"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getEvaluationById } from "@/lib/api";
import type { Evaluation } from "@/lib/types";

// @react-pdf/renderer utilise des APIs browser (Blob, Canvas).
// Le dynamic import avec ssr:false empeche le crash cote serveur.
const EvaluationPdfExport = dynamic(() => import("./EvaluationPdfExport"), {
  ssr: false,
  loading: () => <span className="text-xs text-gray-400">PDF…</span>,
});

type Props = {
  evaluationId: number;
  /** Si l'évaluation complète est déjà chargée (évite un fetch) */
  evaluation?: Evaluation;
  variant?: "default" | "compact";
  onClick?: (e: React.MouseEvent) => void;
};

export default function EvaluationPdfButton({
  evaluationId,
  evaluation: initial,
  variant = "compact",
  onClick,
}: Props) {
  const [evaluation, setEvaluation] = useState<Evaluation | null>(
    initial ?? null,
  );
  const [loading, setLoading] = useState(!initial);

  useEffect(() => {
    if (initial) {
      return;
    }
    void (async () => {
      setLoading(true);
      try {
        const data = await getEvaluationById(String(evaluationId));
        setEvaluation(data);
      } catch {
        setEvaluation(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [evaluationId, initial]);

  if (loading) {
    return <span className="text-xs text-gray-400">PDF…</span>;
  }
  if (!evaluation || evaluation.statut !== "terminee") {
    return null;
  }

  const stopNav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick?.(e);
  };

  if (variant === "compact") {
    return (
      <span
        onClick={stopNav}
        onKeyDown={(e) => e.stopPropagation()}
        role="presentation"
      >
        <EvaluationPdfExport
          evaluation={evaluation}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
          label="PDF"
        />
      </span>
    );
  }

  return (
    <span onClick={stopNav} role="presentation">
      <EvaluationPdfExport evaluation={evaluation} />
    </span>
  );
}
