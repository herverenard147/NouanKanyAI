"""
main.py — API FastAPI pour exposer les modèles d'IA au frontend React.
Endpoints: /api/predict, /api/anomaly, /api/recommend
"""

from datetime import datetime, timedelta

from fastapi import FastAPI, Request, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session
from typing import List, Optional
import base64
import hashlib
import io
import joblib
import json
import os
import random
import re
import threading
import time
import uuid
import requests
from collections import deque, OrderedDict
from dotenv import load_dotenv
from PIL import Image

# Session HTTP persistante (réutilise la connexion TCP/TLS vers Gemini au lieu
# d'en rouvrir une à chaque appel, ce qui réduisait la marge avant timeout).
_gemini_session = requests.Session()

# Horodatage de démarrage du process, pour exposer process_uptime_seconds dans
# /api/admin/metrics. time.monotonic() plutôt que time.time() : ne saute pas si
# l'horloge système est ajustée (NTP, changement de fuseau, etc.) pendant l'exécution.
PROCESS_START_TIME = time.monotonic()

# AI_MODE="mock" court-circuite tout appel réseau vers Gemini (voir call_gemini()) :
# utile en développement/tests pour ne pas consommer le quota gratuit partagé avec
# la démo. "live" (défaut) appelle réellement Gemini — le défaut est volontairement
# "live" pour ne jamais casser la prod silencieusement si la variable est omise.
AI_MODE = os.environ.get("AI_MODE", "live").strip().lower()

class TTLCache:
    """Cache LRU en mémoire, borné en taille (éviction du moins récemment utilisé),
    avec TTL optionnel par entrée (None = pas d'expiration, seule la taille borne le
    cache). Pas de Redis : un process Render se relance de toute façon en redéploiement,
    ce qui vide naturellement le cache — aucun état à faire persister entre process.
    N'expose que ce dont les endpoints ont besoin : get/set + un taux de hit pour les logs."""
    def __init__(self, max_size: int, ttl_seconds: Optional[float], name: str):
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds
        self.name = name
        self._store: "OrderedDict[str, tuple[str, float]]" = OrderedDict()
        self.hits = 0
        self.misses = 0

    def get(self, key: str) -> Optional[str]:
        entry = self._store.get(key)
        if entry is None:
            self.misses += 1
            return None
        value, expires_at = entry
        if self.ttl_seconds is not None and time.time() > expires_at:
            del self._store[key]
            self.misses += 1
            return None
        self._store.move_to_end(key)
        self.hits += 1
        return value

    def set(self, key: str, value: str) -> None:
        # Ne jamais mettre en cache une réponse vide (sinon un échec silencieux se fige).
        if not value:
            return
        expires_at = (time.time() + self.ttl_seconds) if self.ttl_seconds is not None else float("inf")
        self._store[key] = (value, expires_at)
        self._store.move_to_end(key)
        while len(self._store) > self.max_size:
            self._store.popitem(last=False)

    def hit_rate(self) -> float:
        total = self.hits + self.misses
        return round(100 * self.hits / total, 1) if total else 0.0

# Un cache dédié par endpoint (namespaces séparés) : la même image pourrait en
# théorie être envoyée à la fois à l'OCR facture et à l'analyse média, et ces deux
# endpoints attendent des formats de réponse totalement différents (MOIS/MONTANT/KWH
# vs STATUS/DESCRIPTION) — un cache partagé par hash d'image renverrait le mauvais
# format à l'un des deux appelants.
_chat_cache = TTLCache(max_size=100, ttl_seconds=3600, name="chat")   # TTL 1h
_ocr_cache = TTLCache(max_size=100, ttl_seconds=None, name="ocr")     # pas de TTL : une facture ne change pas
_media_cache = TTLCache(max_size=100, ttl_seconds=None, name="media") # idem

