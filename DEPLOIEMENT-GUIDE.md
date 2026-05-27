# Guide de déploiement — Auditude

---

## Architecture de production

```
Navigateur
    │
    ▼
Vercel (Next.js — fiscalscore-app)
    │  NEXT_PUBLIC_STRAPI_URL
    ▼
Render (Strapi CMS — fiscalscore-cms)
    │
    ▼
PostgreSQL (base de données)
```

---

## Variables d'environnement

### Sur Vercel (Next.js)

| Variable | Valeur | Obligatoire |
|---|---|---|
| `NEXT_PUBLIC_STRAPI_URL` | `https://qhm-1.onrender.com` | ✅ |
| `NEXTAUTH_URL` | `https://ton-app.vercel.app` | ✅ |
| `NEXTAUTH_SECRET` | chaîne aléatoire (min 32 chars) | ✅ |

### Sur Render (Strapi)

Copie `.env.example` → `.env` et remplis les vraies valeurs :

```
HOST=0.0.0.0
PORT=1337
APP_KEYS=clé1,clé2,clé3,clé4
API_TOKEN_SALT=xxx
ADMIN_JWT_SECRET=xxx
TRANSFER_TOKEN_SALT=xxx
JWT_SECRET=xxx
DATABASE_URL=postgresql://...
```

---

## Ordre de démarrage après un redéploiement

```
① Strapi démarre sur Render
        ↓
② Bootstrap s'exécute automatiquement (src/index.ts)
   → Crée les rôles "Admin" et "Evaluateur"
   → Applique toutes les permissions API
   → Auto-assigne le rôle Admin à tout user
     dont le username/email contient "admin"
        ↓
③ (1ère fois uniquement) Lancer le seed :
   npm run seed:qhm
   → Crée 2 questionnaires + 17 questions
   → Crée 2 clients démo
   → Crée admin@qhm.local / AdminQhm2026!
   → Crée evaluateur@qhm.local / EvalQhm2026!
        ↓
④ Vercel redéploie automatiquement depuis GitHub
        ↓
⑤ Connexion sur Auditude
   → Se déconnecter / reconnecter si session ancienne
```

---

## Checklist si tu es bloqué à la connexion

| Symptôme | Cause | Solution |
|---|---|---|
| Boucle de redirection | `NEXTAUTH_URL` incorrect | Mettre l'URL exacte Vercel |
| "Identifiants invalides" | Pas de compte créé | Lancer `npm run seed:qhm` |
| Dashboard rouge / Strapi inaccessible | `NEXT_PUBLIC_STRAPI_URL` mauvaise URL ou Render en veille | Vérifier l'URL + attendre le réveil Render (~50s) |
| Boutons admin invisibles | Rôle "Authenticated" au lieu de "Admin" | Redémarrer Strapi → bootstrap auto-assigne le rôle |
| 403 sur tous les endpoints | Mauvais rôle API | Même chose — redémarrer Strapi |
| Questionnaire introuvable (404) | ID d'un ancien environnement | Lancer `npm run seed:qhm` |

---

## Problème Render — mise en veille (plan gratuit)

Le plan gratuit Render **met le service en veille après 15 minutes d'inactivité**.
Au réveil, il faut ~50 secondes → timeout côté Vercel → page d'erreur.

### Solutions

| Option | Coût | Mise en veille | Recommandé |
|---|---|---|---|
| Render Free | Gratuit | ❌ Oui (15 min) | Dev uniquement |
| Render Paid | $7/mois | ✅ Non | ✅ Production |
| Railway Starter | Gratuit (~$5 crédit/mois) | ✅ Non | ✅ Meilleure alternative gratuite |
| Fly.io | Gratuit (limité) | ✅ Non | Alternative possible |

---

## Si Render tombe — utiliser localhost comme fallback

### Pourquoi ça ne marche pas directement

Les serveurs Vercel (USA/EU) **ne peuvent pas atteindre ton `localhost:1337`**.
Même si Strapi tourne sur ton PC, il n'est pas accessible depuis internet.

```
Vercel (serveurs distants)
       ↓
NEXT_PUBLIC_STRAPI_URL = https://qhm-1.onrender.com
       ↓
Render est éteint → ERREUR ❌

Ton localhost:1337
       ↑
Vercel ne peut pas l'atteindre ❌
```

