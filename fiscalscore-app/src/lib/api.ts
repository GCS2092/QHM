import { strapiGet, strapiPost } from './strapi';
import type { Client, Evaluation, Questionnaire, Question } from './types';

function normalizeClient(item: any): Client {
  return {
    id: item.id,
    ...item.attributes,
  };
}

function normalizeQuestionnaire(item: any): Questionnaire {
  const attrs = item.attributes;
  return {
    id: item.id,
    titre: attrs.titre,
    description: attrs.description,
    actif: attrs.actif,
    questions: attrs.questions?.data?.map((question: any) => ({
      id: question.id,
      ...question.attributes,
    })),
    evaluations: attrs.evaluations?.data?.map((evaluation: any) => ({
      id: evaluation.id,
      ...evaluation.attributes,
    })),
  };
}

function normalizeEvaluation(item: any): Evaluation {
  const attrs = item.attributes;
  return {
    id: item.id,
    score: attrs.score,
    date: attrs.date,
    evaluateur: attrs.evaluateur,
    commentaire: attrs.commentaire,
    client: attrs.client?.data ? normalizeClient(attrs.client.data) : undefined,
    questionnaire: attrs.questionnaire?.data ? normalizeQuestionnaire(attrs.questionnaire.data) : undefined,
  };
}

export async function getClients(): Promise<Client[]> {
  const res = await strapiGet('/clients', { populate: '*', sort: 'nom:asc' });
  return (res.data || []).map(normalizeClient);
}

export async function getClientById(id: string): Promise<Client & { evaluations?: Evaluation[] }> {
  const res = await strapiGet(`/clients/${id}`, { populate: '*' });
  const client = normalizeClient({ id: res.data.id, attributes: res.data.attributes });
  return {
    ...client,
    evaluations: res.data.attributes.evaluations?.data?.map(normalizeEvaluation),
  };
}

export async function getQuestionnaires(): Promise<Questionnaire[]> {
  const res = await strapiGet('/questionnaires', { populate: '*', sort: 'titre:asc' });
  return (res.data || []).map(normalizeQuestionnaire);
}

export async function getQuestionnaireById(id: string): Promise<Questionnaire> {
  const res = await strapiGet(`/questionnaires/${id}`, { populate: '*' });
  return normalizeQuestionnaire({ id: res.data.id, attributes: res.data.attributes });
}

export async function getEvaluations(): Promise<Evaluation[]> {
  const res = await strapiGet('/evaluations', { populate: '*', sort: 'date:desc' });
  return (res.data || []).map(normalizeEvaluation);
}

export async function getAnalyticsSummary() {
  const [clientsRes, evaluationsRes, questionnairesRes] = await Promise.all([
    strapiGet('/clients', { fields: 'id' }),
    strapiGet('/evaluations', { fields: 'id' }),
    strapiGet('/questionnaires', { fields: 'id' }),
  ]);

  return {
    totalClients: clientsRes.data?.length ?? 0,
    totalEvaluations: evaluationsRes.data?.length ?? 0,
    totalQuestionnaires: questionnairesRes.data?.length ?? 0,
  };
}

export async function getDashboardSummary() {
  const [clientsRes, evaluationsRes, questionnairesRes] = await Promise.all([
    strapiGet('/clients', { fields: 'id' }),
    strapiGet('/evaluations', { populate: 'client', sort: 'date:desc' }),
    strapiGet('/questionnaires', { fields: 'id' }),
  ]);

  const evaluations = evaluationsRes.data || [];
  const scores: number[] = evaluations.map((item: any) => Number(item.attributes.score ?? 0));
  const averageScore = scores.length > 0 ? Math.round(scores.reduce((acc: number, score: number) => acc + score, 0) / scores.length) : 0;
  const conformesCount = scores.filter((score: number) => score >= 80).length;

  const riskMap = new Map<number, { nom: string; score: number; alerte: string }>();
  const monthlyStats = new Map<string, { label: string; total: number; count: number }>();
  const formatter = new Intl.DateTimeFormat('fr-FR', { month: 'short' });

  evaluations.forEach((item: any) => {
    const score = Number(item.attributes.score ?? 0);
    const client = item.attributes.client?.data;
    if (client?.id != null && score <= 40 && !riskMap.has(client.id)) {
      const nom = [client.attributes.nom, client.attributes.prenom].filter(Boolean).join(' ');
      const alerte = score <= 20 ? 'Critique' : 'Risque eleve';
      riskMap.set(client.id, { nom: nom || 'Client inconnu', score, alerte });
    }

    const date = item.attributes.date ? new Date(item.attributes.date) : null;
    if (date instanceof Date && !Number.isNaN(date.getTime())) {
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const label = `${formatter.format(date)} ${date.getFullYear().toString().slice(-2)}`;
      const current = monthlyStats.get(key) ?? { label, total: 0, count: 0 };
      current.total += score;
      current.count += 1;
      monthlyStats.set(key, current);
    }
  });

  const scoreSeries = Array.from(monthlyStats.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, item]) => ({ mois: item.label, score: Math.round(item.total / item.count) }));

  return {
    totalClients: clientsRes.data?.length ?? 0,
    totalEvaluations: evaluations.length,
    totalQuestionnaires: questionnairesRes.data?.length ?? 0,
    averageScore,
    conformesCount,
    risks: Array.from(riskMap.values()).slice(0, 5),
    scoreSeries,
  };
}

export async function createClient(data: {
  nom: string;
  prenom: string;
  identifiantFiscal: string;
  email?: string;
  telephone?: string;
  score?: number;
  statut?: string;
}) {
  return strapiPost('/clients', data);
}

export async function createQuestionnaire(data: {
  titre: string;
  description?: string;
  actif?: boolean;
}) {
  return strapiPost('/questionnaires', data);
}

export async function createEvaluation(data: {
  client: number;
  questionnaire: number;
  score: number;
  date: string;
  evaluateur: string;
  commentaire?: string;
}) {
  return strapiPost('/evaluations', data);
}