def normalize_text(s: str) -> str:
    """Normalise un texte pour la clé de cache du chat : minuscules, ponctuation
    retirée, espaces compressés — pour que deux formulations quasi identiques
    ('Bonjour !' vs 'bonjour') touchent la même entrée de cache."""
    s = s.lower()
    s = re.sub(r"[^\w\s]", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s

IMAGE_MAX_DIMENSION = 1024
IMAGE_JPEG_QUALITY = 85

# Réponses mock : 2-3 par endpoint, format texte STRICTEMENT identique à ce que
# Gemini renvoie réellement (mêmes préfixes de champs), préfixées [MOCK] pour ne
# jamais pouvoir être confondues avec une vraie extraction en aval (notamment côté
# OCR facture, où le texte se retrouve directement dans un enregistrement en base).
MOCK_CHAT_RESPONSES = [
    "[MOCK] Bonjour ! Ceci est une réponse simulée (AI_MODE=mock) — aucun appel Gemini n'a été émis. Comment puis-je vous aider ?",
    "[MOCK] D'après le contexte fourni, vos équipements semblent globalement sous contrôle. (réponse simulée, AI_MODE=mock)",
    "[MOCK] Je vous recommande de surveiller de près les machines à forte température. (réponse simulée, AI_MODE=mock)",
]

MOCK_OCR_RESPONSES = [
    "MOIS: [MOCK] Février 2026\nMONTANT: 87450\nKWH: 312",
    "MOIS: [MOCK] Mars 2026\nMONTANT: 156200\nKWH: 578",
    "MOIS: [MOCK] Janvier 2026\nMONTANT: 64000\nKWH: 210",
]

MOCK_MEDIA_RESPONSES = [
    "STATUS: NORMAL\nDESCRIPTION: [MOCK] Tout est en ordre (réponse simulée, AI_MODE=mock).",
    "STATUS: ALERTE\nDESCRIPTION: [MOCK] Fumée détectée près du moteur (réponse simulée, AI_MODE=mock).",
    "STATUS: NORMAL\nDESCRIPTION: [MOCK] Aucune anomalie visible (réponse simulée, AI_MODE=mock).",
]

def mock_gemini_response(payload: dict) -> dict:
    """Génère une réponse simulée avec EXACTEMENT la même structure que l'API Gemini
    réelle (candidates[0].content.parts[0].text) — c'est ce que tout le code appelant
    lit, donc le mock doit avoir la même forme, sinon il ne teste rien de réel.
    Détecte l'endpoint appelant en inspectant le contenu du payload (présence d'une
    image + mots-clés propres au prompt de chaque endpoint), puisque call_gemini()
    ne reçoit qu'un payload générique, sans identifiant d'endpoint."""
    parts = payload.get("contents", [{}])[0].get("parts", [])
    prompt_text = "".join(p.get("text", "") for p in parts)
    has_image = any("inlineData" in p for p in parts)

    if has_image and "facture d'électricité" in prompt_text:
        text = random.choice(MOCK_OCR_RESPONSES)
    elif has_image:
        text = random.choice(MOCK_MEDIA_RESPONSES)
    else:
        text = random.choice(MOCK_CHAT_RESPONSES)

    return {"candidates": [{"content": {"parts": [{"text": text}]}, "finishReason": "STOP"}]}

def compress_image_for_gemini(file_bytes: bytes, mime_type: str, source: str) -> tuple[bytes, str]:
    """Redimensionne (plus grand côté <= IMAGE_MAX_DIMENSION) et recompresse en JPEG
    avant l'envoi à Gemini Vision, uniquement si l'image dépasse ce seuil. Ne touche
    jamais aux vidéos (mime_type non-image) : Gemini les reçoit telles quelles.
    `source` sert uniquement à identifier l'appelant dans les logs de taille."""
    original_size = len(file_bytes)
    if not mime_type or not mime_type.startswith("image/"):
        print(f"[INFO] Compression image ({source}) : ignorée (mime_type={mime_type}), {original_size} octets envoyés tels quels.")
        return file_bytes, mime_type

    try:
        img = Image.open(io.BytesIO(file_bytes))
        width, height = img.size
        if max(width, height) <= IMAGE_MAX_DIMENSION:
            print(f"[INFO] Compression image ({source}) : sous le seuil ({width}x{height}), {original_size} octets envoyés tels quels.")
            return file_bytes, mime_type

        ratio = IMAGE_MAX_DIMENSION / max(width, height)
        new_size = (max(1, int(width * ratio)), max(1, int(height * ratio)))
        img = img.convert("RGB")
        img = img.resize(new_size, Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=IMAGE_JPEG_QUALITY)
        compressed_bytes = buf.getvalue()
        print(
            f"[INFO] Compression image ({source}) : {width}x{height} ({original_size} octets) "
            f"-> {new_size[0]}x{new_size[1]} ({len(compressed_bytes)} octets), "
            f"-{round(100 * (1 - len(compressed_bytes) / original_size))}%."
        )
        return compressed_bytes, "image/jpeg"
    except Exception as e:
        print(f"[WARN] Compression image ({source}) echouee ({type(e).__name__}), envoi de l'original ({original_size} octets).")
        return file_bytes, mime_type

def gemini_error_summary(e: Exception) -> str:
    """Résumé sûr d'une erreur d'appel Gemini pour les logs : jamais la chaîne brute de
    l'exception, qui peut embarquer l'URL de la requête (et donc la clé API)."""
    if isinstance(e, requests.exceptions.HTTPError) and e.response is not None:
        return f"HTTP {e.response.status_code}"
    return type(e).__name__

GEMINI_RATE_LIMIT_PER_MINUTE = int(os.environ.get("GEMINI_RATE_LIMIT_PER_MINUTE", "10"))

# Budget d'attente en file, SÉPARÉ du timeout réseau (`timeout` passé à call_gemini).
# Échouer vite avec un message explicite vaut mieux que faire attendre l'utilisateur
# 40s (le timeout réseau de l'OCR/média) pour obtenir exactement le même message
# d'échec. Avant cette séparation, le budget de file réutilisait `timeout` : pire cas
# par tentative = jusqu'à 40s de file + jusqu'à 40s réseau, multiplié par les
# retries — largement plus de 2 minutes au total (voir calcul détaillé fourni à part).
GEMINI_MAX_QUEUE_WAIT = float(os.environ.get("GEMINI_MAX_QUEUE_WAIT", "8"))

# Version épinglée explicite, jamais un alias "-latest" : gemini-3.5-flash est le
# modèle actuellement pointé par gemini-flash-latest (source : release notes Google,
# ai.google.dev/gemini-api/docs/changelog). Épingler sur cette version explicite
# neutralise le risque de bascule silencieuse par Google, sans changer le
# comportement du produit en production.
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.5-flash")

class RateLimiterSaturated(Exception):
    """Levée quand l'attente pour un slot du limiteur dépasse le budget alloué —
    à distinguer d'une erreur Gemini : ici, aucun appel réseau n'a été tenté."""
    pass

class GeminiRateLimiter:
    """Limiteur de débit global vers Gemini : fenêtre glissante de 60s, plafond
    configurable (GEMINI_RATE_LIMIT_PER_MINUTE). File d'attente plutôt que rejet
    immédiat — un appelant bloque jusqu'à ce qu'un slot se libère, dans la limite
    de max_wait_seconds, avant d'abandonner avec RateLimiterSaturated.

    ATTENTION — n'est correct que pour UN SEUL process. Vérifié pour ce déploiement :
    render.yaml lance `uvicorn main:app` sans --workers (1 process, défaut uvicorn)
    sur le plan "starter" (1 instance, pas de bloc `scaling` = pas d'autoscaling).
    Si l'un de ces deux points change (--workers > 1, ou plusieurs instances), ce
    plafond en mémoire devient faux : chaque process aurait son propre plafond
    indépendant, et le total réel envoyé à Gemini dépasserait la limite configurée
    sans que rien ne le signale. Pas de solution multi-process ici (demanderait un
    store partagé type Redis) — hors périmètre tant que le déploiement reste mono-process."""
    def __init__(self, max_per_minute: int):
        self.max_per_minute = max_per_minute
        self._timestamps: deque = deque()
        self._lock = threading.Lock()

    def acquire(self, max_wait_seconds: float) -> None:
        deadline = time.monotonic() + max_wait_seconds
        while True:
            with self._lock:
                now = time.monotonic()
                while self._timestamps and now - self._timestamps[0] >= 60:
                    self._timestamps.popleft()
                if len(self._timestamps) < self.max_per_minute:
                    self._timestamps.append(now)
                    return
                wait_hint = 60 - (now - self._timestamps[0])
            if time.monotonic() >= deadline:
                raise RateLimiterSaturated(
                    f"Quota local Gemini saturé ({self.max_per_minute}/min) — délai d'attente dépassé."
                )
            time.sleep(max(0.05, min(wait_hint, deadline - time.monotonic(), 0.5)))

_gemini_rate_limiter = GeminiRateLimiter(GEMINI_RATE_LIMIT_PER_MINUTE)

GEMINI_METRICS_ENDPOINTS = ("chat", "ocr", "media")

class GeminiMetrics:
    """Compteurs d'observabilité du quota Gemini consommé, en mémoire (RAM du
    process), par endpoint (chat/ocr/media). Chaque compteur n'est incrémenté
    qu'au point exact où l'événement correspondant se produit (voir call_gemini()
    et les 3 endpoints appelants) — jamais d'estimation, jamais de valeur par
    défaut autre que 0.

    Comme GeminiRateLimiter (voir sa docstring), valable seulement pour un
    déploiement mono-process : chaque process aurait ses propres compteurs
    indépendants, sans coordination entre eux."""
    def __init__(self):
        self._lock = threading.Lock()
        self._real_calls_total = {e: 0 for e in GEMINI_METRICS_ENDPOINTS}
        self._real_calls_60s = {e: deque() for e in GEMINI_METRICS_ENDPOINTS}
        self._real_calls_24h = {e: deque() for e in GEMINI_METRICS_ENDPOINTS}
        self._cache_hits = {e: 0 for e in GEMINI_METRICS_ENDPOINTS}
        self._http_429 = {e: 0 for e in GEMINI_METRICS_ENDPOINTS}
        self._timeouts = {e: 0 for e in GEMINI_METRICS_ENDPOINTS}
        self._saturations = {e: 0 for e in GEMINI_METRICS_ENDPOINTS}
        self._mock_calls = {e: 0 for e in GEMINI_METRICS_ENDPOINTS}

    @staticmethod
    def _prune(dq: deque, now: float, seconds: float) -> None:
        while dq and now - dq[0] >= seconds:
            dq.popleft()

    def record_real_call(self, endpoint: str) -> None:
        """Un appel réseau a réellement été émis vers Gemini (chaque retry compte,
        quel que soit le résultat de la tentative)."""
        now = time.time()
        with self._lock:
            self._real_calls_total[endpoint] += 1
            self._real_calls_60s[endpoint].append(now)
            self._real_calls_24h[endpoint].append(now)
            self._prune(self._real_calls_60s[endpoint], now, 60)
            self._prune(self._real_calls_24h[endpoint], now, 86400)
            total = sum(self._real_calls_total.values())
        if total % 20 == 0:
            print(f"[INFO] Gemini — appels réels cumulés (tous endpoints): {total}")

    def record_cache_hit(self, endpoint: str) -> None:
        with self._lock:
            self._cache_hits[endpoint] += 1

    def record_429(self, endpoint: str) -> None:
        with self._lock:
            self._http_429[endpoint] += 1

    def record_timeout(self, endpoint: str) -> None:
        with self._lock:
            self._timeouts[endpoint] += 1

    def record_saturation(self, endpoint: str) -> None:
        with self._lock:
            self._saturations[endpoint] += 1
            total = sum(self._saturations.values())
        if total % 20 == 0:
            print(f"[INFO] Limiteur Gemini — saturations cumulées (tous endpoints): {total}")

    def record_mock_call(self, endpoint: str) -> None:
        with self._lock:
            self._mock_calls[endpoint] += 1

    def snapshot(self) -> dict:
        now = time.time()
        with self._lock:
            endpoints = {}
            for e in GEMINI_METRICS_ENDPOINTS:
                self._prune(self._real_calls_60s[e], now, 60)
                self._prune(self._real_calls_24h[e], now, 86400)
                endpoints[e] = {
                    "real_calls_total": self._real_calls_total[e],
                    "real_calls_last_60s": len(self._real_calls_60s[e]),
                    "real_calls_last_24h": len(self._real_calls_24h[e]),
                    "cache_hits": self._cache_hits[e],
                    "http_429_count": self._http_429[e],
                    "timeouts_count": self._timeouts[e],
                    "rate_limiter_saturations": self._saturations[e],
                    "mock_calls": self._mock_calls[e],
                }
            return endpoints

_gemini_metrics = GeminiMetrics()

def call_gemini(payload: dict, endpoint: str, timeout: int = 25, retries: int = 2, model: str = None) -> dict:
    """Appelle l'API Gemini avec retry + backoff sur timeout/erreur réseau/429/503.
    La clé API est envoyée en en-tête (jamais dans l'URL) pour qu'elle ne puisse pas
    se retrouver dans un message d'erreur ou un log.

    endpoint : "chat" | "ocr" | "media" — identifie le call site pour GeminiMetrics
    (voir sa définition ci-dessus). Obligatoire, sans valeur par défaut : un
    endpoint manquant produirait une métrique fausse plutôt qu'une erreur visible.

    model : identifiant de modèle Gemini explicite. Si non fourni, retombe sur
    GEMINI_MODEL (version épinglée par défaut, voir sa définition ci-dessus) — les
    3 call sites actuels ne passent pas encore ce paramètre.

    AI_MODE=mock : court-circuit total, aucun appel réseau (voir mock_gemini_response),
    et donc aucun passage par le limiteur — placé en tout début de fonction, avant
    toute construction d'URL/en-têtes. Seul le compteur "appels mockés" de
    GeminiMetrics est incrémenté ici ; le compteur "appels réels" ne l'est jamais
    en mode mock, puisque le code qui l'incrémente n'est jamais atteint.

    Limiteur de débit : chaque tentative (y compris chaque retry — un retry est un
    appel réseau comme un autre) doit acquérir un slot avant de contacter Gemini.
    Le budget d'attente en file est GEMINI_MAX_QUEUE_WAIT, SÉPARÉ ET INDÉPENDANT de
    `timeout` (le timeout HTTP de la requête elle-même) : l'attente en file ne
    consomme pas le budget réseau, elle s'y ajoute. Pire cas par tentative : jusqu'à
    GEMINI_MAX_QUEUE_WAIT secondes en file + jusqu'à `timeout` secondes d'appel
    réseau. Échouer vite avec un message explicite (file courte, ~8s par défaut)
    vaut mieux que faire attendre l'utilisateur aussi longtemps que le timeout
    réseau (20-40s) pour obtenir exactement le même message d'échec. Une saturation
    du limiteur n'est PAS retentée (retenter attendrait à nouveau sur la même
    ressource saturée) : elle remonte immédiatement à l'appelant."""
    if AI_MODE == "mock":
        _gemini_metrics.record_mock_call(endpoint)
        return mock_gemini_response(payload)

    gemini_api_key = os.environ.get("GEMINI_API_KEY", "")
    model_name = model or GEMINI_MODEL
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
    headers = {"x-goog-api-key": gemini_api_key, "Content-Type": "application/json"}

    last_exc = None
    for attempt in range(retries + 1):
        try:
            _gemini_rate_limiter.acquire(max_wait_seconds=GEMINI_MAX_QUEUE_WAIT)
        except RateLimiterSaturated:
            _gemini_metrics.record_saturation(endpoint)
            raise
        _gemini_metrics.record_real_call(endpoint)
        try:
            resp = _gemini_session.post(url, json=payload, headers=headers, timeout=timeout)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            last_exc = e
            if isinstance(e, requests.exceptions.Timeout):
                _gemini_metrics.record_timeout(endpoint)
            elif isinstance(e, requests.exceptions.HTTPError) and e.response is not None and e.response.status_code == 429:
                _gemini_metrics.record_429(endpoint)
            transient = isinstance(e, (requests.exceptions.Timeout, requests.exceptions.ConnectionError)) or (
                isinstance(e, requests.exceptions.HTTPError) and e.response is not None and e.response.status_code in (429, 503)
            )
            if transient and attempt < retries:
                backoff = 1.5 * (2 ** attempt) + random.uniform(0, 1)
                time.sleep(backoff)
                continue
            break
    raise last_exc

from db import engine, Base, get_db
import models_db as models
import equipment_catalog
from auth import hash_password, verify_password, create_access_token, get_current_user_id

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

if engine is not None:
    try:
        Base.metadata.create_all(bind=engine)
        # create_all() ne modifie pas les tables déjà existantes : migration légère
        # pour les colonnes ajoutées après coup (idempotent, sans Alembic).
        from sqlalchemy import text
        with engine.begin() as conn:
            conn.execute(text(
                "ALTER TABLE machines ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id)"
            ))
            conn.execute(text("ALTER TABLE machines ADD COLUMN IF NOT EXISTS categorie VARCHAR"))
            conn.execute(text("ALTER TABLE machines ADD COLUMN IF NOT EXISTS marque VARCHAR"))
            conn.execute(text("ALTER TABLE machines ADD COLUMN IF NOT EXISTS modele VARCHAR"))
            conn.execute(text("ALTER TABLE machines ADD COLUMN IF NOT EXISTS numero_serie VARCHAR"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS platform_role VARCHAR"))
            conn.execute(text("ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id)"))
            conn.execute(text("ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS gain_fcfa FLOAT"))
            conn.execute(text("ALTER TABLE invoices ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id)"))
        print("[OK] Connecté à PostgreSQL, tables synchronisées.")
    except Exception as e:
        print(f"[ERROR] Erreur PostgreSQL: {e}")
else:
    print("[WARN] DATABASE_URL non configurée. L'API répondra sans base de données.")

FRENCH_MONTHS = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]

app = FastAPI(title="NouanKanyAI — Intelligence Artificielle", version="1.0.0")

# CORS pour que le frontend Next.js puisse appeler l'API.
# En production, définir FRONTEND_URL (ex: https://nouankanyai-frontend.onrender.com).
# ALLOWED_ORIGINS permet d'ajouter des origines supplémentaires séparées par des virgules.
_default_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]
_frontend_url = os.environ.get("FRONTEND_URL", "").strip()
_extra_origins = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "").split(",") if o.strip()]
allowed_origins = _default_origins + ([_frontend_url] if _frontend_url else []) + _extra_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

