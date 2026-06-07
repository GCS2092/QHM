# ✅ Checklist Migration Strapi v5 - FiscalScore CMS

## 🚨 Situation Actuelle

**Erreur**: `invalid input syntax for type integer: nv19hbh8sqxtu61igw9qwujp`

**Cause**: Les colonnes `id` sont de type `INTEGER` au lieu de `VARCHAR` pour Strapi v5 documentId

## 📋 Checklist Pre-Migration

### Préparation
- [ ] Lire `SETUP.md` (5 min)
- [ ] Vérifier `.env.local` existe et est correctement configuré
- [ ] Tester la connexion à PostgreSQL
  ```bash
  npm run check:schema
  ```
- [ ] Noter l'état actuel du schéma (pour comparaison)

### Sauvegarde
- [ ] Créer une sauvegarde complète
  ```bash
  pg_dump -U strapi -d fiscalscore > backup_$(date +%Y%m%d_%H%M%S).sql
  ```
- [ ] Vérifier que le fichier de backup a été créé
- [ ] Stocker le backup dans un endroit sûr

### Arrêt de l'application
- [ ] Arrêter tous les processus Strapi (`Ctrl+C`)
- [ ] Vérifier qu'aucun autre processus n'accède à la BD

## 🔧 Checklist Exécution Migration

### Migration
- [ ] Exécuter la migration
  ```bash
  npm run migrate:strapi-v5
  ```
- [ ] Attendre que le script se termine complètement
- [ ] Vérifier le message de succès dans la console

### Vérification Immédiate
- [ ] Vérifier que la migration a réussi
  ```bash
  npm run check:schema
  ```
- [ ] Voir le résultat: ✅ Le schéma est compatible avec Strapi v5 documentId!
- [ ] Garder la trace de ces résultats

## 🚀 Checklist Post-Migration

### Redémarrage
- [ ] Redémarrer Strapi
  ```bash
  npm run dev
  ```
