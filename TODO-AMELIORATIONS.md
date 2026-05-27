# 📝 TODO — Améliorations à apporter

**Projet** : QHM — Outil d'évaluation comportementale d'audit  
**Date** : 2026-05-27

Ce document liste les améliorations identifiées lors de l'audit de conformité au cahier des charges.

---

## 🔴 Priorité 1 — Critique (avant production)

### 1. Verrouillage frontend des questions de base
**Fichier** : `fiscalscore-app/src/components/questionnaires/QuestionsAdmin.tsx`

```typescript
// Ajouter avant toute modification/suppression de question
async function handleUpdateQuestion(id: number, data: any) {
  // Vérifier si le questionnaire a des évaluations en cours
  const hasActiveEvaluations = questionnaire.evaluations?.some(
    (e) => e.statut === 'en_cours'
  );
  
  if (hasActiveEvaluations) {
    alert('Impossible de modifier cette question : des évaluations sont en cours sur ce questionnaire.');
    return;
  }
  
  // Continuer la modification...
  await updateQuestion(id, data);
}

async function handleDeleteQuestion(id: number) {
  const hasActiveEvaluations = questionnaire.evaluations?.some(
    (e) => e.statut === 'en_cours'
  );
  
  if (hasActiveEvaluations) {
    alert('Impossible de supprimer cette question : des évaluations sont en cours.');
    return;
  }
  
  if (!confirm('Supprimer cette question ?')) return;
  await deleteQuestion(id);
}
```

**Aussi ajouter une indication visuelle :**
```tsx
{questionnaire.evaluations?.some(e => e.statut === 'en_cours') && (
  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
    ⚠️ Attention : Des évaluations sont en cours sur ce questionnaire. 
    Les questions ne peuvent pas être modifiées.
  </div>
)}
```

---

### 2. Gestion complète des utilisateurs (évaluateurs)
**Fichier** : `fiscalscore-app/src/app/dashboard/settings/page.tsx`

#### A. Ajouter fonctions API
**Fichier** : `fiscalscore-app/src/lib/api.ts`

```typescript
export async function updateUser(
  id: number,
  data: {
    username?: string;
    email?: string;
    password?: string;
  },
  tkn?: string
) {
  return strapiPut(`/users/${id}`, data, token(tkn));
}

export async function deleteUser(id: number, tkn?: string) {
  return strapiDelete(`/users/${id}`, token(tkn));
}

export async function deactivateUser(id: number, tkn?: string) {
  return strapiPut(`/users/${id}`, { blocked: true }, token(tkn));
}
```

#### B. Ajouter UI de gestion
```tsx
// Dans la liste des évaluateurs, ajouter :
<div className="flex gap-2">
  <button 
    onClick={() => setEditingUser(user)}
    className="text-blue-600 hover:underline"
  >
    Modifier
  </button>
  <button 
    onClick={() => handleDeleteUser(user.id)}
    className="text-red-600 hover:underline"
  >
    Supprimer
  </button>
</div>

// Modal de modification :
{editingUser && (
  <div className="modal">
    <form onSubmit={handleUpdateUser}>
      <input 
        value={editForm.email} 
        onChange={(e) => setEditForm({...editForm, email: e.target.value})}
        placeholder="Email"
      />
      <input 
        type="password"
        value={editForm.password} 
        onChange={(e) => setEditForm({...editForm, password: e.target.value})}
        placeholder="Nouveau mot de passe (optionnel)"
      />
      <button type="submit">Enregistrer</button>
      <button onClick={() => setEditingUser(null)}>Annuler</button>
    </form>
  </div>
)}
```

---

### 3. Nettoyage des templates Strapi
**Commandes à exécuter :**

```powershell
cd fiscalscore-cms
Remove-Item -Recurse -Force src/api/about
Remove-Item -Recurse -Force src/api/article
Remove-Item -Recurse -Force src/api/author
Remove-Item -Recurse -Force src/api/category
Remove-Item -Recurse -Force src/api/global
```

**Ensuite redémarrer Strapi :**
```powershell
npm run develop
```

---

### 4. Remplacer les questions seed par les vraies
**Fichier** : `fiscalscore-cms/data/qhm-seed.json`

Actuellement, le fichier contient des questions génériques :
```json
{
  "critere": "Critère 1",
  "indicateur": "Indicateur 1.1",
  "texte": "Question générique planification 1",
  ...
}
```

**À faire :**
1. Ouvrir `fiscalscore-cms/data/qhm-seed.json`
2. Remplacer les 17 questions par les vrais libellés du cahier des charges
3. Relancer le seed : `npm run seed:qhm`

---

## 🟠 Priorité 2 — Important (recommandé avant production)

### 5. Calcul automatique des scores côté backend
**Fichier à créer** : `fiscalscore-cms/src/api/evaluation/content-types/evaluation/lifecycles.ts`

```typescript
export default {
  async beforeCreate(event) {
    await calculateScores(event.params.data);
  },
  
  async beforeUpdate(event) {
    await calculateScores(event.params.data);
  },
};

async function calculateScores(data: any) {
  if (!data.reponses || data.reponses.length === 0) return;
  
  const notes = data.reponses
    .map((r: any) => r.note)
    .filter((n: number) => n > 0); // Exclure les 0
  
  data.scoreMaxReel = notes.length * 3;
  data.scoreFinal = notes.reduce((sum: number, n: number) => sum + n, 0);
  data.pourcentageScore = data.scoreMaxReel > 0 
    ? Math.round((data.scoreFinal / data.scoreMaxReel) * 100) 
    : 0;
}
```

