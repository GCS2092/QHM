"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import EvaluationForm from "@/components/evaluations/EvaluationForm";

export default function EvaluationEditPage() {
  const params = useParams();
  const id = String(params?.id ?? "");

  return (
    <div className="space-y-4">
      <Link href={`/dashboard/evaluations/${id}`} className="text-sm text-blue-600 hover:underline">
        ← Retour à l&apos;évaluation
      </Link>
      <EvaluationForm editEvaluationId={id} />
    </div>
  );
}
