# UI Wireframes - Tri et Pagination

## 📐 Pages Clients - Vue complète

```
┌─────────────────────────────────────────────────────────────────┐
│  Clients                                          [+ Nouveau...]  │
│  450 clients enregistrés                                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  [🔍 Rechercher...........] [Tous les secteurs ▼] [Actifs ▼]    │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────┐
│ ┌────────────────────────────────────────────┐                        │
│ │ [Sort ▼] [↑ Asc] [Items/page ▼]            │  Showing 1-10 of 450 │
│ │ (Date) (Desc)  (10)                        │  Page 1 of 45        │
│ └────────────────────────────────────────────┘                        │
└───────────────────────────────────────────────────────────────────────┘

┌──────────────────┬──────────────────┬──────────────────┐
│  Client 1        │  Client 2        │  Client 3        │
│  [Card Layout]   │  [Card Layout]   │  [Card Layout]   │
└──────────────────┴──────────────────┴──────────────────┘
┌──────────────────┬──────────────────┬──────────────────┐
│  Client 4        │  Client 5        │  Client 6        │
│  [Card Layout]   │  [Card Layout]   │  [Card Layout]   │
└──────────────────┴──────────────────┴──────────────────┘
┌──────────────────┬──────────────────┬──────────────────┐
│  Client 7        │  Client 8        │  Client 9        │
│  [Card Layout]   │  [Card Layout]   │  [Card Layout]   │
└──────────────────┴──────────────────┴──────────────────┘
┌──────────────────┬──────────────────┬──────────────────┐
│  Client 10       │                  │                  │
│  [Card Layout]   │                  │                  │
└──────────────────┴──────────────────┴──────────────────┘

        ┌──────────────────────────────────────┐
        │   [← Précédent]    [Suivant →]       │
        └──────────────────────────────────────┘
```

### État des contrôles

**Page 1 (1ère page):**
```
[Sort: Date ▼] [Order: Desc ↓] [Items: 10 ▼] | Page 1 of 45
           ↓
       Changes tri  
           ↓
     [Reset page] → Page 1
```

**Page 45 (dernière page):**
```
Affichage 441-450 de 450
[← Précédent ENABLED] [Suivant → DISABLED]
```

**Après changement Items/page (10 → 25):**
```
Avant: Page 2 of 45 (affichage 11-20 de 450)
Tri dropdown change → Page 1 of 18 (affichage 1-25 de 450)
```

---

## 📊 Pages Évaluations - Vue complète

```
┌─────────────────────────────────────────────────────────────────┐
│  Évaluations                                   [+ Nouvelle...]   │
│  156 évaluations                                                │
└─────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────────┐                       │
│ │ [Sort ▼] [↑ Asc] [Filter ▼] [Items/page ▼] │ Showing 1-10 of 156  │
│ │ (Date)  (Desc)  (Tous)     (10)             │ Page 1 of 16         │
│ └──────────────────────────────────────────────┘                       │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│  Client          │ Questionnaire │ Score │ Date  │ Éval. │ Statut │ A.│
├────────────────────────────────────────────────────────────────────────┤
│ Acme Corp        │ Planification │ 78%  │ 02/23 │ Smith │ ✓ Term │ PDF
│ Beta Inc         │ Mission       │  —   │ 01/23 │ Jones │ ⏳ Cours│ Edit
│ Gamma Ltd        │ Planification │ 92%  │ 01/23 │ Brown │ ✓ Term │ PDF
│ Delta Ent        │ Mission       │ 65%  │ 12/22 │ Lee   │ ✓ Term │ PDF
│ Epsilon SA       │ Planification │  —   │ 11/22 │ Chen  │ ⏳ Cours│ Edit
│ Zeta Group       │ Mission       │ 88%  │ 10/22 │ Park  │ ✓ Term │ PDF
│ Eta Corp         │ Planification │ 75%  │ 09/22 │ Smith │ ✓ Term │ PDF
│ Theta Ltd        │ Mission       │  —   │ 08/22 │ Brown │ ⏳ Cours│ Edit
│ Iota Inc         │ Planification │ 81%  │ 07/22 │ Jones │ ✓ Term │ PDF
│ Kappa SA         │ Mission       │ 96%  │ 06/22 │ Lee   │ ✓ Term │ PDF
└────────────────────────────────────────────────────────────────────────┘

        ┌──────────────────────────────────────┐
        │   [← Précédent]    [Suivant →]       │
        └──────────────────────────────────────┘
```

### Variations de filtre

