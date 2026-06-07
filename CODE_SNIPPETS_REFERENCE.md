# Code Snippets - Référence d'implémentation

## 🔧 Clients Page - Code Key

### 1️⃣ Imports ajoutés
```typescript
import { ChevronUp, ChevronDown } from "lucide-react";

type SortBy = "nom" | "date" | "secteur";
type SortOrder = "asc" | "desc";
```

### 2️⃣ État React ajouté
```typescript
const [sortBy, setSortBy] = useState<SortBy>("date");
const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
const [page, setPage] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(10);
```

### 3️⃣ useMemo - Tri
```typescript
const sorted = useMemo(() => {
  const copy = [...filtered];
  copy.sort((a, b) => {
    let aVal: string | number = "";
    let bVal: string | number = "";

    if (sortBy === "nom") {
      aVal = a.nomEntreprise ?? "";
      bVal = b.nomEntreprise ?? "";
    } else if (sortBy === "date") {
      aVal = a.dateCreation ?? "";
      bVal = b.dateCreation ?? "";
    } else if (sortBy === "secteur") {
      aVal = a.secteur ?? "";
      bVal = b.secteur ?? "";
    }

    const result = String(aVal).localeCompare(String(bVal));
    return sortOrder === "asc" ? result : -result;
  });
  return copy;
}, [filtered, sortBy, sortOrder]);
```

### 4️⃣ Pagination - Calculs
```typescript
const totalPages = Math.ceil(sorted.length / itemsPerPage);
const startIdx = (page - 1) * itemsPerPage;
const endIdx = startIdx + itemsPerPage;
const paginatedData = sorted.slice(startIdx, endIdx);

const handlePageChange = (newPage: number) => {
  setPage(Math.max(1, Math.min(newPage, totalPages)));
};
```

### 5️⃣ Input avec réinitialisation page
```typescript
<input
  type="text"
  placeholder="Rechercher..."
  value={search}
  onChange={(e) => {
    setSearch(e.target.value);
    setPage(1);  // ← Reset page à chaque changement
  }}
  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
/>
```

### 6️⃣ Toolbar - Structure
```typescript
<div className="flex items-center justify-between bg-white border border-gray-100 rounded-lg p-4 flex-wrap gap-4">
  {/* Gauche: Contrôles */}
  <div className="flex items-center gap-3 flex-wrap">
    {/* Sort dropdown */}
    <select
      value={sortBy}
      onChange={(e) => {
        setSortBy(e.target.value as SortBy);
        setPage(1);
      }}
      className="border border-gray-200 px-3 py-1.5 rounded text-sm text-gray-700 bg-white hover:bg-gray-50"
    >
      <option value="date">Date</option>
      <option value="nom">Nom</option>
      <option value="secteur">Secteur</option>
    </select>

    {/* Order button */}
    <button
      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
      className="border border-gray-200 px-2 py-1.5 rounded text-sm text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-1"
    >
      {sortOrder === "asc" ? (
        <><ChevronUp className="w-4 h-4" /> Asc</>
      ) : (
        <><ChevronDown className="w-4 h-4" /> Desc</>
      )}
    </button>

    {/* Items per page */}
    <select
      value={itemsPerPage}
      onChange={(e) => {
        setItemsPerPage(Number(e.target.value));
        setPage(1);
      }}
      className="border border-gray-200 px-3 py-1.5 rounded text-sm text-gray-700 bg-white hover:bg-gray-50"
    >
      <option value="10">10</option>
      <option value="25">25</option>
      <option value="50">50</option>
    </select>
  </div>

  {/* Droite: Info pagination */}
  <div className="text-sm text-gray-600 flex items-center gap-4">
    {sorted.length > 0 && (
      <span>
        Affichage {startIdx + 1}-{Math.min(endIdx, sorted.length)} de {sorted.length}
      </span>
    )}
    <span className="font-medium">
      Page {page} de {totalPages || 1}
    </span>
  </div>
</div>
```

