# Guide Rapide: Migration Strapi v5 documentId

## 🚨 Le Problème

Vous recevez cette erreur:
```
invalid input syntax for type integer: nv19hbh8sqxtu61igw9qwujp
```

**Cause**: Strapi v5 utilise des documentId (strings/UUIDs), mais votre base de données est configurée pour des IDs entiers.

## ✅ Solution en 3 étapes

### 1️⃣ Vérifier l'état (OPTIONNEL mais RECOMMANDÉ)

```bash
npm run check:schema
```

Cela vous montrera quelles tables nécessitent une migration.

### 2️⃣ Sauvegarder la base de données (⚠️ TRÈS IMPORTANT)

```bash
# Sur Windows/PowerShell:
$env:PGPASSWORD = "your_password"
& "C:\Program Files\PostgreSQL\bin\pg_dump.exe" -h localhost -U strapi -d fiscalscore > backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql

# Sur Linux/Mac:
pg_dump -h localhost -U strapi -d fiscalscore > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 3️⃣ Exécuter la migration

```bash
npm run migrate:strapi-v5
```

Attendez que le script se termine. Vous devriez voir:
```
✅ Toutes les migrations ont été appliquées avec succès!
```

### 4️⃣ Vérifier que tout a fonctionné

```bash
npm run check:schema
```

Vous devriez voir:
```
✅ RÉSULTAT: Le schéma est compatible avec Strapi v5 documentId!
```

### 5️⃣ Redémarrer Strapi

```bash
npm run dev
```

## 🔄 Si ça ne fonctionne pas

### Erreur: "Connexion échouée"

Vérifiez vos variables d'environnement dans `.env.local`:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=fiscalscore
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=your_actual_password
```

### Erreur: "Table non trouvée"

C'est normal si c'est la première fois. Strapi créera les tables au prochain démarrage.

### Vous voulez annuler la migration (rollback)

**SEULEMENT SI vous n'avez pas ajouté de nouvelles données après la migration!**

```bash
npm run rollback:migration
```

Puis restaurez votre sauvegarde:

```bash
psql -U strapi -d fiscalscore < backup_filename.sql
```

## 📁 Fichiers créés

```
database/
  migrations/
    001_fix_strapi_v5_documentids.sql     ← Migration SQL
    
scripts/
  migrate-strapi-v5-documentids.js         ← Script principal (Node.js)
  check-database-schema.js                 ← Script de diagnostic
  rollback-migration.js                    ← Script de rollback (secours)
  MIGRATION_GUIDE.md                       ← Ce fichier

MIGRATION_STRAPI_V5.md                     ← Documentation complète
```

## 🆘 Support

Pour plus de détails, consultez `MIGRATION_STRAPI_V5.md` dans la racine du projet.

## ⏱️ Durée estimée

- **Vérification**: < 1 seconde
- **Migration**: 5-30 secondes (selon le nombre de lignes)
- **Total**: ~1 minute

## ✨ Prochaines étapes après migration

1. ✅ Testez votre application
2. ✅ Vérifiez les logs pour les erreurs
3. ✅ Créez/modifiez quelques enregistrements pour vérifier
4. ✅ Testez les relations entre tables
5. ✅ Commitez vos changements en Git (si applicable)

---

**C'est fait!** 🎉 Votre base de données est maintenant compatible avec Strapi v5.
