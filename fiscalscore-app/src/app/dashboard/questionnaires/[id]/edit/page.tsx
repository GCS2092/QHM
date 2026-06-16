"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { getQuestionnaireById } from "@/lib/api";
import QuestionnaireEditForm from "@/components/questionnaires/QuestionnaireEditForm";
import type { Questionnaire } from "@/lib/types";

export default function EditQuestionnairePage() {
  const params = useParams();
  const id = String(params?.id ?? "");
  const { data: session, status } = useSession();
  const token = (session?.user as { accessToken?: string })?.accessToken;
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id || !token) return;
    try {
      const data = await getQuestionnaireById(id, token);
      setQuestionnaire(data);
    } catch {
      setQuestionnaire(null);
    }
  }, [id, token]);

  useEffect(() => {
    if (status !== "authenticated" || !token) return;
    void (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [status, token, load]);

  if (loading) {
    return <div className="text-gray-500">Chargement...</div>;
  }

  if (!questionnaire) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Modifier le questionnaire
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Questionnaire introuvable ou inaccessible.
          </p>
        </div>
      </div>
    );
  }

  const hasActiveEvaluations =
    questionnaire.evaluations?.some((e) => e.statut === "en_cours") ?? false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Modifier le questionnaire
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Mettez à jour le titre, la description et l&apos;état du questionnaire.
        </p>
      </div>
      <QuestionnaireEditForm
        questionnaire={questionnaire}
        hasActiveEvaluations={hasActiveEvaluations}
      />
    </div>
  );
}
