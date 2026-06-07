"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { getQuestionnaireById } from "@/lib/api";
import { isAdminRole } from "@/lib/scoring";
import type { Questionnaire } from "@/lib/types";
import dynamic from "next/dynamic";
import QuestionsAdmin from "@/components/questionnaires/QuestionsAdmin";

// @react-pdf/renderer necessite un import dynamique sans SSR
const QuestionnairePdfExport = dynamic(
  () => import("@/components/questionnaires/QuestionnairePdfExport"),
  {
    ssr: false,
    loading: () => (
      <span className="text-sm text-gray-400">Préparation PDF…</span>
    ),
  },
);

export default function QuestionnaireDetailPage() {
  const params = useParams();
  const id = String(params?.id ?? "");
  const { data: session } = useSession();
  const isAdmin = isAdminRole((session?.user as { role?: string })?.role);
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    if (!id) return;
    getQuestionnaireById(id)
      .then(setQuestionnaire)
      .catch(() => setQuestionnaire(null));
  }, [id]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await reload();
      setLoading(false);
    })();
  }, [reload]);

  if (loading) return <div className="text-gray-500">Chargement...</div>;
  if (!questionnaire) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Questionnaire introuvable</h1>
      </div>
    );
  }

  const questions = questionnaire.questions ?? [];
  const typeLabel =
    questionnaire.type === "mission"
      ? "Pendant la mission"
      : "Phase de planification";
  const hasActiveEvaluations =
    questionnaire.evaluations?.some((e) => e.statut === "en_cours") ?? false;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {questionnaire.titre}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {questionnaire.description ?? "—"} · {typeLabel}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin ? (
            <Link
              href={`/dashboard/questionnaires/${questionnaire.id}/edit`}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Modifier
            </Link>
          ) : null}
          <QuestionnairePdfExport questionnaire={questionnaire} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-gray-500">
            Statut
          </p>
          <p className="mt-2 text-lg font-semibold">
            {questionnaire.actif ? "Actif" : "Inactif"}
          </p>
          <p className="mt-4 text-sm text-gray-600">
            {questions.length} question(s) de base
          </p>
          <p className="text-sm text-gray-600">
            {questionnaire.evaluations?.length ?? 0} évaluation(s)
          </p>
        </div>
        <div className="lg:col-span-2 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          {isAdmin ? (
            <QuestionsAdmin
              questionnaire={questionnaire}
              hasActiveEvaluations={hasActiveEvaluations}
              onUpdated={reload}
            />
          ) : (
            <div>
              <p className="font-semibold mb-4">Questions</p>
              {questions.length === 0 ? (
                <p className="text-sm text-gray-500">Aucune question.</p>
              ) : (
                <ul className="space-y-2">
                  {questions.map((q) => (
                    <li key={q.id} className="rounded-lg border p-3 text-sm">
                      <span className="font-medium">{q.critere}</span> —{" "}
                      {q.texte}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
