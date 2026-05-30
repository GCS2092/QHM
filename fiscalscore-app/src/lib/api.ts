import { strapiGet, strapiPost, strapiPut, strapiDelete } from "./strapi";
import { getSeuil } from "./scoring";
import type {
  AnalyticsSummary,
  Assignation,
  Client,
  Evaluation,
  Questionnaire,
  Question,
  Response,
} from "./types";

let authToken: string | undefined;

export function setApiAuthToken(token: string | undefined) {
  authToken = token;
}

function token(override?: string) {
  return override ?? authToken;
}

interface RawQuestionCustom {
  id?: number | string;
  documentId?: string;
  critere?: string;
  indicateur?: string;
  texte?: string;
  ordre?: number;
}

interface RawQuestion {
  id?: number | string;
  documentId?: string;
  texte?: string;
  critere?: string;
  indicateur?: string;
  ordre?: number;
  commentaireZero?: string;
  commentaireUn?: string;
  commentaireDeux?: string;
  commentaireTrois?: string;
  questionnaire?: { id?: number | string; documentId?: string; titre?: string };
}

function normalizeQuestion(item: unknown): Question {
  const rawItem = item as RawQuestion;
  return {
    id: rawItem?.documentId ?? rawItem?.id ?? 0,
    texte: rawItem?.texte ?? "",
    critere: rawItem?.critere,
    indicateur: rawItem?.indicateur,
    ordre: rawItem?.ordre ?? 0,
    commentaireZero: rawItem?.commentaireZero,
    commentaireUn: rawItem?.commentaireUn,
    commentaireDeux: rawItem?.commentaireDeux,
    commentaireTrois: rawItem?.commentaireTrois,
    questionnaire: rawItem?.questionnaire
      ? {
          id: rawItem.questionnaire.documentId ?? rawItem.questionnaire.id ?? 0,
          titre: rawItem.questionnaire.titre,
        }
      : undefined,
  };
}

interface RawResponse {
  id?: number | string;
  documentId?: string;
  note?: number | string;
  commentaireEvaluateur?: string;
  question?: RawQuestion;
  question_custom?: RawQuestionCustom;
  questionCustom?: RawQuestionCustom;
}

function normalizeResponse(item: unknown): Response {
  const rawItem = item as RawResponse;
  const qc = rawItem?.question_custom ?? rawItem?.questionCustom;
  return {
    id: rawItem?.documentId ?? rawItem?.id ?? 0,
    note: Number(rawItem?.note ?? 0),
    commentaireEvaluateur: rawItem?.commentaireEvaluateur,
    question: rawItem?.question
      ? normalizeQuestion(rawItem.question)
      : undefined,
    questionCustom: qc
      ? {
          id: qc.documentId ?? qc.id ?? 0,
          critere: qc.critere ?? "",
          indicateur: qc.indicateur,
          texte: qc.texte ?? "",
          ordre: qc.ordre ?? 0,
        }
      : undefined,
  };
}

interface RawAssignation {
  evaluateur?: {
    id?: number | string;
    documentId?: string;
    username?: string;
    email?: string;
    role?: { name?: string };
  };
}

interface RawClient {
  id?: number | string;
  documentId?: string;
  nomEntreprise?: string;
  nom?: string;
  nomResponsable?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  secteur?: string;
  archive?: boolean;
  createdAt?: string;
  dateCreation?: string;
  assignations?: RawAssignation[];
  evaluations?: RawEvaluation[];
}

interface RawQuestionnaire {
  id?: number | string;
  documentId?: string;
  titre?: string;
  description?: string;
  actif?: boolean;
  type?: "planification" | "mission";
  questions?: RawQuestion[];
  evaluations?: RawEvaluation[];
}

interface RawEvaluation {
  id?: number | string;
  documentId?: string;
  scoreFinal?: number | string;
  score?: number | string;
  scoreMaxReel?: number | string;
  pourcentageScore?: number | string;
  dateEvaluation?: string;
  date?: string;
  evaluateur?: string;
  evaluateurUtilisateur?: { id?: number | string; documentId?: string } | number | string | null;
  commentaireGlobal?: string;
  commentaire?: string;
  commentaireConclusion?: string;
  statut?: "en_cours" | "terminee";
  client?: RawClient;
  questionnaire?: RawQuestionnaire;
  reponses?: RawResponse[];
  questions_custom?: RawQuestionCustom[];
}

