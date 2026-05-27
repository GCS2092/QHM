import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAnalyticsSummary } from "@/lib/api";
import StatsCard from "@/components/dashboard/StatsCard";
import ScoreChart from "@/components/dashboard/ScoreChart";
import RiskTable from "@/components/dashboard/RiskTable";
import { Users, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";

interface SessionUser {
  accessToken?: string;
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const token = (session?.user as SessionUser | undefined)?.accessToken;

  let summary;
  try {
    summary = await getAnalyticsSummary(token);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-semibold text-gray-800">
          Impossible de charger le tableau de bord
        </h2>
        <p className="text-sm text-gray-500 max-w-md text-center">
          Le serveur Strapi est inaccessible. Assurez-vous qu&apos;il est bien
          démarré sur{" "}
          <code className="font-mono bg-gray-100 px-1 rounded">
            http://localhost:1337
          </code>
          .
        </p>
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
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-sm text-gray-500 mt-1">
          Vue globale des évaluations comportementales
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
          title="Clients à risque"
          value={String(summary.risks.length)}
          change="Basé sur les evaluations faibles"
          positive={false}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="red"
        />
        <StatsCard
          title="Score moyen"
          value={`${summary.averagePourcentage}%`}
          change="Pourcentage moyen sur toutes les évaluations"
          positive={summary.averagePourcentage >= 60}
          icon={<TrendingUp className="w-5 h-5" />}
          color="green"
        />
        <StatsCard
          title="Très favorables"
          value={String(summary.conformesCount)}
          change="Évaluations au seuil vert"
          positive={true}
          icon={<CheckCircle className="w-5 h-5" />}
          color="emerald"
        />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ScoreChart data={summary.scoreSeries} />
        <RiskTable risks={summary.risks} />
      </div>
    </div>
  );
}