### 7️⃣ Boutons Pagination
```typescript
{totalPages > 1 && (
  <div className="flex items-center justify-center gap-2">
    <button
      onClick={() => handlePageChange(page - 1)}
      disabled={page === 1}
      className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      ← Précédent
    </button>
    <button
      onClick={() => handlePageChange(page + 1)}
      disabled={page === totalPages}
      className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Suivant →
    </button>
  </div>
)}
```

### 8️⃣ Rendu - Utiliser paginatedData
```typescript
{paginatedData.length > 0 ? (
  paginatedData.map((client) => <ClientCard key={client.id} client={client} />)
) : (
  <div className="col-span-full text-center py-12 text-gray-400">
    Aucun client trouvé
  </div>
)}
```

---

## 🔧 Évaluations Page - Code Key

### 1️⃣ Imports et Types
```typescript
import { ChevronUp, ChevronDown } from "lucide-react";
import { useMemo } from "react";

type SortBy = "client" | "date" | "score";
type SortOrder = "asc" | "desc";
type FilterStatus = "tous" | "en_cours" | "terminee";
```

### 2️⃣ État React
```typescript
const [sortBy, setSortBy] = useState<SortBy>("date");
const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
const [filterStatus, setFilterStatus] = useState<FilterStatus>("tous");
const [page, setPage] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(10);
```

### 3️⃣ useMemo - Filtre statut
```typescript
const filtered = useMemo(
  () => evaluations.filter((e) => {
    if (filterStatus === "tous") return true;
    return e.statut === filterStatus;
  }),
  [evaluations, filterStatus]
);
```

### 4️⃣ useMemo - Tri (avec numérique)
```typescript
const sorted = useMemo(() => {
  const copy = [...filtered];
  copy.sort((a, b) => {
    let aVal: string | number = "";
    let bVal: string | number = "";

    if (sortBy === "client") {
      aVal = a.client?.nomEntreprise ?? "";
      bVal = b.client?.nomEntreprise ?? "";
    } else if (sortBy === "date") {
      aVal = a.dateEvaluation ?? "";
      bVal = b.dateEvaluation ?? "";
    } else if (sortBy === "score") {
      aVal = a.pourcentageScore ?? 0;
      bVal = b.pourcentageScore ?? 0;
    }

    // Tri numérique pour scores, alphabétique pour autres
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    }

    const result = String(aVal).localeCompare(String(bVal));
    return sortOrder === "asc" ? result : -result;
  });
  return copy;
}, [filtered, sortBy, sortOrder]);
```

### 5️⃣ Dropdown Filtre Statut
```typescript
<select
  value={filterStatus}
  onChange={(e) => {
    setFilterStatus(e.target.value as FilterStatus);
    setPage(1);
  }}
  className="border border-gray-200 px-3 py-1.5 rounded text-sm text-gray-700 bg-white hover:bg-gray-50"
>
  <option value="tous">Tous</option>
  <option value="en_cours">En cours</option>
  <option value="terminee">Terminée</option>
</select>
```

### 6️⃣ Rendu Table avec paginatedData
```typescript
<tbody className="divide-y divide-gray-50">
  {loading ? (
    <tr>
      <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
        Chargement...
      </td>
    </tr>
  ) : error ? (
    <tr>
      <td colSpan={7} className="px-6 py-10 text-center text-red-600">
        {error}
      </td>
    </tr>
  ) : paginatedData.length === 0 ? (
    <tr>
      <td colSpan={7} className="px-6 py-10 text-center text-gray-400">
        Aucune évaluation
      </td>
    </tr>
  ) : (
    paginatedData.map((e) => (
      <tr key={e.id} className="hover:bg-gray-50 transition">
        {/* Colonnes */}
      </tr>
    ))
  )}
</tbody>
```

---

## 🎯 Pattern général - Réutilisable