function normalizeClient(item: unknown): Client {
  const rawItem = item as RawClient;
  return {
    id: rawItem?.documentId ?? rawItem?.id ?? 0,
    nomEntreprise: rawItem?.nomEntreprise ?? rawItem?.nom ?? "",
    nomResponsable: rawItem?.nomResponsable ?? rawItem?.prenom ?? "",
    email: rawItem?.email,
    telephone: rawItem?.telephone,
    secteur: rawItem?.secteur,
    archive: Boolean(rawItem?.archive),
    dateCreation: rawItem?.createdAt ?? rawItem?.dateCreation,
    evaluateurs: Array.isArray(rawItem?.assignations)
      ? rawItem.assignations.filter(Boolean).map((a: unknown) => {
          const rawA = a as RawAssignation;
          return {
            id: rawA.evaluateur?.documentId ?? rawA.evaluateur?.id ?? 0,
            username:
              rawA.evaluateur?.username ??
              rawA.evaluateur?.email ??
              "Utilisateur",
            email: rawA.evaluateur?.email,
            role: rawA.evaluateur?.role?.name,
          };
        })
      : [],
    evaluations: Array.isArray(rawItem?.evaluations)
      ? rawItem.evaluations.filter(Boolean).map(normalizeEvaluation)
      : [],
  };
}

function normalizeQuestionnaire(item: unknown): Questionnaire {
  const rawItem = item as RawQuestionnaire;
  const questions = Array.isArray(rawItem?.questions)
    ? rawItem.questions
        .filter(Boolean)
        .map(normalizeQuestion)
        .sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0))
    : [];
  return {
    id: rawItem?.documentId ?? rawItem?.id ?? 0,
    titre: rawItem?.titre?.trim() ? rawItem.titre : "Questionnaire sans titre",
    description: rawItem?.description,
    actif: Boolean(rawItem?.actif),
    type: rawItem?.type ?? "planification",
    questions,
    evaluations: Array.isArray(rawItem?.evaluations)
      ? rawItem.evaluations.filter(Boolean).map(normalizeEvaluation)
      : [],
  };
}

function normalizeEvaluation(item: unknown): Evaluation {
  const rawItem = item as RawEvaluation;
  const rawEvalUser = rawItem?.evaluateurUtilisateur;

  let evaluateurUtilisateurId: number | string | undefined;
  if (rawEvalUser == null) {
    evaluateurUtilisateurId = undefined;
  } else if (typeof rawEvalUser === "object") {
    const obj = rawEvalUser as { documentId?: string; id?: number | string };
    evaluateurUtilisateurId = obj.documentId ?? (Number(obj.id) || undefined);
  } else {
    evaluateurUtilisateurId = Number(rawEvalUser) || undefined;
  }

  return {
    id: rawItem?.documentId ?? rawItem?.id ?? 0,
    scoreFinal: Number(rawItem?.scoreFinal ?? rawItem?.score ?? 0),
    scoreMaxReel: Number(rawItem?.scoreMaxReel ?? 0),
    pourcentageScore: Number(rawItem?.pourcentageScore ?? 0),
    dateEvaluation: rawItem?.dateEvaluation ?? rawItem?.date ?? "",
    evaluateur: rawItem?.evaluateur ?? "",
    evaluateurUtilisateurId,
    commentaireGlobal: rawItem?.commentaireGlobal ?? rawItem?.commentaire,
    commentaireConclusion: rawItem?.commentaireConclusion,
    statut: rawItem?.statut ?? "terminee",
    client: rawItem?.client ? normalizeClient(rawItem.client) : undefined,
    questionnaire: rawItem?.questionnaire
      ? normalizeQuestionnaire(rawItem.questionnaire)
      : undefined,
    reponses: Array.isArray(rawItem?.reponses)
      ? rawItem.reponses.filter(Boolean).map(normalizeResponse)
      : [],
    questions_custom: Array.isArray(rawItem?.questions_custom)
      ? rawItem.questions_custom.filter(Boolean).map((question: unknown) => {
          const rawQ = question as RawQuestionCustom;
          return {
            id: rawQ.documentId ?? rawQ.id ?? 0,
            critere: rawQ.critere ?? "",
            indicateur: rawQ.indicateur,
            texte: rawQ.texte ?? "",
            ordre: rawQ.ordre ?? 0,
          };
        })
      : [],
  };
}

