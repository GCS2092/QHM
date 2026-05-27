"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import ClientCard from "@/components/clients/ClientCard";
import { Search, Plus, Filter } from "lucide-react";
import { getClients } from "@/lib/api";
import { isAdminRole } from "@/lib/scoring";
import type { Client } from "@/lib/types";

export default function ClientsPage() {
  const { data: session } = useSession();
  const isAdmin = isAdminRole((session?.user as { role?: string })?.role);
  const [search, setSearch] = useState("");
  const [secteurFilter, setSecteurFilter] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getClients()
      .then(setClients)
      .catch((err) => setError(err.message || "Impossible de charger les clients"))
      .finally(() => setLoading(false));
  }, []);

  const secteurs = useMemo(
    () => Array.from(new Set(clients.map((c) => c.secteur).filter(Boolean) as string[])).sort(),
    [clients]
  );

  const filtered = useMemo(
    () => clients.filter((c) => {
      const matchSearch =
        (c.nomEntreprise ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (c.nomResponsable ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (c.secteur ?? "").toLowerCase().includes(search.toLowerCase());
      const matchSecteur = !secteurFilter || c.secteur === secteurFilter;
      const matchArchive = showArchived ? true : !c.archive;
      return matchSearch && matchSecteur && matchArchive;
    }),
    [clients, search, secteurFilter, showArchived]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">{clients.length} clients enregistrés</p>
        </div>
        {isAdmin ? (
          <Link href="/dashboard/clients/new" className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
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
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={secteurFilter}
          onChange={(e) => setSecteurFilter(e.target.value)}
          className="border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-700"
        >
          <option value="">Tous les secteurs</option>
          {secteurs.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setShowArchived((v) => !v)}
          className={`flex items-center gap-2 border px-4 py-2 rounded-lg text-sm transition ${showArchived ? "border-blue-300 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
        >
          <Filter className="w-4 h-4" /> {showArchived ? "Tous" : "Actifs"}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full rounded-xl border border-gray-100 bg-white p-10 text-center text-gray-500">Chargement des clients...</div>
        ) : error ? (
          <div className="col-span-full rounded-xl border border-red-100 bg-red-50 p-10 text-center text-red-700">{error}</div>
        ) : filtered.length > 0 ? (
          filtered.map((client) => <ClientCard key={client.id} client={client} />)
        ) : (
          <div className="col-span-full text-center py-12 text-gray-400">Aucun client trouvé</div>
        )}
      </div>
    </div>
  );
}
