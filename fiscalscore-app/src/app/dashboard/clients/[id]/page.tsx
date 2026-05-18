import { strapiGet } from "@/lib/strapi";

type ClientPageProps = {
  params: { id: string };
};

async function getClient(id: string) {
  const res = await strapiGet(`/clients/${id}`, { populate: '*' });
  return res.data;
}

export default async function ClientDetailPage({ params }: ClientPageProps) {
  let client: any;
  try {
    client = await getClient(params.id);
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

  const attrs = client.attributes;
  const evaluations = attrs.evaluations?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fiche client</h1>
        <p className="text-sm text-gray-500 mt-1">Detail du client {attrs.prenom} {attrs.nom}</p>
      </div>
      <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Nom complet</p>
            <p className="mt-2 text-lg font-semibold text-gray-900">{attrs.prenom} {attrs.nom}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Score fiscal</p>
            <p className="mt-2 text-lg font-semibold text-green-600">{attrs.score ?? 0} / 100</p>
          </div>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3 text-gray-600">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Identifiant fiscal</p>
            <p className="mt-2 font-medium text-gray-900">{attrs.identifiantFiscal}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Telephone</p>
            <p className="mt-2 font-medium text-gray-900">{attrs.telephone ?? 'Non renseigne'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Email</p>
            <p className="mt-2 font-medium text-gray-900">{attrs.email ?? 'Non renseigne'}</p>
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
            {evaluations.map((item: any) => (
              <div key={item.id} className="rounded-2xl border border-gray-100 p-4 bg-gray-50">
                <p className="font-semibold text-gray-900">{item.attributes.questionnaire?.data?.attributes?.titre ?? 'Questionnaire inconnu'}</p>
                <p className="text-sm text-gray-600">Score: {item.attributes.score} / 100</p>
                <p className="text-sm text-gray-500">Date: {item.attributes.date}</p>
                <p className="text-sm text-gray-500">Evaluateur: {item.attributes.evaluateur}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
