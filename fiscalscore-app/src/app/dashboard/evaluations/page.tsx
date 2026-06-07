"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, ChevronUp, ChevronDown } from "lucide-react";
import ScoreBadge from "@/components/ui-custom/ScoreBadge";
import EvaluationPdfButton from "@/components/evaluations/EvaluationPdfButton";
import { getEvaluations } from "@/lib/api";
import type { Evaluation } from "@/lib/types";

type SortBy = "client" | "date" | "score";
type SortOrder = "asc" | "desc";
type FilterStatus = "tous" | "en_cours" | "terminee";

export default function EvaluationsPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("tous");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    getEvaluations()
      .then(setEvaluations)
      .catch((err) =>
        setError(err.message || "Impossible de charger les évaluations"),
      )
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      evaluations.filter((e) => {
        if (filterStatus === "tous") return true;
        return e.statut === filterStatus;
      }),
    [evaluations, filterStatus],
  );

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";

      if (sortBy === "client") {
        aVal = a.client?.nomEntreprise ?? "";
        bVal = b.client?.nomEntreprise ?? "";
      } else if (sortBy === "date") {
        aVal = a.dateEvaluation ?? "";
        bVal = b.dateEvaluation ?? "";
      } else if (sortBy === "score") {
        aVal = a.pourcentageScore ?? 0;
        bVal = b.pourcentageScore ?? 0;
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }

      const result = String(aVal).localeCompare(String(bVal));
      return sortOrder === "asc" ? result : -result;
    });
    return copy;
  }, [filtered, sortBy, sortOrder]);

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const startIdx = (page - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedData = sorted.slice(startIdx, endIdx);

  const handlePageChange = (newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Évaluations</h1>
          <p className="text-sm text-gray-500 mt-1">
            {evaluations.length} évaluations
          </p>
        </div>
        <Link
          href="/dashboard/evaluations/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" /> Nouvelle évaluation
        </Link>
      </div>

      {/* Toolbar avec tri, filtre et pagination */}
      <div className="flex items-center justify-between bg-white border border-gray-100 rounded-lg p-4 flex-wrap gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Tri */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as SortBy);
              setPage(1);
            }}
            className="border border-gray-200 px-3 py-1.5 rounded text-sm text-gray-700 bg-white hover:bg-gray-50"
          >
            <option value="date">Date</option>
            <option value="client">Client</option>
            <option value="score">Score</option>
          </select>

          {/* Ordre */}
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="border border-gray-200 px-2 py-1.5 rounded text-sm text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-1"
          >
            {sortOrder === "asc" ? (
              <>
                <ChevronUp className="w-4 h-4" /> Asc
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" /> Desc
              </>
            )}
          </button>

          {/* Filtre statut */}
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value as FilterStatus);
              setPage(1);
            }}
            className="border border-gray-200 px-3 py-1.5 rounded text-sm text-gray-700 bg-white hover:bg-gray-50"
          >
            <option value="tous">Tous</option>
            <option value="en_cours">En cours</option>
            <option value="terminee">Terminée</option>
          </select>

          {/* Items par page */}
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setPage(1);
            }}
            className="border border-gray-200 px-3 py-1.5 rounded text-sm text-gray-700 bg-white hover:bg-gray-50"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
        </div>

        {/* Pagination info */}
        <div className="text-sm text-gray-600 flex items-center gap-4">
          {sorted.length > 0 && (
            <span>
              Affichage {startIdx + 1}-{Math.min(endIdx, sorted.length)} de{" "}
              {sorted.length}
            </span>
          )}
          <span className="font-medium">
            Page {page} de {totalPages || 1}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">
                Client
              </th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">
                Questionnaire
              </th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">
                Score
              </th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">
                Date
              </th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">
                Évaluateur
              </th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">
                Statut
              </th>
              <th className="text-right px-6 py-3 text-gray-500 font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-10 text-center text-gray-500"
                >
                  Chargement...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-red-600">
                  {error}
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-10 text-center text-gray-400"
                >
                  Aucune évaluation
                </td>
              </tr>
            ) : (
              paginatedData.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <Link
                      href={`/dashboard/evaluations/${e.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {e.client?.nomEntreprise ?? "Client inconnu"}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {e.questionnaire?.titre ?? "—"}
                  </td>
                  <td className="px-6 py-4">
                    {e.statut === "terminee" ? (
                      <ScoreBadge
                        pourcentage={e.pourcentageScore}
                        type={e.questionnaire?.type}
                      />
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {e.dateEvaluation}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{e.evaluateur}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${e.statut === "terminee" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}
                    >
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
                      <EvaluationPdfButton
                        evaluationId={e.id}
                        evaluation={e.statut === "terminee" ? e : undefined}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Boutons de pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Précédent
          </button>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
}
