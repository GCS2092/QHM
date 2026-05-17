import ScoreBadge from "@/components/ui-custom/ScoreBadge";

const risques = [
  { nom: "Ibrahima Sow", score: 18, alerte: "Non-declaration" },
  { nom: "Omar Cisse", score: 35, alerte: "Retards repetes" },
  { nom: "Fatou Ndiaye", score: 45, alerte: "Incoherences" },
  { nom: "Modou Fall", score: 22, alerte: "Fraude suspectee" },
  { nom: "Rokhaya Diop", score: 38, alerte: "Dossier incomplet" },
];

export default function RiskTable() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900">Clients a surveiller</h3>
        <p className="text-xs text-gray-400 mt-0.5">Score inferieur a 50</p>
      </div>
      <div className="space-y-3">
        {risques.map((client, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center text-red-600 text-xs font-bold">
                {client.nom.split(" ").map((n: string) => n[0]).join("").slice(0,2)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{client.nom}</p>
                <p className="text-xs text-gray-400">{client.alerte}</p>
              </div>
            </div>
            <ScoreBadge score={client.score} />
          </div>
        ))}
      </div>
    </div>
  );
}