// ─── CLIENTS ────────────────────────────────────────────────────────────────

export async function getClients(tkn?: string): Promise<Client[]> {
  const res = await strapiGet(
    "/clients",
    {
      "populate[assignations][populate][evaluateur][fields][0]": "id",
      "populate[assignations][populate][evaluateur][fields][1]": "username",
      "populate[assignations][populate][evaluateur][fields][2]": "email",
      "populate[evaluations][fields][0]": "id",
      "populate[evaluations][fields][1]": "pourcentageScore",
      "populate[evaluations][fields][2]": "dateEvaluation",
      "populate[evaluations][fields][3]": "statut",
      sort: "nomEntreprise:asc",
    },
    token(tkn),
  );
  const rawData: unknown[] = Array.isArray(res.data)
    ? res.data.filter(Boolean)
    : [];
  return rawData.map(normalizeClient);
}

export async function getClientById(
  id: string,
  tkn?: string,
): Promise<(Client & { evaluations?: Evaluation[] }) | null> {
  const res = await strapiGet(
    `/clients/${id}`,
    {
      "populate[assignations][populate][evaluateur][fields][0]": "id",
      "populate[assignations][populate][evaluateur][fields][1]": "username",
      "populate[assignations][populate][evaluateur][fields][2]": "email",
      "populate[evaluations][populate][questionnaire][fields][0]": "id",
      "populate[evaluations][populate][questionnaire][fields][1]": "titre",
      "populate[evaluations][populate][questionnaire][fields][2]": "type",
      "populate[evaluations][fields][0]": "id",
      "populate[evaluations][fields][1]": "pourcentageScore",
      "populate[evaluations][fields][2]": "dateEvaluation",
      "populate[evaluations][fields][3]": "statut",
      "populate[evaluations][fields][4]": "scoreFinal",
      "populate[evaluations][fields][5]": "scoreMaxReel",
      "populate[evaluations][fields][6]": "evaluateur",
      "populate[evaluations][fields][7]": "commentaireGlobal",
    },
    token(tkn),
  );
  if (!res?.data) return null;
  const client = normalizeClient(res.data);
  return {
    ...client,
    evaluations: Array.isArray(res.data.evaluations)
      ? res.data.evaluations.filter(Boolean).map(normalizeEvaluation)
      : [],
  };
}

export async function updateClient(
  id: number | string,
  data: Partial<{
    nomEntreprise: string;
    nomResponsable: string;
    email?: string;
    telephone?: string;
    secteur?: string;
    archive?: boolean;
  }>,
  tkn?: string,
) {
  return strapiPut(`/clients/${id}`, data, token(tkn));
}

export async function deleteClient(id: number | string, tkn?: string) {
  return strapiDelete(`/clients/${id}`, token(tkn));
}

// ─── QUESTIONNAIRES ──────────────────────────────────────────────────────────

export async function getQuestionnaires(
  tkn?: string,
): Promise<Questionnaire[]> {
  const res = await strapiGet(
    "/questionnaires",
    { populate: "*", sort: "titre:asc" },
    token(tkn),
  );
  const rawData: unknown[] = Array.isArray(res.data)
    ? res.data.filter(Boolean)
    : [];
  return rawData.map(normalizeQuestionnaire);
}

export async function getQuestionnaireById(
  id: string,
  tkn?: string,
): Promise<Questionnaire> {
  const res = await strapiGet(
    `/questionnaires/${id}`,
    { populate: "*" },
    token(tkn),
  );
  return normalizeQuestionnaire(res?.data ?? {});
}

export async function updateQuestionnaire(
  id: string,
  data: {
    titre: string;
    description?: string;
    actif?: boolean;
    type?: "planification" | "mission";
  },
  tkn?: string,
) {
  return strapiPut(`/questionnaires/${id}`, data, token(tkn));
}

export async function deleteQuestionnaire(id: number | string, tkn?: string) {
  return strapiDelete(`/questionnaires/${id}`, token(tkn));
}

