"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import type {
  Client,
  Questionnaire,
  Question,
  QuestionCustom,
} from "@/lib/types";
import {
  getClients,
  getQuestionnaires,
  getQuestionnaireById,
  getEvaluationById,
  createEvaluation,
  updateEvaluation,
  setApiAuthToken,
} from "@/lib/api";
import { computeScoreFromNotes, getSeuil, isAdminRole } from "@/lib/scoring";
import { commentaireAutoForNote } from "@/lib/commentaires-auto";

type LocalResponse = {
  questionId?: number | string;
  note: number | null;
  commentaireEvaluateur?: string;
};

export default function EvaluationForm({
  initialClientId,
  editEvaluationId,
}: {
  initialClientId?: string;
  editEvaluationId?: string;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAdmin = isAdminRole((session?.user as { role?: string })?.role);
  const isEditMode = Boolean(editEvaluationId);
  const evaluateurName = session?.user?.name ?? "";
  const evaluateurId = Number((session?.user as { id?: string })?.id);
  const [loadingEdit, setLoadingEdit] = useState(isEditMode);
  const [sessionReady, setSessionReady] = useState(false);

  const [clients, setClients] = useState<Client[]>([]);
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>(
    initialClientId ?? "",
  );
  const [selectedQuestionnaire, setSelectedQuestionnaire] =
    useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [customQuestions, setCustomQuestions] = useState<QuestionCustom[]>([]);
  const [responses, setResponses] = useState<Record<string, LocalResponse>>({});
  const [introComment, setIntroComment] = useState("");
  const [conclusionComment, setConclusionComment] = useState("");
  const [dateEvaluation, setDateEvaluation] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [saving, setSaving] = useState(false);
  const [serverEvalId, setServerEvalId] = useState<number | string | null>(
    null,
  );

  const selectedQ = questionnaires.find(
    (q) => String(q.id) === selectedQuestionnaire,
  );
  const qType = selectedQ?.type ?? "planification";

  // Étape 1 : injecter le token dès que la session est prête
  useEffect(() => {
    if (status !== "authenticated") return;
    const token = (session?.user as { accessToken?: string })?.accessToken;
    setApiAuthToken(token);
    setSessionReady(true);
  }, [session, status]);

  // Étape 2 : charger clients et questionnaires APRÈS que le token est injecté
  useEffect(() => {
    if (!sessionReady) return;

    Promise.all([getClients(), getQuestionnaires()])
      .then(([c, q]) => {
        const activeClients = c.filter((cl) => !cl.archive);
        setClients(activeClients);
        setQuestionnaires(q.filter((item) => item.actif !== false));
        if (!isEditMode && !selectedClient && activeClients.length)
          setSelectedClient(String(activeClients[0].id));
        const activeQ = q.filter((item) => item.actif !== false);
        if (!isEditMode && !selectedQuestionnaire && activeQ.length)
          setSelectedQuestionnaire(String(activeQ[0].id));
      })
      .catch((err: Error) => {
        console.error("❌ Erreur chargement clients/questionnaires:", err.message);
        toast.error("Erreur de chargement : " + err.message);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionReady]);

  // Étape 3 : charger l'évaluation en mode édition APRÈS que le token est injecté
  useEffect(() => {
    if (!editEvaluationId || !sessionReady) return;

    async function loadEvaluation(id: string) {
      try {
        const ev = await getEvaluationById(id);
        if (!ev) {
          router.push("/dashboard/evaluations");
          return;
        }
        if (ev.statut === "terminee" && !isAdmin) {
          router.push(`/dashboard/evaluations/${editEvaluationId}`);
          return;
        }
        setServerEvalId(ev.id);
        setSelectedClient(String(ev.client?.id ?? ""));
        setSelectedQuestionnaire(String(ev.questionnaire?.id ?? ""));
        setDateEvaluation(ev.dateEvaluation);
        setIntroComment(ev.commentaireGlobal ?? "");
        setConclusionComment(ev.commentaireConclusion ?? "");

        const q = ev.questionnaire?.id
          ? await getQuestionnaireById(String(ev.questionnaire.id))
          : { questions: [] as Question[] };
        const sorted = [...(q.questions ?? [])].sort(
          (a, b) => (a.ordre ?? 0) - (b.ordre ?? 0),
        );
        setQuestions(sorted);
        setCustomQuestions(ev.questions_custom ?? []);

        const init: Record<string, LocalResponse> = {};
        sorted.forEach((question) => {
          const rep = ev.reponses?.find((r) => r.question?.id === question.id);
          init[`q_${question.id}`] = {
            questionId: question.id,
            note: rep != null ? rep.note : null,
            commentaireEvaluateur: rep?.commentaireEvaluateur,
          };
        });
        (ev.questions_custom ?? []).forEach((cq) => {
          const rep = ev.reponses?.find((r) => r.questionCustom?.id === cq.id);
          init[`c_${cq.id}`] = {
            note: rep != null ? rep.note : null,
            commentaireEvaluateur: rep?.commentaireEvaluateur,
          };
        });
        setResponses(init);
      } catch (err) {
        console.error("❌ Erreur chargement évaluation:", err);
        router.push("/dashboard/evaluations");
      } finally {
        setLoadingEdit(false);
      }
    }

    loadEvaluation(editEvaluationId);
  }, [editEvaluationId, isAdmin, router, sessionReady]);

  useEffect(() => {
    if (!selectedQuestionnaire) return;
    if (isEditMode && serverEvalId) return;

    let mounted = true;
    getQuestionnaireById(selectedQuestionnaire)
      .then((q) => {
        if (!mounted) return;
        const sorted = [...(q.questions ?? [])].sort(
          (a, b) => (a.ordre ?? 0) - (b.ordre ?? 0),
        );
        setQuestions(sorted);
        setCustomQuestions([]);
        const init: Record<string, LocalResponse> = {};
        sorted.forEach((question) => {
          init[`q_${question.id}`] = { questionId: question.id, note: null };
        });
        setResponses(init);
        setServerEvalId(null);
      })
      .catch((err: Error) => {
        console.error("❌ Erreur chargement questionnaire:", err.message);
        toast.error("Impossible de charger le questionnaire : " + err.message);
      });
    return () => {
      mounted = false;
    };
  }, [selectedQuestionnaire, isEditMode, serverEvalId]);

  const allQuestionsCount = questions.length + customQuestions.length;
  const answeredCount = useMemo(
    () => Object.values(responses).filter((r) => r.note !== null).length,
    [responses],
  );

  const scoreComputed = useMemo(() => {
    const notes = Object.values(responses)
      .map((r) => r.note)
      .filter((n): n is number => n !== null);
    return computeScoreFromNotes(notes);
  }, [responses]);

  const seuilPreview = getSeuil(scoreComputed.pourcentage, qType);

  const handleNoteChange = useCallback((key: string, value: number) => {
    setResponses((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? {}), note: value },
    }));
  }, []);

  const handleCommentChange = useCallback((key: string, value: string) => {
    setResponses((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? {}), commentaireEvaluateur: value },
    }));
  }, []);

  function addCustomQuestion() {
    const tempId = -Date.now();
    const q: QuestionCustom = {
      id: tempId,
      critere: "",
      texte: "",
      ordre: customQuestions.length + 1,
    };
    setCustomQuestions((prev) => [...prev, q]);
    setResponses((prev) => ({ ...prev, [`c_${tempId}`]: { note: null } }));
    toast.success("Question personnalisée ajoutée");
  }

  function updateCustomQuestion(idx: number, patch: Partial<QuestionCustom>) {
    setCustomQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)),
    );
  }

  async function handleSave(draft = false) {
    if (!selectedClient || !selectedQuestionnaire) return;
    if (!draft && answeredCount < allQuestionsCount) return;
    setSaving(true);
    try {
      const baseReponses = Object.entries(responses)
        .filter(
          ([key, r]) => key.startsWith("q_") && r.note !== null && r.questionId,
        )
        .map(([, r]) => ({
          question: Number(r.questionId),
          note: Number(r.note),
          commentaireEvaluateur: r.commentaireEvaluateur,
        }));

      const customReponses = Object.entries(responses)
        .filter(([key, r]) => key.startsWith("c_") && r.note !== null)
        .map(([, r]) => ({
          note: Number(r.note),
          commentaireEvaluateur: r.commentaireEvaluateur,
        }));

      const payload = {
        client: selectedClient,
        questionnaire: selectedQuestionnaire,
        dateEvaluation,
        evaluateur: evaluateurName,
        evaluateurUtilisateur: evaluateurId || undefined,
        commentaireGlobal: introComment || undefined,
        commentaireConclusion: conclusionComment.trim()
          ? conclusionComment.trim()
          : undefined,
        statut: draft ? ("en_cours" as const) : ("terminee" as const),
        scoreFinal: scoreComputed.scoreObtained,
        scoreMaxReel: scoreComputed.scoreMaxReel,
        pourcentageScore: scoreComputed.pourcentage,
        reponses: [...baseReponses, ...customReponses],
        questions_custom: customQuestions
          .filter((cq) => cq.critere.trim() && cq.texte.trim())
          .map((cq, idx) => ({
            critere: cq.critere,
            indicateur: cq.indicateur,
            texte: cq.texte,
            ordre: idx + 1,
          })),
      };

      if (!serverEvalId) {
        const res = await createEvaluation(payload);
        const createdId = res?.data?.documentId ?? res?.data?.id ?? res?.documentId ?? res?.id ?? null;
        if (createdId) setServerEvalId(createdId);
        if (draft) {
          toast.success("Évaluation enregistrée automatiquement");
        } else if (createdId) {
          toast.success("Évaluation terminée avec succès");
          router.push(`/dashboard/evaluations/${createdId}`);
          return;
        }
      } else {
        await updateEvaluation(serverEvalId, payload);
        if (draft) {
          toast.success("Modifications enregistrées");
        } else {
          toast.success("Évaluation mise à jour avec succès");
          router.push(`/dashboard/evaluations/${serverEvalId}`);
          return;
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'enregistrement. Veuillez réessayer.");
    } finally {
      setSaving(false);
    }
  }

  const isUnsaved = answeredCount > 0 && serverEvalId === null;
  const confirmMessage =
    "Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir quitter sans sauvegarder ?";

  useEffect(() => {
    if (!isUnsaved) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isUnsaved]);

  useEffect(() => {
    if (!isUnsaved) return;
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a[href]");
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      e.preventDefault();
      if (window.confirm(confirmMessage)) {
        window.location.href = href;
      }
    };
    document.addEventListener("click", handleLinkClick);
    return () => document.removeEventListener("click", handleLinkClick);
  }, [isUnsaved, confirmMessage]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const safeNavigate = useCallback(
    (path: string) => {
      if (isUnsaved && !window.confirm(confirmMessage)) return;
      router.push(path);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [isUnsaved],
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const safeBack = useCallback(() => {
    if (isUnsaved && !window.confirm(confirmMessage)) return;
    router.back();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUnsaved]);

  if (status === "loading" || (isEditMode && loadingEdit)) {
    return (
      <div className="text-gray-500 py-12">
        Chargement de l&apos;évaluation…
      </div>
    );
  }

  const pageTitle = isEditMode
    ? isAdmin
      ? "Modifier l'évaluation"
      : "Reprendre l'évaluation"
    : "Nouvelle évaluation";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Toutes les questions doivent être notées (0 à 3) avant de terminer.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {answeredCount > 0 && !serverEvalId && (
            <p className="text-xs text-orange-600">
              ⚠️ Donnees non enregistrees - Cliquez sur Sauvegarder pour
              conserver vos reponses
            </p>
          )}
          {serverEvalId && answeredCount < allQuestionsCount && (
            <p className="text-xs text-blue-600">
              Brouillon sauvegarde ({answeredCount}/{allQuestionsCount}{" "}
              questions repondues)
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving}
              className="rounded bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200 transition-colors"
            >
              Sauvegarder le brouillon
            </button>
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    "Etes-vous sur de vouloir terminer cette evaluation ? Cette action ne peut pas etre annulee.",
                  )
                ) {
                  void handleSave(false);
                }
              }}
              disabled={
                saving ||
                answeredCount < allQuestionsCount ||
                allQuestionsCount === 0
              }
              className="rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Terminer l&apos;evaluation
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Client
            </label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
              disabled={Boolean(initialClientId) || isEditMode}
            >
              <option value="">— Sélectionner un client —</option>
              {clients.map((c) => (
                <option key={String(c.id)} value={c.id}>
                  {c.nomEntreprise}
                  {c.nomResponsable ? ` (${c.nomResponsable})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Questionnaire
            </label>
            <select
              value={selectedQuestionnaire}
              onChange={(e) => setSelectedQuestionnaire(e.target.value)}
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
              disabled={isEditMode}
            >
              {questionnaires.map((q) => (
                <option key={String(q.id)} value={q.id}>
                  {q.titre} (
                  {q.type === "mission" ? "Mission" : "Planification"})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Date d&apos;évaluation
            </label>
            <input
              value={dateEvaluation}
              onChange={(e) => setDateEvaluation(e.target.value)}
              type="date"
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Évaluateur
            </label>
            <input
              value={evaluateurName}
              readOnly
              className="mt-2 w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-600"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Commentaire d&apos;introduction
          </label>
          <textarea
            value={introComment}
            onChange={(e) => setIntroComment(e.target.value)}
            className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
            rows={2}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Commentaire de conclusion (optionnel)
          </label>
          <textarea
            value={conclusionComment}
            onChange={(e) => setConclusionComment(e.target.value)}
            className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
            rows={2}
            placeholder="Synthèse en fin d'évaluation"
          />
        </div>

        {selectedClient && (
          <div className="rounded-lg border-2 border-blue-300 bg-blue-50 p-4">
            <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">
              Client sélectionné
            </p>
            <p className="text-lg font-bold text-blue-900 mt-1">
              {
                clients.find((c) => String(c.id) === selectedClient)
                  ?.nomEntreprise
              }
            </p>
            <p className="text-sm text-blue-700 mt-0.5">
              Responsable :{" "}
              {clients.find((c) => String(c.id) === selectedClient)
                ?.nomResponsable || "—"}
            </p>
          </div>
        )}

        <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-gray-50 p-3">
          <span className="text-sm text-gray-600">
            Progression : {answeredCount} / {allQuestionsCount} questions
            répondues
          </span>
          <div className="flex items-center gap-4 text-sm">
            <span>
              Score :{" "}
              <strong>
                {scoreComputed.scoreObtained} / {scoreComputed.scoreMaxReel}
              </strong>
            </span>
            <span>
              Pourcentage : <strong>{scoreComputed.pourcentage}%</strong>
            </span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${
                seuilPreview.couleur === "vert"
                  ? "bg-green-100 text-green-800"
                  : seuilPreview.couleur === "orange"
                    ? "bg-orange-100 text-orange-800"
                    : "bg-red-100 text-red-800"
              }`}
            >
              {seuilPreview.label}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b text-left text-gray-500">
                <th className="px-3 py-2 font-medium">Critère</th>
                <th className="px-3 py-2 font-medium">Indicateur</th>
                <th className="px-3 py-2 font-medium">Question</th>
                <th className="px-3 py-2 font-medium w-36">Niveau (0-3)</th>
                <th className="px-3 py-2 font-medium">Commentaire auto.</th>
                <th className="px-3 py-2 font-medium">Commentaire libre</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {questions.map((q) => {
                const key = `q_${q.id}`;
                const resp = responses[key] ?? { note: null };
                return (
                  <tr key={key} className="align-top">
                    <td className="px-3 py-3 text-gray-800">
                      {q.critere ?? "—"}
                    </td>
                    <td className="px-3 py-3 text-gray-600">
                      {q.indicateur ?? "—"}
                    </td>
                    <td className="px-3 py-3">{q.texte}</td>
                    <td className="px-3 py-3">
                      <select
                        value={resp.note ?? ""}
                        onChange={(e) =>
                          handleNoteChange(key, Number(e.target.value))
                        }
                        className="w-full rounded border px-2 py-1.5 text-sm"
                      >
                        <option value="">—</option>
                        <option value={0}>0 — Sans objet</option>
                        <option value={1}>1 — Préoccupant</option>
                        <option value={2}>2 — Neutre</option>
                        <option value={3}>3 — Collaboratif</option>
                      </select>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500 max-w-[180px]">
                      {commentaireAutoForNote(resp.note, q)}
                    </td>
                    <td className="px-3 py-3">
                      <input
                        value={resp.commentaireEvaluateur ?? ""}
                        onChange={(e) =>
                          handleCommentChange(key, e.target.value)
                        }
                        className="w-full rounded border px-2 py-1.5 text-sm"
                        placeholder="Optionnel"
                      />
                    </td>
                  </tr>
                );
              })}
              {customQuestions.map((cq, idx) => {
                const key = `c_${cq.id}`;
                const resp = responses[key] ?? { note: null };
                return (
                  <tr key={key} className="bg-blue-50/30 align-top">
                    <td className="px-3 py-2">
                      <input
                        value={cq.critere}
                        onChange={(e) =>
                          updateCustomQuestion(idx, { critere: e.target.value })
                        }
                        className="w-full rounded border px-2 py-1 text-sm"
                        placeholder="Critère *"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={cq.indicateur ?? ""}
                        onChange={(e) =>
                          updateCustomQuestion(idx, {
                            indicateur: e.target.value,
                          })
                        }
                        className="w-full rounded border px-2 py-1 text-sm"
                        placeholder="Indicateur"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={cq.texte}
                        onChange={(e) =>
                          updateCustomQuestion(idx, { texte: e.target.value })
                        }
                        className="w-full rounded border px-2 py-1 text-sm"
                        placeholder="Question *"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={resp.note ?? ""}
                        onChange={(e) =>
                          handleNoteChange(key, Number(e.target.value))
                        }
                        className="w-full rounded border px-2 py-1.5 text-sm"
                      >
                        <option value="">—</option>
                        {[0, 1, 2, 3].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-400">—</td>
                    <td className="px-3 py-2">
                      <input
                        value={resp.commentaireEvaluateur ?? ""}
                        onChange={(e) =>
                          handleCommentChange(key, e.target.value)
                        }
                        className="w-full rounded border px-2 py-1.5 text-sm"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={addCustomQuestion}
          className="rounded bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200"
        >
          + Ajouter une question personnalisée
        </button>
      </div>
    </div>
  );
}