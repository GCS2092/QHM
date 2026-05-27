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

// Raw data interfaces from Strapi
interface RawQuestionCustom {
  id: number | string;
  critere?: string;
  indicateur?: string;
  texte?: string;
  ordre?: number;
}

interface RawQuestion {
  id?: number | string;
  texte?: string;
  critere?: string;
  indicateur?: string;
  ordre?: number;
  commentaireZero?: string;
  commentaireUn?: string;
  commentaireDeux?: string;
  commentaireTrois?: string;
  questionnaire?: { id: number | string; titre?: string };
}

function normalizeQuestion(item: unknown): Question {
  const rawItem = item as RawQuestion;
  return {
    id: Number(rawItem?.id ?? 0),
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
          id: Number(rawItem.questionnaire.id),
          titre: rawItem.questionnaire.titre,
        }
      : undefined,
  };
}

interface RawResponse {
  id?: number | string;
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
    id: Number(rawItem?.id ?? 0),
    note: Number(rawItem?.note ?? 0),
    commentaireEvaluateur: rawItem?.commentaireEvaluateur,
    question: rawItem?.question
      ? normalizeQuestion(rawItem.question)
      : undefined,
    questionCustom: qc
      ? {
          id: Number(qc.id),
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
    username?: string;
    email?: string;
    role?: { name?: string };
  };
}

interface RawClient {
  id?: number | string;
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
  titre?: string;
  description?: string;
  actif?: boolean;
  type?: "planification" | "mission";
  questions?: RawQuestion[];
  evaluations?: RawEvaluation[];
}

interface RawEvaluation {
  id?: number | string;
  scoreFinal?: number | string;
  score?: number | string;
  scoreMaxReel?: number | string;
  pourcentageScore?: number | string;
  dateEvaluation?: string;
  date?: string;
  evaluateur?: string;
  evaluateurUtilisateur?: { id?: number | string } | number | string | null;
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
    id: Number(rawItem?.id ?? 0),
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
            id: Number(rawA.evaluateur?.id),
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
    id: Number(rawItem?.id ?? 0),
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
  const evaluateurUtilisateurId = rawEvalUser
    ? typeof rawEvalUser === "object"
      ? Number((rawEvalUser as { id?: number | string }).id) || undefined
      : Number(rawEvalUser) || undefined
    : undefined;
  return {
    id: Number(rawItem?.id ?? 0),
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
            id: Number(rawQ.id),
            critere: rawQ.critere ?? "",
            indicateur: rawQ.indicateur,
            texte: rawQ.texte ?? "",
            ordre: rawQ.ordre ?? 0,
          };
        })
      : [],
  };
}

