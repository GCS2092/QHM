import Link from "next/link";
import { getQuestionnaireById } from "@/lib/api";
import type { Questionnaire } from "@/lib/types";
import QuestionnairePdfExport from "@/components/questionnaires/QuestionnairePdfExport";

type QuestionnairePageProps = {
  params: { id: string };
};

export default async function QuestionnaireDetailPage({ params }: QuestionnairePageProps) {
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
          <h1 className="text-2xl font-bold text-gray-900">Questionnaire</h1>
          <p className="text-sm text-gray-500 mt-1">Questionnaire introuvable</p>
        </div>
      </div>
    );
  }

  const questions = questionnaire.questions ?? [];
  const evaluations = questionnaire.evaluations ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{questionnaire.titre ?? 'Questionnaire sans titre'}</h1>
          <p className="text-sm text-gray-500 mt-1">{questionnaire.description ?? 'Aucune description disponible'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/dashboard/questionnaires/${questionnaire.id}/edit`} className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition">
            Modifier
          </Link>
          <QuestionnairePdfExport questionnaire={questionnaire} />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Statut</p>
          <p className="mt-2 text-lg font-semibold text-gray-900">{questionnaire.actif ? 'Actif' : 'Inactif'}</p>
          <div className="mt-8 space-y-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Questions totales</p>
              <p className="mt-2 font-medium text-gray-900">{questions.length}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Evaluations</p>
              <p className="mt-2 font-medium text-gray-900">{evaluations.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold text-gray-900 mb-4">Questions</p>
          {questions.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune question definie.</p>
          ) : (
            <ul className="space-y-3">
              {questions.map((question: any) => (
                <li key={question.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <p className="font-medium text-gray-900">{question.texte}</p>
                  <p className="text-xs text-gray-500">Coefficient: {question.coefficient}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
