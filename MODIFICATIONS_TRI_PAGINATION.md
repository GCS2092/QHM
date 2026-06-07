# Modifications: Tri et Pagination - Clients & Évaluations

## 📋 Résumé des changements

Implémentation complète du tri et de la pagination pour les pages **Clients** et **Évaluations** avec une barre d'outils intuitive.

---

## 🔧 FICHIER 1: `src/app/dashboard/clients/page.tsx`

### État ajouté
```typescript
const [sortBy, setSortBy] = useState<SortBy>("date");           // "nom" | "date" | "secteur"
const [sortOrder, setSortOrder] = useState<SortOrder>("desc");  // "asc" | "desc"
const [page, setPage] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(10);           // 10/25/50
```

### Logique de tri
- **Par nomEntreprise**: Tri alphabétique des entreprises
- **Par dateCreation**: Tri par date (décroissant par défaut)
- **Par secteur**: Tri alphabétique des secteurs

### Pagination
- Affichage de **10/25/50 éléments par page**
- Boutons **← Précédent** et **Suivant →** (activés/désactivés selon contexte)
- Affichage **"Page X de Y"**
- Affichage **"Showing 1-10 of 50"**

### Barre d'outils
```
[Sort dropdown: "Date ▼"] [Order: Asc/Desc ▲▼] [Items/page: 10 ▼] | Page 1 of 5
```

### Détails de mise en œuvre
- **useMemo** pour filtrage optimisé
- **useMemo** pour tri optimisé
- Réinitialisation du `page` à 1 lors de changement de filtres/tri
- **localeCompare** pour tri compatible avec accents français
- Tri numérique pour dates (ISO format)

---

## 🔧 FICHIER 2: `src/app/dashboard/evaluations/page.tsx`

### État ajouté
```typescript
const [sortBy, setSortBy] = useState<SortBy>("date");                    // "client" | "date" | "score"
const [sortOrder, setSortOrder] = useState<SortOrder>("desc");           // "asc" | "desc"
const [filterStatus, setFilterStatus] = useState<FilterStatus>("tous");  // "tous" | "en_cours" | "terminee"
const [page, setPage] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(10);                    // 10/25/50
```

### Logique de tri
- **Par nomEntreprise** (client): Tri alphabétique
- **Par dateEvaluation**: Tri par date
- **Par pourcentageScore**: Tri numérique

### Filtre de statut
- **Tous**: Affiche toutes les évaluations
- **En cours**: Affiche uniquement les évaluations en cours
- **Terminée**: Affiche uniquement les évaluations terminées

### Pagination
- Même système que Clients (10/25/50 éléments)
- Boutons **← Précédent** et **Suivant →**
- Affichage **"Page X de Y"**
- Affichage **"Showing X-Y of Z"**

### Barre d'outils
```
[Sort: "Date ▼"] [Order: Asc/Desc ▲▼] [Filter: Tous ▼] [Items/page: 10 ▼] | Page 1 of 5
```

### Détails de mise en œuvre
- **useMemo** pour filtrage par statut
- **useMemo** pour tri (gère tri numérique vs texte)
- Changement de filtre réinitialise la page
- Tri numérique pour `pourcentageScore`, texte pour les autres

---

## 🎨 Design UI

### Toolbar unifiée (clients et évaluations)
```
Conteneur: bg-white, border-gray-100, rounded-lg, p-4, flex-wrap gap-4

Gauche (contrôles):
  - Dropdown tri (Date/Nom/Client/Score/Secteur)
  - Bouton ordre (Asc/Desc avec icônes ChevronUp/ChevronDown)
  - Dropdown filtre (Clients: secteur; Évaluations: statut)
  - Dropdown items/page (10/25/50)

Droite (info):
  - Texte "Affichage X-Y de Z"
  - Texte "Page X de Y"
```

### Boutons de pagination
- Position: au bas de la page, centré
- États: enabled/disabled selon position
- Style: border gray-200, hover:bg-gray-50, disabled:opacity-50

---

## ✅ Comportements clés

### Réinitialisation automatique
- Changement de **recherche** → page = 1
- Changement de **filtre** → page = 1
- Changement de **tri** → page = 1
- Changement de **items/page** → page = 1

### Gestion des cas limites
- Page vide après filtre → affiche "Aucun client/évaluation"
- Dernière page incomplète → affiche correctement (ex: "45-47 de 47")
- Pas de pagination si < 11 éléments (boutons masqués)

### Performance
- Tri et filtre avec **useMemo** pour éviter recalculs inutiles
- Dépendances correctes: `[filtered, sortBy, sortOrder]` et `[evaluations, filterStatus]`

---

## 📁 Fichiers modifiés

| Fichier | Lignes ajoutées | Résumé |
|---------|-----------------|--------|
| `src/app/dashboard/clients/page.tsx` | ~120 | Tri (nom/date/secteur), pagination, toolbar |
| `src/app/dashboard/evaluations/page.tsx` | ~180 | Tri (client/date/score), filtre statut, pagination, toolbar |

---

## 🚀 Prochains pas optionnels

1. **Persistance URL**: Ajouter les paramètres tri/page à la QueryString
2. **Tri des colonnes**: Rendre les en-têtes du tableau cliquables (évaluations)
3. **Export**: Ajouter bouton "Export CSV" avec données triées/filtrées
4. **Recherche globale**: Ajouter recherche texte sur évaluations
5. **Mémorisation**: Sauvegarder préférences utilisateur (localStorage)
