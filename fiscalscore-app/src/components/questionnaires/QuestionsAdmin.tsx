"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
} from "@/lib/api";
import { COMMENTAIRES_CDC_DEFAUT } from "@/lib/commentaires-auto";
import type { Question, Questionnaire } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export default function QuestionsAdmin({
  questionnaire,
  hasActiveEvaluations = false,
  onUpdated,
}: {
  questionnaire: Questionnaire;
  hasActiveEvaluations?: boolean;
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(
    null,
  );

  // Calculer hasActiveEvaluations si non fourni
  const evaluationsActive =
    hasActiveEvaluations ||
    (questionnaire.evaluations?.some((e) => e.statut === "en_cours") ?? false);

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
    if (evaluationsActive) {
      setToastMessage(
        "Les questions ne peuvent pas être modifiées tant que des évaluations sont en cours.",
      );
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }
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

  function openDeleteDialog(q: Question) {
    if (evaluationsActive) {
      setToastMessage(
        "Les questions ne peuvent pas être supprimées tant que des évaluations sont en cours.",
      );
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }
    setQuestionToDelete(q);
    setDeleteDialogOpen(true);
  }

  async function handleDelete() {
    if (!questionToDelete) return;
    try {
      await deleteQuestion(questionToDelete.id);
      toast.success("Question supprimée");
      setDeleteDialogOpen(false);
      setQuestionToDelete(null);
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
      {/* Toast de notification */}
      {toastMessage && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 rounded-lg shadow-lg text-sm z-50">
          {toastMessage}
        </div>
      )}

      {/* Banneau d'alerte si évaluations en cours */}
      {evaluationsActive && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-800">
          <div className="flex gap-3">
            <div className="text-lg leading-none pt-0.5">⚠️</div>
            <div>
              <p className="font-medium">Attention</p>
              <p className="text-sm mt-1">
                Des évaluations sont en cours. Les questions ne peuvent pas être
                modifiées tant que vous les terminez.
              </p>
            </div>
          </div>
        </div>
      )}

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
            disabled={evaluationsActive}
            className="rounded border px-2 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            required
          />
          <input
            placeholder="Ordre"
            type="number"
            value={form.ordre}
            onChange={(e) =>
              setForm({ ...form, ordre: Number(e.target.value) })
            }
            disabled={evaluationsActive}
            className="rounded border px-2 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <textarea
          placeholder="Indicateur"
          value={form.indicateur}
          onChange={(e) => setForm({ ...form, indicateur: e.target.value })}
          disabled={evaluationsActive}
          className="w-full rounded border px-2 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          rows={2}
        />
        <textarea
          placeholder="Question *"
          value={form.texte}
          onChange={(e) => setForm({ ...form, texte: e.target.value })}
          disabled={evaluationsActive}
          className="w-full rounded border px-2 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
            disabled={evaluationsActive}
            className="rounded border px-2 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <input
            placeholder="Commentaire note 1"
            value={form.commentaireUn}
            onChange={(e) =>
              setForm({ ...form, commentaireUn: e.target.value })
            }
            disabled={evaluationsActive}
            className="rounded border px-2 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <input
            placeholder="Commentaire note 2"
            value={form.commentaireDeux}
            onChange={(e) =>
              setForm({ ...form, commentaireDeux: e.target.value })
            }
            disabled={evaluationsActive}
            className="rounded border px-2 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <input
            placeholder="Commentaire note 3"
            value={form.commentaireTrois}
            onChange={(e) =>
              setForm({ ...form, commentaireTrois: e.target.value })
            }
            disabled={evaluationsActive}
            className="rounded border px-2 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={evaluationsActive}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editing ? "Mettre à jour" : "Ajouter"}
          </button>
          {editing ? (
            <button
              type="button"
              onClick={resetForm}
              disabled={evaluationsActive}
              className="rounded bg-gray-200 px-3 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
          ) : null}
        </div>
      </form>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
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
                  onClick={() => {
                    if (evaluationsActive) {
                      setToastMessage(
                        "Les questions ne peuvent pas être modifiées tant que des évaluations sont en cours.",
                      );
                      setTimeout(() => setToastMessage(null), 4000);
                    } else {
                      startEdit(q);
                    }
                  }}
                  disabled={evaluationsActive}
                  className="text-xs text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  Modifier
                </button>
                <AlertDialogTrigger asChild>
                  <button
                    type="button"
                    onClick={() => openDeleteDialog(q)}
                    disabled={evaluationsActive}
                    className="text-xs text-red-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    Supprimer
                  </button>
                </AlertDialogTrigger>
              </div>
            </li>
          ))}
        </ul>
        {questionToDelete && (
          <AlertDialogContent>
            <AlertDialogTitle>
              Êtes-vous sûr de supprimer cette question ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette question sera supprimée de toutes les évaluations.
              {questionnaire.evaluations &&
                questionnaire.evaluations.length > 0 && (
                  <>
                    <br />
                    <br />
                    Cette question est utilisée dans{" "}
                    {questionnaire.evaluations.length} évaluation
                    {questionnaire.evaluations.length > 1 ? "s" : ""}.
                  </>
                )}
            </AlertDialogDescription>
            <div className="flex gap-2 mt-6">
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction destructive onClick={handleDelete}>
                Supprimer
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </div>
  );
}
