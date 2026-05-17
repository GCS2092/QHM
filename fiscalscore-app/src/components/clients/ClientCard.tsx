import Link from "next/link";
import ScoreBadge from "@/components/ui-custom/ScoreBadge";
import { Phone, FileText } from "lucide-react";

interface Client { id: number; nom: string; prenom: string; identifiantFiscal: string; score: number; telephone: string; }

export default function ClientCard({ client }: { client: Client }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
          {client.prenom[0]}{client.nom[0]}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{client.prenom} {client.nom}</p>
          <p className="text-xs text-gray-400 font-mono">{client.identifiantFiscal}</p>
        </div>
      </div>
      <div className="mb-4"><ScoreBadge score={client.score} /></div>
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Phone className="w-3.5 h-3.5 text-gray-400" />{client.telephone}
        </div>
      </div>
      <div className="flex gap-2 pt-3 border-t border-gray-50">
        <Link href={`/dashboard/clients/${client.id}`}
          className="flex-1 text-center text-xs font-medium text-blue-600 hover:text-blue-700 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition">
          Voir fiche
        </Link>
        <Link href={`/dashboard/evaluations/new?client=${client.id}`}
          className="flex-1 text-center text-xs font-medium text-gray-600 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition flex items-center justify-center gap-1">
          <FileText className="w-3 h-3" /> Evaluer
        </Link>
      </div>
    </div>
  );
}
