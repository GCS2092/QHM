import { getAnalyticsSummary } from "@/lib/api";
import type { AnalyticsSummary } from "@/lib/types";
import StatsCard from "@/components/dashboard/StatsCard";
import ScoreChart from "@/components/dashboard/ScoreChart";
import RiskTable from "@/components/dashboard/RiskTable";
import { Users, FileText, CheckCircle, TrendingUp } from "lucide-react";

export default async function AnalyticsPage() {
  const summary: AnalyticsSummary = await getAnalyticsSummary();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Analyse des donnees fiscales et tendances.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Total Clients"
          value={String(summary.totalClients)}
          change="Nombre total de clients"
          positive={true}
          icon={<Users className="w-5 h-5" />}
          color="blue"
        />
        <StatsCard
          title="Evaluations"
          value={String(summary.totalEvaluations)}
          change="Total des evaluations recueillies"
          positive={summary.totalEvaluations > 0}
          icon={<TrendingUp className="w-5 h-5" />}
          color="green"
        />
        <StatsCard
          title="Questionnaires"
          value={String(summary.totalQuestionnaires)}
          change="Questionnaires disponibles"
          positive={summary.activeQuestionnaires >= summary.inactiveQuestionnaires}
          icon={<FileText className="w-5 h-5" />}
          color="emerald"
        />
        <StatsCard
          title="Questionnaires actifs"
          value={`${summary.activeQuestionnaires} / ${summary.totalQuestionnaires}`}
          change="Actifs vs inactifs"
          positive={summary.activeQuestionnaires >= summary.inactiveQuestionnaires}
          icon={<CheckCircle className="w-5 h-5" />}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ScoreChart data={summary.scoreSeries} />
        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Performance moyenne</h3>
                <p className="text-sm text-gray-500">Score moyen sur toutes les evaluations</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">{summary.averageScore}/100</p>
                <p className="text-sm text-gray-500">{summary.conformesCount} conformes</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Conformes</p>
                <p className="mt-2 text-xl font-semibold text-gray-900">{summary.conformesCount}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Inactifs</p>
                <p className="mt-2 text-xl font-semibold text-gray-900">{summary.inactiveQuestionnaires}</p>
              </div>
            </div>
          </div>
          <RiskTable risks={summary.risks} />
        </div>
      </div>
    </div>
  );
}
