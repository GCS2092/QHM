# Architecture: Tri et Pagination

## 📊 Flux de données

```
┌─────────────────────────────────────────────────────────┐
│ State React                                             │
├─────────────────────────────────────────────────────────┤
│ • evaluations[] → données brutes API                   │
│ • search → filtre texte                                 │
│ • secteurFilter → filtre secteur (clients)             │
│ • filterStatus → filtre statut (évaluations)           │
│ • showArchived → affiche archives                       │
│ • sortBy → champ de tri                                 │
│ • sortOrder → asc/desc                                  │
│ • page → numéro page actuelle                           │
│ • itemsPerPage → 10/25/50                               │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ ÉTAPE 1: FILTER │  useMemo([filtered])
        │   (données      │  Combiné: search +
        │    brutes)      │  filterStatus/secteur +
        └────────┬────────┘  showArchived
                 │
                 ▼
        ┌────────────────┐
        │ ÉTAPE 2: SORT  │  useMemo([sorted])
        │   (filtré)     │  Tri par: date/nom/
        └────────┬────────┘  score/secteur
                 │
                 ▼
        ┌─────────────────┐
        │ ÉTAPE 3: SLICE  │  JS Array.slice()
        │ (trié)          │  startIdx = (page-1) * itemsPerPage
        │ PAGE            │  endIdx = startIdx + itemsPerPage
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ AFFICHAGE PAGE  │
        │ (paginée)       │
        └─────────────────┘
```

---

## 🔄 État complet - CLIENTS

```typescript
// Données
const [clients, setClients] = useState<Client[]>([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

// Filtres existants
const [search, setSearch] = useState("")
const [secteurFilter, setSecteurFilter] = useState("")
const [showArchived, setShowArchived] = useState(false)

// NOUVEAU: Tri
const [sortBy, setSortBy] = useState<"nom" | "date" | "secteur">("date")
const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

// NOUVEAU: Pagination
const [page, setPage] = useState(1)
const [itemsPerPage, setItemsPerPage] = useState(10)
```

---

## 🔄 État complet - ÉVALUATIONS

```typescript
// Données
const [evaluations, setEvaluations] = useState<Evaluation[]>([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

// NOUVEAU: Tri
const [sortBy, setSortBy] = useState<"client" | "date" | "score">("date")
const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

// NOUVEAU: Filtre statut
const [filterStatus, setFilterStatus] = useState<"tous" | "en_cours" | "terminee">("tous")

// NOUVEAU: Pagination
const [page, setPage] = useState(1)
const [itemsPerPage, setItemsPerPage] = useState(10)
```

---

## 💾 Logique de tri (pseudo-code)

```typescript
const sorted = useMemo(() => {
  const copy = [...filtered]
  
  copy.sort((a, b) => {
    let aVal, bVal
    
    // Extraire la valeur à comparer selon sortBy
    if (sortBy === "date") {
      aVal = a.dateCreation ?? ""
      bVal = b.dateCreation ?? ""
    } else if (sortBy === "nom") {
      aVal = a.nomEntreprise ?? ""
      bVal = b.nomEntreprise ?? ""
    } else if (sortBy === "secteur") {
      aVal = a.secteur ?? ""
      bVal = b.secteur ?? ""
    }
    
    // Comparer numériquement ou alphabétiquement
    const result = String(aVal).localeCompare(String(bVal))
    
    // Inverser si décroissant
    return sortOrder === "asc" ? result : -result
  })
  
  return copy
}, [filtered, sortBy, sortOrder])
```

---

## 📄 Logique de pagination

```typescript
// Calcul des limites
const totalPages = Math.ceil(sorted.length / itemsPerPage)
const startIdx = (page - 1) * itemsPerPage
const endIdx = startIdx + itemsPerPage

// Extraction de la page actuelle
const paginatedData = sorted.slice(startIdx, endIdx)

// Changement de page avec garde-fous
const handlePageChange = (newPage: number) => {
  setPage(Math.max(1, Math.min(newPage, totalPages)))
}
```

### Exemples

**50 items, 10 par page:**
- Page 1: startIdx=0, endIdx=10 → items 0-9
- Page 2: startIdx=10, endIdx=20 → items 10-19
- Page 5: startIdx=40, endIdx=50 → items 40-49
- Total pages = 5

**47 items, 10 par page:**
- Page 1: startIdx=0, endIdx=10 → items 0-9 (affichage "1-10 de 47")
- Page 5: startIdx=40, endIdx=50 → items 40-46 (affichage "41-47 de 47")
- Total pages = 5

---

## 🎛️ Barre d'outils (Toolbar)