**Filtre: "En cours"**
```
Avant: 156 évaluations totales, Page 1 of 16
Après: 24 évaluations en_cours, Page 1 of 3
→ Affichage 1-10 de 24

Table affiche uniquement les évaluations avec statut="en_cours"
```

**Filtre: "Terminée"**
```
Avant: 156 évaluations totales
Après: 132 évaluations terminee, Page 1 of 14
→ Affichage 1-10 de 132
```

---

## 🎨 Design détaillé de la Toolbar

### Clients - Toolbar

```
┌──────────────────────────────────────────────────────────────┐
│ Tri        Ordre          Items/page      │ Info pagination  │
├──────────────────────────────────────────────────────────────┤
│ ┌────────────┐ ┌───────┐ ┌───────────┐  │ Affichage 1-10  │
│ │  Date ▼    │ │ ↓ Desc│ │   10 ▼    │  │ Page 1 de 45    │
│ └────────────┘ └───────┘ └───────────┘  │                 │
│                                         │                 │
│ Options:       Options: │ Options:      │                 │
│ - Date         │ ↑ Asc  │ - 10        │                 │
│ - Nom          │ ↓ Desc │ - 25        │                 │
│ - Secteur      │        │ - 50        │                 │
└──────────────────────────────────────────────────────────────┘
```

**Styles appliqués:**
```
Conteneur:
  bg-white border-gray-100 rounded-lg p-4
  display: flex justify-between items-center
  gap-4 flex-wrap

Contrôles (gauche):
  flex items-center gap-3 flex-wrap

Selects:
  border-gray-200 px-3 py-1.5 rounded text-sm
  bg-white hover:bg-gray-50

Button:
  border-gray-200 px-2 py-1.5 rounded text-sm
  flex items-center gap-1

Info (droite):
  text-sm text-gray-600 flex items-center gap-4
  font-medium pour "Page X de Y"
```

---

### Évaluations - Toolbar (avec Filtre)

```
┌────────────────────────────────────────────────────────────────┐
│ Tri    Ordre   Filtre     Items/page    │ Info pagination       │
├────────────────────────────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌────────┐ ┌────────┐ │ Affichage 1-10 de 156│
│ │Date▼ │ │↓Desc │ │Tous ▼  │ │ 10 ▼  │ │ Page 1 de 16         │
│ └──────┘ └──────┘ └────────┘ └────────┘ │                      │
│                                        │                      │
│ Options:  Options: Options:     Opt.:  │                      │
│ - Date    │ ↑ Asc  │ - Tous      │ 10 │                      │
│ - Client  │ ↓ Desc │ - En cours  │ 25 │                      │
│ - Score   │        │ - Terminée  │ 50 │                      │
└────────────────────────────────────────────────────────────────┘
```

---

## 📝 Affichage des résultats de pagination

### Format standard
```
Affichage X-Y de Z

X = (page - 1) * itemsPerPage + 1
Y = Math.min(page * itemsPerPage, total)
Z = total

Exemples:
- Page 1, 10/page, total 156 → "Affichage 1-10 de 156"
- Page 2, 10/page, total 156 → "Affichage 11-20 de 156"
- Page 16, 10/page, total 156 → "Affichage 151-156 de 156" ← dernière page
- Page 7, 25/page, total 150 → "Affichage 151-150 de 150" ← 1 item
```

### Cas spéciaux
```
0 résultats: 
  Affichage non affiché (le conteneur est masqué)
  Table affiche "Aucun résultat"

1 résultat:
  "Affichage 1-1 de 1"
  Boutons pagination: masqués (totalPages = 1)
```

---

## 🔄 Scénarios d'interaction

### Scénario 1: Utilisateur trie par nom

```
Avant:
  [Sort: Date ▼] Page 1 of 45
  Affichage 1-10 de 450
  
Clic sur "Sort: Date ▼" → change en "Nom"
  ↓
setState({sortBy: 'nom'})
  ↓
Recalcul du tri (useMemo)
  ↓
setState({page: 1}) [automatique]
  ↓
Affichage:
  [Sort: Nom ▼] Page 1 of 45
  Affichage 1-10 de 450
  
Données = triées alphabétiquement par nomEntreprise, clients 1-10
```

### Scénario 2: Utilisateur change items/page en milieu de pagination

