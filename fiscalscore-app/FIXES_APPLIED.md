# 🔧 Corrections Appliquées - Évaluation et Questionnaires

**Date**: 2026-06-07  
**Statut**: ✅ Appliquées et Documentées

---

## 📋 Problèmes Identifiés et Corrigés

### Problème 1: Autosave Automatique Involontaire
**Symptôme**: 
- L'application sauvegardait automatiquement après 2 secondes chaque changement
- Créait des doublons de questionnaires
- Impossible d'achever les questionnaires sans sauvegarde

**Cause**:
```tsx
// ❌ ANCIEN CODE (ligne 294-308)
useEffect(() => {
  if (answeredCount === 0 && !serverEvalId) return;
  const timer = setTimeout(() => {
    void handleSave(true);  // Sauvegarde auto après 2s
  }, 2000);
  return () => clearTimeout(timer);
}, [responses, customQuestions, introComment, dateEvaluation, selectedClient, selectedQuestionnaire]);
```

**Solution Appliquée**:
```tsx
// ✅ NOUVEAU CODE
// Autosave désactivé - contrôle manuel uniquement
// NOTE: l'utilisateur doit cliquer sur "Sauvegarder" ou "Terminer"
```

**Fichier Modifié**: `src/components/evaluations/EvaluationForm.tsx`

---

### Problème 2: Contrôle Insuffisant de la Sauvegarde
**Symptôme**:
- Les utilisateurs ne savaient pas quand l'évaluation était sauvegardée
- Pas de confirmation avant la finalisation
- Boutons peu visibles et peu intuitifs

**Solution Appliquée**:

1. **Bouton "Sauvegarder le brouillon"**:
   - Style: Gris clair avec texte clair
   - Effet: Sauvegarde uniquement le brouillon (statut: `en_cours`)
   - Toujours disponible

