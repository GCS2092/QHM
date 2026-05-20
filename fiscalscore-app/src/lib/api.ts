import { strapiGet, strapiPost, strapiPut, strapiDelete } from './strapi';
import type { AnalyticsSummary, Client, Evaluation, Questionnaire, Question } from './types';

function normalizeClient(item: any): Client {
  const attrs = item?.attributes ?? {};
  return {
    id: item?.id ?? 0,
    nom: attrs.nom ?? "",
    prenom: attrs.prenom ?? "",
    identifiantFiscal: attrs.identifiantFiscal ?? "",
    email: attrs.email,
    telephone: attrs.telephone ?? "",
    score: Number(attrs.score ?? 0),
    statut: attrs.statut,
  };
}

function normalizeQuestionnaire(item: any): Questionnaire {
  const attrs = item?.attributes ?? {};
  return {
    id: Number(item?.id ?? item?.attributes?.id ?? 0),
    titre: attrs.titre?.trim() ? attrs.titre : "Questionnaire sans titre",
    description: attrs.description,
    actif: Boolean(attrs.actif),
    questions: Array.isArray(attrs.questions?.data)
      ? attrs.questions.data.filter(Boolean).map((question: any) => ({
          id: question.id,
          ...question.attributes,
        }))
      : [],
    evaluations: Array.isArray(attrs.evaluations?.data)
      ? attrs.evaluations.data.filter(Boolean).map((evaluation: any) => ({
          id: evaluation.id,
          ...evaluation.attributes,
        }))
      : [],
  };
}

function normalizeEvaluation(item: any): Evaluation {
  const attrs = item?.attributes ?? {};
  return {
    id: item?.id ?? 0,
    score: Number(attrs.score ?? 0),
    date: attrs.date ?? "",
    evaluateur: attrs.evaluateur ?? "",
    commentaire: attrs.commentaire,
    client: attrs.client?.data ? normalizeClient(attrs.client.data) : undefined,
    questionnaire: attrs.questionnaire?.data ? normalizeQuestionnaire(attrs.questionnaire.data) : undefined,
  };
}

export async function getClients(): Promise<Client[]> {
  const res = await strapiGet('/clients', { populate: '*', sort: 'nom:asc' });
  const rawData = Array.isArray(res.data) ? res.data.filter(Boolean) : [];
  return rawData.map(normalizeClient);
}

export async function getClientById(id: string): Promise<(Client & { evaluations?: Evaluation[] }) | null> {
  const res = await strapiGet(`/clients/${id}`, { populate: '*' });
  if (!res?.data) {
    return null;
  }

  const client = normalizeClient({ id: res.data.id, attributes: res.data.attributes });
  return {
    ...client,
    evaluations: Array.isArray(res.data.attributes.evaluations?.data)
      ? res.data.attributes.evaluations.data.filter(Boolean).map(normalizeEvaluation)
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
  const item = res?.data ?? {};
  return normalizeQuestionnaire({ id: item.id ?? Number(id), attributes: item.attributes ?? {} });
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
  const activeQuestionnaires = questionnaires.filter((item: any) => item.attributes?.actif).length;
  const inactiveQuestionnaires = questionnaires.length - activeQuestionnaires;

  const scores: number[] = evaluations.map((item: any) => Number(item.attributes.score ?? 0));
  const averageScore = scores.length > 0 ? Math.round(scores.reduce((acc, score) => acc + score, 0) / scores.length) : 0;
  const conformesCount = scores.filter((score) => score >= 80).length;

  const riskMap = new Map<number, { nom: string; score: number; alerte: string }>();
  const monthlyStats = new Map<string, { label: string; total: number; count: number }>();
  const formatter = new Intl.DateTimeFormat('fr-FR', { month: 'short' });

  evaluations.forEach((item: any) => {
    const score = Number(item.attributes.score ?? 0);
    const client = item.attributes.client?.data;
    if (client?.id != null && score <= 50 && !riskMap.has(client.id)) {
      const nom = [client.attributes.nom, client.attributes.prenom].filter(Boolean).join(' ');
      const alerte = score <= 20 ? 'Critique' : score <= 40 ? 'Risque eleve' : 'Risque modere';
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
  // ✅ Strapi v5 : les relations doivent utiliser le format "connect"
  return strapiPost('/evaluations', {
    ...data,
    client: { connect: [data.client] },
    questionnaire: { connect: [data.questionnaire] },
  });
}