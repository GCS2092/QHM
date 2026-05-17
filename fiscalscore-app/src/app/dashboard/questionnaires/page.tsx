"use client";
import { FileText, Plus, Eye, Edit } from "lucide-react";

const questionnaires = [
  { id: 1, titre: "Conformite fiscale generale", questions: 12, evaluations: 48, actif: true },
  { id: 2, titre: "Ponctualite des declarations", questions: 8, evaluations: 32, actif: true },
  { id: 3, titre: "Transparence financiere", questions: 15, evaluations: 20, actif: false },
  { id: 4, titre: "Historique de paiement", questions: 10, evaluations: 56, actif: true },
];

export default function QuestionnairesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Questionnaires</h1>
          <p className="text-sm text-gray-500 mt-1">{questionnaires.length} questionnaires disponibles</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          <Plus className="w-4 h-4" /> Nouveau questionnaire
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Titre</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Questions</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Evaluations</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Statut</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {questionnaires.map(q => (
              <tr key={q.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-medium text-gray-900">{q.titre}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{q.questions} questions</td>
                <td className="px-6 py-4 text-gray-600">{q.evaluations} evaluations</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${q.actif ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {q.actif ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"><Eye className="w-4 h-4" /></button>
                    <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition"><Edit className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
