# Base de données - Migrations

Dossier contenant les scripts de migration SQL pour Strapi v5.

## Fichiers

### 001_fix_strapi_v5_documentids.sql

**Description**: Convertit les colonnes `id` de `INTEGER` à `VARCHAR(255)` pour supporter les documentId de Strapi v5.

**Problème résolu**:
- Erreur: `invalid input syntax for type integer: nv19hbh8sqxtu61igw9qwujp`
- Cause: Strapi v5 utilise des UUID/strings comme IDs, pas des entiers

**Tables affectées**:
- evaluations
- clients
- questionnaires
- reponses
- question_customs
- assignations
- questions (optionnelle)

**Comment utiliser**:

```bash
# Via le script Node.js (RECOMMANDÉ)
npm run migrate:strapi-v5

# Via psql (manuel)
psql -U strapi -d fiscalscore -f database/migrations/001_fix_strapi_v5_documentids.sql
```

**Sécurité**:
1. ✅ Sauvegardez votre base de données AVANT
2. ✅ Testez en développement d'abord
3. ✅ Vérifiez avec `npm run check:schema` après

## Scripts d'exécution

Voir `scripts/` pour les scripts correspondants:

- `migrate-strapi-v5-documentids.js` - Migration principale
- `check-database-schema.js` - Diagnostic
- `rollback-migration.js` - Annulation (si nécessaire)

## Documentation complète

Consultez `MIGRATION_STRAPI_V5.md` à la racine du projet pour tous les détails.

## Conventions de nommage des migrations

- **Format**: `NNN_description.sql`
- **NNN**: Numéro séquentiel (001, 002, etc.)
- **description**: Description courte du changement

Exemple:
```
001_fix_strapi_v5_documentids.sql
002_add_new_table.sql
003_update_constraints.sql
```

## Notes

- Les migrations sont appliquées manuellement (pas d'exécution automatique)
- Chaque migration doit être idempotente (sûre à exécuter plusieurs fois)
- Toujours tester sur une copie de la base de données d'abord
