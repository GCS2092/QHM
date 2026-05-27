import { getSeuil, seuilColorClass, type QuestionnaireType } from "@/lib/scoring";

interface ScoreBadgeProps {
  pourcentage: number;
  type?: QuestionnaireType;
  showLabel?: boolean;
}

export default function ScoreBadge({ pourcentage, type = 'planification', showLabel = true }: ScoreBadgeProps) {
  const seuil = getSeuil(pourcentage, type);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${seuilColorClass(seuil.couleur)}`}>
      <span className="font-bold">{pourcentage}%</span>
      {showLabel ? <span className="opacity-75">{seuil.label}</span> : null}
    </span>
  );
}
