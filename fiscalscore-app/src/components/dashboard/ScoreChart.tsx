"use client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { mois: "Jan", score: 58 }, { mois: "Fev", score: 62 }, { mois: "Mar", score: 55 },
  { mois: "Avr", score: 70 }, { mois: "Mai", score: 67 }, { mois: "Jun", score: 74 },
  { mois: "Jul", score: 71 }, { mois: "Aou", score: 78 }, { mois: "Sep", score: 73 },
  { mois: "Oct", score: 80 }, { mois: "Nov", score: 76 }, { mois: "Dec", score: 82 },
];

export default function ScoreChart() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900">Evolution du score moyen</h3>
        <p className="text-xs text-gray-400 mt-0.5">Score moyen sur 12 mois</p>
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
          <YAxis domain={[40, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
            formatter={(value) => [`${value}/100`, "Score moyen"]} />
          <Area type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2}
            fill="url(#scoreGradient)" dot={false} activeDot={{ r: 4, fill: "#2563eb" }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
