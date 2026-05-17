"use client";
import { useState } from "react";
import ClientCard from "@/components/clients/ClientCard";
import { Search, Plus, Filter } from "lucide-react";

const mockClients = [
  { id: 1, nom: "Diallo", prenom: "Mamadou", identifiantFiscal: "SN-2021-00123", score: 82, telephone: "+221 77 123 45 67" },
  { id: 2, nom: "Ndiaye", prenom: "Fatou", identifiantFiscal: "SN-2020-00456", score: 45, telephone: "+221 76 234 56 78" },
  { id: 3, nom: "Sow", prenom: "Ibrahima", identifiantFiscal: "SN-2019-00789", score: 18, telephone: "+221 70 345 67 89" },
  { id: 4, nom: "Ba", prenom: "Aminata", identifiantFiscal: "SN-2022-00321", score: 71, telephone: "+221 78 456 78 90" },
  { id: 5, nom: "Cisse", prenom: "Omar", identifiantFiscal: "SN-2021-00654", score: 35, telephone: "+221 77 567 89 01" },
  { id: 6, nom: "Traore", prenom: "Aissatou", identifiantFiscal: "SN-2020-00987", score: 90, telephone: "+221 76 678 90 12" },
];

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const filtered = mockClients.filter(c =>
    c.nom.toLowerCase().includes(search.toLowerCase()) ||
    c.prenom.toLowerCase().includes(search.toLowerCase()) ||
    c.identifiantFiscal.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">{mockClients.length} clients enregistres</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          <Plus className="w-4 h-4" /> Nouveau client
        </button>
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Rechercher un client..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
          <Filter className="w-4 h-4" /> Filtres
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(client => <ClientCard key={client.id} client={client} />)}
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">Aucun client trouve</div>
      )}
    </div>
  );
}
