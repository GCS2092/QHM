interface ScoreBadgeProps { score: number; }

function getScoreConfig(score: number) {
  if (score <= 20) return { label: "Critique", className: "bg-red-100 text-red-700" };
  if (score <= 40) return { label: "Risque eleve", className: "bg-orange-100 text-orange-700" };
  if (score <= 60) return { label: "Moyen", className: "bg-yellow-100 text-yellow-700" };
  if (score <= 80) return { label: "Bon", className: "bg-blue-100 text-blue-700" };
  return { label: "Excellent", className: "bg-green-100 text-green-700" };
}

export default function ScoreBadge({ score }: ScoreBadgeProps) {
  const config = getScoreConfig(score);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.className}`}>
      <span className="font-bold">{score}</span>
      <span className="opacity-75"> {config.label}</span>
    </span>
  );
}
