export type QuestionnaireType = 'planification' | 'mission';

export type SeuilCouleur = 'vert' | 'orange' | 'rouge';

export interface ScoreResult {
  scoreObtained: number;
  scoreMaxReel: number;
  pourcentage: number;
}

export interface SeuilResult {
  couleur: SeuilCouleur;
  commentaire: string;
  label: string;
}

const SEUILS_PLANIFICATION = {
  vertMin: 86,
  orangeMin: 57,
  commentaires: {
    vert: 'Comportement très favorable à une mission fluide. Pas de mesures particulières à prévoir.',
    orange: 'Risques comportementaux modérés. Renforcer les points de suivi, prévoir des rappels et maintenir un dialogue ouvert.',
    rouge: "Risques comportementaux élevés. Adapter la stratégie d'audit : tests étendus, vérifications renforcées, formalisations accrues des échanges, implication du superviseur.",
  },
} as const;

const SEUILS_MISSION = {
  vertMin: 80,
  orangeMin: 60,
  commentaires: {
    vert: 'Comportement très coopératif et favorable au bon déroulement de la mission. Échanges fluides, informations accessibles, risques comportementaux faibles.',
    orange: 'Risques comportementaux modérés. Certaines difficultés peuvent apparaître (retards, imprécisions, tensions ponctuelles). Renforcer le suivi des demandes, formaliser davantage les échanges, maintenir une communication régulière.',
    rouge: 'Risques comportementaux élevés. Le comportement observé peut affecter la qualité des travaux d\'audit (réticence, incohérences, manque de transparence, blocages). Adapter la stratégie : augmentation des contrôles, extension des tests, supervision renforcée, demandes écrites systématiques, implication du manager ou superviseur.',
  },
} as const;

/** Notes 0 exclues ; score max réel = nb questions notées 1–3 × 3 */
export function computeScoreFromNotes(notes: number[]): ScoreResult {
  const filtered = notes.filter((n) => n > 0);
  const scoreObtained = filtered.reduce((a, b) => a + b, 0);
  const scoreMaxReel = filtered.length * 3;
  const pourcentage = scoreMaxReel > 0 ? Math.round((scoreObtained / scoreMaxReel) * 100) : 0;
  return { scoreObtained, scoreMaxReel, pourcentage };
}

export function getSeuil(pourcentage: number, type: QuestionnaireType = 'planification'): SeuilResult {
  const config = type === 'mission' ? SEUILS_MISSION : SEUILS_PLANIFICATION;
  if (pourcentage >= config.vertMin) {
    return { couleur: 'vert', label: 'Très favorable', commentaire: config.commentaires.vert };
  }
  if (pourcentage >= config.orangeMin) {
    return { couleur: 'orange', label: 'Risque modéré', commentaire: config.commentaires.orange };
  }
  return { couleur: 'rouge', label: 'Risque élevé', commentaire: config.commentaires.rouge };
}

export function seuilColorClass(couleur: SeuilCouleur): string {
  if (couleur === 'vert') return 'bg-green-100 text-green-800 border-green-200';
  if (couleur === 'orange') return 'bg-orange-100 text-orange-800 border-orange-200';
  return 'bg-red-100 text-red-800 border-red-200';
}

export function noteBarColor(note: number): string {
  if (note <= 1) return '#ef4444';
  if (note === 2) return '#f97316';
  return '#22c55e';
}

export function formatEvaluationPdfName(nomEntreprise: string, type: QuestionnaireType, date: string): string {
  const typeLabel = type === 'planification' ? 'Planification' : 'Mission';
  const safeName = nomEntreprise.replace(/[^\w\-]+/g, '_').slice(0, 40);
  const safeDate = date.slice(0, 10);
  return `${safeName}_${typeLabel}_${safeDate}.pdf`;
}

export function isAdminRole(role?: string | null): boolean {
  if (!role) return false;
  const r = role.toLowerCase();
  return r === 'administrator' || r === 'admin';
}

export function isEvaluatorRole(role?: string | null): boolean {
  if (!role) return true;
  const r = role.toLowerCase();
  return r === 'evaluateur' || r === 'authenticated' || r === 'evaluator';
}

export function isEvaluatorOnly(role?: string | null): boolean {
  return Boolean(role) && !isAdminRole(role);
}
