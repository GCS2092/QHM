export interface UserReference {
  id: number;
  username: string;
  email?: string;
  role?: string;
}

export interface Question {
  id: number;
  texte: string;
  critere?: string;
  indicateur?: string;
  ordre?: number;
  commentaireZero?: string;
  commentaireUn?: string;
  commentaireDeux?: string;
  commentaireTrois?: string;
  questionnaire?: {
    id: number;
    titre?: string;
  };
}

export interface QuestionCustom {
  id: number;
  critere: string;
  indicateur?: string;
  texte: string;
  ordre?: number;
}

export interface Response {
  id: number;
  note: number;
  commentaireEvaluateur?: string;
  question?: Question;
  questionCustom?: QuestionCustom;
}

export interface Client {
  id: number;
  nomEntreprise: string;
  nomResponsable: string;
  email?: string;
  telephone?: string;
  secteur?: string;
  archive?: boolean;
  dateCreation?: string;
  evaluateurs?: UserReference[];
  evaluations?: Evaluation[];
}

export interface Questionnaire {
  id: number;
  titre: string;
  description?: string;
  actif?: boolean;
  type?: "planification" | "mission";
  questions?: Question[];
  evaluations?: Evaluation[];
}

export interface Evaluation {
  id: number;
  scoreFinal: number;
  scoreMaxReel: number;
  pourcentageScore: number;
  dateEvaluation: string;
  evaluateur: string;
  evaluateurUtilisateurId?: number;
  commentaireGlobal?: string;
  commentaireConclusion?: string;
  statut?: "en_cours" | "terminee";
  client?: Client;
  questionnaire?: Questionnaire;
  reponses?: Response[];
  questions_custom?: QuestionCustom[];
}

export interface AnalyticsSummary {
  totalClients: number;
  totalEvaluations: number;
  totalQuestionnaires: number;
  activeQuestionnaires: number;
  inactiveQuestionnaires: number;
  averagePourcentage: number;
  conformesCount: number;
  risks: Array<{ nom: string; pourcentage: number; alerte: string }>;
  scoreSeries: Array<{ mois: string; score: number }>;
}

export interface Assignation {
  id: number;
  clientId: number;
  evaluateurId: number;
  dateAssignation?: string;
  client?: Client;
  evaluateur?: UserReference;
}
