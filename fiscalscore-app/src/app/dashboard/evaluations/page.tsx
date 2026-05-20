"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import ScoreBadge from "@/components/ui-custom/ScoreBadge";
import { getEvaluations } from "@/lib/api";
import type { Evaluation } from "@/lib/types";

export default function EvaluationsPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getEvaluations()
      .then(setEvaluations)
      .catch((err) => setError(err.message || "Impossible de charger les evaluations"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Evaluations</h1>
          <p className="text-sm text-gray-500 mt-1">{evaluations.length} evaluations recentes</p>
        </div>
        <Link href="/dashboard/evaluations/new" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          <Plus className="w-4 h-4" /> Nouvelle evaluation
        </Link>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Client</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Questionnaire</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Score</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Date</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Evaluateur</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">Chargement des evaluations...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-red-600">{error}</td>
              </tr>
            ) : evaluations.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-400">Aucune evaluation trouvee</td>
              </tr>
            ) : (
              evaluations.filter(Boolean).map((e) => (
                <tr key={e.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {(e.client?.prenom?.[0] ?? "").toUpperCase()}{(e.client?.nom?.[0] ?? "").toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{e.client ? `${e.client.prenom} ${e.client.nom}` : "Client inconnu"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{e.questionnaire?.titre ?? "Questionnaire inconnu"}</td>
                  <td className="px-6 py-4"><ScoreBadge score={e.score ?? 0} /></td>
                  <td className="px-6 py-4 text-gray-500">{e.date}</td>
                  <td className="px-6 py-4 text-gray-600">{e.evaluateur}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
