"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Plus, Eye, Edit, Trash2 } from "lucide-react";
import { getQuestionnaires, deleteQuestionnaire } from "@/lib/api";
import type { Questionnaire } from "@/lib/types";

export default function QuestionnairesPage() {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    getQuestionnaires()
      .then(setQuestionnaires)
      .catch((err) => setError(err.message || "Impossible de charger les questionnaires"))
      .finally(() => setLoading(false));
  }, []);

  const availableCount = useMemo(() => questionnaires.length, [questionnaires]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce questionnaire ?")) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteQuestionnaire(id);
      setQuestionnaires((prev) => prev.filter((questionnaire) => questionnaire.id !== id));
    } catch (err: any) {
      setError(err?.message ?? "Impossible de supprimer le questionnaire");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Questionnaires</h1>
          <p className="text-sm text-gray-500 mt-1">{availableCount} questionnaires disponibles</p>
        </div>
        <Link href="/dashboard/questionnaires/new" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          <Plus className="w-4 h-4" /> Nouveau questionnaire
        </Link>
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
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">Chargement des questionnaires...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-red-600">{error}</td>
              </tr>
            ) : questionnaires.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-400">Aucun questionnaire trouve</td>
              </tr>
            ) : (
              questionnaires.map((q) => (
                <tr key={q.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-900">{q.titre ?? 'Questionnaire sans titre'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{q.questions?.length ?? 0} questions</td>
                  <td className="px-6 py-4 text-gray-600">{q.evaluations?.length ?? 0} evaluations</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${q.actif ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {q.actif ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/questionnaires/${q.id}`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition">
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link href={`/dashboard/questionnaires/${q.id}/edit`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition">
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(q.id)}
                        disabled={deletingId === q.id}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