### Les 3 scénarios

| Situation | Vercel URL | Fonctionne ? |
|---|---|---|
| Render actif | `https://qhm-1.onrender.com` | ✅ |
| Render éteint + Strapi local | URL Render inchangée | ❌ |
| Strapi local + Next.js local | `http://localhost:1337` | ✅ |

---

## Solution temporaire — ngrok (tunnel gratuit)

ngrok expose ton `localhost:1337` via une URL HTTPS publique que Vercel peut atteindre.

### Installation (une seule fois)

```bash
# Option 1 — Téléchargement direct
# https://ngrok.com/download

# Option 2 — Chocolatey (Windows)
choco install ngrok

# Option 3 — Winget (Windows)
winget install ngrok
```

### Procédure quand Render est down

```bash
# Étape 1 — Démarre Strapi en local
cd C:\QHM\QHM\QHM\fiscalscore-cms
npm run develop
# Attends le message "Strapi started successfully"

# Étape 2 — Dans un 2ème terminal, ouvre le tunnel
ngrok http 1337
# → Affiche une URL publique type :
#   Forwarding  https://abc123.ngrok-free.app -> http://localhost:1337
```

```
# Étape 3 — Sur Vercel
Settings → Environment Variables
→ NEXT_PUBLIC_STRAPI_URL = https://abc123.ngrok-free.app
→ Redéployer (bouton "Redeploy" ou push un commit vide)

# Étape 4 — Quand Render est de retour
→ Remettre : NEXT_PUBLIC_STRAPI_URL = https://qhm-1.onrender.com
→ Redéployer
```

> ⚠️ L'URL ngrok change à chaque redémarrage sauf avec un compte payant.

---

## Dev en local (sans Vercel, sans Render)

Le fichier `fiscalscore-app/.env.local` (ignoré par git) est déjà configuré :

```env
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-local-auditude
```

```bash
# Terminal 1 — Strapi
cd C:\QHM\QHM\QHM\fiscalscore-cms
npm run develop

# Terminal 2 — Next.js (utilise .env.local automatiquement)
cd C:\QHM\QHM\QHM\fiscalscore-app
npm run dev
# → http://localhost:3000
```

---

## Migration vers Railway (recommandé pour remplacer Render)

Railway est gratuit (~$5 de crédit offert/mois), sans mise en veille,
et supporte PostgreSQL + Node.js nativement.

### Comparaison Render vs Railway

| | Render Free | Railway Starter |
|---|---|---|
| Mise en veille | ❌ Oui (15 min) | ✅ Non |
| Délai de réveil | ~50 secondes | Instantané |
| RAM | 512 MB | 512 MB |
| PostgreSQL | ✅ Inclus | ✅ Inclus |
| Déploiement GitHub | ✅ | ✅ |
| Prix | Gratuit | ~$5 crédit/mois offert |

### Étapes de migration

```
1. Créer un compte sur https://railway.app

2. Nouveau projet → "Deploy from GitHub repo"
   → Sélectionner GCS2092/QHM
   → Choisir le dossier : fiscalscore-cms

3. Ajouter un service PostgreSQL dans Railway
   → Copier la DATABASE_URL générée

4. Configurer les variables d'environnement dans Railway
   (mêmes que .env.example mais avec les vraies valeurs)

5. Sur Vercel, mettre à jour :
   NEXT_PUBLIC_STRAPI_URL = https://xxx.railway.app

6. Redéployer Vercel
```

---

## Comptes par défaut (créés par npm run seed:qhm)

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | admin@qhm.local | AdminQhm2026! |
| Évaluateur | evaluateur@qhm.local | EvalQhm2026! |

> ⚠️ Change ces mots de passe en production.

---

## Commandes utiles

```bash
# Démarrer Strapi en développement
cd fiscalscore-cms && npm run develop

# Démarrer Next.js en développement
cd fiscalscore-app && npm run dev

# Lancer le seed (données initiales)
cd fiscalscore-cms && npm run seed:qhm

# Construire Next.js pour production
cd fiscalscore-app && npm run build

# Voir les logs Strapi en temps réel (Render)
# → Dashboard Render → ton service → Logs
```
