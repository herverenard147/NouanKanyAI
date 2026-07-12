// Base URL de l'API backend FastAPI.
// En local: http://localhost:8000 (valeur par défaut).
// En production sur Render: définir NEXT_PUBLIC_API_URL dans les variables d'environnement du service frontend.
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