// ─── EVALUATIONS ─────────────────────────────────────────────────────────────

export async function getEvaluations(tkn?: string): Promise<Evaluation[]> {
  const res = await strapiGet(
    "/evaluations",
    {
      "populate[client][fields][0]": "id",
      "populate[client][fields][1]": "nomEntreprise",
      "populate[client][fields][2]": "nomResponsable",
      "populate[questionnaire][fields][0]": "id",
      "populate[questionnaire][fields][1]": "titre",
      "populate[questionnaire][fields][2]": "type",
      sort: "dateEvaluation:desc",
    },
    token(tkn),
  );
  const rawData: unknown[] = Array.isArray(res.data)
    ? res.data.filter(Boolean)
    : [];
  return rawData.map(normalizeEvaluation);
}

export async function getEvaluationById(
  id: string,
  tkn?: string,
): Promise<Evaluation | null> {
  const res = await strapiGet(
    `/evaluations/${id}`,
    {
      "populate[client][fields][0]": "id",
      "populate[client][fields][1]": "nomEntreprise",
      "populate[client][fields][2]": "nomResponsable",
      "populate[client][fields][3]": "email",
      "populate[client][fields][4]": "telephone",
      "populate[client][fields][5]": "secteur",
      "populate[questionnaire][fields][0]": "id",
      "populate[questionnaire][fields][1]": "titre",
      "populate[questionnaire][fields][2]": "type",
      "populate[questionnaire][fields][3]": "description",
      "populate[questionnaire][fields][4]": "actif",
      "populate[questionnaire][populate][questions][fields][0]": "id",
      "populate[questionnaire][populate][questions][fields][1]": "texte",
      "populate[questionnaire][populate][questions][fields][2]": "critere",
      "populate[questionnaire][populate][questions][fields][3]": "indicateur",
      "populate[questionnaire][populate][questions][fields][4]": "ordre",
      "populate[questionnaire][populate][questions][fields][5]": "commentaireZero",
      "populate[questionnaire][populate][questions][fields][6]": "commentaireUn",
      "populate[questionnaire][populate][questions][fields][7]": "commentaireDeux",
      "populate[questionnaire][populate][questions][fields][8]": "commentaireTrois",
      "populate[reponses][populate][question][fields][0]": "id",
      "populate[reponses][populate][question][fields][1]": "texte",
      "populate[reponses][populate][question][fields][2]": "critere",
      "populate[reponses][populate][question][fields][3]": "indicateur",
      "populate[reponses][populate][question][fields][4]": "ordre",
      "populate[reponses][populate][questionCustom][fields][0]": "id",
      "populate[reponses][populate][questionCustom][fields][1]": "texte",
      "populate[reponses][populate][questionCustom][fields][2]": "critere",
      "populate[reponses][populate][questionCustom][fields][3]": "indicateur",
      "populate[reponses][populate][questionCustom][fields][4]": "ordre",
      "populate[questions_custom][fields][0]": "id",
      "populate[questions_custom][fields][1]": "texte",
      "populate[questions_custom][fields][2]": "critere",
      "populate[questions_custom][fields][3]": "indicateur",
      "populate[questions_custom][fields][4]": "ordre",
    },
    token(tkn),
  );
  if (!res?.data) return null;
  return normalizeEvaluation(res.data);
}

// ─── ANALYTICS ───────────────────────────────────────────────────────────────

