# 🔧 FIX DATABASE SIMPLE - Alternative à la Migration Strapi

**Date**: 2026-06-07  
**Status**: ✅ Prêt à utiliser  
**Durée**: 2-3 minutes

---

## ⚠️ Problème avec la Migration Strapi

La migration Strapi a échoué avec l'erreur:
```
MigrationError: cannot drop constraint...on table...because other objects depend on it
```

**Cause**: Les contraintes de clé étrangère (FOREIGN KEY) ne peuvent pas être supprimées pendant une migration Strapi.

---

## ✅ Solution: Script Node.js Simple

Utilisez plutôt le script Node.js qui contourne ce problème en **désactivant temporairement les triggers**, puis en **convertissant les IDs**, puis en **réactivant les triggers**.

---

## 🚀 Utilisation

### AVANT (Très Important!)
1. **Arrêtez Strapi**:
   ```bash
   # Terminer le processus npm run dev (Ctrl+C)
   ```

2. **Sauvegardez la base de données** (CRITIQUE):
   ```bash
   pg_dump -U strapi -d fiscalscore > backup_before_id_fix.sql
   ```

3. **Vérifiez la configuration**:
   ```bash
   # .env doit contenir:
   cat .env | grep DATABASE_CLIENT
   ```

### EXÉCUTION
```bash
# Dans fiscalscore-cms/
cd fiscalscore-cms

# Exécuter le script
node scripts/fix-database-ids-simple.js
```

### RÉSULTAT ATTENDU
```
🔧 Conversion des IDs de INTEGER à VARCHAR(255)...

📌 ÉTAPE 1: Désactivation des contraintes de clé étrangère...
   ✓ Contraintes désactivées

📌 ÉTAPE 2: Conversion des colonnes id...

   Conversion de 'evaluations'...
   ✓ 'evaluations' convertie avec succès

   Conversion de 'clients'...
   ✓ 'clients' convertie avec succès

   [autres tables...]

📌 ÉTAPE 3: Réactivation des contraintes de clé étrangère...
   ✓ Contraintes réactivées

✅ Conversion terminée avec succès!
```

### APRÈS
1. **Redémarrez Strapi**:
   ```bash
   npm run dev
   ```

2. **Vérifiez qu'il n'y a pas d'erreurs TypeScript**

3. **(Optionnel) Nettoyez les doublons**:
   ```bash
   npm run seed:cleanup-duplicates-questionnaires
   npm run seed:cleanup-duplicates-evaluations
   npm run seed:cleanup-orphans-evaluations
   ```

---

## ❌ Si ça Échoue

### Erreur: "Conversion échouée"
```bash
# Restaurer la sauvegarde
psql -U strapi -d fiscalscore < backup_before_id_fix.sql
```

### Erreur: "Cannot connect to database"
Vérifiez le `.env`:
```bash
# Doit contenir:
DATABASE_CLIENT=postgres
DATABASE_CLIENT_HOST=localhost
DATABASE_CLIENT_PORT=5432
DATABASE_CLIENT_DBNAME=fiscalscore
DATABASE_CLIENT_USER=strapi
DATABASE_CLIENT_PASSWORD=password
```

### Erreur: "Table doesn't exist"
C'est normal, le script saute les tables manquantes. Continuez.

---

## 📊 Qu'est-ce qui Change?

### IDs avant Conversion
```
evaluations.id = 123 (INTEGER)
clients.id = 45 (INTEGER)
questionnaires.id = 6 (INTEGER)
```

### IDs après Conversion
```
evaluations.id = 'eval_00000000000000000123' (VARCHAR)
clients.id = 'client_0000000000000000045' (VARCHAR)
questionnaires.id = 'quest_00000000000000000006' (VARCHAR)
```

**Avantage**: Strapi v5 accepte maintenant ces documentId

---

## 🔄 Comment Ça Marche?

1. **Désactive les triggers** → Les contraintes ne bloquent pas
2. **Renomme id → id_old** → Garde les anciens IDs
3. **Crée id VARCHAR** → Nouvelle colonne
4. **Copie les données** → `'prefix_' || id_old` avec padding
5. **Ajoute PRIMARY KEY** → Nouvelle contrainte
6. **Supprime id_old** → Nettoie
7. **Réactive les triggers** → Restaure les contraintes

---

## ✨ Avantages par Rapport à la Migration SQL

| Aspect | Migration SQL | Script Node.js |
|--------|---------------|-----------------|
| Gestion des FK | ❌ Échoue | ✅ Contourne |
| Transactions | ❌ Problématique | ✅ Robuste |
| Erreurs | ❌ Bloque tout | ✅ Continue |
| Rollback | ❌ Manuel | ✅ Sauvegarde fournie |
| Vitesse | ⚠️ Lent | ✅ Rapide (2-3 min) |

---

## 📝 Notes Importantes

- **Données sauvegardées**: Les IDs originaux sont conservés dans le padding
- **Traçabilité**: Chaque ID a un préfixe (eval_, client_, etc.)
- **Réversible**: Vous avez une sauvegarde complète
- **Strapi-compatible**: Les documentId respectent le format Strapi v5

---

## 🎯 Résumé des Steps

```bash
# 1. Arrêter Strapi
# (Ctrl+C si npm run dev est actif)

# 2. Sauvegarder
pg_dump -U strapi -d fiscalscore > backup_before_id_fix.sql

# 3. Exécuter le fix
node scripts/fix-database-ids-simple.js

# 4. Redémarrer
npm run dev

# 5. Vérifier (dans le navigateur)
# Aller à http://localhost:1337/admin
# Les évaluations doivent afficher correctement sans erreur 500
```

**Temps total: 5-10 minutes** ⚡