```
Avant:
  [Items: 10 ▼] Page 7 of 45
  Affichage 61-70 de 450
  
Clic sur "Items: 10 ▼" → change en "25"
  ↓
setState({itemsPerPage: 25})
setState({page: 1}) [automatique]
  ↓
totalPages = Math.ceil(450 / 25) = 18
  ↓
Affichage:
  [Items: 25 ▼] Page 1 of 18
  Affichage 1-25 de 450
```

### Scénario 3: Utilisateur applique filtre

```
Avant (Évaluations):
  [Filter: Tous ▼] Page 3 of 16
  Affichage 21-30 de 156
  
Clic sur "Filter: Tous ▼" → change en "En cours"
  ↓
Filtre appliqué (useMemo)
  ↓
Données filtrées = 24 items seulement
setState({filterStatus: 'en_cours'})
setState({page: 1}) [automatique]
  ↓
totalPages = Math.ceil(24 / 10) = 3
  ↓
Affichage:
  [Filter: En cours ▼] Page 1 of 3
  Affichage 1-10 de 24
  
Table affiche seulement les 10 premiers items "en_cours"
```

### Scénario 4: Pagination vers dernière page

```
Page 1 of 45, affichage 1-10
  ↓
Clic [Suivant →] × 44 fois (ou saisie page 45)
  ↓
Page 45 of 45
Affichage 441-450 de 450
[← Précédent ENABLED] [Suivant → DISABLED]
```

---

## ✨ Micro-interactions

### Bouton Ordre (Asc/Desc)
```
Normal: [↑ Asc]   ou   [↓ Desc]
Hover:  [↑ Asc] + bg-gray-50

Au clic:
  Asc → Desc (garde la page courante, pas de reset)
  Desc → Asc (garde la page courante, pas de reset)
  
Raison: l'ordre n'affecte pas les résultats, juste leur ordre
```

### Sélects (Tri, Filtre, Items/page)
```
Normal:
  border-gray-200 text-gray-700 bg-white

Hover:
  border-gray-200 text-gray-700 bg-gray-50

Focus:
  border-blue-500 ring-2 ring-blue-200

Open (avec options visibles):
  Affiche dropdown avec animation fade-in
```

### Boutons Pagination
```
Enabled:
  border-gray-200 text-gray-700 bg-white
  hover:bg-gray-50
  cursor-pointer

Disabled (première page - bouton précédent):
  border-gray-200 text-gray-700 bg-white
  opacity-50
  cursor-not-allowed
  
Disabled (dernière page - bouton suivant):
  border-gray-200 text-gray-700 bg-white
  opacity-50
  cursor-not-allowed
```

---

## 📱 Responsive design

### Desktop (xl, lg, md)
```
Toolbar: flexbox horizontal
  [Contrôles gauche] | [Info droite]
  gap-4

Clients: grid 3 colonnes
  xl: 3 colonnes
  md: 2 colonnes
  sm: 1 colonne

Évaluations: table avec scroll horizontal si nécessaire
```

### Tablet (md)
```
Toolbar: flex-wrap si besoin
  [Contrôles] | [Info]
  Peut wraper sur 2 lignes si serré

Clients: grid 2 colonnes
```

### Mobile (sm, xs)
```
Toolbar: stack vertical (flex-col)
  Chaque contrôle en ligne propre
  Info pagination en bas

Clients: grid 1 colonne

Évaluations: scroll horizontal du tableau
  Colonnes essentielles: Client, Score, Statut
  Autres colonnes: masquées ou scrollables
```

**Classe Tailwind appliquée:**
```
flex items-center justify-between 
  flex-wrap gap-4
```

Le `flex-wrap` assure adaptation auto sur petit écran.

---

## 🎯 Checklist d'implémentation

- [x] État React ajouté (sortBy, sortOrder, page, itemsPerPage, filterStatus)
- [x] Logique de tri (useMemo optimisé)
- [x] Logique de filtre (useMemo optimisé)
- [x] Logique de pagination (slice, totalPages)
- [x] Toolbar UI (dropdown tri, bouton ordre, dropdown filtre, dropdown items)
- [x] Info pagination (affichage "X-Y de Z", "Page X de Y")
- [x] Boutons pagination (précédent/suivant avec état disabled)
- [x] Réinitialisation page lors filtre/tri/items change
- [x] Gestion des cas limites (page vide, dernière page, etc.)
- [x] Styles Tailwind cohérents
- [x] Icones lucide-react (ChevronUp, ChevronDown)
- [ ] Responsive mobile (futur: tester sur petit écran)
- [ ] Persistance localStorage (futur: sauver préférences)
- [ ] Query parameters URL (futur: partager URLs avec tri/page)
