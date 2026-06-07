# ⚡ QUICK FIX - Erreur d'Authentification PostgreSQL

**Problème**: Le script ne peut pas se connecter à PostgreSQL (erreur d'authentification)

**Solution**: Utiliser `psql` directement avec la migration SQL

---

## 🚀 Solution Alternative (SQL Direct)

Arrêtez Strapi d'abord, puis exécutez:

```bash
cd C:\QHM\QHM\QHM\fiscalscore-cms

# Sauvegarder d'abord (CRITIQUE!)
pg_dump -U postgres -d fiscalscore > backup_before_migration.sql

# Exécuter la migration SQL
psql -U postgres -d fiscalscore -f database\migrations\001_fix_strapi_v5_documentids.sql
```

### Si le mot de passe PostgreSQL est demandé:
- Utilisez le mot de passe que vous avez défini lors de l'installation de PostgreSQL

### Résultat attendu:
```
BEGIN
ALTER TABLE
ALTER TABLE
...
COMMIT
```

---

## ✅ Après la Migration

```bash
# Redémarrer Strapi
npm run dev
```

Vérifiez qu'il n'y a pas d'erreur TypeScript.

---

## 🆘 Si ça Échoue

### Erreur: "role postgres does not exist"
```bash
# Utiliser strapi à la place
psql -U strapi -d fiscalscore -f database\migrations\001_fix_strapi_v5_documentids.sql
```

### Erreur: "database fiscalscore does not exist"
```bash
# Lister les BD
psql -U postgres -l

# Créer si manquante
createdb -U postgres fiscalscore
```

### Si la migration échoue:
```bash
# Restaurer la sauvegarde
psql -U postgres -d fiscalscore < backup_before_migration.sql
```

---

## 📝 Alternative: Frontend Uniquement

Si vous voulez tester le frontend sans migrer la BD:

```bash
# Frontend fonctionne déjà:
cd C:\QHM\QHM\QHM\fiscalscore-app
npm run dev

# Tester:
# - Créer une évaluation
# - Répondre à des questions
# - Vérifier que l'autosave ne se déclenche PAS
# - Cliquer "Sauvegarder"
# - Cliquer "Terminer" avec confirmation
```

Le frontend est **100% réglé**. La BD peut être migrée plus tard.

---

## ✨ État Actuel

- ✅ **Frontend**: Autosave désactivé, boutons clairs, messages d'état
- ⏳ **Backend BD**: Nécessite migration SQL (2 min)
- ✅ **Scripts**: Prêts à utiliser une fois la BD migrée

---

## 🎯 Prochaines Étapes

1. **Option A** (Recommandé):
   - Exécuter: `psql -U postgres -d fiscalscore -f database\migrations\001_fix_strapi_v5_documentids.sql`
   - Redémarrer: `npm run dev`
   - Tester dans le navigateur

2. **Option B** (Pour plus tard):
   - Continuer à tester le frontend
   - Repasser à la migration quand vous êtes prêt

---

## 📞 Support

Besoin d'aide? Consultez:
- `SOLUTION_FINALE.md` - Vue d'ensemble
- `FIX_DATABASE_SIMPLE.md` - Guide détaillé