- [ ] Attendre le démarrage complet (accès à l'admin)
- [ ] Vérifier les logs pour les erreurs

### Tests Basiques
- [ ] Accéder à l'admin: http://localhost:1337/admin
- [ ] Se connecter avec un compte existant
- [ ] Naviguer dans les sections (Clients, Evaluations, etc.)

### Tests CRUD
- [ ] **CREATE**: Créer un nouveau Client
  - [ ] Remplir les champs requis
  - [ ] Sauvegarder
  - [ ] Vérifier que l'ID a été généré
  - [ ] Confirmer le format: devrait être `client_...` ou un UUID
- [ ] **READ**: Consulter le client créé
  - [ ] Vérifier que toutes les données s'affichent
  - [ ] Vérifier que les relations fonctionnent
- [ ] **UPDATE**: Modifier le client
  - [ ] Changer un champ
  - [ ] Sauvegarder
  - [ ] Vérifier que la modification est appliquée
- [ ] **DELETE**: Supprimer le client
  - [ ] Essayer de supprimer
  - [ ] Confirmer la suppression
  - [ ] Vérifier qu'il disparaît de la liste

### Tests Relations
- [ ] Créer une Evaluation liée à un Client
- [ ] Vérifier que la relation Client → Evaluation s'affiche
- [ ] Créer une Réponse liée à une Evaluation
- [ ] Vérifier les relations multi-niveaux

### Vérification des Logs
- [ ] Consulter les logs Strapi pour les erreurs
- [ ] Chercher les avertissements liés à l'ID
- [ ] Chercher les erreurs de type de données
- [ ] Tout devrait être vert ✅

### Nettoyage de Test
- [ ] Supprimer les enregistrements de test créés
- [ ] Ou laisser les données de test pour validation supplémentaire

## ✅ Checklist Validation Complète

### API REST
- [ ] Tester une requête GET
  ```bash
  curl http://localhost:1337/api/clients
  ```
- [ ] Vérifier que les IDs sont au format expected
- [ ] Tester une requête POST
  ```bash
  curl -X POST http://localhost:1337/api/clients \
    -H "Content-Type: application/json" \
    -d '{"nomEntreprise":"Test","nomResponsable":"Test"}'
  ```

### Performance
- [ ] Aucun ralentissement notable
- [ ] Pas de timeout de requête
- [ ] Les requêtes avec relations fonctionnent

### Intégrité des Données
- [ ] Aucune donnée n'a été perdue
- [ ] Les relations sont intactes
- [ ] Les timestamps (createdAt, updatedAt) sont préservés

## 🆘 Checklist Troubleshooting (Si Erreur)

### Erreur de connexion
- [ ] Vérifier `.env.local`
- [ ] Vérifier que PostgreSQL est en cours d'exécution
- [ ] Vérifier les credentials
- [ ] Tester manuellement la connexion
  ```bash
  psql -U strapi -d fiscalscore -c "SELECT COUNT(*) FROM clients;"
  ```

### Erreur lors de la migration
- [ ] Lire le message d'erreur complètement
- [ ] Vérifier la phase exacte (migration se trouvait à quelle étape)
- [ ] Vérifier si un rollback est nécessaire
- [ ] Consulter `MIGRATION_STRAPI_V5.md` pour le dépannage

### Erreur après la migration
- [ ] Vérifier `npm run check:schema`
- [ ] Redémarrer Strapi complètement
- [ ] Vider le cache du navigateur (Ctrl+Shift+Del)
- [ ] Essayer une requête API en curl pour éviter le cache

### Rollback (en dernier recours)
- [ ] ⚠️ Utilisez SEULEMENT si vraiment nécessaire
- [ ] Exécuter le rollback
  ```bash
  npm run rollback:migration
  ```
- [ ] Restaurer la sauvegarde
  ```bash
  psql -U strapi -d fiscalscore < backup_filename.sql
  ```
- [ ] Vérifier que tout revient à la normale
- [ ] Contactez le support si le problème persiste

## 📊 Checklist Post-Migration Documentation

### Documentation Interne
- [ ] Noter la date de migration: ________________
- [ ] Noter la version Strapi: 5.46.0
- [ ] Noter les tables affectées: 7 tables
- [ ] Ajouter un commentaire dans le Git (si applicable)

### Sauvegarde Archive
- [ ] Copier le backup dans une archive longue terme
- [ ] Labéliser le backup: `strapi_v5_migration_YYYYMMDD.sql`
- [ ] Stocker dans un endroit sûr (cloud, serveur dédié, etc.)
- [ ] Garder pendant au minimum 2 semaines

### Communication
- [ ] Informer l'équipe du succès
- [ ] Partager les fichiers de documentation
- [ ] Pointer vers `SETUP.md` pour les nouvelles configurations

## 🎯 Résumé de ce qui a changé

| Aspect | Avant | Après |
|--------|-------|-------|
| Type d'ID | INTEGER | VARCHAR(255) |
| Format ID | Numérique (1, 2, 3) | Préfixé (`client_1`, etc.) |
| Strapi v5 compatible | ❌ Non | ✅ Oui |
| Supports documentId | ❌ Non | ✅ Oui |
| Perte de données | N/A | ✅ Aucune |

## 🎓 Fichiers de Référence

1. **SETUP.md** - Setup initial et prérequis
2. **MIGRATION_STRAPI_V5.md** - Guide détaillé complet
3. **SOLUTION_SUMMARY.md** - Vue d'ensemble technique
4. **scripts/MIGRATION_GUIDE.md** - Guide rapide 5 étapes
5. **database/migrations/README.md** - Documentation SQL

## 💡 Tips

- ✅ **Toujours sauvegarder AVANT** - Ne pas négliger l'étape 1
- ✅ **Lire les logs** - Ils révèlent souvent le problème
- ✅ **Être patient** - Les migrations peuvent prendre du temps
- ✅ **Tester complètement** - Ne pas se précipiter sur production
- ✅ **Garder les backups** - Juste au cas où...

## 📞 Support & Aide

| Question | Réponse |
|----------|--------|
| Comment vérifier l'état? | `npm run check:schema` |
| Comment migrer? | `npm run migrate:strapi-v5` |
| Comment annuler? | `npm run rollback:migration` |
| Comment sauvegarder? | `pg_dump -U strapi -d fiscalscore > backup.sql` |
| Où trouver la doc? | Consultez `SETUP.md` |

## ✨ État Final Souhaité

```
✅ Schema compatible avec Strapi v5
✅ Colonnes id en VARCHAR(255)
✅ Documentid acceptés sans erreur
✅ CRUD fonctionnel
✅ Relations intactes
✅ Aucune perte de données
✅ Application prête pour production
```

---

**Statut**: 🟡 À Faire | 🟢 Complété | 🔴 Problème

**Signataire**: _________________ **Date**: _________

**Notes**: _____________________________________________________________

