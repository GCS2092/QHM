import { strapiGet } from "@/lib/strapi";

type QuestionnairePageProps = {
  params: { id: string };
};

async function getQuestionnaire(id: string) {
  const res = await strapiGet(`/questionnaires/${id}`, { populate: '*' });
  return res.data;
}

export default async function QuestionnaireDetailPage({ params }: QuestionnairePageProps) {
  let questionnaire: any;
  try {
    questionnaire = await getQuestionnaire(params.id);
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

  const attrs = questionnaire.attributes;
  const questions = attrs.questions?.data || [];
  const evaluations = attrs.evaluations?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{attrs.titre}</h1>
        <p className="text-sm text-gray-500 mt-1">{attrs.description ?? 'Aucune description disponible'}</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Statut</p>
          <p className="mt-2 text-lg font-semibold text-gray-900">{attrs.actif ? 'Actif' : 'Inactif'}</p>
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
                  <p className="font-medium text-gray-900">{question.attributes?.texte ?? question.texte}</p>
                  <p className="text-xs text-gray-500">Coefficient: {question.attributes?.coefficient ?? question.coefficient}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
