import { getClientById } from "@/lib/api";
import type { Client, Evaluation } from "@/lib/types";

type ClientPageProps = {
  params: { id: string };
};

export default async function ClientDetailPage({ params }: ClientPageProps) {
  let client: (Client & { evaluations?: Evaluation[] }) | null = null;
  try {
    client = await getClientById(params.id);
  } catch {
    client = null;
  }

  if (!client) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fiche client</h1>
          <p className="text-sm text-gray-500 mt-1">Client introuvable</p>
        </div>
      </div>
    );
  }

  const evaluations = client.evaluations ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fiche client</h1>
        <p className="text-sm text-gray-500 mt-1">Detail du client {client.prenom} {client.nom}</p>
      </div>
      <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Nom complet</p>
            <p className="mt-2 text-lg font-semibold text-gray-900">{client.prenom} {client.nom}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Score fiscal</p>
            <p className="mt-2 text-lg font-semibold text-green-600">{client.score ?? 0} / 100</p>
          </div>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3 text-gray-600">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Identifiant fiscal</p>
            <p className="mt-2 font-medium text-gray-900">{client.identifiantFiscal}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Telephone</p>
            <p className="mt-2 font-medium text-gray-900">{client.telephone ?? 'Non renseigne'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Email</p>
            <p className="mt-2 font-medium text-gray-900">{client.email ?? 'Non renseigne'}</p>
          </div>
        </div>
      </div>
      <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm font-medium text-gray-900">Evaluations recentes</p>
            <p className="text-xs text-gray-500">{evaluations.length} enregistrees</p>
          </div>
        </div>
        {evaluations.length === 0 ? (
          <div className="text-sm text-gray-500">Aucune evaluation trouvee pour ce client.</div>
        ) : (
          <div className="space-y-4">
            {evaluations.filter(Boolean).map((item) => (
              <div key={item.id} className="rounded-2xl border border-gray-100 p-4 bg-gray-50">
                <p className="font-semibold text-gray-900">{item.questionnaire?.titre ?? 'Questionnaire inconnu'}</p>
                <p className="text-sm text-gray-600">Score: {item.score ?? 0} / 100</p>
                <p className="text-sm text-gray-500">Date: {item.date}</p>
                <p className="text-sm text-gray-500">Evaluateur: {item.evaluateur}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