export async function getAnalyticsSummary(
  tkn?: string,
): Promise<AnalyticsSummary> {
  const [clientsRes, evaluationsRes, questionnairesRes] = await Promise.all([
    strapiGet("/clients", { "fields[0]": "id" }, token(tkn)),
    strapiGet(
      "/evaluations",
      {
        "populate[client][fields][0]": "id",
        "populate[client][fields][1]": "nomEntreprise",
        "populate[questionnaire][fields][0]": "id",
        "populate[questionnaire][fields][1]": "type",
        "fields[0]": "pourcentageScore",
        "fields[1]": "dateEvaluation",
        "fields[2]": "statut",
        sort: "dateEvaluation:desc",
      },
      token(tkn),
    ),
    strapiGet(
      "/questionnaires",
      { "fields[0]": "id", "fields[1]": "actif" },
      token(tkn),
    ),
  ]);

  const evaluations: unknown[] = Array.isArray(evaluationsRes.data)
    ? evaluationsRes.data.filter(Boolean)
    : [];
  const clientsCount = clientsRes.data?.length ?? 0;
  const questionnaires: unknown[] = Array.isArray(questionnairesRes.data)
    ? questionnairesRes.data.filter(Boolean)
    : [];
  const activeQuestionnaires = questionnaires.filter((item: unknown) => {
    const rawItem = item as RawQuestionnaire;
    return rawItem?.actif;
  }).length;
  const inactiveQuestionnaires = questionnaires.length - activeQuestionnaires;

  const pourcentages: number[] = evaluations.map((item: unknown) => {
    const rawItem = item as RawEvaluation;
    return Number(rawItem?.pourcentageScore ?? 0);
  });
  const averagePourcentage =
    pourcentages.length > 0
      ? Math.round(
          pourcentages.reduce((a, b) => a + b, 0) / pourcentages.length,
        )
      : 0;
  const conformesCount = evaluations.filter((item: unknown) => {
    const rawItem = item as RawEvaluation;
    const pct = Number(rawItem?.pourcentageScore ?? 0);
    const type = rawItem?.questionnaire?.type ?? "planification";
    const seuil = getSeuil(pct, type);
    return seuil.couleur === "vert";
  }).length;

  interface RiskEntry {
    nom: string;
    pourcentage: number;
    alerte: string;
  }

  interface MonthlyEntry {
    label: string;
    total: number;
    count: number;
  }

  const riskMap: Map<string, RiskEntry> = new Map();
  const monthlyStats: Map<string, MonthlyEntry> = new Map();
  const formatter = new Intl.DateTimeFormat("fr-FR", { month: "short" });

  evaluations.forEach((item: unknown) => {
    const rawItem = item as RawEvaluation;
    const pct = Number(rawItem?.pourcentageScore ?? 0);
    const type = rawItem?.questionnaire?.type ?? "planification";
    const seuil = getSeuil(pct, type);
    const client = rawItem?.client;
    if (client?.id != null && seuil.couleur === "rouge") {
      const clientKey = String(client.documentId ?? client.id);
      if (!riskMap.has(clientKey)) {
        const nom = client.nomEntreprise ?? client.nom ?? "Client inconnu";
        riskMap.set(clientKey, {
          nom,
          pourcentage: pct,
          alerte: seuil.label,
        });
      }
    }

    const date = rawItem?.dateEvaluation
      ? new Date(rawItem.dateEvaluation)
      : null;
    if (date instanceof Date && !Number.isNaN(date.getTime())) {
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const label = `${formatter.format(date)} ${date.getFullYear().toString().slice(-2)}`;
      const current = monthlyStats.get(key) ?? { label, total: 0, count: 0 };
      current.total += pct;
      current.count += 1;
      monthlyStats.set(key, current);
    }
  });

  const scoreSeries = Array.from(monthlyStats.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, item]) => ({
      mois: item.label,
      score: Math.round(item.total / item.count),
    }));

  return {
    totalClients: clientsCount,
    totalEvaluations: evaluations.length,
    totalQuestionnaires: questionnaires.length,
    activeQuestionnaires,
    inactiveQuestionnaires,
    averagePourcentage,
    conformesCount,
    risks: Array.from(riskMap.values()).slice(0, 5),
    scoreSeries,
  };
}

// ─── CREATE CLIENT / QUESTIONNAIRE ───────────────────────────────────────────

export async function createClient(
  data: {
    nomEntreprise: string;
    nomResponsable: string;
    email?: string;
    telephone?: string;
    secteur?: string;
    archive?: boolean;
  },
  tkn?: string,
) {
  return strapiPost("/clients", data, token(tkn));
}

export async function createQuestionnaire(
  data: {
    titre: string;
    description?: string;
    actif?: boolean;
    type?: "planification" | "mission";
  },
  tkn?: string,
) {
  return strapiPost("/questionnaires", data, token(tkn));
}

// ─── ASSIGNATIONS ────────────────────────────────────────────────────────────

interface RawAssignationData {
  id?: number | string;
  documentId?: string;
  client?: RawClient | number;
  evaluateur?:
    | {
        id?: number | string;
        documentId?: string;
        username?: string;
        email?: string;
        role?: { name?: string };
      }
    | number;
  dateAssignation?: string;
}

