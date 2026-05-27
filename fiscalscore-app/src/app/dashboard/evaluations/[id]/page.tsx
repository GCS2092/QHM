"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { getEvaluationById } from "@/lib/api";
import { getSeuil, seuilColorClass, isAdminRole } from "@/lib/scoring";
import ScoreBadge from "@/components/ui-custom/ScoreBadge";
import dynamic from "next/dynamic";
import EvaluationCharts from "@/components/evaluations/EvaluationCharts";
import EvaluationAdminFullEdit from "@/components/evaluations/EvaluationAdminFullEdit";
import { commentaireAutoForNote } from "@/lib/commentaires-auto";

const EvaluationPdfExport = dynamic(
  () => import("@/components/evaluations/EvaluationPdfExport"),
  {
    ssr: false,
    loading: () => <span className="text-xs text-gray-400">PDF…</span>,
  },
);
import type { Evaluation } from "@/lib/types";

export default function EvaluationDetailPage() {
  const params = useParams();
  const id = String(params?.id ?? "");
  const { data: session } = useSession();
  const isAdmin = isAdminRole((session?.user as { role?: string })?.role);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    if (!id) return;
    getEvaluationById(id)
      .then(setEvaluation)
      .catch(() => setEvaluation(null));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      setLoading(true);
      await reload();
      setLoading(false);
    })();
  }, [id, reload]);

  if (loading) return <div className="text-gray-500">Chargement...</div>;
  if (!evaluation) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Évaluation introuvable</h1>
        <Link
          href="/dashboard/evaluations"
          className="text-blue-600 text-sm mt-2 inline-block"
        >
          Retour
        </Link>
      </div>
    );
  }

  const type = evaluation.questionnaire?.type ?? "planification";
  const seuil = getSeuil(evaluation.pourcentageScore, type);
  const isTerminee = evaluation.statut === "terminee";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard/evaluations"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Évaluations
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            {evaluation.client?.nomEntreprise}
          </h1>
          <p className="text-sm text-gray-500">
            {evaluation.questionnaire?.titre} — {evaluation.dateEvaluation}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {evaluation.statut === "en_cours" ? (
            <Link
              href={`/dashboard/evaluations/${evaluation.id}/edit`}
              className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
            >
              Reprendre le questionnaire
            </Link>
          ) : null}
          {isAdmin && isTerminee ? (
            <Link
              href={`/dashboard/evaluations/${evaluation.id}/edit`}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Modifier (formulaire)
            </Link>
          ) : null}
          {isTerminee ? <EvaluationPdfExport evaluation={evaluation} /> : null}
        </div>
      </div>

      {isTerminee ? (
        <>
          <div
            className={`rounded-xl border p-6 ${seuilColorClass(seuil.couleur)}`}
          >
            <div className="flex flex-wrap items-center gap-4 mb-3">
              <ScoreBadge
                pourcentage={evaluation.pourcentageScore}
                type={type}
              />
              <span className="text-sm">
                Score brut : {evaluation.scoreFinal} / {evaluation.scoreMaxReel}
              </span>
            </div>
            <p className="text-sm">{seuil.commentaire}</p>
          </div>
          <EvaluationCharts evaluation={evaluation} />
        </>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 text-sm">
          Cette évaluation est en cours. Terminez-la pour voir les graphiques et
          exporter le PDF.
        </div>
      )}

      {isAdmin && isTerminee ? (
        <EvaluationAdminFullEdit evaluation={evaluation} onSaved={reload} />
      ) : null}

      {evaluation.commentaireGlobal ? (
        <div className="rounded-xl border bg-white p-5">
          <h3 className="font-semibold text-gray-900 mb-2">
            Commentaire d&apos;introduction
          </h3>
          <p className="text-sm text-gray-600">
            {evaluation.commentaireGlobal}
          </p>
        </div>
      ) : null}

      {evaluation.commentaireConclusion ? (
        <div className="rounded-xl border bg-white p-5">
          <h3 className="font-semibold text-gray-900 mb-2">
            Commentaire de conclusion
          </h3>
          <p className="text-sm text-gray-600">
            {evaluation.commentaireConclusion}
          </p>
        </div>
      ) : null}

      <div className="rounded-xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">
                Critère
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">
                Indicateur
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">
                Question
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">
                Note
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">
                Commentaire
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {evaluation.reponses?.map((r) => {
              const isCustom = Boolean(r.questionCustom);
              const q = r.question ?? r.questionCustom;
              const auto = r.question
                ? commentaireAutoForNote(r.note, r.question)
                : "";
              return (
                <tr key={r.id} className={isCustom ? "bg-blue-50/50" : ""}>
                  <td className="px-4 py-3">
                    {q?.critere}
                    {isCustom ? " *" : ""}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {q?.indicateur ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {"texte" in (q ?? {}) ? (q as { texte: string }).texte : ""}
                  </td>
                  <td className="px-4 py-3 font-medium">{r.note}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {auto ? (
                      <span className="block text-xs text-gray-500 mb-1">
                        {auto}
                      </span>
                    ) : null}
                    {r.commentaireEvaluateur ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
