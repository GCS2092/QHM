"use client";

import { useState, useEffect, useMemo } from "react";
import {
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
} from "@/lib/api";
import { COMMENTAIRES_CDC_DEFAUT } from "@/lib/commentaires-auto";
import type { Question, Questionnaire } from "@/lib/types";

export default function QuestionsAdmin({
  questionnaire,
  onUpdated,
}: {
  questionnaire: Questionnaire;
  onUpdated: () => void;
}) {
  const [editing, setEditing] = useState<Question | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const sorted = useMemo(
    () =>
      [...(questionnaire.questions ?? [])].sort(
        (a, b) => (a.ordre ?? 0) - (b.ordre ?? 0),
      ),
    [questionnaire.questions],
  );
  const [localSorted, setLocalSorted] = useState<Question[] | null>(null);
  const displayedQuestions = localSorted ?? sorted;
  const [form, setForm] = useState({
    texte: "",
    critere: "",
    indicateur: "",
    ordre: 0,
    commentaireZero: "",
    commentaireUn: "",
    commentaireDeux: "",
    commentaireTrois: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLocalSorted(null);
    }, 0);
    return () => clearTimeout(timer);
  }, [questionnaire.questions]);

  function resetForm() {
    setEditing(null);
    setForm({
      texte: "",
      critere: "",
      indicateur: "",
      ordre: displayedQuestions.length + 1,
      commentaireZero: "",
      commentaireUn: "",
      commentaireDeux: "",
      commentaireTrois: "",
    });
  }

  function startEdit(q: Question) {
    setEditing(q);
    setForm({
      texte: q.texte,
      critere: q.critere ?? "",
      indicateur: q.indicateur ?? "",
      ordre: q.ordre ?? 0,
      commentaireZero: q.commentaireZero ?? "",
      commentaireUn: q.commentaireUn ?? "",
      commentaireDeux: q.commentaireDeux ?? "",
      commentaireTrois: q.commentaireTrois ?? "",
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (editing) {
        await updateQuestion(editing.id, form);
      } else {
        await createQuestion({
          ...form,
          commentaireZero: form.commentaireZero || COMMENTAIRES_CDC_DEFAUT.zero,
          commentaireUn: form.commentaireUn || COMMENTAIRES_CDC_DEFAUT.un,
          commentaireDeux: form.commentaireDeux || COMMENTAIRES_CDC_DEFAUT.deux,
          commentaireTrois:
            form.commentaireTrois || COMMENTAIRES_CDC_DEFAUT.trois,
          questionnaire: questionnaire.id,
        });
      }
      resetForm();
      onUpdated();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de l'enregistrement",
      );
    }
  }

  async function handleDelete(id: number | string) {
    if (!confirm("Supprimer cette question ?")) return;
    try {
      await deleteQuestion(id);
      onUpdated();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de supprimer (évaluation en cours ?)",
      );
    }
  }

  function onDragStart(idx: number) {
    setDragIdx(idx);
    if (localSorted === null) {
      setLocalSorted(sorted);
    }
  }

  function onDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const current = localSorted ?? sorted;
    const newSorted = [...current];
    const [removed] = newSorted.splice(dragIdx, 1);
    newSorted.splice(idx, 0, removed);
    setLocalSorted(newSorted);
    setDragIdx(idx);
  }

  async function onDragEnd() {
    setDragIdx(null);
    const current = localSorted ?? sorted;
    if (current.length) {
      await reorderQuestions(
        questionnaire.id,
        current.map((q) => q.id),
      );
      setLocalSorted(null);
      onUpdated();
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-gray-500">
        Glissez-déposez les questions pour modifier l&apos;ordre (drag &amp;
        drop).
      </p>
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-3"
      >
        <h3 className="font-medium text-gray-900">
          {editing ? "Modifier la question" : "Nouvelle question de base"}
        </h3>
        <div className="grid gap-2 md:grid-cols-2">
          <input
            placeholder="Critère *"
            value={form.critere}
            onChange={(e) => setForm({ ...form, critere: e.target.value })}
            className="rounded border px-2 py-1.5 text-sm"
            required
          />
          <input
            placeholder="Ordre"
            type="number"
            value={form.ordre}
            onChange={(e) =>
              setForm({ ...form, ordre: Number(e.target.value) })
            }
            className="rounded border px-2 py-1.5 text-sm"
          />
        </div>
        <textarea
          placeholder="Indicateur"
          value={form.indicateur}
          onChange={(e) => setForm({ ...form, indicateur: e.target.value })}
          className="w-full rounded border px-2 py-1.5 text-sm"
          rows={2}
        />
        <textarea
          placeholder="Question *"
          value={form.texte}
          onChange={(e) => setForm({ ...form, texte: e.target.value })}
          className="w-full rounded border px-2 py-1.5 text-sm"
          rows={2}
          required
        />
        <div className="grid gap-2 md:grid-cols-2">
          <input
            placeholder="Commentaire note 0"
            value={form.commentaireZero}
            onChange={(e) =>
              setForm({ ...form, commentaireZero: e.target.value })
            }
            className="rounded border px-2 py-1.5 text-sm"
          />
          <input
            placeholder="Commentaire note 1"
            value={form.commentaireUn}
            onChange={(e) =>
              setForm({ ...form, commentaireUn: e.target.value })
            }
            className="rounded border px-2 py-1.5 text-sm"
          />
          <input
            placeholder="Commentaire note 2"
            value={form.commentaireDeux}
            onChange={(e) =>
              setForm({ ...form, commentaireDeux: e.target.value })
            }
            className="rounded border px-2 py-1.5 text-sm"
          />
          <input
            placeholder="Commentaire note 3"
            value={form.commentaireTrois}
            onChange={(e) =>
              setForm({ ...form, commentaireTrois: e.target.value })
            }
            className="rounded border px-2 py-1.5 text-sm"
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white"
          >
            {editing ? "Mettre à jour" : "Ajouter"}
          </button>
          {editing ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded bg-gray-200 px-3 py-1.5 text-sm"
            >
              Annuler
            </button>
          ) : null}
        </div>
      </form>

      <ul className="space-y-2">
        {displayedQuestions.map((q, idx) => (
          <li
            key={String(q.id)}
            draggable
            onDragStart={() => onDragStart(idx)}
            onDragOver={(e) => onDragOver(e, idx)}
            onDragEnd={onDragEnd}
            className={`flex items-start justify-between rounded-xl border p-3 bg-white cursor-grab active:cursor-grabbing ${dragIdx === idx ? "border-blue-400 ring-2 ring-blue-100" : ""}`}
          >
            <div>
              <span className="text-xs text-gray-400 mr-2">#{idx + 1}</span>
              <span className="font-medium text-sm">
                {q.critere} — {q.texte}
              </span>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => startEdit(q)}
                className="text-xs text-blue-600"
              >
                Modifier
              </button>
              <button
                type="button"
                onClick={() => handleDelete(q.id)}
                className="text-xs text-red-600"
              >
                Supprimer
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}