"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getClients, getQuestionnaires, createEvaluation } from "@/lib/api";
import type { Client, Questionnaire } from "@/lib/types";

type FormState = {
  clientId: string;
  questionnaireId: string;
  score: number;
  evaluateur: string;
  commentaire: string;
  date: string;
};

export default function EvaluationNewPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [form, setForm] = useState<FormState>({
    clientId: "",
    questionnaireId: "",
    score: 70,
    evaluateur: "Agent Kone",
    commentaire: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getClients(), getQuestionnaires()])
      .then(([clientsData, questionnairesData]) => {
        setClients(clientsData);
        setQuestionnaires(questionnairesData);

        const nextClient = new URLSearchParams(window.location.search).get("client");
        if (nextClient) {
          setForm((prev) => ({ ...prev, clientId: nextClient }));
        } else if (clientsData.length > 0) {
          setForm((prev) => ({ ...prev, clientId: String(clientsData[0].id) }));
        }

        if (questionnairesData.length > 0) {
          setForm((prev) => ({ ...prev, questionnaireId: String(questionnairesData[0].id) }));
        }
      })
      .catch(() => setFeedback("Impossible de charger les clients ou les questionnaires."))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.clientId) {
      setFeedback("Selectionnez un client pour l'evaluation.");
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      await createEvaluation({
        client: Number(form.clientId),
        questionnaire: Number(form.questionnaireId),
        score: form.score,
        date: form.date,
        evaluateur: form.evaluateur,
        commentaire: form.commentaire,
      });
      router.push('/dashboard/evaluations');
    } catch (error: any) {
      setFeedback(error?.message ?? "Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nouvelle evaluation</h1>
        <p className="text-sm text-gray-500 mt-1">Creer une evaluation fiscale pour un client existant.</p>
      </div>
      <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Client</label>
              <select
                value={form.clientId}
                onChange={(event) => setForm((prev) => ({ ...prev, clientId: event.target.value }))}
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
              >
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.prenom} {client.nom} - {client.identifiantFiscal}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Questionnaire</label>
              <select
                value={form.questionnaireId}
                onChange={(event) => setForm((prev) => ({ ...prev, questionnaireId: event.target.value }))}
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
              >
                {questionnaires.map((questionnaire) => (
                  <option key={questionnaire.id} value={questionnaire.id}>
                    {questionnaire.titre}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Score</label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.score}
                onChange={(event) => setForm((prev) => ({ ...prev, score: Number(event.target.value) }))}
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Evaluateur</label>
              <input
                type="text"
                value={form.evaluateur}
                onChange={(event) => setForm((prev) => ({ ...prev, evaluateur: event.target.value }))}
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Commentaire</label>
            <textarea
              value={form.commentaire}
              onChange={(event) => setForm((prev) => ({ ...prev, commentaire: event.target.value }))}
              className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              rows={4}
            />
          </div>
          {feedback ? <div className="text-sm text-blue-700">{feedback}</div> : null}
          <div className="flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={saving || loading}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer l evaluation'}
            </button>
          </div>
        </form>
      </div>
      {loading && (
        <div className="rounded-3xl border border-gray-100 bg-gray-50 p-6 text-sm text-gray-500">Chargement des donnees...</div>
      )}
    </div>
  );
}
