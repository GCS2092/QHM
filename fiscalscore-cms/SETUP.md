# Setup Strapi v5 - FiscalScore CMS

Guide de configuration et de correction de la base de données Strapi v5.

## 🔴 Problème Identifié

**Erreur**: `invalid input syntax for type integer: nv19hbh8sqxtu61igw9qwujp`

**Cause**: Mismatch entre le type d'ID PostgreSQL et les documentId de Strapi v5
- ❌ Base de données: IDs entiers (INTEGER)
- ✅ Strapi v5: documentId (string/UUID)

## ✅ Solution

### Option 1: Migration Automatique (RECOMMANDÉE)

La solution la plus simple et la plus sûre.

```bash
# 1. Vérifier l'état (optionnel)
npm run check:schema

# 2. Sauvegarder la base de données
pg_dump -U strapi -d fiscalscore > backup.sql

# 3. Exécuter la migration
npm run migrate:strapi-v5

# 4. Vérifier le résultat
npm run check:schema

# 5. Redémarrer Strapi
npm run dev
```

### Option 2: Migration Manuelle SQL

Pour les utilisateurs avancés avec pgAdmin ou psql:

```bash
psql -U strapi -d fiscalscore -f database/migrations/001_fix_strapi_v5_documentids.sql
```

### Option 3: Recréer la base de données

Si vous n'avez pas de données importantes:

```bash
# Supprimer et recréer
dropdb -U strapi fiscalscore
createdb -U strapi fiscalscore

# Laisser Strapi créer les tables correctement
npm run dev
```

## 📋 Étapes de configuration initiale

### 1. Configuration de l'environnement

```bash
# Copier le fichier d'exemple
cp .env.local.example .env.local

# Éditer avec vos paramètres
nano .env.local  # ou votre éditeur préféré
```

Paramètres requis:
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=fiscalscore
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=your_password
```

### 2. Installation des dépendances

```bash
npm install
```

### 3. Appliquer les corrections de schéma

Voir la section "Solution" ci-dessus.

### 4. Tester la connexion

```bash
npm run check:schema
```

Résultat attendu:
```
✅ RÉSULTAT: Le schéma est compatible avec Strapi v5 documentId!
```

### 5. Démarrer Strapi

```bash
npm run dev
```

Accédez à: http://localhost:1337/admin

## 🗂️ Structure des fichiers créés

```
fiscalscore-cms/
├── MIGRATION_STRAPI_V5.md          ← Documentation complète
├── SETUP.md                         ← Ce fichier
├── .env.local.example               ← Exemple de configuration
├── database/
│   └── migrations/
│       ├── README.md                ← Doc des migrations
│       └── 001_fix_strapi_v5_documentids.sql
└── scripts/
    ├── MIGRATION_GUIDE.md           ← Guide rapide
    ├── migrate-strapi-v5-documentids.js
    ├── check-database-schema.js
    └── rollback-migration.js
```

## 🚀 Commandes NPM disponibles

```bash
# Développement
npm run dev              # Démarrer Strapi en mode développement

# Migration & Schéma
npm run check:schema     # Vérifier le schéma de la BD
npm run migrate:strapi-v5 # Appliquer la migration
npm run rollback:migration # Annuler la migration (urgence)

# Build & Production
npm run build            # Compiler pour la production
npm start                # Démarrer en mode production

# Data
npm run seed:qhm        # Importer les données QHM (script custom)
npm run seed:example    # Importer données d'exemple

# Strapi
npm run console         # Ouvrir la console Strapi
npm run upgrade         # Mettre à jour Strapi
npm run upgrade:dry     # Vérifier les mises à jour disponibles
```

## 📋 Checklist Post-Migration

Après avoir appliqué la migration:

- [ ] Vérifier avec `npm run check:schema`
- [ ] Redémarrer Strapi: `npm run dev`
- [ ] Se connecter à l'admin (http://localhost:1337/admin)
- [ ] Créer un nouveau client via l'interface
- [ ] Vérifier que l'ID a été généré correctement
- [ ] Consulter les logs pour les erreurs
- [ ] Tester les relations entre tables
- [ ] Créer/modifier quelques enregistrements
- [ ] Tester les API REST/GraphQL

## 🆘 Dépannage

### La migration échoue

1. Vérifiez la connexion à la base de données:
   ```bash
   npm run check:schema
   ```

2. Vérifiez vos credentials dans `.env.local`

3. Assurez-vous qu'aucun processus n'accède à la BD

4. Consultez les logs d'erreur

### "Table non trouvée"

C'est normal lors du premier lancement. Les tables seront créées par Strapi.

### Erreur de permission PostgreSQL

```sql
-- Donner les permissions nécessaires
GRANT ALL PRIVILEGES ON DATABASE fiscalscore TO strapi;
GRANT ALL PRIVILEGES ON SCHEMA public TO strapi;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO strapi;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO strapi;
```

### Revenir en arrière (Rollback)

```bash
# SEULEMENT si vous n'avez pas ajouté de nouvelles données
npm run rollback:migration

# Puis restaurer la sauvegarde
psql -U strapi -d fiscalscore < backup.sql
```

## 📚 Documentation Additionnelle

- **MIGRATION_STRAPI_V5.md** - Guide complet de migration
- **scripts/MIGRATION_GUIDE.md** - Guide rapide
- **database/migrations/README.md** - Doc des migrations SQL

## 🌐 Ressources

- [Strapi v5 Documentation](https://docs.strapi.io)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Strapi Database Guide](https://docs.strapi.io/developer-docs/latest/database.html)

## ℹ️ Informations Système

- **Strapi Version**: 5.46.0
- **Node.js**: >= 20.0.0
- **Database**: PostgreSQL
- **Créé**: 2026-06-07

## 💡 Tips & Astuces

1. **Toujours sauvegarder avant une migration**
2. **Tester en développement d'abord**
3. **Garder les fichiers de backup pendant au moins 2 semaines**
4. **Vérifier les logs après chaque changement**
5. **Documenter tous les changements effectués**

## ✨ Prochaines étapes

1. ✅ Configurer `.env.local`
2. ✅ Exécuter la migration du schéma
3. ✅ Démarrer Strapi
4. ✅ Configurer l'admin initial
5. ✅ Importer les données (si applicable)
6. ✅ Tester complètement
7. ✅ Déployer en production

---

**Besoin d'aide?** Consultez les fichiers README et de documentation dans chaque dossier.
