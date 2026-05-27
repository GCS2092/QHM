import ScoreBadge from "@/components/ui-custom/ScoreBadge";

type RiskItem = {
  nom: string;
  pourcentage: number;
  alerte: string;
};

interface RiskTableProps {
  risks?: RiskItem[];
}

export default function RiskTable({ risks }: RiskTableProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900">Clients à surveiller</h3>
        <p className="text-xs text-gray-400 mt-0.5">Seuil rouge (risque comportemental élevé)</p>
      </div>
      {risks && risks.length > 0 ? (
        <div className="space-y-3">
          {risks.map((client, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center text-red-600 text-xs font-bold">
                  {client.nom.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{client.nom}</p>
                  <p className="text-xs text-gray-400">{client.alerte}</p>
                </div>
              </div>
              <ScoreBadge pourcentage={client.pourcentage} showLabel={false} />
            </div>
          ))}
        </div>
      ) : (
        <div className="py-10 text-center text-sm text-gray-500">Aucun client à risque élevé dans les évaluations actuelles.</div>
      )}
    </div>
  );
}
