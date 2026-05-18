import { getDashboardSummary } from "@/lib/api";
import StatsCard from "@/components/dashboard/StatsCard";
import ScoreChart from "@/components/dashboard/ScoreChart";
import RiskTable from "@/components/dashboard/RiskTable";
import { Users, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";

export default async function DashboardPage() {
  const summary = await getDashboardSummary();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-sm text-gray-500 mt-1">Vue globale des evaluations fiscales</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard title="Total Clients" value={String(summary.totalClients)} change="Nombre total de clients" positive={true} icon={<Users className="w-5 h-5" />} color="blue" />
        <StatsCard title="Clients à risque" value={String(summary.risks.length)} change="Basé sur les evaluations faibles" positive={false} icon={<AlertTriangle className="w-5 h-5" />} color="red" />
        <StatsCard title="Score moyen" value={`${summary.averageScore}/100`} change="Moyenne calculée sur toutes les evaluations" positive={summary.averageScore >= 60} icon={<TrendingUp className="w-5 h-5" />} color="green" />
        <StatsCard title="Conformes" value={String(summary.conformesCount)} change="Evaluations supérieures à 80" positive={true} icon={<CheckCircle className="w-5 h-5" />} color="emerald" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ScoreChart data={summary.scoreSeries} />
        <RiskTable risks={summary.risks} />
      </div>
    </div>
  );
}
