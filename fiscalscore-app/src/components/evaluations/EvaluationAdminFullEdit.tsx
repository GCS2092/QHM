"use client";

import { useMemo, useState } from "react";
import { updateEvaluation } from "@/lib/api";
import { computeScoreFromNotes, getSeuil } from "@/lib/scoring";
import { commentaireAutoForNote } from "@/lib/commentaires-auto";
import type { Evaluation } from "@/lib/types";

type Row = {
  key: string;
  label: string;
  critere: string;
  questionId?: number | string;
  questionCustomId?: number | string;
  note: number;
  commentaireEvaluateur?: string;
  autoComment?: string;
};

export default function EvaluationAdminFullEdit({
  evaluation,
  onSaved,
}: {
  evaluation: Evaluation;
  onSaved: () => void;
}) {
  const qType = evaluation.questionnaire?.type ?? "planification";

  const initialRows = useMemo((): Row[] => {
    const rows: Row[] = [];
    evaluation.reponses?.forEach((r, i) => {
      if (r.question) {
        rows.push({
          key: `q_${r.question.id}`,
          label: r.question.texte,
          critere: r.question.critere ?? "",
          questionId: r.question.id,
          note: r.note,
          commentaireEvaluateur: r.commentaireEvaluateur,
          autoComment: commentaireAutoForNote(r.note, r.question),
        });
      } else if (r.questionCustom) {
        rows.push({
          key: `c_${r.questionCustom.id}`,
          label: r.questionCustom.texte,
          critere: r.questionCustom.critere,
          questionCustomId: r.questionCustom.id,
          note: r.note,
          commentaireEvaluateur: r.commentaireEvaluateur,
        });
      } else {
        rows.push({
          key: `r_${i}`,
          label: "Réponse",
          critere: "",
          note: r.note,
          commentaireEvaluateur: r.commentaireEvaluateur,
        });
      }
    });
    return rows;
  }, [evaluation]);

  const [rows, setRows] = useState(initialRows);
  const [commentaireGlobal, setCommentaireGlobal] = useState(evaluation.commentaireGlobal ?? "");
  const [commentaireConclusion, setCommentaireConclusion] = useState(evaluation.commentaireConclusion ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const scoreComputed = useMemo(() => {
    const notes = rows.map((r) => r.note);
    return computeScoreFromNotes(notes);
  }, [rows]);

  const seuil = getSeuil(scoreComputed.pourcentage, qType);

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.key !== key) return r;
        const next = { ...r, ...patch };
        if (patch.note !== undefined && r.questionId) {
          const q = evaluation.reponses?.find((x) => x.question?.id === r.questionId)?.question;
          next.autoComment = commentaireAutoForNote(patch.note, q);
        }
        return next;
      })
    );
  }

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    try {
      const reponses = rows.map((r) => ({
        question: r.questionId,
        questionCustom: r.questionCustomId,
        note: r.note,
        commentaireEvaluateur: r.commentaireEvaluateur,
      }));
      const questions_custom = (evaluation.questions_custom ?? []).map((cq) => ({
        critere: cq.critere,
        indicateur: cq.indicateur,
        texte: cq.texte,
        ordre: cq.ordre,
      }));

      await updateEvaluation(evaluation.id, {
        commentaireGlobal,
        commentaireConclusion,
        statut: "terminee",
        scoreFinal: scoreComputed.scoreObtained,
        scoreMaxReel: scoreComputed.scoreMaxReel,
        pourcentageScore: scoreComputed.pourcentage,
        reponses,
        questions_custom,
      });
      setMsg("Évaluation mise à jour (notes et scores recalculés).");
      onSaved();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-4">
      <h3 className="font-semibold text-gray-900">Modification admin — notes et commentaires</h3>
      <p className="text-xs text-gray-600">
        Score recalculé : {scoreComputed.scoreObtained} / {scoreComputed.scoreMaxReel} ({scoreComputed.pourcentage}%) — {seuil.label}
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="text-xs text-gray-600">Introduction</label>
          <textarea value={commentaireGlobal} onChange={(e) => setCommentaireGlobal(e.target.value)} className="mt-1 w-full rounded border px-2 py-1.5 text-sm" rows={2} />
        </div>
        <div>
          <label className="text-xs text-gray-600">Conclusion</label>
          <textarea value={commentaireConclusion} onChange={(e) => setCommentaireConclusion(e.target.value)} className="mt-1 w-full rounded border px-2 py-1.5 text-sm" rows={2} />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-3 py-2">Critère / question</th>
              <th className="px-3 py-2 w-28">Note</th>
              <th className="px-3 py-2">Comm. auto</th>
              <th className="px-3 py-2">Comm. libre</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.key}>
                <td className="px-3 py-2">
                  <div className="font-medium text-gray-800">{row.critere || "—"}</div>
                  <div className="text-xs text-gray-500">{row.label}</div>
                </td>
                <td className="px-3 py-2">
                  <select
                    value={row.note}
                    onChange={(e) => updateRow(row.key, { note: Number(e.target.value) })}
                    className="w-full rounded border px-2 py-1 text-sm"
                  >
                    {[0, 1, 2, 3].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 text-xs text-gray-500 max-w-[140px]">{row.autoComment ?? "—"}</td>
                <td className="px-3 py-2">
                  <input
                    value={row.commentaireEvaluateur ?? ""}
                    onChange={(e) => updateRow(row.key, { commentaireEvaluateur: e.target.value })}
                    className="w-full rounded border px-2 py-1 text-sm"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button type="button" onClick={handleSave} disabled={saving} className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50">
        {saving ? "Enregistrement…" : "Enregistrer les modifications"}
      </button>
      {msg ? <p className="text-xs text-gray-600">{msg}</p> : null}
    </div>
  );
}