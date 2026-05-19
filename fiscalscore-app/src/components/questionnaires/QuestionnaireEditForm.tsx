"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateQuestionnaire } from "@/lib/api";
import type { Questionnaire } from "@/lib/types";

interface QuestionnaireEditFormProps {
  questionnaire: Questionnaire;
}

export default function QuestionnaireEditForm({ questionnaire }: QuestionnaireEditFormProps) {
  const router = useRouter();
  const [titre, setTitre] = useState(questionnaire.titre ?? "");
  const [description, setDescription] = useState(questionnaire.description ?? "");
  const [actif, setActif] = useState(Boolean(questionnaire.actif));
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!titre.trim()) {
      setFeedback("Le titre du questionnaire est requis.");
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      await updateQuestionnaire(String(questionnaire.id), {
        titre: titre.trim(),
        description: description.trim(),
        actif,
      });
      router.push(`/dashboard/questionnaires/${questionnaire.id}`);
    } catch (error: any) {
      setFeedback(error?.message ?? "Impossible de mettre à jour le questionnaire.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Titre</label>
          <input
            type="text"
            value={titre}
            onChange={(event) => setTitre(event.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            placeholder="Nom du questionnaire"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            rows={4}
            placeholder="Brève description du questionnaire"
          />
        </div>
        <div className="flex items-center gap-3">
          <input
            id="actif"
            type="checkbox"
            checked={actif}
            onChange={(event) => setActif(event.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="actif" className="text-sm text-gray-700">Actif</label>
        </div>
        {feedback ? <div className="text-sm text-red-600">{feedback}</div> : null}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Mise à jour en cours..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
}
