# Commandes pour lancer le projet QHM

> Exécuter les commandes depuis PowerShell. Adapter les chemins si ton dossier n'est pas `Downloads\QHM\QHM`.

## Prérequis

```powershell
node -v    # >= 20 recommandé
npm -v
# PostgreSQL en service (si DATABASE_CLIENT=postgres dans fiscalscore-cms\.env)
```

---

## 1. Installation (une seule fois)

```powershell
# Backend Strapi
cd c:\Users\lolon\Downloads\QHM\QHM\fiscalscore-cms
npm install

# Frontend Next.js
cd c:\Users\lolon\Downloads\QHM\QHM\fiscalscore-app
npm install
```

### Fichiers d'environnement

```powershell
# Strapi — copier si absent
cd c:\Users\lolon\Downloads\QHM\QHM\fiscalscore-cms
if (-not (Test-Path .env)) { Copy-Item .env.example .env }

# Next.js — copier si absent
cd c:\Users\lolon\Downloads\QHM\QHM\fiscalscore-app
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
```

Contenu minimal `fiscalscore-app\.env.local` :

```env
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=change-me-in-production
```

---

## 2. Base de données PostgreSQL (si utilisée)

```powershell
# Démarrer PostgreSQL (Windows — adapter le nom du service)
net start postgresql-x64-17

# Créer la base (dans psql ou pgAdmin)
# CREATE DATABASE fiscalscore;
```

Vérifier `fiscalscore-cms\.env` :

```env
DATABASE_CLIENT=postgres
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=fiscalscore
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password123
```

**Alternative dev sans PostgreSQL** — dans `fiscalscore-cms\.env` :

```env
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db
```

---

## 3. Données de démo (cahier des charges)

```powershell
cd c:\Users\lolon\Downloads\QHM\QHM\fiscalscore-cms

# Lancer Strapi une première fois (crée les tables + rôles Admin/Evaluateur)
npm run develop
# Arrêter avec Ctrl+C après le premier démarrage réussi, puis :

npm run seed:qhm
```

Comptes créés par le seed :

| Rôle        | Email                 | Mot de passe   |
|-------------|------------------------|----------------|
| Admin       | admin@qhm.local        | AdminQhm2026!  |
| Évaluateur  | evaluateur@qhm.local   | EvalQhm2026!   |

---

## 4. Lancer le projet (2 terminaux)

### Terminal A — Strapi (port 1337)

```powershell
cd c:\Users\lolon\Downloads\QHM\QHM\fiscalscore-cms
npm run develop
```

- Admin Strapi : http://localhost:1337/admin  
- API : http://localhost:1337/api  

### Terminal B — Next.js (port 3000)

```powershell
cd c:\Users\lolon\Downloads\QHM\QHM\fiscalscore-app
npm run dev
```

- Application : http://localhost:3000  
- Connexion : http://localhost:3000/login  

---

## 5. Vérifications / build (détecter les erreurs)

```powershell
# Build Strapi
cd c:\Users\lolon\Downloads\QHM\QHM\fiscalscore-cms
npm run build

# Build + lint Next.js
cd c:\Users\lolon\Downloads\QHM\QHM\fiscalscore-app
npm run build
npm run lint
```

---

## 6. Script tout-en-un (PowerShell)

```powershell
cd c:\Users\lolon\Downloads\QHM\QHM
.\run-projet.ps1
```

Voir `run-projet.ps1` pour le détail (vérifie Node, installe si besoin, lance les builds).

---

## 7. Dépannage rapide

```powershell
# Port 1337 occupé
netstat -ano | findstr :1337
taskkill /PID <PID> /F

# Port 3000 occupé
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Réinstaller les dépendances
Remove-Item -Recurse -Force node_modules
npm install
```

---

## 8. Production (aperçu)

```powershell
cd c:\Users\lolon\Downloads\QHM\QHM\fiscalscore-cms
npm run build
npm run start

cd c:\Users\lolon\Downloads\QHM\QHM\fiscalscore-app
npm run build
npm run start
```