LATENCY_WINDOW_SECONDS = 300  # 5 minutes
LATENCY_MAX_SAMPLES = 10000   # protection RAM en cas de burst

class RequestLatencyMetrics:
    """Latence moyenne des requêtes API, fenêtre glissante de 5 minutes, en mémoire
    (RAM du process). Même patron que GeminiRateLimiter/GeminiMetrics : deque +
    threading.Lock, purge des entrées expirées à chaque écriture.

    Mono-process uniquement (voir GeminiRateLimiter pour le contexte de déploiement
    Render) : chaque process aurait sa propre fenêtre, sans coordination."""
    def __init__(self):
        self._lock = threading.Lock()
        self._samples: deque = deque()  # (timestamp, duration_ms)

    def record(self, duration_ms: float) -> None:
        now = time.monotonic()
        with self._lock:
            self._samples.append((now, duration_ms))
            while self._samples and now - self._samples[0][0] >= LATENCY_WINDOW_SECONDS:
                self._samples.popleft()
            while len(self._samples) > LATENCY_MAX_SAMPLES:
                self._samples.popleft()

    def snapshot(self) -> tuple:
        """Retourne (avg_ms, sample_count). (None, 0) si la fenêtre est vide —
        jamais 0 ni une valeur inventée pour signaler l'absence de données."""
        now = time.monotonic()
        with self._lock:
            while self._samples and now - self._samples[0][0] >= LATENCY_WINDOW_SECONDS:
                self._samples.popleft()
            count = len(self._samples)
            if count == 0:
                return (None, 0)
            avg = sum(d for _, d in self._samples) / count
            return (round(avg), count)

_latency_metrics = RequestLatencyMetrics()

@app.middleware("http")
async def latency_tracking_middleware(request: Request, call_next):
    """Chronomètre le cycle HTTP complet (y compris le temps d'attente réseau sur
    un appel Gemini sortant, le cas échéant) — c'est la latence réellement perçue
    par l'utilisateur, pas seulement le temps de calcul local.

    Filtre : uniquement les vraies routes métier (/api/*), hors préflight OPTIONS.
    Exclut de fait la racine "/" (health check Render, healthCheckPath dans
    render.yaml) et les routes auto-générées FastAPI (/docs, /openapi.json,
    /redoc), qui répondent en <1ms et fausseraient la moyenne vers le bas sans
    représenter une latence perçue par un utilisateur réel."""
    start = time.perf_counter()
    response = await call_next(request)
    if request.url.path.startswith("/api/") and request.method != "OPTIONS":
        duration_ms = (time.perf_counter() - start) * 1000
        _latency_metrics.record(duration_ms)
    return response

# Charger les modèles au démarrage
MODELS_DIR = os.path.join(os.path.dirname(__file__), 'ml', 'models')
xgb_data = None
xgb_metrics = None  # dict (r2/mae_kw/mape_pct/dataset/computed_at) ou None si absent/illisible
iso_data = None

def load_models():
    global xgb_data, xgb_metrics, iso_data
    xgb_path = os.path.join(MODELS_DIR, 'xgboost_model.pkl')
    xgb_metrics_path = os.path.join(MODELS_DIR, 'xgboost_metrics.json')
    iso_path = os.path.join(MODELS_DIR, 'isolation_forest.pkl')

    if os.path.exists(xgb_path):
        xgb_data = joblib.load(xgb_path)
        print("[OK] Modele XGBoost charge.")
        # Fichier de métriques distinct du .pkl (voir train_xgboost.py) : son absence
        # ou son illisibilité ne doit JAMAIS empêcher le serveur de démarrer — un
        # couplage dur entre entraînement ML et disponibilité de l'API serait
        # inacceptable. Repli silencieux à None, jamais de valeur inventée.
        try:
            with open(xgb_metrics_path) as f:
                xgb_metrics = json.load(f)
            print(f"[OK] Metriques XGBoost chargees (r2={xgb_metrics.get('r2')}, mae_kw={xgb_metrics.get('mae_kw')}).")
        except Exception as e:
            xgb_metrics = None
            print(f"[WARN] Metriques XGBoost absentes ou illisibles ({type(e).__name__}: {e}) — model_metrics restera a null.")
    else:
        print("[WARN] Modele XGBoost non trouve. Lancez d'abord train_xgboost.py")

    if os.path.exists(iso_path):
        iso_data = joblib.load(iso_path)
        print("[OK] Modele Isolation Forest charge.")
    else:
        print("[WARN] Modele Isolation Forest non trouve. Lancez d'abord train_anomaly.py")

# --- Modèles Pydantic ---

class SensorReading(BaseModel):
    machine_id: str
    nom: Optional[str] = None
    categorie: Optional[str] = None
    marque: Optional[str] = None
    modele: Optional[str] = None
    power_kw: float
    temperature_c: float
    vibration_hz: float
    pressure_bar: float
    priority: Optional[str] = 'haute'

class PredictionRequest(BaseModel):
    machine_id: str
    temperature_c: float
    vibration_hz: float
    pressure_bar: float
    hours_ahead: Optional[int] = 24

# --- Helpers de sérialisation ---

def serialize_user(user: models.User) -> dict:
    return {
        "id": str(user.id),
        "email": user.email,
        "nom": user.nom,
        "type_compte": user.type_compte,
        "role": user.role,
        "platform_role": user.platform_role,
    }

def maybe_bootstrap_superadmin(user: models.User, db: Session):
    """Le compte dont l'email correspond à SUPERADMIN_EMAIL reçoit automatiquement le
    rôle superadmin à la connexion — évite d'avoir besoin d'un accès direct à la base
    pour créer le tout premier administrateur de la plateforme."""
    superadmin_email = os.environ.get("SUPERADMIN_EMAIL", "").strip().lower()
    if superadmin_email and user.email == superadmin_email and user.platform_role != "superadmin":
        user.platform_role = "superadmin"
        db.commit()

def get_current_admin_user_id(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)) -> str:
    """Dépendance FastAPI : autorise uniquement les comptes avec platform_role admin/superadmin."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user or user.platform_role not in ("admin", "superadmin"):
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs de la plateforme")
    return user_id

def get_current_superadmin_user_id(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)) -> str:
    """Dépendance FastAPI : autorise uniquement le rôle superadmin (gestion des rôles)."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user or user.platform_role != "superadmin":
        raise HTTPException(status_code=403, detail="Accès réservé au superadmin")
    return user_id

def serialize_site(site: models.Site) -> dict:
    return {
        "id": str(site.id),
        "nom": site.nom,
        "localisation": site.localisation,
        "user_id": str(site.user_id),
    }

# --- Routes ---

@app.on_event("startup")
def startup():
    load_models()
    if AI_MODE == "mock":
        print("[INFO] AI_MODE=mock — aucun appel Gemini ne sera émis, réponses simulées sur les 3 endpoints IA.")
    else:
        print(f"[INFO] AI_MODE={AI_MODE} — appels Gemini réels actifs.")

@app.get("/")
def root():
    return {"message": "NouanKanyAI API is running", "version": "1.0.0"}

# --- Authentification ---

class SignupRequest(BaseModel):
    email: str
    password: str
    nom: str
    type_compte: Optional[str] = "Particulier"

