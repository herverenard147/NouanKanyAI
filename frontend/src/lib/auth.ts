// Authentification maison (remplace @supabase/supabase-js) : JWT stocké côté client,
// envoyé en Bearer token à l'API FastAPI.
import { API_URL } from './api';

const TOKEN_KEY = 'nk_token';

export interface AuthUser {
  id: string;
  email: string;
  nom: string;
  type_compte: string;
  role: string;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data.detail || 'Une erreur est survenue';
  } catch {
    return 'Une erreur est survenue';
  }
}

export async function signUp(email: string, password: string, nom: string, type_compte: string): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, nom, type_compte }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  setToken(data.token);
  return data.user;
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  setToken(data.token);
  return data.user;
}

export function signOut() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/api/auth/me`, { headers: authHeaders() });
    if (!res.ok) {
      signOut();
      return null;
    }
    return await res.json();
  } catch {
    return null;
  }
}
