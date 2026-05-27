"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import ScoreBadge from "@/components/ui-custom/ScoreBadge";
import EvaluationPdfButton from "@/components/evaluations/EvaluationPdfButton";
import { getEvaluations } from "@/lib/api";
import type { Evaluation } from "@/lib/types";

export default function EvaluationsPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getEvaluations()
      .then(setEvaluations)
      .catch((err) => setError(err.message || "Impossible de charger les évaluations"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Évaluations</h1>
          <p className="text-sm text-gray-500 mt-1">{evaluations.length} évaluations</p>
        </div>
        <Link href="/dashboard/evaluations/new" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          <Plus className="w-4 h-4" /> Nouvelle évaluation
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
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Évaluateur</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Statut</th>
              <th className="text-right px-6 py-3 text-gray-500 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-500">Chargement...</td></tr>
            ) : error ? (
              <tr><td colSpan={7} className="px-6 py-10 text-center text-red-600">{error}</td></tr>
            ) : evaluations.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-400">Aucune évaluation</td></tr>
            ) : (
              evaluations.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <Link href={`/dashboard/evaluations/${e.id}`} className="font-medium text-blue-600 hover:underline">
                      {e.client?.nomEntreprise ?? "Client inconnu"}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{e.questionnaire?.titre ?? "—"}</td>
                  <td className="px-6 py-4">
                    {e.statut === "terminee" ? (
                      <ScoreBadge pourcentage={e.pourcentageScore} type={e.questionnaire?.type} />
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{e.dateEvaluation}</td>
                  <td className="px-6 py-4 text-gray-600">{e.evaluateur}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${e.statut === "terminee" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                      {e.statut === "terminee" ? "Terminée" : "En cours"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {e.statut === "en_cours" ? (
                        <Link
                          href={`/dashboard/evaluations/${e.id}/edit`}
                          className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100"
                        >
                          <Pencil className="w-3 h-3" /> Reprendre
                        </Link>
                      ) : null}
                      <EvaluationPdfButton evaluationId={e.id} evaluation={e.statut === "terminee" ? e : undefined} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
