import { getQuestionnaireById } from "@/lib/api";
import QuestionnaireEditForm from "@/components/questionnaires/QuestionnaireEditForm";
import type { Questionnaire } from "@/lib/types";

type EditQuestionnairePageProps = {
  params: { id: string };
};

export default async function EditQuestionnairePage({
  params,
}: EditQuestionnairePageProps) {
  let questionnaire: Questionnaire | null = null;

  try {
    questionnaire = await getQuestionnaireById(params.id);
  } catch {
    questionnaire = null;
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

  // Charger les évaluations liées
  const hasActiveEvaluations =
    questionnaire.evaluations?.some((e) => e.statut === "en_cours") ?? false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Modifier le questionnaire
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Mettez à jour le titre, la description et l'état du questionnaire.
        </p>
      </div>
      <QuestionnaireEditForm
        questionnaire={questionnaire}
        hasActiveEvaluations={hasActiveEvaluations}
      />
    </div>
  );
}
