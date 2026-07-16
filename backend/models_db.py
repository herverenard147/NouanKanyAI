"""
models_db.py — Modèles SQLAlchemy (remplacent les tables Supabase).
"""

import uuid
from datetime import datetime

from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    nom = Column(String, nullable=False)
    type_compte = Column(String, default="Particulier")
    role = Column(String, default="Utilisateur")
    # Rôle d'accès à la plateforme (distinct de `role`/`type_compte` qui décrivent
    # le type de compte client) : None = client normal, "admin" ou "superadmin".
    platform_role = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_sign_in_at = Column(DateTime, nullable=True)

    sites = relationship("Site", back_populates="owner")


class Site(Base):
    __tablename__ = "sites"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nom = Column(String, nullable=False)
    localisation = Column(String, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="sites")
    machines = relationship("Machine", back_populates="site")


class Machine(Base):
    __tablename__ = "machines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code_interne = Column(String, unique=True, nullable=False)
    nom = Column(String, nullable=False)
    puissance_nominale_kw = Column(Float, nullable=False)
    status = Column(String, default="actif")
    priority = Column(String, default="moyenne")
    categorie = Column(String, nullable=True)
    marque = Column(String, nullable=True)
    modele = Column(String, nullable=True)
    numero_serie = Column(String, nullable=True)
    site_id = Column(UUID(as_uuid=True), ForeignKey("sites.id"), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    site = relationship("Site", back_populates="machines")


class SensorMetric(Base):
    __tablename__ = "sensor_metrics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    machine_id = Column(UUID(as_uuid=True), ForeignKey("machines.id"), nullable=False)
    power_kw = Column(Float)
    temperature_c = Column(Float)
    vibration_hz = Column(Float)
    pressure_bar = Column(Float)
    recorded_at = Column(DateTime, default=datetime.utcnow, index=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    action = Column(String)
    ref_hash = Column(String)
    status = Column(String)
    gain_fcfa = Column(Float, nullable=True)


class Invoice(Base):
    """Facture de commission (Gain-Share 10%) que NouanKanyAI émet au client — distinct
    des factures d'électricité réelles du client, voir `ElectricityBill` ci-dessous."""
    __tablename__ = "invoices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    month = Column(String)
    amount_xof = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)


class ElectricityBill(Base):
    """Facture d'électricité réelle du client (CIE ou équivalent) — importée par photo,
    saisie manuellement, ou générée en prévision par l'IA à partir de l'historique.
    Sert de base à l'IA pour prévoir les futures factures et calibrer ses optimisations."""
    __tablename__ = "electricity_bills"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    month = Column(String)
    amount_xof = Column(Float)
    # Provenance de l'enregistrement : "manuel" (saisie), "ocr" (photo de facture analysée
    # par l'IA), ou "ia" (prévision générée par l'IA à partir de l'historique).
    source = Column(String, default="manuel")
    is_forecast = Column(Boolean, default=False)
    # Renseigné quand la vraie facture arrive pour un mois qui avait été prévu par l'IA,
    # ce qui permet de mesurer l'écart et de recalibrer les prochaines prévisions.
    actual_amount_xof = Column(Float, nullable=True)
    kwh_consumed = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AlertThreshold(Base):
    __tablename__ = "alert_thresholds"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    temperature_max_c = Column(Float, default=60.0)
    vibration_max_hz = Column(Float, default=45.0)
    surconsommation_ratio = Column(Float, default=1.2)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ForecastAccuracy(Base):
    """Facteur de correction appris à partir de l'écart prévision vs facture réelle,
    pour recalibrer les prochaines prévisions de l'IA (moyenne mobile simple)."""
    __tablename__ = "forecast_accuracy"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    correction_factor = Column(Float, default=1.0)
    last_error_pct = Column(Float, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AIAlert(Base):
    __tablename__ = "ai_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    machine_id = Column(UUID(as_uuid=True), ForeignKey("machines.id"), nullable=False)
    type_alerte = Column(String)
    description = Column(Text)
    action_recommandee = Column(Text)
    gain_estime_fcfa = Column(Float)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Activity(Base):
    """Flux "activités récentes" du portail admin — distincte d'AuditLog (couplée
    aux calculs financiers de /api/facturation, ne pas mélanger les deux). Écriture
    directe uniquement pour les événements sans autre trace exploitable (connexions,
    analyses média) ; les autres types du flux admin (délestages, resets, uploads
    OCR) sont LUS depuis leurs tables d'origine (AuditLog, ElectricityBill), jamais
    dupliqués ici — voir /api/admin/metrics."""
    __tablename__ = "activities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # "connexion" | "analyse_media_normal" | "analyse_media_alerte"
    activity_type = Column(String, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    # code_interne de la machine concernée, le cas échéant (ex: analyse média) — même
    # convention que AuditLog.ref_hash, pas l'UUID interne.
    ref_id = Column(String, nullable=True)
    # "gemini" | "fallback_filename" — uniquement pour activity_type analyse_media_*,
    # NULL pour les autres types (ex: connexion). Axe indépendant de activity_type
    # (résultat) pour rester requêtable séparément, ex. calcul d'un "fallback rate".
    analysis_source = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