class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/api/auth/signup")
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    email = req.email.strip().lower()
    if not email or not req.password or not req.nom:
        raise HTTPException(status_code=422, detail="Email, mot de passe et nom sont requis")
    if len(req.password) < 6:
        raise HTTPException(status_code=422, detail="Le mot de passe doit contenir au moins 6 caractères")

    existing = db.query(models.User).filter(models.User.email == email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Un compte existe déjà avec cet email")

    user = models.User(
        email=email,
        password_hash=hash_password(req.password),
        nom=req.nom,
        type_compte=req.type_compte or "Particulier",
        role=req.type_compte or "Utilisateur",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    maybe_bootstrap_superadmin(user, db)

    token = create_access_token(str(user.id))
    return {"token": token, "user": serialize_user(user)}

@app.post("/api/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    email = req.email.strip().lower()
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")

    user.last_sign_in_at = datetime.utcnow()
    db.commit()
    maybe_bootstrap_superadmin(user, db)

    # Télémétrie pour le flux "activités récentes" du portail admin — un échec
    # d'insertion ici ne doit JAMAIS empêcher une connexion utilisateur de réussir.
    try:
        db.add(models.Activity(activity_type="connexion", user_id=user.id, description=f"Connexion de {user.nom}"))
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[WARN] Activity — échec journalisation connexion: {type(e).__name__}: {e}")

    token = create_access_token(str(user.id))
    return {"token": token, "user": serialize_user(user)}

@app.get("/api/auth/me")
def get_me(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable")
    return serialize_user(user)

class UpdateProfileRequest(BaseModel):
    nom: Optional[str] = None
    type_compte: Optional[str] = None

@app.patch("/api/auth/me")
def update_me(req: UpdateProfileRequest, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable")
    if req.nom:
        user.nom = req.nom
    if req.type_compte:
        user.type_compte = req.type_compte
        user.role = req.type_compte
    db.commit()
    return serialize_user(user)

# --- Sites ---

class NewSite(BaseModel):
    nom: str
    localisation: str

@app.get("/api/sites")
def get_sites(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Retourne les sites appartenant à l'utilisateur connecté."""
    sites = db.query(models.Site).filter(models.Site.user_id == user_id).all()
    return [serialize_site(s) for s in sites]

@app.post("/api/sites")
def add_site(site: NewSite, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Ajoute un site pour l'utilisateur connecté."""
    new_site = models.Site(nom=site.nom, localisation=site.localisation, user_id=user_id)
    db.add(new_site)
    db.commit()
    db.refresh(new_site)
    return serialize_site(new_site)

# --- Machines ---

@app.get("/api/machines")
def get_machines(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Retourne l'état des machines de l'utilisateur connecté avec leurs dernières métriques."""
    machines = db.query(models.Machine).filter(models.Machine.user_id == user_id).all()
    sites = db.query(models.Site).filter(models.Site.user_id == user_id).all()
    site_map = {s.id: s.nom for s in sites}

    metrics = db.query(models.SensorMetric).order_by(models.SensorMetric.recorded_at.desc()).all()
    metrics_map = {}
    for m in metrics:
        if m.machine_id not in metrics_map:
            metrics_map[m.machine_id] = m

    result = []
    for mach in machines:
        metric = metrics_map.get(mach.id)
        result.append({
            "machine_id": mach.code_interne,
            "nom": mach.nom,
            "site_id": str(mach.site_id) if mach.site_id else None,
            "site_nom": site_map.get(mach.site_id, "Non associé"),
            "power_kw": metric.power_kw if metric else mach.puissance_nominale_kw,
            "temperature_c": metric.temperature_c if metric else 25.0,
            "vibration_hz": metric.vibration_hz if metric else 1.0,
            "pressure_bar": metric.pressure_bar if metric else 1.0,
            "status": mach.status,
            "priority": mach.priority,
            "categorie": mach.categorie,
            "marque": mach.marque,
            "modele": mach.modele,
            "numero_serie": mach.numero_serie,
        })
    return result

@app.get("/api/equipment-catalog")
def get_equipment_catalog():
    """Retourne le catalogue d'équipements (catégorie -> marque -> modèles) pour le formulaire d'ajout."""
    return equipment_catalog.get_catalog_tree()

# --- Seuils d'alerte (configurables par l'utilisateur) ---

DEFAULT_ALERT_THRESHOLDS = {"temperature_max_c": 60.0, "vibration_max_hz": 45.0, "surconsommation_ratio": 1.2}

def serialize_thresholds(t: Optional[models.AlertThreshold]) -> dict:
    if not t:
        return dict(DEFAULT_ALERT_THRESHOLDS)
    return {
        "temperature_max_c": t.temperature_max_c,
        "vibration_max_hz": t.vibration_max_hz,
        "surconsommation_ratio": t.surconsommation_ratio,
    }

@app.get("/api/alert-thresholds")
def get_alert_thresholds(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Retourne les seuils d'alerte de l'utilisateur (valeurs par défaut si jamais configurés)."""
    t = db.query(models.AlertThreshold).filter(models.AlertThreshold.user_id == user_id).first()
    return serialize_thresholds(t)

class AlertThresholdsUpdate(BaseModel):
    temperature_max_c: float
    vibration_max_hz: float
    surconsommation_ratio: float

@app.put("/api/alert-thresholds")
def update_alert_thresholds(req: AlertThresholdsUpdate, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Met à jour les seuils d'alerte de l'utilisateur connecté."""
    if req.temperature_max_c <= 0 or req.vibration_max_hz <= 0 or req.surconsommation_ratio <= 1:
        raise HTTPException(status_code=422, detail="Valeurs de seuil invalides")

    t = db.query(models.AlertThreshold).filter(models.AlertThreshold.user_id == user_id).first()
    if not t:
        t = models.AlertThreshold(user_id=user_id)
        db.add(t)
    t.temperature_max_c = req.temperature_max_c
    t.vibration_max_hz = req.vibration_max_hz
    t.surconsommation_ratio = req.surconsommation_ratio
    db.commit()
    return serialize_thresholds(t)

@app.get("/api/facturation")
def get_facturation(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Retourne les données de facturation calculées à partir des actions réellement
    exécutées et journalisées par l'IA (registre d'audit), pas d'une simulation.
    """
    now = datetime.utcnow()
    month_start = datetime(now.year, now.month, 1)

    month_logs = db.query(models.AuditLog).filter(
        models.AuditLog.user_id == user_id,
        models.AuditLog.timestamp >= month_start,
    ).all()

    # Économies brutes vérifiées = somme des gains réellement journalisés ce mois-ci
    # (actions à faible risque exécutées par l'IA, ex: délestage préventif).
    gross_savings = sum(a.gain_fcfa or 0 for a in month_logs)
    gain_share = gross_savings * 0.10

    # Répartition hebdomadaire réelle, basée sur les vrais horodatages des actions du mois
    # (et non une répartition simulée fixe).
    week_buckets: dict = {}
    for a in month_logs:
        week_num = min((a.timestamp.day - 1) // 7, 4)
        week_buckets[week_num] = week_buckets.get(week_num, 0) + (a.gain_fcfa or 0)
    bar_data = [{"name": f"S{i + 1}", "savings": round(week_buckets.get(i, 0))} for i in range(5)]

    audit_logs = db.query(models.AuditLog).filter(
        models.AuditLog.user_id == user_id
    ).order_by(models.AuditLog.timestamp.desc()).limit(10).all()
    audit_trail = [
        {"timestamp": a.timestamp.isoformat(), "action": a.action, "ref": a.ref_hash, "status": a.status}
        for a in audit_logs
    ]

    invoice_rows = db.query(models.Invoice).filter(
        models.Invoice.user_id == user_id
    ).order_by(models.Invoice.created_at.desc()).all()
    invoices = [
        {"id": str(i.id), "month": i.month, "amount": f"{int(i.amount_xof):,}".replace(",", " ") + " FCFA"}
        for i in invoice_rows
    ]

    return {
        "grossSavings": round(gross_savings),
        "gainShare": round(gain_share),
        "barData": bar_data,
        "auditTrail": audit_trail,
        "invoices": invoices,
    }

def serialize_bill(i: models.ElectricityBill) -> dict:
    return {
        "id": str(i.id),
        "month": i.month,
        "amount": f"{int(i.amount_xof):,}".replace(",", " ") + " FCFA" if i.amount_xof else None,
        "amount_xof": i.amount_xof,
        "source": i.source,
        "is_forecast": i.is_forecast,
        "actual_amount_xof": i.actual_amount_xof,
        "kwh_consumed": i.kwh_consumed,
        "created_at": i.created_at.isoformat(),
    }

@app.get("/api/bills")
def list_bills(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Liste les factures d'électricité du client (historique, importées par photo, et prévisions IA)."""
    rows = db.query(models.ElectricityBill).filter(models.ElectricityBill.user_id == user_id).order_by(models.ElectricityBill.created_at.desc()).all()
    return [serialize_bill(i) for i in rows]

class ManualBill(BaseModel):
    month: str
    amount_xof: float
    kwh_consumed: Optional[float] = None

@app.post("/api/bills/manual")
def add_manual_bill(req: ManualBill, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Ajoute une facture d'électricité historique saisie manuellement (sans photo)."""
    bill = models.ElectricityBill(
        user_id=user_id, month=req.month, amount_xof=req.amount_xof,
        kwh_consumed=req.kwh_consumed, source="manuel", is_forecast=False,
    )
    db.add(bill)
    db.commit()
    db.refresh(bill)
    return serialize_bill(bill)

@app.post("/api/bills/upload-photo")
# Volontairement synchrone. FastAPI exécute en threadpool. Permet à
# GeminiRateLimiter.acquire() (time.sleep bloquant) de fonctionner sans geler
# l'event loop. Précédent : chat_with_gemini est déjà en def pour la même raison.
def upload_bill_photo(file: UploadFile = File(...), user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Prend une photo de facture CIE, en extrait le mois/montant/consommation via Gemini
    Vision, et l'intègre directement dans l'historique de factures de l'utilisateur.

    compress_image_for_gemini() validée par test A/B sur une photo WhatsApp réelle
    (720x1280) : extraction MOIS/MONTANT/KWH strictement identique avec et sans
    compression. Le cas d'une photo brute d'appareil à forte réduction (3000px+ ->
    1024px) n'a PAS été testé faute d'échantillon disponible à ce jour. Le log
    taille avant/après (dans compress_image_for_gemini) reste actif pour repérer
    toute dérive si un cas plus extrême se présente en usage réel.

    Cache par SHA-256 de l'image brute (avant compression), pas de TTL : la même
    photo de facture renvoie toujours la même lecture, donc pas de raison de
    l'expirer par le temps — seule la taille du cache (LRU) la fera sortir un jour.
    """
    file_bytes = file.file.read()
    mime_type = file.content_type
    # Hash calculé AVANT compression : la même photo doit toucher le cache même si
    # les réglages de compression (résolution/qualité) changent plus tard.
    image_hash = hashlib.sha256(file_bytes).hexdigest()

    text_response = _ocr_cache.get(image_hash) if AI_MODE != "mock" else None
    if text_response is not None:
        _gemini_metrics.record_cache_hit("ocr")
        print(f"[INFO] Cache OCR HIT — taux de hit cumulé: {_ocr_cache.hit_rate()}%")
    else:
        file_bytes, mime_type = compress_image_for_gemini(file_bytes, mime_type, source="bills-upload-photo")
        base64_data = base64.b64encode(file_bytes).decode("utf-8")

        prompt = (
            "Ceci est une photo d'une facture d'électricité (CIE, Côte d'Ivoire, ou équivalent). "
            "Extrait les informations suivantes et réponds STRICTEMENT sous ce format, une ligne par champ, "
            "sans aucun texte additionnel :\n"
            "MOIS: [le mois et l'année de facturation, ex: 'Mars 2026']\n"
            "MONTANT: [le montant total à payer, en chiffres seulement, sans espace ni symbole, ex: 452000]\n"
            "KWH: [la consommation en kWh si elle est visible sur la facture, en chiffres seulement, ou 'INCONNU' si absente]\n"
            "Si l'image n'est pas une facture d'électricité lisible, réponds uniquement : MOIS: ERREUR"
        )

        payload = {
            "contents": [{
                "parts": [
                    {"inlineData": {"mimeType": mime_type, "data": base64_data}},
                    {"text": prompt}
                ]
            }],
            "generationConfig": {"temperature": 0.1, "maxOutputTokens": 300, "thinkingConfig": {"thinkingBudget": 0}}
        }

        try:
            result = call_gemini(payload, endpoint="ocr", timeout=40, retries=2)
            text_response = result['candidates'][0]['content']['parts'][0]['text']
        except RateLimiterSaturated as e:
            print(f"[WARN] OCR facture — limiteur Gemini sature: {e}")
            return {"error": "Quota local Gemini saturé, réessayez dans quelques instants."}
        except Exception as e:
            print(f"[WARN] Gemini invoice OCR error: {gemini_error_summary(e)}")
            return {"error": "L'analyse IA de la facture a échoué (service momentanément indisponible). Réessayez ou saisissez-la manuellement."}

        # Jamais d'erreur/exception ici (le except ci-dessus a déjà renvoyé), donc
        # tout text_response qui arrive à ce point est un texte que Gemini a
        # réellement généré — y compris "MOIS: ERREUR", un résultat valide en soi.
        if AI_MODE != "mock":
            _ocr_cache.set(image_hash, text_response)
        print(f"[INFO] Cache OCR — taux de hit cumulé: {_ocr_cache.hit_rate()}% ({_ocr_cache.hits}/{_ocr_cache.hits + _ocr_cache.misses})")

    month, amount, kwh = None, None, None
    for line in text_response.split('\n'):
        if line.startswith("MOIS:"):
            month = line.replace("MOIS:", "").strip()
        elif line.startswith("MONTANT:"):
            raw = line.replace("MONTANT:", "").strip().replace(" ", "")
            amount = float(raw) if raw.replace('.', '', 1).isdigit() else None
        elif line.startswith("KWH:"):
            raw = line.replace("KWH:", "").strip().replace(" ", "")
            kwh = float(raw) if raw.replace('.', '', 1).isdigit() else None

    if not month or month == "ERREUR" or amount is None:
        return {"error": "Impossible de lire cette facture. Essayez une photo plus nette et bien cadrée."}

    bill = models.ElectricityBill(
        user_id=user_id, month=month, amount_xof=amount, kwh_consumed=kwh,
        source="ocr-mock" if AI_MODE == "mock" else "ocr", is_forecast=False,
    )
    db.add(bill)
    db.commit()
    db.refresh(bill)
    return {"status": "success", "bill": serialize_bill(bill)}

@app.post("/api/bills/forecast")
def generate_bill_forecast(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Génère une prévision de facture pour le mois prochain, basée sur l'historique réel
    des factures de l'utilisateur (moyenne mobile des 3 dernières), recalibrée par le
    facteur de correction appris des écarts prévision/réel précédents.
    """
    history = db.query(models.ElectricityBill).filter(
        models.ElectricityBill.user_id == user_id, models.ElectricityBill.is_forecast == False,
    ).order_by(models.ElectricityBill.created_at.desc()).limit(3).all()

    if history:
        base_estimate = sum(h.amount_xof for h in history) / len(history)
    else:
        # Pas d'historique : estimation de repli à partir de la puissance actuelle des machines.
        machines = db.query(models.Machine).filter(models.Machine.user_id == user_id).all()
        total_power_kw = sum(m.puissance_nominale_kw for m in machines if m.status == "actif")
        base_estimate = total_power_kw * 24 * 30 * 100

    correction = db.query(models.ForecastAccuracy).filter(models.ForecastAccuracy.user_id == user_id).first()
    correction_factor = correction.correction_factor if correction else 1.0
    predicted_amount = round(base_estimate * correction_factor)

    next_month_date = (datetime.utcnow().replace(day=1) + timedelta(days=32)).replace(day=1)
    month_label = f"{FRENCH_MONTHS[next_month_date.month - 1]} {next_month_date.year}"

    existing = db.query(models.ElectricityBill).filter(
        models.ElectricityBill.user_id == user_id, models.ElectricityBill.month == month_label, models.ElectricityBill.is_forecast == True,
    ).first()
    if existing:
        existing.amount_xof = predicted_amount
        db.commit()
        db.refresh(existing)
        return serialize_bill(existing)

    bill = models.ElectricityBill(
        user_id=user_id, month=month_label, amount_xof=predicted_amount,
        source="ia", is_forecast=True,
    )
    db.add(bill)
    db.commit()
    db.refresh(bill)
    return serialize_bill(bill)

class ActualBillAmount(BaseModel):
    actual_amount_xof: float

@app.patch("/api/bills/{bill_id}/actual")
def confirm_bill_actual(bill_id: str, req: ActualBillAmount, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Quand la vraie facture d'un mois prévu arrive, l'utilisateur saisit le montant réel :
    on mesure l'écart avec la prévision et on recalibre le facteur de correction (moyenne
    mobile) pour que les prochaines prévisions de l'IA s'améliorent.
    """
    bill = db.query(models.ElectricityBill).filter(
        models.ElectricityBill.id == bill_id, models.ElectricityBill.user_id == user_id,
    ).first()
    if not bill:
        return {"error": "Facture introuvable"}

    bill.actual_amount_xof = req.actual_amount_xof

    if bill.is_forecast and bill.amount_xof:
        error_ratio = req.actual_amount_xof / bill.amount_xof
        correction = db.query(models.ForecastAccuracy).filter(models.ForecastAccuracy.user_id == user_id).first()
        if not correction:
            correction = models.ForecastAccuracy(user_id=user_id, correction_factor=1.0)
            db.add(correction)
        # Moyenne mobile exponentielle : on ajuste progressivement plutôt que de tout
        # recaler d'un coup sur un seul écart (plus stable si une facture est un cas isolé).
        correction.correction_factor = round(correction.correction_factor * 0.7 + error_ratio * 0.3, 4)
        correction.last_error_pct = round((error_ratio - 1) * 100, 1)

    db.commit()
    db.refresh(bill)
    return serialize_bill(bill)

def fetch_recent_activities(db: Session, limit: int = 20) -> list:
    """Agrège 5 sources hétérogènes en un flux "activités récentes" unique pour le
    portail admin. 3 sources sont LUES depuis leurs tables existantes (délestages et
    resets support via AuditLog, uploads OCR via ElectricityBill) ; 2 sont lues depuis
    Activity, alimentée par écriture directe dans login()/analyze_machine_media()
    (connexions, analyses média — voir leurs commentaires respectifs).

    Chaque source est plafonnée à `limit` lignes AVANT fusion (inutile de charger plus
    que ce qu'on gardera après tri). Le tri final se fait sur les datetime Python natifs,
    PAS sur des chaînes ISO déjà formatées (un décalage de fuseau pourrait faire trier
    des chaînes différemment de leurs vraies dates) — la sérialisation ISO n'a lieu
    qu'au tout dernier moment, sur les 20 entrées déjà triées et tronquées.
    """
    raw = []  # liste de (datetime, dict partiel sans "timestamp" ni "user_name")

    delestages = db.query(models.AuditLog).filter(
        models.AuditLog.action.like("Délestage automatique%")
    ).order_by(models.AuditLog.timestamp.desc()).limit(limit).all()
    for a in delestages:
        raw.append((a.timestamp, {"type": "delestage", "user_id": a.user_id, "ref_id": a.ref_hash, "extras": {}}))

    resets = db.query(models.AuditLog).filter(
        models.AuditLog.action.like("Réinitialisation par le support%")
    ).order_by(models.AuditLog.timestamp.desc()).limit(limit).all()
    for a in resets:
        raw.append((a.timestamp, {"type": "reset_admin", "user_id": a.user_id, "ref_id": a.ref_hash, "extras": {}}))

    bills = db.query(models.ElectricityBill).filter(
        models.ElectricityBill.source.in_(["ocr", "ocr-mock"])
    ).order_by(models.ElectricityBill.created_at.desc()).limit(limit).all()
    for b in bills:
        raw.append((b.created_at, {"type": "ocr_upload", "user_id": b.user_id, "ref_id": str(b.id), "extras": {}}))

    connexions = db.query(models.Activity).filter(
        models.Activity.activity_type == "connexion"
    ).order_by(models.Activity.created_at.desc()).limit(limit).all()
    for act in connexions:
        raw.append((act.created_at, {"type": "connexion", "user_id": act.user_id, "ref_id": act.ref_id, "extras": {}}))

    medias = db.query(models.Activity).filter(
        models.Activity.activity_type.in_(["analyse_media_normal", "analyse_media_alerte"])
    ).order_by(models.Activity.created_at.desc()).limit(limit).all()
    for act in medias:
        raw.append((act.created_at, {
            "type": act.activity_type, "user_id": act.user_id, "ref_id": act.ref_id,
            "extras": {"analysis_source": act.analysis_source},
        }))

    raw.sort(key=lambda pair: pair[0], reverse=True)
    top = raw[:limit]

    # Résolution user_name par une seule requête groupée (pas de N+1 par entrée).
    user_ids = {entry["user_id"] for _, entry in top if entry["user_id"]}
    users_by_id = {}
    if user_ids:
        for u in db.query(models.User).filter(models.User.id.in_(user_ids)).all():
            users_by_id[u.id] = u.nom

    result = []
    for ts, entry in top:
        result.append({
            "type": entry["type"],
            "timestamp": ts.isoformat() if ts else None,
            "user_id": str(entry["user_id"]) if entry["user_id"] else None,
            # None si user_id absent OU si l'utilisateur référencé a été supprimé
            # depuis (users_by_id.get() sur une clé absente renvoie None).
            "user_name": users_by_id.get(entry["user_id"]),
            "ref_id": entry["ref_id"],
            "extras": entry["extras"],
        })
    return result

@app.get("/api/admin/metrics")
def get_admin_metrics(admin_id: str = Depends(get_current_admin_user_id), db: Session = Depends(get_db)):
    """Retourne les métriques globales de la plateforme (réservé aux administrateurs)."""
    try:
        # Check explicite, distinct des requêtes réelles ci-dessous : une connexion peut
        # être "ouverte" mais bloquée (ex. lock long) sans lever immédiatement sur les
        # requêtes suivantes. Timeout court côté DB (statement_timeout) pour ne jamais
        # figer la route sur un check qui traîne. N'échappe PAS au try/except global —
        # un échec ici est une vraie panne DB et doit suivre le même chemin
        # {"error": ...} que n'importe quelle autre requête de cette fonction (voir
        # TODO.md pour le chantier de réponse dégradée par section, hors périmètre ici).
        try:
            db.execute(text("SET LOCAL statement_timeout = '2000ms'"))
            db.execute(text("SELECT 1"))
            db_status = "connected"
        except Exception as e:
            print(f"[WARN] Admin metrics — check DB (SELECT 1) échoué: {type(e).__name__}: {e}")
            raise

        avg_latency_ms, latency_sample_count = _latency_metrics.snapshot()

        sites_data = db.query(models.Site).all()
        machines_data = db.query(models.Machine).all()
        users_data = db.query(models.User).order_by(models.User.created_at.asc()).all()
        anomalies_detected = db.query(models.AIAlert).count() + db.query(models.Machine).filter(models.Machine.status == "alerte").count()

        total_sites = len(sites_data)
        total_machines = len(machines_data)

        active_machines = 0
        total_power = 0.0
        for m in machines_data:
            if m.status == "actif":
                active_machines += 1
                total_power += float(m.puissance_nominale_kw or 0)

        # Estimer les économies globales générées sur la plateforme (Simulation)
        global_savings = total_power * 24 * 30 * 100 * 0.15

        # Associer dynamiquement le nombre de sites et de machines à chaque utilisateur
        user_sites_count = {}
        for s in sites_data:
            user_sites_count[s.user_id] = user_sites_count.get(s.user_id, 0) + 1

        site_to_user = {s.id: s.user_id for s in sites_data}
        user_machines_count = {}
        for m in machines_data:
            if m.site_id and m.site_id in site_to_user:
                uid = site_to_user[m.site_id]
                user_machines_count[uid] = user_machines_count.get(uid, 0) + 1

        users = []
        for u in users_data:
            users.append({
                "id": str(u.id),
                "name": u.nom,
                "email": u.email,
                "role": u.type_compte or "Utilisateur",
                "platform_role": u.platform_role,
                "last_active": u.last_sign_in_at.strftime("%d/%m/%Y") if u.last_sign_in_at else "Jamais",
                "status": "actif" if u.last_sign_in_at else "inactif",
                "sites_count": user_sites_count.get(u.id, 0),
                "machines_count": user_machines_count.get(u.id, 0),
            })

        return {
            "platform": {
                "total_sites": total_sites,
                "total_machines": total_machines,
                "active_machines": active_machines,
                "global_savings_xof": global_savings,
                "revenue_xof": global_savings * 0.10  # 10% Gain-Share
            },
            "users": users,
            "recent_activities": fetch_recent_activities(db),
            "ml_health": {
                "isolation_forest_anomalies_detected": anomalies_detected,
                "model_drift_status": "NORMAL"
            },
            "model_metrics": {
                "xgboost": {
                    "r2": xgb_metrics.get("r2") if xgb_metrics else None,
                    "mae_kw": xgb_metrics.get("mae_kw") if xgb_metrics else None,
                    "mape_pct": xgb_metrics.get("mape_pct") if xgb_metrics else None,
                    "dataset": xgb_metrics.get("dataset") if xgb_metrics else None,
                    "computed_at": xgb_metrics.get("computed_at") if xgb_metrics else None,
                }
            },
            "system": {
                "process_uptime_seconds": round(time.monotonic() - PROCESS_START_TIME),
                "avg_latency_ms": avg_latency_ms,
                "sample_count": latency_sample_count,
                "database_status": db_status,
            }
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/admin/gemini-metrics")
def get_gemini_metrics(admin_id: str = Depends(get_current_admin_user_id)):
    """Snapshot des compteurs d'observabilité du quota Gemini consommé (réservé aux
    administrateurs, même dépendance que /api/admin/metrics). Compteurs en mémoire
    du process courant uniquement (voir GeminiMetrics) — repartent à zéro à chaque
    redéploiement/redémarrage."""
    return {
        "ai_mode": AI_MODE,
        "gemini_model": GEMINI_MODEL,
        "rate_limit_per_minute": GEMINI_RATE_LIMIT_PER_MINUTE,
        "max_queue_wait_seconds": GEMINI_MAX_QUEUE_WAIT,
        "endpoints": _gemini_metrics.snapshot(),
    }

class RoleUpdate(BaseModel):
    platform_role: Optional[str] = None  # None, "admin"

@app.patch("/api/admin/users/{target_user_id}/role")
def update_user_role(target_user_id: str, req: RoleUpdate, superadmin_id: str = Depends(get_current_superadmin_user_id), db: Session = Depends(get_db)):
    """Promeut ou rétrograde un utilisateur au rôle admin. Réservé au superadmin —
    un admin ne peut pas se promouvoir lui-même ni promouvoir d'autres comptes,
    ce qui borne le pouvoir d'un admin ordinaire (limite de rôle)."""
    if req.platform_role not in (None, "admin"):
        raise HTTPException(status_code=422, detail="Rôle invalide")

    target = db.query(models.User).filter(models.User.id == target_user_id).first()
    if not target:
        return {"error": "Utilisateur introuvable"}
    if target.platform_role == "superadmin":
        raise HTTPException(status_code=403, detail="Impossible de modifier le rôle du superadmin")

    target.platform_role = req.platform_role
    db.commit()
    return serialize_user(target)

@app.get("/api/admin/users/{target_user_id}/machines")
def admin_get_user_machines(target_user_id: str, admin_id: str = Depends(get_current_admin_user_id), db: Session = Depends(get_db)):
    """Permet au support/admin de voir les équipements d'un utilisateur pour l'assister
    (ex: un client bloqué en état d'alerte). Lecture seule sauf action explicite ci-dessous."""
    machines = db.query(models.Machine).filter(models.Machine.user_id == target_user_id).all()
    sites = db.query(models.Site).filter(models.Site.user_id == target_user_id).all()
    site_map = {s.id: s.nom for s in sites}
    return [
        {
            "id": str(m.id),
            "machine_id": m.code_interne,
            "nom": m.nom,
            "site_nom": site_map.get(m.site_id, "Non associé"),
            "status": m.status,
            "puissance_nominale_kw": m.puissance_nominale_kw,
        }
        for m in machines
    ]

@app.get("/api/admin/users/{target_user_id}/facturation")
def admin_get_user_facturation(target_user_id: str, admin_id: str = Depends(get_current_admin_user_id), db: Session = Depends(get_db)):
    """Vue support en lecture seule de la facturation d'un utilisateur (litiges, support client)."""
    now = datetime.utcnow()
    month_start = datetime(now.year, now.month, 1)
    month_logs = db.query(models.AuditLog).filter(
        models.AuditLog.user_id == target_user_id, models.AuditLog.timestamp >= month_start,
    ).all()
    gross_savings = sum(a.gain_fcfa or 0 for a in month_logs)
    invoice_count = db.query(models.Invoice).filter(models.Invoice.user_id == target_user_id).count()
    bill_count = db.query(models.ElectricityBill).filter(models.ElectricityBill.user_id == target_user_id).count()
    return {
        "grossSavingsThisMonth": round(gross_savings),
        "gainShareThisMonth": round(gross_savings * 0.10),
        "invoiceCount": invoice_count,
        "billCount": bill_count,
    }

@app.post("/api/admin/machines/{machine_id}/reset")
def admin_reset_machine(machine_id: str, admin_id: str = Depends(get_current_admin_user_id), db: Session = Depends(get_db)):
    """Action de support limitée : remet un équipement en alerte en état actif pour le
    compte d'un client (ex: assistance suite à un appel). Journalisée dans l'audit du
    client concerné pour rester traçable — l'admin n'agit jamais silencieusement.
    """
    mach = db.query(models.Machine).filter(models.Machine.code_interne == machine_id).first()
    if not mach:
        return {"error": "Machine non trouvée"}

    mach.status = "actif"
    db.add(models.SensorMetric(
        machine_id=mach.id,
        power_kw=round(mach.puissance_nominale_kw * 0.7, 1),
        temperature_c=32.0,
        vibration_hz=1.2,
        pressure_bar=1.0,
    ))
    db.add(models.AuditLog(
        user_id=mach.user_id,
        action=f"Réinitialisation par le support — {mach.nom}",
        ref_hash=mach.code_interne,
        status="Résolu par le support",
    ))
    db.commit()
    return {"status": "success"}

class NewMachine(BaseModel):
    nom: str
    power_kw: Optional[float] = None
    categorie: Optional[str] = None
    marque: Optional[str] = None
    modele: Optional[str] = None
    numero_serie: Optional[str] = None
    quantite: Optional[int] = 1
    site_id: Optional[str] = None

@app.post("/api/machines")
def add_machine(machine: NewMachine, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Ajoute des machines pour l'utilisateur connecté.

    La puissance nominale est déterminée automatiquement à partir du catalogue
    (catégorie + marque + modèle) si fourni, sinon on utilise power_kw en saisie libre.
    """
    power_kw = machine.power_kw
    if machine.categorie and machine.marque and machine.modele:
        looked_up = equipment_catalog.lookup(machine.categorie, machine.marque, machine.modele)
        if looked_up:
            power_kw = looked_up["puissance_kw"]

    if power_kw is None:
        return {"error": "Puissance non déterminée : choisissez un modèle du catalogue ou indiquez une puissance manuelle."}

    added_machines = []
    for _ in range(machine.quantite):
        code = f"NEW-{uuid.uuid4().hex[:6].upper()}"
        new_mach = models.Machine(
            code_interne=code,
            nom=machine.nom,
            puissance_nominale_kw=power_kw,
            status="actif",
            priority="moyenne",
            categorie=machine.categorie,
            marque=machine.marque,
            modele=machine.modele,
            numero_serie=machine.numero_serie,
            site_id=machine.site_id if machine.site_id else None,
            user_id=user_id,
        )
        db.add(new_mach)
        db.commit()
        db.refresh(new_mach)

        metric = models.SensorMetric(
            machine_id=new_mach.id,
            power_kw=power_kw,
            temperature_c=35.0,
            vibration_hz=1.5,
            pressure_bar=1.0,
        )
        db.add(metric)
        db.commit()

        added_machines.append({
            "machine_id": code,
            "nom": machine.nom,
            "power_kw": power_kw,
            "temperature_c": 35.0,
            "vibration_hz": 1.5,
            "pressure_bar": 1.0,
            "status": "actif",
            "priority": "moyenne"
        })
    return {"status": "success", "machines": added_machines}

@app.post("/api/machines/{machine_id}/simulate")
def simulate_anomaly(machine_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Simule une alerte sur une machine spécifique appartenant à l'utilisateur connecté."""
    mach = db.query(models.Machine).filter(
        models.Machine.code_interne == machine_id, models.Machine.user_id == user_id
    ).first()
    if not mach:
        return {"error": "Machine non trouvée"}

    mach.status = "alerte"
    db.add(models.SensorMetric(
        machine_id=mach.id,
        power_kw=mach.puissance_nominale_kw + 15.0,
        temperature_c=75.0,
        vibration_hz=50.0,
        pressure_bar=4.0,
    ))
    db.commit()

    return {"status": "success"}

@app.post("/api/machines/{machine_id}/reset")
def reset_machine(machine_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Remet une machine en état actif avec des relevés nominaux (ex: après une alerte)."""
    mach = db.query(models.Machine).filter(
        models.Machine.code_interne == machine_id, models.Machine.user_id == user_id
    ).first()
    if not mach:
        return {"error": "Machine non trouvée"}

    mach.status = "actif"
    db.add(models.SensorMetric(
        machine_id=mach.id,
        power_kw=round(mach.puissance_nominale_kw * 0.7, 1),
        temperature_c=32.0,
        vibration_hz=1.2,
        pressure_bar=1.0,
    ))
    db.commit()

    return {"status": "success"}

@app.get("/api/machines/{machine_id}/history")
def get_machine_history(machine_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Retourne l'historique récent des relevés capteurs d'une machine."""
    mach = db.query(models.Machine).filter(
        models.Machine.code_interne == machine_id, models.Machine.user_id == user_id
    ).first()
    if not mach:
        return {"error": "Machine non trouvée"}

    metrics = db.query(models.SensorMetric).filter(
        models.SensorMetric.machine_id == mach.id
    ).order_by(models.SensorMetric.recorded_at.desc()).limit(20).all()

    alerts = db.query(models.AIAlert).filter(
        models.AIAlert.machine_id == mach.id
    ).order_by(models.AIAlert.created_at.desc()).limit(10).all()

    return {
        "machine": {
            "nom": mach.nom,
            "code_interne": mach.code_interne,
            "status": mach.status,
            "priority": mach.priority,
            "puissance_nominale_kw": mach.puissance_nominale_kw,
            "created_at": mach.created_at.isoformat(),
        },
        "history": [
            {
                "recorded_at": m.recorded_at.isoformat(),
                "power_kw": m.power_kw,
                "temperature_c": m.temperature_c,
                "vibration_hz": m.vibration_hz,
                "pressure_bar": m.pressure_bar,
            }
            for m in metrics
        ],
        "alerts": [
            {
                "type_alerte": a.type_alerte,
                "description": a.description,
                "action_recommandee": a.action_recommandee,
                "created_at": a.created_at.isoformat(),
                "is_resolved": a.is_resolved,
            }
            for a in alerts
        ],
    }

@app.post("/api/predict")
def predict(req: PredictionRequest):
    """Prédit la consommation future d'une machine."""
    if xgb_data is None:
        return {"error": "Modèle XGBoost non chargé. Entraînez-le d'abord."}

    from ml.recommendation_engine import predict_next_hours
    predictions = predict_next_hours(
        xgb_data, req.machine_id,
        req.temperature_c, req.vibration_hz, req.pressure_bar,
        req.hours_ahead
    )
    return {"machine_id": req.machine_id, "predictions": predictions}

@app.post("/api/anomaly")
def check_anomaly(reading: SensorReading):
    """Vérifie si une lecture de capteur est anormale."""
    if iso_data is None:
        return {"error": "Modèle Isolation Forest non chargé. Entraînez-le d'abord."}

    from ml.recommendation_engine import detect_anomalies
    result = detect_anomalies(iso_data, reading.model_dump())
    return {"machine_id": reading.machine_id, **result}

@app.post("/api/recommend")
def get_recommendations(machines: List[SensorReading], user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Génère des recommandations basées sur l'état actuel des machines.

    Les actions à faible risque (délestage préventif sur une machine de
    priorité basse) sont exécutées automatiquement par l'IA et journalisées
    dans le registre d'audit. Toute alerte (anomalie, surchauffe) reste une
    action humaine : l'IA ne coupe jamais un équipement en défaut toute seule.
    """
    if xgb_data is None or iso_data is None:
        return {"error": "Les modèles ne sont pas chargés. Entraînez-les d'abord."}

    from ml.recommendation_engine import generate_recommendations
    machines_state = [m.model_dump() for m in machines]

    threshold_row = db.query(models.AlertThreshold).filter(models.AlertThreshold.user_id == user_id).first()
    thresholds = serialize_thresholds(threshold_row)

    recs = generate_recommendations(xgb_data, iso_data, machines_state, thresholds=thresholds)

    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
    for rec in recs:
        if rec['type'] == 'délestage':
            # Action à faible risque : l'IA l'exécute directement et la trace dans l'audit
            # (une seule fois par heure et par machine, pour ne pas spammer le registre
            # vu que /api/recommend est appelé toutes les quelques secondes par le frontend).
            rec['auto_resolu'] = True
            already_logged = db.query(models.AuditLog).filter(
                models.AuditLog.user_id == user_id,
                models.AuditLog.ref_hash == rec['machine_id'],
                models.AuditLog.action.like("Délestage automatique%"),
                models.AuditLog.timestamp >= one_hour_ago,
            ).first()
            if not already_logged:
                db.add(models.AuditLog(
                    user_id=user_id,
                    action=f"Délestage automatique — {rec['title']}",
                    ref_hash=rec['machine_id'],
                    status="Résolu par l'IA",
                    gain_fcfa=rec.get('gain_fcfa') or 0,
                ))
        else:
            rec['auto_resolu'] = False
    db.commit()

    return {"recommendations": recs, "count": len(recs)}

class ChatRequest(BaseModel):
    message: str
    context: List[dict]

def summarize_machines_for_chat(context: List[dict]) -> str:
    """Résumé compact des machines pour le prompt Gemini : un objet JSON complet par
    machine (site_id, numero_serie, etc.) gonfle le prompt sans utilité pour l'assistant
    et ralentit la génération. Ne garder que ce qui sert à répondre à une question."""
    if not context:
        return "Aucune machine enregistrée."
    lines = []
    for m in context[:30]:
        lines.append(
            f"- {m.get('nom', '?')} ({m.get('categorie', '?')}, site {m.get('site_nom', '?')}) : "
            f"statut={m.get('status', '?')}, {m.get('power_kw', '?')}kW, "
            f"{m.get('temperature_c', '?')}°C, {m.get('vibration_hz', '?')}Hz"
        )
    return "\n".join(lines)

@app.post("/api/chat")
def chat_with_gemini(req: ChatRequest):
    machines_summary = summarize_machines_for_chat(req.context)

    # Le contexte machines fait partie de la clé : sinon deux questions identiques
    # posées sur des parcs différents renverraient la même réponse en cache — un
    # bug métier silencieux, pire qu'une absence de cache. Pas de cache en mode
    # mock : aucun coût réseau à éviter, et ça garantit qu'une réponse [MOCK] ne
    # peut jamais rester en cache après un repassage en AI_MODE=live (le cache est
    # simplement jamais écrit tant qu'on est en mock).
    cache_key = None
    if AI_MODE != "mock":
        cache_key = hashlib.sha256(
            f"{normalize_text(req.message)}|{normalize_text(machines_summary)}".encode()
        ).hexdigest()
        cached = _chat_cache.get(cache_key)
        if cached is not None:
            _gemini_metrics.record_cache_hit("chat")
            print(f"[INFO] Cache chat HIT — taux de hit cumulé: {_chat_cache.hit_rate()}%")
            return {"response": cached}

    system_prompt = "Tu es NouanKanyAI Copilot, l'IA intelligente de l'application NouanKanyAI. Tu aides le responsable d'une usine ou d'un hotel a gerer sa consommation d'energie (electricite, machines). Reste professionnel et concis (reponses courtes, va a l'essentiel), et utilise le contexte fourni pour donner des reponses precises. Reponds toujours en francais, sauf si l'utilisateur ecrit explicitement dans une autre langue."
    context_str = f"Etat actuel des machines :\n{machines_summary}"
    full_prompt = f"{system_prompt}\n\n{context_str}\n\nQuestion de l'utilisateur : {req.message}"

    payload = {
        "contents": [{"parts": [{"text": full_prompt}]}],
        "generationConfig": {"temperature": 0.3, "maxOutputTokens": 800, "thinkingConfig": {"thinkingBudget": 0}}
    }

    try:
        result = call_gemini(payload, endpoint="chat", timeout=20, retries=2)
        text = result['candidates'][0]['content']['parts'][0]['text']
        if cache_key:
            _chat_cache.set(cache_key, text)
        print(f"[INFO] Cache chat — taux de hit cumulé: {_chat_cache.hit_rate()}% ({_chat_cache.hits}/{_chat_cache.hits + _chat_cache.misses})")
        return {"response": text}
    except RateLimiterSaturated as e:
        print(f"[WARN] Chat — limiteur Gemini sature: {e}")
        return {"response": "Quota local saturé, réessayez dans quelques instants."}
    except Exception as e:
        print(f"[WARN] Gemini chat error: {gemini_error_summary(e)}")
        return {"response": "Désolé, l'assistant IA met trop de temps à répondre pour le moment. Réessayez dans quelques instants."}

@app.post("/api/machines/{machine_id}/analyze-media")
# Volontairement synchrone. FastAPI exécute en threadpool. Permet à
# GeminiRateLimiter.acquire() (time.sleep bloquant) de fonctionner sans geler
# l'event loop. Précédent : chat_with_gemini est déjà en def pour la même raison.
def analyze_machine_media(machine_id: str, file: UploadFile = File(...), user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Analyse un flux photo/vidéo d'une machine via Gemini Multimodal pour détecter une menace."""
    mach = db.query(models.Machine).filter(
        models.Machine.code_interne == machine_id, models.Machine.user_id == user_id
    ).first()
    if not mach:
        return {"error": "Machine non trouvée"}

    def log_media_activity(activity_type: str, analysis_source: str, description: str) -> None:
        """Télémétrie pour le flux "activités récentes" du portail admin — TOUTES les
        analyses (ALERTE et NORMAL), pas seulement celles qui déclenchent une alerte
        (contrairement à AIAlert, écrit uniquement sur ALERTE). analysis_source
        distingue une vraie analyse Gemini ("gemini") d'un résultat de repli par nom
        de fichier ("fallback_filename", utilisé quand Gemini est indisponible) — axe
        indépendant du résultat (activity_type), pour rester requêtable séparément
        (ex. calcul d'un "fallback rate"). Silencieux : un échec d'insertion ne doit
        jamais faire échouer une analyse déjà terminée."""
        try:
            db.add(models.Activity(
                activity_type=activity_type, user_id=user_id, ref_id=mach.code_interne,
                analysis_source=analysis_source, description=description,
            ))
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"[WARN] Activity — échec journalisation analyse média ({activity_type}/{analysis_source}): {type(e).__name__}: {e}")

    # 1. Lire le fichier, vérifier le cache (hash AVANT compression), sinon appeler Gemini
    file_bytes = file.file.read()
    mime_type = file.content_type
    image_hash = hashlib.sha256(file_bytes).hexdigest()

    text_response = _media_cache.get(image_hash) if AI_MODE != "mock" else None
    if text_response is not None:
        _gemini_metrics.record_cache_hit("media")
        print(f"[INFO] Cache media HIT — taux de hit cumulé: {_media_cache.hit_rate()}%")
    else:
        file_bytes, mime_type = compress_image_for_gemini(file_bytes, mime_type, source="analyze-media")
        base64_data = base64.b64encode(file_bytes).decode("utf-8")

        # 2. Appeler l'API Gemini
        prompt = (
            "Analyse cette image ou vidéo de l'équipement industriel. Détecte s'il y a une anomalie, un danger imminent, "
            "une fumée, un feu, une fuite, ou toute menace physique. Réponds strictement sous le format :\n"
            "STATUS: [ALERTE ou NORMAL]\n"
            "DESCRIPTION: [Une description concise en français du problème détecté, ou 'Tout est en ordre' si NORMAL]"
        )

        payload = {
            "contents": [{
                "parts": [
                    {
                        "inlineData": {
                            "mimeType": mime_type,
                            "data": base64_data
                        }
                    },
                    {
                        "text": prompt
                    }
                ]
            }],
            "generationConfig": {"temperature": 0.2, "maxOutputTokens": 200, "thinkingConfig": {"thinkingBudget": 0}}
        }

        try:
            result = call_gemini(payload, endpoint="media", timeout=40, retries=2)
            text_response = result['candidates'][0]['content']['parts'][0]['text']
        except RateLimiterSaturated as e:
            # Distinct du fallback "simulation par nom de fichier" ci-dessous : ici,
            # aucun appel Gemini n'a été tenté (quota local, pas un échec de l'API),
            # donc deviner via le nom du fichier serait trompeur.
            print(f"[WARN] Analyse média — limiteur Gemini sature: {e}")
            return {
                "status": "ERROR",
                "description": "Quota local Gemini saturé, réessayez dans quelques instants.",
                "message": "Quota local saturé, réessayez dans quelques instants.",
            }
        except Exception as e:
            # En cas d'erreur ou d'absence de clé valide, mode démo basé sur le nom du fichier.
            # Jamais mis en cache : un 503 transitoire ne doit pas se figer pour les prochains appels.
            print(f"[WARN] Gemini analyze error: {gemini_error_summary(e)}")
            filename_lower = file.filename.lower()
            if any(w in filename_lower for w in ["fire", "feu", "smoke", "danger", "fuite", "leak"]):
                mach.status = "alerte"
                db.add(models.SensorMetric(
                    machine_id=mach.id,
                    power_kw=float(mach.puissance_nominale_kw) * 1.3,
                    temperature_c=90.0,
                    vibration_hz=45.0,
                    pressure_bar=4.5,
                ))
                db.add(models.AIAlert(
                    machine_id=mach.id,
                    type_alerte="Simulation de danger visuel",
                    description=f"Incident simulé suite au chargement du fichier de menace : {file.filename}",
                    action_recommandee="Vérifiez les capteurs et l'alarme incendie.",
                    gain_estime_fcfa=float(mach.puissance_nominale_kw) * 100 * 24 * 5,
                    is_resolved=False,
                ))
                db.commit()

                log_media_activity("analyse_media_alerte", "fallback_filename", f"Menace simulée détectée (Fichier: {file.filename}).")
                return {
                    "status": "ALERTE",
                    "description": f"Menace simulée détectée (Fichier: {file.filename}).",
                    "message": f"Alerte de sécurité simulée sur l'appareil {mach.nom}."
                }
            log_media_activity("analyse_media_normal", "fallback_filename", "Aucune menace apparente détectée (Mode simulation).")
            return {"status": "NORMAL", "description": "Aucune menace apparente détectée (Mode simulation)."}

        if AI_MODE != "mock":
            _media_cache.set(image_hash, text_response)
        print(f"[INFO] Cache media — taux de hit cumulé: {_media_cache.hit_rate()}% ({_media_cache.hits}/{_media_cache.hits + _media_cache.misses})")

    status = "NORMAL"
    description = "Aucun danger détecté."

    for line in text_response.split('\n'):
        if line.startswith("STATUS:"):
            status = line.replace("STATUS:", "").strip()
        elif line.startswith("DESCRIPTION:"):
            description = line.replace("DESCRIPTION:", "").strip()

    # En mode mock, Machine.status peut valoir "alerte" sans marque distinctive.
    # La seule trace est le [MOCK] dans l'AIAlert liée. Ne jamais exécuter
    # AI_MODE=mock contre une base destinée à une démo ou à la production.
    if "ALERTE" in status:
        mach.status = "alerte"
        db.add(models.SensorMetric(
            machine_id=mach.id,
            power_kw=float(mach.puissance_nominale_kw) * 1.3,
            temperature_c=85.0,
            vibration_hz=48.0,
            pressure_bar=5.0,
        ))
        db.add(models.AIAlert(
            machine_id=mach.id,
            type_alerte="Danger détecté par flux visuel",
            description=f"L'analyse du flux vidéo/photo a identifié une menace : {description}",
            action_recommandee="Inspectez l'équipement immédiatement et lancez la procédure de coupure d'urgence si nécessaire.",
            gain_estime_fcfa=float(mach.puissance_nominale_kw) * 100 * 24 * 5,
            is_resolved=False,
        ))
        db.commit()

        log_media_activity("analyse_media_alerte", "gemini", description)
        return {
            "status": "ALERTE",
            "description": description,
            "message": f"Menace identifiée ! L'appareil {mach.nom} a été placé en état d'alerte de sécurité."
        }
    else:
        log_media_activity("analyse_media_normal", "gemini", description)
        return {
            "status": "NORMAL",
            "description": description,
            "message": "Le flux média a été analysé. Aucun danger visible n'a été détecté."
        }

if __name__ == '__main__':
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
