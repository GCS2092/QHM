"use client";

import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { getSeuil, noteBarColor, seuilColorClass, type QuestionnaireType } from "@/lib/scoring";
import type { Evaluation } from "@/lib/types";

function buildRadarData(evaluation: Evaluation) {
  const byCritere = new Map<string, { total: number; count: number }>();
  const add = (critere: string, note: number) => {
    if (note === 0) return;
    const key = critere || 'Autre';
    const cur = byCritere.get(key) ?? { total: 0, count: 0 };
    cur.total += note;
    cur.count += 1;
    byCritere.set(key, cur);
  };
  evaluation.reponses?.forEach((r) => {
    const critere = r.question?.critere ?? r.questionCustom?.critere ?? 'Autre';
    add(critere, r.note);
  });
  return Array.from(byCritere.entries()).map(([critere, { total, count }]) => ({
    critere: critere.length > 24 ? `${critere.slice(0, 22)}…` : critere,
    critereFull: critere,
    score: Math.round((total / (count * 3)) * 100),
  }));
}

type BarRow = {
  label: string;
  critere: string;
  indicateur: string;
  question: string;
  note: number;
  custom: boolean;
};

function buildBarData(evaluation: Evaluation): BarRow[] {
  const rows: BarRow[] = [];
  evaluation.reponses?.forEach((r, i) => {
    const q = r.question;
    const cq = r.questionCustom;
    const critere = q?.critere ?? cq?.critere ?? "—";
    const indicateur = q?.indicateur ?? cq?.indicateur ?? "—";
    const question = q?.texte ?? cq?.texte ?? `Question ${i + 1}`;
    rows.push({
      label: `Q${i + 1}${critere !== "—" ? ` · ${critere.slice(0, 16)}` : ""}${critere.length > 16 ? "…" : ""}`,
      critere,
      indicateur,
      question,
      note: r.note,
      custom: Boolean(cq),
    });
  });
  return rows;
}

function BarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: BarRow }>;
}) {
  if (!active || !payload?.[0]) return null;
  const row = payload[0].payload;
  return (
    <div className="max-w-xs rounded-lg border border-gray-200 bg-white p-3 text-xs shadow-lg">
      <p className="font-semibold text-gray-900">
        {row.critere}
        {row.custom ? " *" : ""}
      </p>
      <p className="mt-1 text-gray-600">
        <span className="font-medium">Indicateur :</span> {row.indicateur}
      </p>
      <p className="mt-1 text-gray-600">
        <span className="font-medium">Question :</span> {row.question}
      </p>
      <p className="mt-2 font-semibold text-gray-900">Note : {row.note} / 3</p>
    </div>
  );
}

export function ScoreGauge({ pourcentage, type }: { pourcentage: number; type: QuestionnaireType }) {
  const seuil = getSeuil(pourcentage, type);
  const color = seuil.couleur === 'vert' ? '#22c55e' : seuil.couleur === 'orange' ? '#f97316' : '#ef4444';
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${(pourcentage / 100) * 264} 264`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-900">{pourcentage}%</span>
        </div>
      </div>
      <span className={`mt-3 px-3 py-1 rounded-full text-sm font-medium border ${seuilColorClass(seuil.couleur)}`}>
        {seuil.label}
      </span>
    </div>
  );
}

export default function EvaluationCharts({ evaluation }: { evaluation: Evaluation }) {
  const type = evaluation.questionnaire?.type ?? 'planification';
  const radarData = buildRadarData(evaluation);
  const barData = buildBarData(evaluation);
  const barHeight = Math.max(260, barData.length * 36);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-gray-100 bg-white p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Jauge globale</h3>
        <div className="flex justify-center">
          <ScoreGauge pourcentage={evaluation.pourcentageScore} type={type} />
        </div>
        <p className="mt-4 text-sm text-gray-600 text-center">
          Score brut : {evaluation.scoreFinal} / {evaluation.scoreMaxReel}
        </p>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-5">
        <h3 className="font-semibold text-gray-900 mb-4">
          {type === 'planification' ? 'Radar par critère' : 'Barres par question'}
        </h3>
        {type === 'planification' ? (
          radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="critere" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Tooltip
                  formatter={(value) => [`${value}%`, "Score critère"]}
                  labelFormatter={(_, items) =>
                    items?.[0]?.payload?.critereFull ?? ""
                  }
                />
                <Radar dataKey="score" stroke="#2563eb" fill="#2563eb" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-500 text-center py-12">Pas de données pour le radar</p>
          )
        ) : barData.length > 0 ? (
          <ResponsiveContainer width="100%" height={barHeight}>
            <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 3]} ticks={[0, 1, 2, 3]} />
              <YAxis type="category" dataKey="label" width={140} tick={{ fontSize: 9 }} />
              <Tooltip content={<BarTooltip />} />
              <Bar dataKey="note" radius={[0, 4, 4, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={noteBarColor(entry.note)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-gray-500 text-center py-12">Pas de données</p>
        )}
      </div>
    </div>
  );
}
