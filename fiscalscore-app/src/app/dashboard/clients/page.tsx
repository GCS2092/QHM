"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ClientCard from "@/components/clients/ClientCard";
import { Search, Plus, Filter } from "lucide-react";
import { getClients } from "@/lib/api";
import type { Client } from "@/lib/types";

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getClients()
      .then(setClients)
      .catch((err) => setError(err.message || "Impossible de charger les clients"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => clients.filter((c) =>
      c.nom.toLowerCase().includes(search.toLowerCase()) ||
      c.prenom.toLowerCase().includes(search.toLowerCase()) ||
      c.identifiantFiscal.toLowerCase().includes(search.toLowerCase())
    ),
    [clients, search]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">{clients.length} clients enregistres</p>
        </div>
        <Link href="/dashboard/clients/new" className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          <Plus className="w-4 h-4" /> Nouveau client
        </Link>
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
          <Filter className="w-4 h-4" /> Filtres
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
          <div className="col-span-full text-center py-12 text-gray-400">Aucun client trouve</div>
        )}
      </div>
    </div>
  );
}
