import { strapiGet, strapiPost, strapiPut, strapiDelete } from './strapi';
import type { AnalyticsSummary, Client, Evaluation, Questionnaire } from './types';

function normalizeClient(item: any): Client {
  return {
    id: item?.id ?? 0,
    nom: item?.nom ?? "",
    prenom: item?.prenom ?? "",
    identifiantFiscal: item?.identifiantFiscal ?? "",
    email: item?.email,
    telephone: item?.telephone ?? "",
    score: Number(item?.score ?? 0),
    statut: item?.statut,
  };
}

function normalizeQuestionnaire(item: any): Questionnaire {
  return {
    id: Number(item?.id ?? 0),
    titre: item?.titre?.trim() ? item.titre : "Questionnaire sans titre",
    description: item?.description,
    actif: Boolean(item?.actif),
    questions: Array.isArray(item?.questions)
      ? item.questions.filter(Boolean)
      : [],
    evaluations: Array.isArray(item?.evaluations)
      ? item.evaluations.filter(Boolean)
      : [],
  };
}

function normalizeEvaluation(item: any): Evaluation {
  return {
    id: item?.id ?? 0,
    score: Number(item?.score ?? 0),
    date: item?.date ?? "",
    evaluateur: item?.evaluateur ?? "",
    commentaire: item?.commentaire,
    client: item?.client ? normalizeClient(item.client) : undefined,
    questionnaire: item?.questionnaire ? normalizeQuestionnaire(item.questionnaire) : undefined,
  };
}

export async function getClients(): Promise<Client[]> {
  const res = await strapiGet('/clients', { populate: '*', sort: 'nom:asc' });
  const rawData = Array.isArray(res.data) ? res.data.filter(Boolean) : [];
  return rawData.map(normalizeClient);
}

export async function getClientById(id: string): Promise<(Client & { evaluations?: Evaluation[] }) | null> {
  const res = await strapiGet(`/clients/${id}`, { populate: '*' });
  if (!res?.data) return null;

  const client = normalizeClient(res.data);
  return {
    ...client,
    evaluations: Array.isArray(res.data.evaluations)
      ? res.data.evaluations.filter(Boolean).map(normalizeEvaluation)
      : [],
  };
}

export async function getQuestionnaires(): Promise<Questionnaire[]> {
  const res = await strapiGet('/questionnaires', { populate: '*', sort: 'titre:asc' });
  const rawData = Array.isArray(res.data) ? res.data.filter(Boolean) : [];
  return rawData.map(normalizeQuestionnaire);
}

export async function getQuestionnaireById(id: string): Promise<Questionnaire> {
  const res = await strapiGet(`/questionnaires/${id}`, { populate: '*' });
  return normalizeQuestionnaire(res?.data ?? {});
}

export async function updateQuestionnaire(id: string, data: { titre: string; description?: string; actif?: boolean }) {
  return strapiPut(`/questionnaires/${id}`, data);
}

export async function deleteQuestionnaire(id: number) {
  return strapiDelete(`/questionnaires/${id}`);
}

export async function getEvaluations(): Promise<Evaluation[]> {
  const res = await strapiGet('/evaluations', { populate: '*', sort: 'date:desc' });
  const rawData = Array.isArray(res.data) ? res.data.filter(Boolean) : [];
  return rawData.map(normalizeEvaluation);
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const [clientsRes, evaluationsRes, questionnairesRes] = await Promise.all([
    strapiGet('/clients', { fields: 'id' }),
    strapiGet('/evaluations', { 'populate[0]': 'client', 'populate[1]': 'questionnaire', sort: 'date:desc' }),
    strapiGet('/questionnaires', { 'fields[0]': 'id', 'fields[1]': 'actif' }),
  ]);

  const evaluations = Array.isArray(evaluationsRes.data) ? evaluationsRes.data.filter(Boolean) : [];
  const clientsCount = clientsRes.data?.length ?? 0;
  const questionnaires = Array.isArray(questionnairesRes.data) ? questionnairesRes.data.filter(Boolean) : [];
  const activeQuestionnaires = questionnaires.filter((item: any) => item?.actif).length;
  const inactiveQuestionnaires = questionnaires.length - activeQuestionnaires;

  const scores: number[] = evaluations.map((item: any) => Number(item?.score ?? 0));
  const averageScore = scores.length > 0 ? Math.round(scores.reduce((acc, score) => acc + score, 0) / scores.length) : 0;
  const conformesCount = scores.filter((score) => score >= 80).length;

  const riskMap = new Map<number, { nom: string; score: number; alerte: string }>();
  const monthlyStats = new Map<string, { label: string; total: number; count: number }>();
  const formatter = new Intl.DateTimeFormat('fr-FR', { month: 'short' });

  evaluations.forEach((item: any) => {
    const score = Number(item?.score ?? 0);
    const client = item?.client;
    if (client?.id != null && score <= 50 && !riskMap.has(client.id)) {
      const nom = [client.nom, client.prenom].filter(Boolean).join(' ');
      const alerte = score <= 20 ? 'Critique' : score <= 40 ? 'Risque eleve' : 'Risque modere';
      riskMap.set(client.id, { nom: nom || 'Client inconnu', score, alerte });
    }

    const date = item?.date ? new Date(item.date) : null;
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
    totalClients: clientsCount,
    totalEvaluations: evaluations.length,
    totalQuestionnaires: questionnaires.length,
    activeQuestionnaires,
    inactiveQuestionnaires,
    averageScore,
    conformesCount,
    risks: Array.from(riskMap.values()).slice(0, 5),
    scoreSeries,
  };
}

export async function getDashboardSummary() {
  const [clientsRes, evaluationsRes, questionnairesRes] = await Promise.all([
    strapiGet('/clients', { fields: 'id' }),
    strapiGet('/evaluations', { populate: 'client', sort: 'date:desc' }),
    strapiGet('/questionnaires', { fields: 'id' }),
  ]);

  const evaluations = Array.isArray(evaluationsRes.data) ? evaluationsRes.data.filter(Boolean) : [];
  const scores: number[] = evaluations.map((item: any) => Number(item?.score ?? 0));
  const averageScore = scores.length > 0 ? Math.round(scores.reduce((acc: number, score: number) => acc + score, 0) / scores.length) : 0;
  const conformesCount = scores.filter((score: number) => score >= 80).length;

  const riskMap = new Map<number, { nom: string; score: number; alerte: string }>();
  const monthlyStats = new Map<string, { label: string; total: number; count: number }>();
  const formatter = new Intl.DateTimeFormat('fr-FR', { month: 'short' });

  evaluations.forEach((item: any) => {
    const score = Number(item?.score ?? 0);
    const client = item?.client;
    if (client?.id != null && score <= 40 && !riskMap.has(client.id)) {
      const nom = [client.nom, client.prenom].filter(Boolean).join(' ');
      const alerte = score <= 20 ? 'Critique' : 'Risque eleve';
      riskMap.set(client.id, { nom: nom || 'Client inconnu', score, alerte });
    }

    const date = item?.date ? new Date(item.date) : null;
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
  // ✅ Strapi v5 : relations avec "connect"
  return strapiPost('/evaluations', {
    ...data,
    client: { connect: [data.client] },
    questionnaire: { connect: [data.questionnaire] },
  });
}