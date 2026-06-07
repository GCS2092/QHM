"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import ClientCard from "@/components/clients/ClientCard";
import { Search, Plus, Filter, ChevronUp, ChevronDown } from "lucide-react";
import { getClients } from "@/lib/api";
import { isAdminRole } from "@/lib/scoring";
import type { Client } from "@/lib/types";

type SortBy = "nom" | "date" | "secteur";
type SortOrder = "asc" | "desc";

export default function ClientsPage() {
  const { data: session } = useSession();
  const isAdmin = isAdminRole((session?.user as { role?: string })?.role);
  const [search, setSearch] = useState("");
  const [secteurFilter, setSecteurFilter] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getClients()
      .then(setClients)
      .catch((err) =>
        setError(err.message || "Impossible de charger les clients"),
      )
      .finally(() => setLoading(false));
  }, []);

  const secteurs = useMemo(
    () =>
      Array.from(
        new Set(clients.map((c) => c.secteur).filter(Boolean) as string[]),
      ).sort(),
    [clients],
  );

  const filtered = useMemo(
    () =>
      clients.filter((c) => {
        const matchSearch =
          (c.nomEntreprise ?? "")
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          (c.nomResponsable ?? "")
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          (c.secteur ?? "").toLowerCase().includes(search.toLowerCase());
        const matchSecteur = !secteurFilter || c.secteur === secteurFilter;
        const matchArchive = showArchived ? true : !c.archive;
        return matchSearch && matchSecteur && matchArchive;
      }),
    [clients, search, secteurFilter, showArchived],
  );

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

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const startIdx = (page - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedData = sorted.slice(startIdx, endIdx);

  const handlePageChange = (newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">
            {clients.length} clients enregistrés
          </p>
        </div>
        {isAdmin ? (
          <Link
            href="/dashboard/clients/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" /> Nouveau client
          </Link>
        ) : null}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une entreprise, un responsable..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={secteurFilter}
          onChange={(e) => {
            setSecteurFilter(e.target.value);
            setPage(1);
          }}
          className="border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-700"
        >
          <option value="">Tous les secteurs</option>
          {secteurs.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            setShowArchived((v) => !v);
            setPage(1);
          }}
          className={`flex items-center gap-2 border px-4 py-2 rounded-lg text-sm transition ${showArchived ? "border-blue-300 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
        >
          <Filter className="w-4 h-4" /> {showArchived ? "Tous" : "Actifs"}
        </button>
      </div>

      {/* Toolbar avec tri et pagination */}
      <div className="flex items-center justify-between bg-white border border-gray-100 rounded-lg p-4 flex-wrap gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Tri */}
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

          {/* Ordre */}
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="border border-gray-200 px-2 py-1.5 rounded text-sm text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-1"
          >
            {sortOrder === "asc" ? (
              <>
                <ChevronUp className="w-4 h-4" /> Asc
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" /> Desc
              </>
            )}
          </button>

          {/* Items par page */}
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

        {/* Pagination info */}
        <div className="text-sm text-gray-600 flex items-center gap-4">
          {sorted.length > 0 && (
            <span>
              Affichage {startIdx + 1}-{Math.min(endIdx, sorted.length)} de{" "}
              {sorted.length}
            </span>
          )}
          <span className="font-medium">
            Page {page} de {totalPages || 1}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full rounded-xl border border-gray-100 bg-white p-10 text-center text-gray-500">
            Chargement des clients...
          </div>
        ) : error ? (
          <div className="col-span-full rounded-xl border border-red-100 bg-red-50 p-10 text-center text-red-700">
            {error}
          </div>
        ) : paginatedData.length > 0 ? (
          paginatedData.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-gray-400">
            Aucun client trouvé
          </div>
        )}
      </div>

      {/* Boutons de pagination */}
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
    </div>
  );
}