2. **Bouton "Terminer l'évaluation"**:
   - Style: Vert fort (couleur d'action principale)
   - Effet: Finalise l'évaluation et verrouille les réponses
   - Condition: Toutes les questions doivent être répondues
   - **Confirmation**: `window.confirm()` avant exécution

3. **Messages de Statut**:
   - ⚠️ Orange: "Données non enregistrées" si > 0 réponses et pas de sauvegarde
   - 📝 Bleu: "Brouillon sauvegardé" avec compteur de progression

**Code Appliqué**:
```tsx
<div className="flex flex-col gap-2">
  {answeredCount > 0 && !serverEvalId && (
    <p className="text-xs text-orange-600">
      ⚠️ Données non enregistrées - Cliquez sur Sauvegarder
    </p>
  )}
  {serverEvalId && answeredCount < allQuestionsCount && (
    <p className="text-xs text-blue-600">
      Brouillon sauvegardé ({answeredCount}/{allQuestionsCount} questions)
    </p>
  )}
  <div className="flex gap-2">
    <button onClick={() => handleSave(true)}>
      Sauvegarder le brouillon
    </button>
    <button 
      onClick={() => {
        if (window.confirm("Êtes-vous sûr ?")) {
          handleSave(false);
        }
      }}
      disabled={answeredCount < allQuestionsCount}
    >
      Terminer l'évaluation
    </button>
  </div>
</div>
```

---

## 🔙 Problèmes à Traiter Côté Backend (Strapi)

### Problème 3: Erreur de Base de Données - ID en Entier au lieu de UUID
**Symptôme**:
```
error: invalid input syntax for type integer: "nv19hbh8sqxtu61igw9qwujp"
```

**Cause**:
- Strapi v5 utilise des `documentId` (chaînes UUID)
- La base PostgreSQL a été créée avec des IDs entiers
- Les migrations n'ont pas converti les colonnes

**Statut**: ✅ **Solution Créée par l'Agent Backend**
- Scripts de migration: `scripts/migrate-strapi-v5-documentids.js`
- Documentation complète: `README_MIGRATION.md`
- À exécuter: `npm run migrate:strapi-v5`

### Problème 4: Questionnaires Dupliqués
**Cause Probable**:
- L'autosave multiple créait plusieurs enregistrements
- Ou les doublons préexistaient et le problème affichait tous

**Solution**:
1. ✅ **Frontend**: Autosave désactivé (corrige les futurs doublons)
2. ⏳ **Backend**: Script de dédoublonnage nécessaire

**Script de Nettoyage Recommandé**:
```bash
# À faire après les corrections
npm run cleanup:duplicate-questionnaires
```

---

## ✅ Changements Résumés

| Aspect | Avant | Après | Fichier |
|--------|-------|-------|---------|
| Autosave | Automatique (2s) | Manuel uniquement | `EvaluationForm.tsx` |
| Bouton Sauvegarder | Peu clair | "Sauvegarder le brouillon" en gris | `EvaluationForm.tsx` |
| Bouton Terminer | Bleu basique | Vert fort + confirmation | `EvaluationForm.tsx` |
| Messages d'État | Absent | Orange/Bleu avec détails | `EvaluationForm.tsx` |
| Contrôle Utilisateur | Automatique | Manuel et explicite | - |

---

## 🚀 Prochaines Étapes

### 1. **Test Immédiat** (Frontend)
```bash
cd fiscalscore-app
npm run dev
# Tester: Charger une évaluation, répondre à quelques questions
# Vérifier: Les données ne se sauvegardent QUE si on clique sur le bouton
```

### 2. **Migration Base de Données** (Backend)
```bash
cd ../fiscalscore-cms
npm run check:schema              # Vérifier l'état actuel
pg_dump -U strapi -d fiscalscore > backup.sql  # Sauvegarder!
npm run migrate:strapi-v5         # Migrer les IDs
npm run check:schema              # Vérifier le résultat
npm run dev                       # Redémarrer Strapi
```

### 3. **Nettoyage des Doublons** (Optionnel mais recommandé)
```bash
# À faire une fois le backend stable
npm run cleanup:duplicate-questionnaires
npm run cleanup:duplicate-evaluations
```

### 4. **Tests Complets**
```bash
# Créer une nouvelle évaluation
# Répondre à toutes les questions
# Cliquer sur "Sauvegarder le brouillon" → Vérifier la sauvegarde
# Cliquer sur "Terminer" → Vérifier la confirmation et la finalisation
# Vérifier dans l'admin Strapi: Pas de doublons créés
```

---

## 📝 Notes Techniques

### Autosave: Pourquoi Désactivé?

L'autosave automatique était problématique car:
1. **Pas de feedback**: L'utilisateur ne savait pas quand ça sauvegardait
2. **Pas de contrôle**: Impossible d'empêcher une sauvegarde involontaire
3. **Doublons**: Chaque changement risquait de créer un nouveau brouillon
4. **Questionnaires non achevés**: On ne pouvait pas terminer sans sauvegarde

Maintenant:
- ✅ L'utilisateur contrôle tout
- ✅ Feedback visuel clair
- ✅ Confirmation avant les actions irréversibles
- ✅ Pas de sauvegarde involontaire

### Statuts des Évaluations

```
"en_cours" (brouillon)
├─ Bouton "Sauvegarder": Enregistre le brouillon
├─ Bouton "Terminer": Change vers "terminee"
└─ ⚠️ L'utilisateur peut revenir et modifier

"terminee" (finalisée)
├─ ❌ Impossible à modifier (pour les non-admins)
└─ ✅ Peut être téléchargée en PDF
```

---

## 🎯 Validation

- ✅ Autosave désactivé
- ✅ Boutons clairement intitulés et stylisés
- ✅ Confirmation avant terminer
- ✅ Messages de statut visibles
- ⏳ Migration BD en cours (agent backend)
- ⏳ Nettoyage des doublons (À faire après BD)

---

## 📞 Support

Si vous avez besoin de:
- **Réactiver l'autosave**: Décommentez le bloc useEffect ligne 297-317
- **Modifier le délai d'autosave**: Changez `2000` (2 secondes) en autre valeur
- **Ajouter une sauvegarde au défilement**: Ajoutez un `onScroll` listener

