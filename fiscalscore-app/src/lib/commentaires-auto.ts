import type { Question } from './types';

/** Libellés officiels du CDC (section 4 — définition des notes) */
export const COMMENTAIRES_CDC_DEFAUT = {
  zero: 'Comportement non observé / Sans objet — exclu du calcul du score.',
  un: 'Comportement préoccupant.',
  deux: 'Comportement neutre à plutôt collaboratif.',
  trois: 'Comportement très collaboratif et professionnel.',
} as const;

export function commentaireAutoForNote(note: number | null, question?: Pick<Question, 'commentaireZero' | 'commentaireUn' | 'commentaireDeux' | 'commentaireTrois'>): string {
  if (note === null) return '';
  if (note === 0) return question?.commentaireZero?.trim() || COMMENTAIRES_CDC_DEFAUT.zero;
  if (note === 1) return question?.commentaireUn?.trim() || COMMENTAIRES_CDC_DEFAUT.un;
  if (note === 2) return question?.commentaireDeux?.trim() || COMMENTAIRES_CDC_DEFAUT.deux;
  if (note === 3) return question?.commentaireTrois?.trim() || COMMENTAIRES_CDC_DEFAUT.trois;
  return '';
}