export async function getAssignations(tkn?: string): Promise<Assignation[]> {
  const res = await strapiGet(
    "/assignations",
    {
      "populate[client][fields][0]": "id",
      "populate[client][fields][1]": "nomEntreprise",
      "populate[client][fields][2]": "nomResponsable",
      "populate[evaluateur][fields][0]": "id",
      "populate[evaluateur][fields][1]": "username",
      "populate[evaluateur][fields][2]": "email",
    },
    token(tkn),
  );
  const rawData: unknown[] = Array.isArray(res.data)
    ? res.data.filter(Boolean)
    : [];
  return rawData.map((a: unknown) => {
    const rawA = a as RawAssignationData;
    const clientId =
      typeof rawA.client === "number"
        ? rawA.client
        : rawA.client?.documentId ?? rawA.client?.id ?? 0;
    const evaluateurObj =
      typeof rawA.evaluateur === "number" ? undefined : rawA.evaluateur;
    const evaluateurId =
      typeof rawA.evaluateur === "number"
        ? rawA.evaluateur
        : rawA.evaluateur?.documentId ?? rawA.evaluateur?.id ?? 0;

    return {
      id: rawA.documentId ?? rawA.id ?? 0,
      clientId,
      evaluateurId,
      dateAssignation: rawA.dateAssignation,
      client:
        typeof rawA.client === "object" && rawA.client
          ? normalizeClient(rawA.client)
          : undefined,
      evaluateur: evaluateurObj
        ? {
            id: evaluateurObj.documentId ?? evaluateurObj.id ?? 0,
            username: evaluateurObj.username ?? evaluateurObj.email ?? "",
            email: evaluateurObj.email,
            role: evaluateurObj.role?.name,
          }
        : undefined,
    };
  });
}

export async function createAssignation(
  data: {
    client: number | string;
    evaluateur: number | string;
    dateAssignation?: string;
  },
  tkn?: string,
) {
  return strapiPost("/assignations", data, token(tkn));
}

export async function deleteAssignation(id: number | string, tkn?: string) {
  return strapiDelete(`/assignations/${id}`, token(tkn));
}

// ─── USERS ───────────────────────────────────────────────────────────────────

interface RawUser {
  id: number | string;
  documentId?: string;
  username?: string;
  email?: string;
  role?: { name?: string };
}

interface NormalizedUser {
  id: number | string;
  username: string;
  email: string;
  role?: string;
}

export async function getUsers(tkn?: string): Promise<NormalizedUser[]> {
  const res = await strapiGet("/users", { populate: "role" }, token(tkn));
  const list = Array.isArray(res)
    ? res
    : Array.isArray(res?.data)
      ? res.data
      : [];
  return list.map((u: unknown) => {
    const rawU = u as RawUser;
    return {
      id: rawU.documentId ?? rawU.id,
      username: rawU.username ?? rawU.email ?? "",
      email: rawU.email ?? "",
      role: rawU.role?.name,
    };
  });
}

export async function getEvaluatorUsers(tkn?: string) {
  return (await getUsers(tkn)).filter((u) => {
    const r = (u.role ?? "").toLowerCase();
    return r === "evaluateur" || r === "authenticated";
  });
}

export async function deleteUser(id: number | string, tkn?: string) {
  return strapiDelete(`/users/${id}`, token(tkn));
}

export async function createEvaluatorUser(
  data: {
    username: string;
    email: string;
    password: string;
  },
  tkn?: string,
) {
  interface RawRole {
    id?: number | string;
    documentId?: string;
    name?: string;
  }

  interface RawRolesResponse {
    roles?: RawRole[];
    data?: RawRole[];
  }

  const rolesRes = (await strapiGet(
    "/users-permissions/roles",
    {},
    token(tkn),
  ).catch(() => null)) as RawRolesResponse | null;
  const roles = rolesRes?.roles ?? rolesRes?.data ?? [];
  const evaluatorRole = Array.isArray(roles)
    ? roles.find((r: unknown) => {
        const rawR = r as RawRole;
        return (rawR.name ?? "").toLowerCase() === "evaluateur";
      })
    : null;
  const roleId = evaluatorRole?.id ?? evaluatorRole?.documentId;
  return strapiPost(
    "/users",
    {
      username: data.username,
      email: data.email,
      password: data.password,
      role: roleId,
      confirmed: true,
    },
    token(tkn),
  );
}

