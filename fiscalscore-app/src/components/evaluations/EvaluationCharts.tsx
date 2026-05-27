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
    critere: critere.length > 20 ? `${critere.slice(0, 18)}…` : critere,
    score: Math.round((total / (count * 3)) * 100),
  }));
}

function buildBarData(evaluation: Evaluation) {
  const rows: Array<{ label: string; note: number; custom: boolean }> = [];
  evaluation.reponses?.forEach((r, i) => {
    const label = r.question?.texte ?? r.questionCustom?.texte ?? `Q${i + 1}`;
    rows.push({
      label: label.length > 25 ? `${label.slice(0, 23)}…` : label,
      note: r.note,
      custom: Boolean(r.questionCustom),
    });
  });
  return rows;
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
                <Radar dataKey="score" stroke="#2563eb" fill="#2563eb" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-500 text-center py-12">Pas de données pour le radar</p>
          )
        ) : barData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 3]} />
              <YAxis type="category" dataKey="label" width={100} tick={{ fontSize: 9 }} />
              <Tooltip />
              <Bar dataKey="note">
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
