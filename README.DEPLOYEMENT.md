# 🚀 Déploiement Vitoo — Guide pas à pas

Ce guide vous aide à mettre en ligne **Vitoo** avec :
- **1 site React** sur **Vercel** (contient les espaces `/passenger`, `/company`, `/admin`, `/driver`)
- **1 backend API** (Express + Prisma + SQLite) sur **Render** avec disque persistant

> Plus tard, vos 2 domaines séparés (passager et compagnie) pourront être branchés — le code CORS est déjà prêt (voir `CLIENT_ORIGINS`).

---

## 0. Prérequis

- Compte GitHub, Git installé sur votre machine
- Un repo GitHub pour le projet (à créer)
- Comptes gratuits : [vercel.com](https://vercel.com) + [render.com](https://render.com)

---

## 1. Préparer le repo et les secrets

### 1.1 Créer le repo GitHub
```bash
git init
git add -A
git commit -m "init vitoo"
```

Créez un repo **vide** sur github.com, puis :
```bash
git branch -M main
git remote add origin https://github.com/VOTRE-USERNAME/vitoo.git
git push -u origin main
```

> ⚠️ Le `.gitignore` est déjà configuré pour ne **pas** envoyer vos secrets (`.env`, `backend/.env`, `backend/*.db`, `backend/trips.json`).

### 1.2 Générer un JWT secret (à noter quelque part)
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## 2. Déployer le backend sur Render

1. Connectez-vous sur [render.com](https://render.com) → **New** → **Web Service**
2. Choisissez votre repo GitHub
3. Remplissez :
   | Champ | Valeur |
   |---|---|
   | **Name** | `vitoo-api` |
   | **Runtime** | `Node` |
   | **Build Command** | `cd backend && npm ci && npx prisma generate && npm run build` |
   | **Start Command** | `cd backend && node dist/server.js` |
   | **Root Directory** | `/` (ou vide) |
   | **Instance Type** | Free |
4. **Add Disk** : montant `Mount Path` = `/data`, taille 1 Go (la base SQLite y vivra)
5. **Environment** (variables) :
   ```
   NODE_ENV=production
   PORT=4000
   DATABASE_URL=file:/data/vitoo.db
   JWT_SECRET=<le hash généré en 1.2>
   ADMIN_BOOTSTRAP_PHONE=07XXXXXXXX
   ADMIN_BOOTSTRAP_PASSWORD=<mot de passe admin fort>
   CLIENT_ORIGINS=https://VOTRE-APP.vercel.app
   ```
   (les clés SMS/Resend : laissées vides = mode démo console. `GOOGLE_CLIENT_ID`: optionnel)
6. **Create Web Service**. Attendez le déploiement (2-3 min).
7. À la fin, Render vous donne une URL type `https://vitoo-api.onrender.com`
   > Vérifiez : `https://vitoo-api.onrender.com/api/health` doit afficher `{"status":"ok",...}`

---

## 3. Déployer le site sur Vercel

1. Allez sur [vercel.com](https://vercel.com) → **Add New** → **Project**
2. Importez le repo GitHub
3. *(Framework par défaut : Vite sera détecté automatiquement)*
4. **Build Command** : `npm run build` (automatique)
5. **Environment Variables** :
   ```
   VITE_API_URL=https://vitoo-api.onrender.com/api
   ```
6. **Deploy**. Attendez la fin du build.
7. Vous obtenez une URL type `https://vitoo-xxxx.vercel.app`

## 4. Vérifications

| Test | URL | Attendu |
|---|---|---|
| API santé | `https://vitoo-api.onrender.com/api/health` | `{"status":"ok",...}` |
| Site (racine) | `https://votre-app.vercel.app/` | redirige vers `/passenger` |
| Espace passager | `https://votre-app.vercel.app/passenger` | page d'accueil passager |
| Espace compagnie | `https://votre-app.vercel.app/company` | login/accueil compagnie |
| Espace admin | `https://votre-app.vercel.app/admin` | (protégé, renvoie à la maison si non admin) |

---

## 5. Activer le paiement en ligne réel (CinetPay)

Le paiement en ligne est **déjà codé** (CinetPay API Direct). Sans clés, l'application fonctionne en **mode simulation** (aucun argent réel n'est collecté, billet "fake"). Pour encaisser réellement, il faut un **compte marchand CinetPay**, qui exige une entreprise enregistrée.

### 5.1 Créer l'entreprise (obligatoire pour encaisser)

En Côte d'Ivoire, être étudiant n'est **pas** un obstacle légal. L'immatriculation se fait au **CEPICI** (guichet unique : greffe + impôts + CNPS en un seul dossier, RCCM + NIF obtenus en 24–72 h).

| Forme | Associes | Coût CEPICI | Responsabilité | Profil adapté |
|---|---|---|---|---|
| **Entreprise Individuelle (EI)** | 1 seule personne | ~10 000–20 000 FCFA | illimitée (biens personnels) | solo, démarrage rapide |
| **SARL** | **2 à 100** | ~25 000–50 000 FCFA | limitée aux apports | **2 étudiants associés** ← recommandé |

- Capital SARL : **libre** depuis la réforme OHADA (dès 5 000 FCFA symboliques suffit).
- Statuts SARL **sous seing privé** (notaire non obligatoire si capital modeste).
- Documents : CNI de chaque associé + justificatif de domicile + adresse du siège.
- **Budget réaliste total : ~50 000–100 000 FCFA** (frais CEPICI + timbres + éventuel accompagnement type ACF-CI / Legafrik / Kolonell).

### 5.2 Chaîne à suivre après l'immatriculation

1. **DFE** à la DGI (immatriculation fiscale) — indispensable pour CinetPay.
2. **Compte bancaire professionnel** — c'est sur ce compte (IBAN) que CinetPay reverse l'argent.
3. **Compte marchand CinetPay** → [cinetpay.com](https://cinetpay.com) avec RCCM + NIF + pièce d'identité + RIB :
   - Commencez par l'**espace sandbox** (clés de test, disponibles dès la validation du compte).
   - Passez ensuite en **live** pour encaisser pour de vrai.

### 5.3 Activer dans l'application

Une fois les clés obtenues, ajoutez ces variables sur **Render** (service backend) :

```
CINETPAY_API_KEY=…
CINETPAY_SITE_ID=…
CINETPAY_SECRET_KEY=…
PUBLIC_API_URL=https://vitoo-api.onrender.com   # webhook notify_url du guichet
FRONTEND_URL=https://votre-app.vercel.app       # retour passager après paiement
```

Redéployez Render. Testez un vrai paiement → l'argent est versé sur votre compte marchand.

### 5.4 Alternatives si CinetPay ne convient pas

Toutes exigent le **même enregistrement** (RCCM + NIF) :

| Passerelle | Frais (ordre) | Particularité |
|---|---|---|
| **PayDunya** | ~2,9 % | onboarding le plus rapide, agrégateur (Wave, Orange Money, MTN, cartes) |
| **Hub2** | ~1,8–2,2 % | frais les plus bas, API propre, webhooks signés |
| **Cipay (EGSCI)** | — | passerelle ivoirienne émergente |

Le code est branché uniquement sur CinetPay. Changer de passerelle = petits ajustements dans `backend/src/shared/payments/cinetpay.ts`.

---

## 6. Brancher vos 2 domaines (optionnel, plus tard)

Quand vous voudrez **2 domaines séparés** (ex : `vitoo.com` pour passager, `espace.vitoo.com` pour compagnie), on adaptera :
- 2 projets Vercel (ou 2 domaines sur le même projet)
- Le routing forcera l'espace selon le domaine
- Ajoutez le 2e domaine dans `CLIENT_ORIGINS` côté Render (format `https://a.com,https://b.com`)

---

## 7. Mises à jour futures

- **Backend** : `git push` sur la branche liée → Render rebuild automatiquement
- **Frontend** : `git push` → Vercel redéploie

## 8. Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| `CORS error` dans la console | `CLIENT_ORIGINS` ne contient pas la bonne URL Vercel | Mettez à jour `CLIENT_ORIGINS` et redéployez Render |
| Base vide après Redémarrage Render | Disque non monté | Vérifiez le Disk (`Mount Path === /data`) |
| `ERR_CONNECTION_REFUSED` API | Service Render arrêté (free tier dort) | Rouvrez l'URL du site quelques minutes après le dernier appel |