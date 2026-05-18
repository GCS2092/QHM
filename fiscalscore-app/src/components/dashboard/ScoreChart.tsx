"use client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type ScorePoint = { mois: string; score: number };

interface ScoreChartProps {
  data: ScorePoint[];
}

export default function ScoreChart({ data }: ScoreChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900">Evolution du score moyen</h3>
          <p className="text-xs text-gray-400 mt-0.5">Aucune donnée d'évaluation disponible</p>
        </div>
        <div className="h-56 flex items-center justify-center text-sm text-gray-500">Pas encore de scores en base</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900">Evolution du score moyen</h3>
        <p className="text-xs text-gray-400 mt-0.5">Score moyen par mois</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="mois" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
            formatter={(value) => [`${value}/100`, "Score moyen"]} />
          <Area type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2}
            fill="url(#scoreGradient)" dot={false} activeDot={{ r: 4, fill: "#2563eb" }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