### Layout Tailwind
```html
<div class="flex items-center justify-between bg-white border border-gray-100 rounded-lg p-4 flex-wrap gap-4">
  <!-- Gauche: Contrôles -->
  <div class="flex items-center gap-3 flex-wrap">
    <!-- Tri dropdown -->
    <select>...</select>
    
    <!-- Ordre toggle -->
    <button onClick={toggleOrder}>...</button>
    
    <!-- Filtre dropdown -->
    <select>...</select>
    
    <!-- Items/page dropdown -->
    <select>...</select>
  </div>
  
  <!-- Droite: Info pagination -->
  <div class="text-sm text-gray-600 flex items-center gap-4">
    <span>Affichage {start}-{end} de {total}</span>
    <span class="font-medium">Page {page} de {totalPages}</span>
  </div>
</div>
```

### Comportement des contrôles
| Contrôle | Événement | Effet |
|----------|-----------|-------|
| Tri dropdown | `onChange` | `setSortBy(value)`, `setPage(1)` |
| Ordre button | `onClick` | Toggle `sortOrder`, keep `page` |
| Filtre dropdown | `onChange` | `setFilterStatus(value)`, `setPage(1)` |
| Items/page | `onChange` | `setItemsPerPage(value)`, `setPage(1)` |
| ← Précédent | `onClick` | `handlePageChange(page-1)` |
| Suivant → | `onClick` | `handlePageChange(page+1)` |

---

## 🛡️ Cas limites gérés

### 1. Page vide après filtre
```
État: filtered.length === 0
Affichage: "Aucun client trouvé"
Pagination: Masquée (totalPages = 0)
```

### 2. Dernière page incomplète
```
50 items, 10 par page, page 5
Items: 40-49 ✓ (rempli complètement)

47 items, 10 par page, page 5
Items: 40-46 ✓ (7 items, affichage correct "41-47 de 47")
```

### 3. Page trop grande saisie
```
Page 10 demandée mais totalPages = 5
Redirection: setPage(Math.min(10, 5)) → Page 5
```

### 4. Filtre/tri avec page 5
```
Utilisateur à page 5, change le tri
Ancien: 50 items → 5 pages
Nouveau: 15 items → 2 pages (après tri)
Résultat: setPage(1) automatique, affiche page 1
```

### 5. Recherche pendant pagination
```
Page 2 (20 items affichés)
Utilisateur tape "abc" → filtré à 3 results
Résultat: setPage(1) automatique, affiche les 3 items
```

---

## ⚡ Optimisations appliquées

### 1. useMemo pour filtrage
```typescript
const filtered = useMemo(
  () => clients.filter(...),
  [clients, search, secteurFilter, showArchived]
)
```
**Bénéfice**: Ne recalcule que si les dépendances changent

### 2. useMemo pour tri
```typescript
const sorted = useMemo(
  () => {
    const copy = [...filtered]
    copy.sort(...)
    return copy
  },
  [filtered, sortBy, sortOrder]
)
```
**Bénéfice**: Ne trie que si données filtrées ou paramètres de tri changent

### 3. Slice au lieu de map
```typescript
const paginatedData = sorted.slice(startIdx, endIdx)
```
**Bénéfice**: O(1) au lieu de O(n), pas de rendu d'éléments invisibles

### 4. Dépendances correctes
```typescript
// ✅ BON
const sorted = useMemo(() => {...}, [filtered, sortBy, sortOrder])

// ❌ MAUVAIS
const sorted = useMemo(() => {...}, [filtered, sortBy, sortOrder, page, itemsPerPage])
// page et itemsPerPage ne changent pas la logique de tri!
```

---

## 🔌 Points d'intégration API

### Chargement initial
```typescript
useEffect(() => {
  getClients()
    .then(setClients)
    .catch(err => setError(err.message))
    .finally(() => setLoading(false))
}, [])
```
Récupère toutes les données, tri/pagination côté client

### Alternative serveur (futur)
Pour très grandes listes (10k+ items):
```typescript
const [loading, setLoading] = useState(true)
// Envoyer: ?sort=date&order=desc&page=1&limit=10
// API retourne: {data: [...], total: 50, pages: 5}
```

---

## 🧪 Tests à valider

- [ ] Tri par chaque colonne/champ
- [ ] Ordre asc/desc fonctionne
- [ ] Pagination: boutons next/prev
- [ ] Pagination: dernier item correct
- [ ] Filtre réinitialise page
- [ ] Items/page: 10, 25, 50 tous corrects
- [ ] "Page X de Y" correct en tout temps
- [ ] "Affichage X-Y de Z" correct en tout temps
- [ ] Page désactivée: première page, bouton prev désactivé
- [ ] Page désactivée: dernière page, bouton next désactivé
- [ ] Recherche + tri + pagination ensemble
- [ ] Vérifier "Aucun résultat" n'affiche pas pagination
