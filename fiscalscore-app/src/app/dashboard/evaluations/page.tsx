"use client";
import { Plus } from "lucide-react";
import ScoreBadge from "@/components/ui-custom/ScoreBadge";

const evaluations = [
  { id: 1, client: "Mamadou Diallo", questionnaire: "Conformite fiscale generale", score: 82, date: "2026-05-10", evaluateur: "Agent Kone" },
  { id: 2, client: "Fatou Ndiaye", questionnaire: "Ponctualite des declarations", score: 45, date: "2026-05-09", evaluateur: "Agent Sy" },
  { id: 3, client: "Ibrahima Sow", questionnaire: "Transparence financiere", score: 18, date: "2026-05-08", evaluateur: "Agent Kone" },
  { id: 4, client: "Aminata Ba", questionnaire: "Historique de paiement", score: 71, date: "2026-05-07", evaluateur: "Agent Diop" },
  { id: 5, client: "Omar Cisse", questionnaire: "Conformite fiscale generale", score: 35, date: "2026-05-06", evaluateur: "Agent Sy" },
];

export default function EvaluationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Evaluations</h1>
          <p className="text-sm text-gray-500 mt-1">{evaluations.length} evaluations recentes</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          <Plus className="w-4 h-4" /> Nouvelle evaluation
        </button>
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
            {evaluations.map(e => (
              <tr key={e.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {e.client.split(" ").map((n: string) => n[0]).join("").slice(0,2)}
                    </div>
                    <span className="font-medium text-gray-900">{e.client}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{e.questionnaire}</td>
                <td className="px-6 py-4"><ScoreBadge score={e.score} /></td>
                <td className="px-6 py-4 text-gray-500">{e.date}</td>
                <td className="px-6 py-4 text-gray-600">{e.evaluateur}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
