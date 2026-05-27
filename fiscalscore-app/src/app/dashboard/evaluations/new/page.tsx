"use client";

import EvaluationForm from "@/components/evaluations/EvaluationForm";

export default function EvaluationNewPage() {
  // simple wrapper: the heavy lifting is in the client component
  return (
    <div className="space-y-6">
      <EvaluationForm />
    </div>
  );
}
