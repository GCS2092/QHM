"use client";
import StatsCard from "@/components/dashboard/StatsCard";
import ScoreChart from "@/components/dashboard/ScoreChart";
import RiskTable from "@/components/dashboard/RiskTable";
import { Users, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-sm text-gray-500 mt-1">Vue globale des evaluations fiscales</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard title="Total Clients" value="248" change="+12 ce mois" positive={true} icon={<Users className="w-5 h-5" />} color="blue" />
        <StatsCard title="Clients a risque" value="34" change="+3 cette semaine" positive={false} icon={<AlertTriangle className="w-5 h-5" />} color="red" />
        <StatsCard title="Score moyen" value="67/100" change="+4 pts vs mois dernier" positive={true} icon={<TrendingUp className="w-5 h-5" />} color="green" />
        <StatsCard title="Conformes" value="186" change="75% du total" positive={true} icon={<CheckCircle className="w-5 h-5" />} color="emerald" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ScoreChart />
        <RiskTable />
      </div>
    </div>
  );
}
