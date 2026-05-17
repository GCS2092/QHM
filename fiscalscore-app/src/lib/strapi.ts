const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

export async function strapiGet(path: string, token?: string) {
  const res = await fetch(`${STRAPI_URL}/api${path}`, {
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Strapi GET error: ${res.status}`);
  return res.json();
}

export async function strapiPost(path: string, data: unknown, token?: string) {
  const res = await fetch(`${STRAPI_URL}/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ data }),
  });
  if (!res.ok) throw new Error(`Strapi POST error: ${res.status}`);
  return res.json();
}

export function calculerScore(reponses: { note: number; coefficient: number }[]): number {
  if (reponses.length === 0) return 0;
  const sommeNotes = reponses.reduce((acc, r) => acc + r.note * r.coefficient, 0);
  const sommeCoeff = reponses.reduce((acc, r) => acc + r.coefficient, 0);
  return Math.round((sommeNotes / sommeCoeff) * 20);
}

export function classifierScore(score: number): string {
  if (score <= 20) return "Critique";
  if (score <= 40) return "Risque eleve";
  if (score <= 60) return "Moyen";
  if (score <= 80) return "Bon";
  return "Excellent";
}