### Template pour nouvelle page avec tri/pagination
```typescript
"use client";
import { useEffect, useMemo, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

type SortBy = "field1" | "field2" | "field3";
type SortOrder = "asc" | "desc";

export default function MyPage() {
  // État données
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // État tri/pagination
  const [sortBy, setSortBy] = useState<SortBy>("field1");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Charger données
  useEffect(() => {
    fetchData()
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Filtrer (optionnel)
  const filtered = useMemo(
    () => data.filter(/* logique filtrage */),
    [data]
  );

  // Trier
  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let aVal = a[sortBy] ?? "";
      let bVal = b[sortBy] ?? "";
      
      const result = String(aVal).localeCompare(String(bVal));
      return sortOrder === "asc" ? result : -result;
    });
    return copy;
  }, [filtered, sortBy, sortOrder]);

  // Paginer
  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginatedData = sorted.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white border border-gray-100 rounded-lg p-4 flex-wrap gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }}>
            {/* Options */}
          </select>
          <button onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}>
            {sortOrder === "asc" ? "↑" : "↓"}
          </button>
          <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setPage(1); }}>
            <option>10</option>
            <option>25</option>
            <option>50</option>
          </select>
        </div>
        <div className="text-sm text-gray-600">
          Page {page} de {totalPages || 1}
        </div>
      </div>

      {/* Données */}
      {paginatedData.map(item => (
        <div key={item.id}>{/* Rendu */}</div>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-2 justify-center">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            Précédent
          </button>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## 📊 Patterns de tri par type

### Tri alphabétique (texte)
```typescript
const result = String(aVal).localeCompare(String(bVal));
return sortOrder === "asc" ? result : -result;
```
✅ Utilise `localeCompare` pour accents français

### Tri numérique (scores, dates)
```typescript
return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
```
✅ Soustraction directe pour nombres

### Tri mixte (détection automatique)
```typescript
if (typeof aVal === "number" && typeof bVal === "number") {
  return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
} else {
  const result = String(aVal).localeCompare(String(bVal));
  return sortOrder === "asc" ? result : -result;
}
```
✅ Combine les deux approches

---

## 🔄 Patterns de réinitialisation page

### ❌ Mauvais
```typescript
onChange={(e) => setSortBy(e.target.value)} // Oublie de reset page
```

### ✅ Bon
```typescript
onChange={(e) => {
  setSortBy(e.target.value);
  setPage(1);  // Reset page systématiquement
}}
```

### ✅ Alternatif - Dépendance
```typescript
useEffect(() => {
  setPage(1);  // Reset quand sortBy change
}, [sortBy]);
```

---

## 💾 Optimisations - Checklist

- [x] `useMemo` pour filtrage (évite recalcul si data identique)
- [x] `useMemo` pour tri (évite recalcul si filtered identique)
- [x] Dépendances correctes (ne pas inclure `page` dans useMemo de tri)
- [x] `Array.slice()` au lieu de `map()` pour pagination (O(1))
- [x] Réinitialisation `page=1` lors changement filtre/tri
- [x] `localeCompare` pour accents français
- [x] Détection numérique automatique dans tri

---

## 🧪 Tests manuels - Checklist

Avant de valider, tester manuellement:

- [ ] Clic tri: données se réordonnent
- [ ] Clic ordre: inversion asc/desc fonctionne
- [ ] Clic "Suivant": affiche page 2
- [ ] Clic "Précédent": retour page 1
- [ ] "Page X de Y": nombre pages correct
- [ ] "Affichage X-Y de Z": indices corrects
- [ ] Bouton "Précédent" désactivé page 1
- [ ] Bouton "Suivant" désactivé dernière page
- [ ] Changement items/page: page reset à 1
- [ ] Filtre + tri + pagination: fonctionne ensemble
- [ ] Dernier item page: s'affiche correctement
- [ ] Filtre → 0 résultats: "Aucun trouvé"
- [ ] Filtre → 1 résultat: "Affichage 1-1 de 1"

---

## 🚀 Déploiement

Les fichiers modifiés sont prêts à être testés en développement:

```bash
npm run dev
# Accéder à:
# http://localhost:3000/dashboard/clients
# http://localhost:3000/dashboard/evaluations
```

Pas de dépendances supplémentaires nécessaires.