// ─── QUESTIONS ───────────────────────────────────────────────────────────────

export async function reorderQuestions(
  questionnaireId: number | string,
  orderedIds: Array<number | string>,
  tkn?: string,
) {
  return Promise.all(
    orderedIds.map((id, index) =>
      updateQuestion(id, { ordre: index + 1 }, tkn),
    ),
  );
}

export async function createQuestion(
  data: {
    texte: string;
    critere?: string;
    indicateur?: string;
    ordre?: number;
    commentaireZero?: string;
    commentaireUn?: string;
    commentaireDeux?: string;
    commentaireTrois?: string;
    questionnaire: number | string;
  },
  tkn?: string,
) {
  return strapiPost(
    "/questions",
    { ...data, questionnaire: data.questionnaire },
    token(tkn),
  );
}

export async function updateQuestion(
  id: number | string,
  data: Partial<{
    texte: string;
    critere?: string;
    indicateur?: string;
    ordre?: number;
    commentaireZero?: string;
    commentaireUn?: string;
    commentaireDeux?: string;
    commentaireTrois?: string;
  }>,
  tkn?: string,
) {
  return strapiPut(`/questions/${id}`, data, token(tkn));
}

export async function deleteQuestion(id: number | string, tkn?: string) {
  return strapiDelete(`/questions/${id}`, token(tkn));
}

// ─── EVALUATIONS CRUD ────────────────────────────────────────────────────────

export async function createEvaluation(
  data: {
    client: number | string;
    questionnaire: number | string;
    dateEvaluation: string;
    evaluateur: string;
    evaluateurUtilisateur?: number | string;
    commentaireGlobal?: string;
    commentaireConclusion?: string;
    statut: "en_cours" | "terminee";
    scoreFinal: number;
    scoreMaxReel: number;
    pourcentageScore: number;
    reponses: Array<{
      question?: number | string;
      questionCustom?: number | string;
      note: number;
      commentaireEvaluateur?: string;
    }>;
    questions_custom?: Array<{
      critere: string;
      indicateur?: string;
      texte: string;
      ordre?: number;
    }>;
  },
  tkn?: string,
) {
  return strapiPost(
    "/evaluations",
    {
      client: data.client,
      questionnaire: data.questionnaire,
      evaluateur: data.evaluateur,
      evaluateurUtilisateur: data.evaluateurUtilisateur,
      commentaireGlobal: data.commentaireGlobal,
      commentaireConclusion: data.commentaireConclusion,
      statut: data.statut,
      scoreFinal: data.scoreFinal,
      scoreMaxReel: data.scoreMaxReel,
      pourcentageScore: data.pourcentageScore,
      dateEvaluation: data.dateEvaluation,
      reponses: data.reponses.map((response) => ({
        note: response.note,
        commentaireEvaluateur: response.commentaireEvaluateur,
        ...(response.question ? { question: response.question } : {}),
        ...(response.questionCustom
          ? { questionCustom: response.questionCustom }
          : {}),
      })),
      ...(data.questions_custom?.length
        ? {
            questions_custom: data.questions_custom.map((q) => ({
              critere: q.critere,
              indicateur: q.indicateur,
              texte: q.texte,
              ordre: q.ordre,
            })),
          }
        : {}),
    },
    token(tkn),
  );
}

export async function updateEvaluation(
  id: number | string,
  data: Partial<{
    commentaireGlobal: string;
    commentaireConclusion?: string;
    statut: "en_cours" | "terminee";
    scoreFinal: number;
    scoreMaxReel: number;
    pourcentageScore: number;
    reponses?: Array<{
      id?: number | string;
      question?: number | string;
      questionCustom?: number | string;
      note: number;
      commentaireEvaluateur?: string;
    }>;
    questions_custom?: Array<{
      id?: number | string;
      critere: string;
      indicateur?: string;
      texte: string;
      ordre?: number;
    }>;
  }>,
  tkn?: string,
) {
  return strapiPut(`/evaluations/${id}`, data, token(tkn));
}