export async function getClients(tkn?: string): Promise<Client[]> {
  const res = await strapiGet(
    "/clients",
    { populate: "*", sort: "nomEntreprise:asc" },
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
      "populate[assignations][populate][0]": "evaluateur",
      "populate[evaluations][populate][0]": "questionnaire",
      "populate[evaluations][populate][1]": "evaluateurUtilisateur",
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

export async function deleteClient(id: number, tkn?: string) {
  return strapiDelete(`/clients/${id}`, token(tkn));
}

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

export async function deleteQuestionnaire(id: number, tkn?: string) {
  return strapiDelete(`/questionnaires/${id}`, token(tkn));
}

export async function getEvaluations(tkn?: string): Promise<Evaluation[]> {
  const res = await strapiGet(
    "/evaluations",
    { populate: "*", sort: "dateEvaluation:desc" },
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
      "populate[client]": "*",
      "populate[questionnaire]": "*",
      "populate[reponses][populate][0]": "question",
      "populate[reponses][populate][1]": "questionCustom",
      "populate[questions_custom]": "*",
      "populate[evaluateurUtilisateur]": "*",
    },
    token(tkn),
  );
  if (!res?.data) return null;
  return normalizeEvaluation(res.data);
}

export async function getAnalyticsSummary(
  tkn?: string,
): Promise<AnalyticsSummary> {
  const [clientsRes, evaluationsRes, questionnairesRes] = await Promise.all([
    strapiGet("/clients", { fields: "id" }, token(tkn)),
    strapiGet(
      "/evaluations",
      {
        "populate[0]": "client",
        "populate[1]": "questionnaire",
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

  const riskMap = new Map<
    number,
    { nom: string; pourcentage: number; alerte: string }
  >();
  const monthlyStats = new Map<
    string,
    { label: string; total: number; count: number }
  >();
  const formatter = new Intl.DateTimeFormat("fr-FR", { month: "short" });

  evaluations.forEach((item: unknown) => {
    const rawItem = item as RawEvaluation;
    const pct = Number(rawItem?.pourcentageScore ?? 0);
    const type = rawItem?.questionnaire?.type ?? "planification";
    const seuil = getSeuil(pct, type);
    const client = rawItem?.client;
    if (client?.id != null && seuil.couleur === "rouge") {
      const clientIdNum = Number(client.id);
      if (!riskMap.has(clientIdNum)) {
        const nom = client.nomEntreprise ?? client.nom ?? "Client inconnu";
        riskMap.set(clientIdNum, {
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

interface RawAssignationData {
  id: number | string;
  client?: RawClient | number;
  evaluateur?:
    | {
        id: number | string;
        username?: string;
        email?: string;
        role?: { name?: string };
      }
    | number;
  dateAssignation?: string;
}

export async function getAssignations(tkn?: string): Promise<Assignation[]> {
  const res = await strapiGet("/assignations", { populate: "*" }, token(tkn));
  const rawData: unknown[] = Array.isArray(res.data)
    ? res.data.filter(Boolean)
    : [];
  return rawData.map((a: unknown) => {
    const rawA = a as RawAssignationData;
    const clientId =
      typeof rawA.client === "number"
        ? rawA.client
        : rawA.client?.id
          ? Number(rawA.client.id)
          : 0;
    const evaluateurObj =
      typeof rawA.evaluateur === "number" ? undefined : rawA.evaluateur;
    const evaluateurId =
      typeof rawA.evaluateur === "number"
        ? rawA.evaluateur
        : rawA.evaluateur?.id
          ? Number(rawA.evaluateur.id)
          : 0;

    return {
      id: Number(rawA.id),
      clientId,
      evaluateurId,
      dateAssignation: rawA.dateAssignation,
      client:
        typeof rawA.client === "object" && rawA.client
          ? normalizeClient(rawA.client)
          : undefined,
      evaluateur: evaluateurObj
        ? {
            id: Number(evaluateurObj.id),
            username: evaluateurObj.username ?? evaluateurObj.email ?? "",
            email: evaluateurObj.email,
            role: evaluateurObj.role?.name,
          }
        : undefined,
    };
  });
}

export async function createAssignation(
  data: { client: number; evaluateur: number; dateAssignation?: string },
  tkn?: string,
) {
  return strapiPost("/assignations", data, token(tkn));
}

export async function deleteAssignation(id: number, tkn?: string) {
  return strapiDelete(`/assignations/${id}`, token(tkn));
}

interface RawUser {
  id: number | string;
  username?: string;
  email?: string;
  role?: { name?: string };
}

export async function getUsers(
  tkn?: string,
): Promise<
  Array<{ id: number; username: string; email: string; role?: string }>
> {
  const res = await strapiGet("/users", { populate: "role" }, token(tkn));
  const list = Array.isArray(res)
    ? res
    : Array.isArray(res?.data)
      ? res.data
      : [];
  return list.map((u: unknown) => {
    const rawU = u as RawUser;
    return {
      id: Number(rawU.id),
      username: rawU.username ?? rawU.email,
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

export async function deleteUser(id: number, tkn?: string) {
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

export async function reorderQuestions(
  questionnaireId: number,
  orderedIds: number[],
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
    questionnaire: number;
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
  id: number,
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

export async function deleteQuestion(id: number, tkn?: string) {
  return strapiDelete(`/questions/${id}`, token(tkn));
}

export async function createEvaluation(
  data: {
    client: number;
    questionnaire: number;
    dateEvaluation: string;
    evaluateur: string;
    evaluateurUtilisateur?: number;
    commentaireGlobal?: string;
    commentaireConclusion?: string;
    statut: "en_cours" | "terminee";
    scoreFinal: number;
    scoreMaxReel: number;
    pourcentageScore: number;
    reponses: Array<{
      question?: number;
      questionCustom?: number;
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
      id?: number;
      question?: number;
      questionCustom?: number;
      note: number;
      commentaireEvaluateur?: string;
    }>;
    questions_custom?: Array<{
      id?: number;
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
