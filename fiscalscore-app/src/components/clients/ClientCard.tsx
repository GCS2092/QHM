import Link from "next/link";
import { Phone, FileText, Building2 } from "lucide-react";
import type { Client } from "@/lib/types";

export default function ClientCard({ client }: { client: Client }) {
  const initials = `${(client.nomEntreprise?.[0] ?? "?")}${(client.nomResponsable?.[0] ?? "")}`.toUpperCase();
  return (
    <div className={`bg-white rounded-xl border p-5 hover:shadow-sm transition ${client.archive ? 'border-gray-200 opacity-75' : 'border-gray-100'}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
          {initials}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{client.nomEntreprise}</p>
          <p className="text-xs text-gray-500">{client.nomResponsable}</p>
        </div>
      </div>
      {client.archive ? (
        <span className="inline-block mb-3 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Archivé</span>
      ) : null}
      <div className="space-y-1.5 mb-4">
        {client.telephone ? (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Phone className="w-3.5 h-3.5 text-gray-400" />{client.telephone}
          </div>
        ) : null}
        {client.secteur ? (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Building2 className="w-3.5 h-3.5 text-gray-400" />{client.secteur}
          </div>
        ) : null}
      </div>
      <div className="flex gap-2 pt-3 border-t border-gray-50">
        <Link href={`/dashboard/clients/${client.id}`}
          className="flex-1 text-center text-xs font-medium text-blue-600 hover:text-blue-700 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition">
          Voir fiche
        </Link>
        {!client.archive ? (
          <Link href={`/dashboard/evaluations/new?client=${client.id}`}
            className="flex-1 text-center text-xs font-medium text-gray-600 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition flex items-center justify-center gap-1">
            <FileText className="w-3 h-3" /> Évaluer
          </Link>
        ) : null}
      </div>
    </div>
  );
}