---

### 6. Pages d'erreur personnalisées

#### A. Page 404
**Fichier à créer** : `fiscalscore-app/src/app/not-found.tsx`

```tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
      <p className="text-gray-600 mb-8">Page non trouvée</p>
      <Link href="/dashboard" className="bg-blue-600 text-white px-6 py-3 rounded-lg">
        Retour au tableau de bord
      </Link>
    </div>
  );
}
```

#### B. Page d'erreur générique
**Fichier à créer** : `fiscalscore-app/src/app/error.tsx`

```tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold text-red-600 mb-4">Erreur</h1>
      <p className="text-gray-600 mb-2">{error.message}</p>
      <button
        onClick={reset}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg mt-4"
      >
        Réessayer
      </button>
    </div>
  );
}
```

---

### 7. Système de notifications (toasts)

```bash
cd fiscalscore-app
npm install react-hot-toast
```

**Fichier à créer** : `fiscalscore-app/src/components/ToastProvider.tsx`

```tsx
'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster 
      position="top-right"
      toastOptions={{
        success: {
          style: {
            background: '#10B981',
            color: 'white',
          },
        },
        error: {
          style: {
            background: '#EF4444',
            color: 'white',
          },
        },
      }}
    />
  );
}
```

**Ajouter dans** `fiscalscore-app/src/app/layout.tsx` :

```tsx
import ToastProvider from '@/components/ToastProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}
```

**Utilisation dans les composants :**

```tsx
import toast from 'react-hot-toast';

// Success
toast.success('Évaluation enregistrée avec succès !');

// Error
toast.error('Erreur lors de la sauvegarde');

// Loading
const toastId = toast.loading('Enregistrement...');
// ...
toast.success('Terminé !', { id: toastId });
```

---

## 🟢 Priorité 3 — Nice to have (post-production)

### 8. Tests automatisés

#### A. Installation
```bash
cd fiscalscore-app
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
npm install -D playwright @playwright/test
```

#### B. Configuration Vitest
**Fichier** : `fiscalscore-app/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',
  },
});
```

#### C. Exemple de test
**Fichier** : `fiscalscore-app/src/lib/__tests__/scoring.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { computeScoreFromNotes, getSeuil } from '../scoring';

describe('computeScoreFromNotes', () => {
  it('exclut les notes 0 du calcul', () => {
    const notes = [0, 1, 2, 3];
    const result = computeScoreFromNotes(notes);
    
    expect(result.scoreMaxReel).toBe(9); // 3 notes × 3
    expect(result.scoreObtained).toBe(6); // 1 + 2 + 3
  });
  
  it('calcule le pourcentage correctement', () => {
    const notes = [3, 3, 3];
    const result = computeScoreFromNotes(notes);
    
    expect(result.pourcentage).toBe(100);
  });
});

describe('getSeuil', () => {
  it('retourne vert pour planification ≥86%', () => {
    const seuil = getSeuil(86, 'planification');
    expect(seuil.couleur).toBe('vert');
  });
  
  it('retourne rouge pour mission <60%', () => {
    const seuil = getSeuil(50, 'mission');
    expect(seuil.couleur).toBe('rouge');
  });
});
```

---

### 9. Export CSV/Excel

**Fichier** : `fiscalscore-app/src/lib/export.ts`

```typescript
export function exportToCSV(data: any[], filename: string) {
  const csv = [
    Object.keys(data[0]).join(','), // Headers
    ...data.map(row => Object.values(row).join(','))
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Usage :
function handleExportClients() {
  const data = clients.map(c => ({
    Entreprise: c.nomEntreprise,
    Responsable: c.nomResponsable,
    Secteur: c.secteur,
    Email: c.email,
  }));
  
  exportToCSV(data, 'clients');
}
```

---

### 10. Audit trail (logs)

**Fichier backend** : `fiscalscore-cms/src/api/audit/content-types/audit/schema.json`

```json
{
  "kind": "collectionType",
  "collectionName": "audits",
  "info": {
    "singularName": "audit",
    "pluralName": "audits",
    "displayName": "Audit Log"
  },
  "attributes": {
    "action": {
      "type": "enumeration",
      "enum": ["create", "update", "delete"],
      "required": true
    },
    "entity": {
      "type": "string",
      "required": true
    },
    "entityId": {
      "type": "integer"
    },
    "user": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::users-permissions.user"
    },
    "changes": {
      "type": "json"
    }
  }
}
```

**Hook global** : `fiscalscore-cms/src/index.ts`

```typescript
strapi.db.lifecycles.subscribe({
  async afterCreate(event) {
    await strapi.entityService.create('api::audit.audit', {
      data: {
        action: 'create',
        entity: event.model.collectionName,
        entityId: event.result.id,
        user: event.state.user?.id,
      }
    });
  },
});
```

---

## 📋 Checklist récapitulative

### Avant production
- [ ] ✅ Verrouillage questions frontend
- [ ] ✅ Gestion utilisateurs complète
- [ ] ✅ Nettoyage templates Strapi
- [ ] ✅ Questions seed officielles
- [ ] ✅ Calcul scores backend
- [ ] ✅ Pages d'erreur
- [ ] ✅ Système de notifications

### Post-production
- [ ] Tests automatisés
- [ ] Export CSV/Excel
- [ ] Audit trail
- [ ] Documentation technique
- [ ] Guide utilisateur

---

**Note** : Ce document doit être mis à jour au fur et à mesure que les tâches sont complétées.
