# Vitoo Auth Backend

API d'authentification indépendante du frontend Vitoo.

## Démarrage

```bash
cd backend
npm install
npm run dev
```

Le serveur écoute sur `http://localhost:4000`.

## Routes

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `GET /api/auth/me` avec `Authorization: Bearer <token>`
- `PATCH /api/auth/me` avec `Authorization: Bearer <token>`
- `GET /api/admin/users` avec `x-admin-key: <ADMIN_API_KEY>`

Le stockage actuel est en mémoire pour le prototypage. Les comptes sont perdus au redémarrage du serveur.

Pour consulter les comptes inscrits :

```bash
curl http://localhost:4000/api/admin/users -H "x-admin-key: change-this-admin-key"
```
