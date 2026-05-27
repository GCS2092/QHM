import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAnalyticsSummary } from "@/lib/api";
import type { AnalyticsSummary } from "@/lib/types";
import StatsCard from "@/components/dashboard/StatsCard";
import ScoreChart from "@/components/dashboard/ScoreChart";
import RiskTable from "@/components/dashboard/RiskTable";
import {
  Users,
  FileText,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

interface SessionUser {
  accessToken?: string;
}

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  const token = (session?.user as SessionUser | undefined)?.accessToken;

  let summary: AnalyticsSummary;
  try {
    summary = await getAnalyticsSummary(token);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-800">
          Impossible de charger les analytics
        </h2>
        <details className="text-xs text-gray-400 max-w-lg">
          <summary className="cursor-pointer">Détail de l&apos;erreur</summary>
          <pre className="mt-2 whitespace-pre-wrap break-all bg-gray-50 p-2 rounded">
            {message}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">
          Analyse des évaluations comportementales et tendances.
        </p>
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
          positive={
            summary.activeQuestionnaires >= summary.inactiveQuestionnaires
          }
          icon={<FileText className="w-5 h-5" />}
          color="emerald"
        />
        <StatsCard
          title="Questionnaires actifs"
          value={`${summary.activeQuestionnaires} / ${summary.totalQuestionnaires}`}
          change="Actifs vs inactifs"
          positive={
            summary.activeQuestionnaires >= summary.inactiveQuestionnaires
          }
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
                <h3 className="text-lg font-semibold text-gray-900">
                  Performance moyenne
                </h3>
                <p className="text-sm text-gray-500">
                  Score moyen sur toutes les evaluations
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">
                  {summary.averagePourcentage}%
                </p>
                <p className="text-sm text-gray-500">
                  {summary.conformesCount} conformes
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                  Conformes
                </p>
                <p className="mt-2 text-xl font-semibold text-gray-900">
                  {summary.conformesCount}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                  Inactifs
                </p>
                <p className="mt-2 text-xl font-semibold text-gray-900">
                  {summary.inactiveQuestionnaires}
                </p>
              </div>
            </div>
          </div>
          <RiskTable risks={summary.risks} />
        </div>
      </div>
    </div>
  );
}
