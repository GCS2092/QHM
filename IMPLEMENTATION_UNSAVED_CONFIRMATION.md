# Implémentation : Confirmation avant de quitter une évaluation non terminée

## Contexte
L'utilisateur pouvait quitter le formulaire `EvaluationForm` avec des données non sauvegardées, les perdant même en cas de navigation rapide.

## Solution Implémentée

### Fichier Modifié
**`src/components/evaluations/EvaluationForm.tsx`**

### Changements

#### 1. **Variable d'État - Détection des Modifications Non Sauvegardées**
```typescript
const isUnsaved = answeredCount > 0 && serverEvalId === null;
```
- `answeredCount > 0` : Au moins une question a reçu une réponse
- `serverEvalId === null` : Les données ne sont pas encore sauvegardées sur le serveur
- Message de confirmation réutilisable

#### 2. **Hook beforeunload (Rechargement/Fermeture de Page)**
```typescript
useEffect(() => {
  if (!isUnsaved) return;
  
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    e.preventDefault();
    e.returnValue = "";
    return "";
  };
  
  window.addEventListener("beforeunload", handleBeforeUnload);
  return () => window.removeEventListener("beforeunload", handleBeforeUnload);
}, [isUnsaved]);
```

**Cas couverts :**
- F5 / Cmd+R (rechargement)
- Alt+Left/Right (back/forward)
- Fermeture de l'onglet/fenêtre
- Fermeture du navigateur

#### 3. **Hook pour Prévention de Navigation sur Clics de Liens**
```typescript
useEffect(() => {
  if (!isUnsaved) return;
  
  const handleLinkClick = (e: MouseEvent) => {
    const target = (e.target as HTMLElement).closest("a[href]");
    if (!target) return;
    const href = target.getAttribute("href");
    if (!href || href.startsWith("#")) return;
    
    e.preventDefault();
    if (window.confirm(confirmMessage)) {
      window.location.href = href;
    }
  };
  
  document.addEventListener("click", handleLinkClick);
  return () => document.removeEventListener("click", handleLinkClick);
}, [isUnsaved, confirmMessage]);
```

**Cas couverts :**
- Clics sur les liens de navigation
- Navigation par lien interne (`a href="..."`)
- Liens vers d'autres pages

#### 4. **Fonctions Utilitaires pour Navigation Programmée**
```typescript
const safeNavigate = useCallback(
  (path: string) => {
    if (isUnsaved && !window.confirm(confirmMessage)) {
      return;
    }
    router.push(path);
  },
  [isUnsaved],
);

const safeBack = useCallback(() => {
  if (isUnsaved && !window.confirm(confirmMessage)) {
    return;
  }
  router.back();
}, [isUnsaved]);
```

**Utilisation (si besoin) :**
- `safeNavigate("/dashboard/evaluations")` au lieu de `router.push(...)`
- `safeBack()` au lieu de `router.back()`

## Flux Utilisateur

### Scénario : Utilisateur quitte avec modifications non sauvegardées

1. L'utilisateur répond à des questions → `answeredCount > 0` → `isUnsaved = true`
2. Autosave déclenche après 2 secondes → `serverEvalId` est défini → `isUnsaved = false` (données sauvegardées)

**OU** si navigation avant autosave :

3. Utilisateur clique sur un lien → Hook intercepte
4. Confirmation : "Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir quitter ?"
5. **Oui** → Navigation effectuée
6. **Non** → Navigation annulée, utilisateur reste sur le formulaire

### Cas Spéciaux Couverts
- ✅ Fermeture d'onglet
- ✅ Rechargement de page (F5)
- ✅ Bouton back du navigateur
- ✅ Clics sur liens internes
- ✅ Navigation Next.js programmatique (via `safeNavigate`)
- ✅ Retour arrière programmatique (via `safeBack`)

## Durée d'Autosave Existante
L'autosave existant (2 secondes) continue à fonctionner. Après une sauvegarde réussie, `isUnsaved` devient `false` et les confirmations ne s'affichent plus jusqu'aux prochaines modifications.

## Tests Recommandés
1. Répondre à une question et recharger (F5) → Confirmation doit apparaître
2. Répondre à une question et attendre 2s → Recharger → Pas de confirmation (autosave fait)
3. Répondre et cliquer sur un lien de navigation → Confirmation doit apparaître
4. Cliquer "Non" dans la confirmation → Rester sur le formulaire
5. Cliquer "Oui" dans la confirmation → Naviguer
