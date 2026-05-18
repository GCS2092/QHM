export interface Client {
  id: number;
  nom: string;
  prenom: string;
  identifiantFiscal: string;
  email?: string;
  telephone: string;
  score: number;
  statut?: string;
  evaluations?: Evaluation[];
}

export interface Questionnaire {
  id: number;
  titre: string;
  description?: string;
  actif?: boolean;
  questions?: Question[];
  evaluations?: Evaluation[];
}

export interface Evaluation {
  id: number;
  score: number;
  date: string;
  evaluateur: string;
  commentaire?: string;
  client?: Client;
  questionnaire?: Questionnaire;
}

export interface Question {
  id: number;
  texte: string;
  coefficient: number;
  questionnaire?: {
    id: number;
    titre?: string;
  };
}
