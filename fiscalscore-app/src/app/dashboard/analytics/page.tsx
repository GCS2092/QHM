import { getAnalyticsSummary } from "@/lib/api";

export default async function AnalyticsPage() {
  const summary = await getAnalyticsSummary();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Analyse des donnees fiscales et tendances.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Clients</p>
          <p className="mt-3 text-3xl font-semibold text-gray-900">{summary.totalClients}</p>
        </div>
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Evaluations</p>
          <p className="mt-3 text-3xl font-semibold text-gray-900">{summary.totalEvaluations}</p>
        </div>
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Questionnaires</p>
          <p className="mt-3 text-3xl font-semibold text-gray-900">{summary.totalQuestionnaires}</p>
        </div>
      </div>
      <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-10 text-center text-gray-500">
        <p className="text-lg font-medium">Graphiques et details disponibles bientot.</p>
        <p className="mt-2 text-sm">Vous pouvez maintenant recuperer les donnees depuis Strapi.</p>
      </div>
    </div>
  );
}
