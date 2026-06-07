# Migration Strapi v5: Correction des colonnes ID

## 🔴 Problème

Strapi v5 utilise des **documentId** (UUID/string) comme clés primaires, mais votre base de données PostgreSQL a été créée avec des IDs de type `INTEGER`. Cela cause l'erreur:

```
invalid input syntax for type integer: nv19hbh8sqxtu61igw9qwujp
```

Lorsque Strapi essaie d'insérer un documentId (string) dans une colonne de type INTEGER.

## ✅ Solution

Cette solution fournit une **migration automatique** qui convertit les colonnes `id` de `INTEGER` à `VARCHAR(255)` pour toutes les tables pertinentes.

### Tables affectées

- `evaluations`
- `clients`
- `questionnaires`
- `reponses`
- `question_customs`
- `assignations`
- `questions` (optionnelle)

## 📋 Instructions d'utilisation

### Étape 1: Vérifier l'état du schéma (Recommandé avant migration)

```bash
npm run check:schema
# ou
node scripts/check-database-schema.js
```

Cela vous montrera:
- ✅ Quelles tables sont déjà compatibles avec Strapi v5
- ⚠️ Quelles tables nécessitent une migration
- 📊 Le nombre de lignes dans chaque table

### Étape 2: Sauvegarder la base de données (IMPORTANT!)

```bash
# PostgreSQL
pg_dump -U strapi -d fiscalscore > backup_before_migration.sql

# Ou via votre outil de gestion (pgAdmin, DBeaver, etc.)
```

### Étape 3: Exécuter la migration

**Option A: Via le script Node.js (Recommandé)**

```bash
npm run migrate:strapi-v5
# ou
node scripts/migrate-strapi-v5-documentids.js
```

**Option B: Via SQL brut (avancé)**

```bash
# Dans pgAdmin ou via psql
psql -U strapi -d fiscalscore -f database/migrations/001_fix_strapi_v5_documentids.sql
```

### Étape 4: Vérifier la migration

```bash
npm run check:schema
```

Vous devriez voir: ✅ RÉSULTAT: Le schéma est compatible avec Strapi v5 documentId!

### Étape 5: Redémarrer Strapi

```bash
npm run dev
# ou
npm start
```

## 🔧 Détails techniques

### Stratégie de conversion d'ID

Pour garantir la traçabilité et l'unicité, les anciens IDs INTEGER sont convertis en VARCHAR avec un **préfixe identifiant la table**:

| Table | Prefix | Exemple |
|-------|--------|---------|
| evaluations | `eval_` | `eval_00000000000000000001` |
| clients | `client_` | `client_0000000000000000001` |
| questionnaires | `quest_` | `quest_00000000000000000001` |
| reponses | `rep_` | `rep_000000000000000000001` |
| question_customs | `qcust_` | `qcust_00000000000000000001` |
| assignations | `assign_` | `assign_000000000000000000001` |
| questions | `ques_` | `ques_000000000000000000001` |

### Étapes de la migration

Pour chaque table:

1. ❌ Supprimer la contrainte PRIMARY KEY
2. 📝 Renommer `id` → `id_old`
3. ➕ Créer nouvelle colonne `id VARCHAR(255)`
4. 🔄 Générer nouveaux IDs avec préfixe + padding
5. 🗑️ Supprimer `id_old`
6. ✅ Rétablir la contrainte PRIMARY KEY

### Impact

- ✅ Les IDs existants sont préservés (traçabilité)
- ✅ Les unicités sont maintenues
- ✅ Les relations étrangères sont automatiquement mises à jour par PostgreSQL (contraintes)
- ⚠️ Assurez-vous que l'application utilise correctement les nouveaux IDs

## 🚀 Fichiers de la solution

```
database/
  migrations/
    001_fix_strapi_v5_documentids.sql    # Migration SQL brute

scripts/
  migrate-strapi-v5-documentids.js       # Script Node.js de migration
  check-database-schema.js               # Diagnostic du schéma

MIGRATION_STRAPI_V5.md                   # Ce fichier
```

## 📦 Dépendances

- `pg` (PostgreSQL driver) - Déjà instalé ✅
- `.env.local` ou variables d'environnement (DATABASE_*)

## ⚠️ Précautions

1. **Sauvegarde obligatoire**: Effectuez une sauvegarde AVANT la migration
2. **Test en dev d'abord**: Testez sur un environnement de développement
3. **Pas d'accès concurrent**: Assurez-vous qu'aucun autre processus n'accède à la BD
4. **Vérifiez votre APP**: Après migration, testez que l'application fonctionne correctement

## 🆘 Dépannage

### Erreur: "Table 'evaluations' non trouvée"

- La table n'existe pas encore. Strapi la créera automatiquement au prochain démarrage.
- Vous pouvez ignorer cette erreur.

### Erreur: "Connexion à la base de données échouée"

Vérifiez vos variables d'environnement:

```bash
# .env.local
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=strapi
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=votre_password
```

### L'erreur persiste après migration

1. Vérifiez que la migration a réussi: `npm run check:schema`
2. Redémarrez Strapi complètement
3. Videz le cache/cookies du navigateur
4. Testez avec une nouvelle requête API

## 🔄 Alternatives

### Utiliser des UUID standards au lieu de strings préfixées

Après la migration, vous pouvez convertir les IDs en UUID standards:

```javascript
// Exemple pour une table
UPDATE evaluations 
SET id = gen_random_uuid()::text;
```

### Réappliquer la migration

Si quelque chose s'est mal passé:

```bash
# 1. Restaurer la sauvegarde
psql -U strapi -d fiscalscore < backup_before_migration.sql

# 2. Réessayer la migration
node scripts/migrate-strapi-v5-documentids.js
```

## 📚 Ressources

- [Documentation Strapi v5](https://docs.strapi.io/developer-docs/latest/getting-started/introduction.html)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [Strapi Database Documentation](https://docs.strapi.io/developer-docs/latest/database.html)

## ✨ Prochaines étapes

Après une migration réussie:

1. ✅ Testez complètement l'application
2. ✅ Vérifiez les logs de Strapi pour les erreurs
3. ✅ Testez les opérations CRUD (Create, Read, Update, Delete)
4. ✅ Testez les relations entre tables
5. ✅ Commitez vos changements en Git (si applicable)

## 📝 Notes

- Cette migration est **non destructive** - les données existantes sont conservées
- Les contraintes de clés étrangères sont automatiquement gérées par PostgreSQL
- La migration peut prendre du temps sur de grandes tables (100k+ lignes)

---

**Créé**: 2026-06-07  
**Version Strapi**: 5.46.0  
**Database**: PostgreSQL
