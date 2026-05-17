Set-Location "C:\QHM\fiscalscore-app"

$dirs = @(
  "src\app\dashboard\clients",
  "src\app\dashboard\questionnaires",
  "src\app\dashboard\evaluations",
  "src\components\layout",
  "src\components\dashboard",
  "src\components\clients",
  "src\components\ui-custom",
  "src\lib"
)
foreach ($d in $dirs) {
  New-Item -ItemType Directory -Force -Path $d | Out-Null
  Write-Host "OK Dossier: $d"
}

function WF($path, $content) {
  $dir = Split-Path $path
  if ($dir) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  [System.IO.File]::WriteAllText((Join-Path (Get-Location) $path), $content, [System.Text.Encoding]::UTF8)
  Write-Host "OK Fichier: $path"
}

WF ".env.local" "NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
NEXTAUTH_SECRET=fiscalscore-secret-change-en-production
NEXTAUTH_URL=http://localhost:3000
"

WF "src\app\page.tsx" 'import { redirect } from "next/navigation";
export default function Home() { redirect("/dashboard"); }
'

WF "src\app\layout.tsx" 'import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FiscalScore",
  description: "Plateforme evaluation fiscale",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
'

WF "src\app\dashboard\layout.tsx" 'import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
'

WF "src\app\dashboard\page.tsx" '"use client";
import StatsCard from "@/components/dashboard/StatsCard";
import ScoreChart from "@/components/dashboard/ScoreChart";
import RiskTable from "@/components/dashboard/RiskTable";
import { Users, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-sm text-gray-500 mt-1">Vue globale des evaluations fiscales</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard title="Total Clients" value="248" change="+12 ce mois" positive={true} icon={<Users className="w-5 h-5" />} color="blue" />
        <StatsCard title="Clients a risque" value="34" change="+3 cette semaine" positive={false} icon={<AlertTriangle className="w-5 h-5" />} color="red" />
        <StatsCard title="Score moyen" value="67/100" change="+4 pts vs mois dernier" positive={true} icon={<TrendingUp className="w-5 h-5" />} color="green" />
        <StatsCard title="Conformes" value="186" change="75% du total" positive={true} icon={<CheckCircle className="w-5 h-5" />} color="emerald" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ScoreChart />
        <RiskTable />
      </div>
    </div>
  );
}
'

WF "src\app\dashboard\clients\page.tsx" '"use client";
import { useState } from "react";
import ClientCard from "@/components/clients/ClientCard";
import { Search, Plus, Filter } from "lucide-react";

const mockClients = [
  { id: 1, nom: "Diallo", prenom: "Mamadou", identifiantFiscal: "SN-2021-00123", score: 82, telephone: "+221 77 123 45 67" },
  { id: 2, nom: "Ndiaye", prenom: "Fatou", identifiantFiscal: "SN-2020-00456", score: 45, telephone: "+221 76 234 56 78" },
  { id: 3, nom: "Sow", prenom: "Ibrahima", identifiantFiscal: "SN-2019-00789", score: 18, telephone: "+221 70 345 67 89" },
  { id: 4, nom: "Ba", prenom: "Aminata", identifiantFiscal: "SN-2022-00321", score: 71, telephone: "+221 78 456 78 90" },
  { id: 5, nom: "Cisse", prenom: "Omar", identifiantFiscal: "SN-2021-00654", score: 35, telephone: "+221 77 567 89 01" },
  { id: 6, nom: "Traore", prenom: "Aissatou", identifiantFiscal: "SN-2020-00987", score: 90, telephone: "+221 76 678 90 12" },
];

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const filtered = mockClients.filter(c =>
    c.nom.toLowerCase().includes(search.toLowerCase()) ||
    c.prenom.toLowerCase().includes(search.toLowerCase()) ||
    c.identifiantFiscal.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">{mockClients.length} clients enregistres</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          <Plus className="w-4 h-4" /> Nouveau client
        </button>
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Rechercher un client..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
          <Filter className="w-4 h-4" /> Filtres
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(client => <ClientCard key={client.id} client={client} />)}
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">Aucun client trouve</div>
      )}
    </div>
  );
}
'

WF "src\app\dashboard\questionnaires\page.tsx" '"use client";
import { FileText, Plus, Eye, Edit } from "lucide-react";

const questionnaires = [
  { id: 1, titre: "Conformite fiscale generale", questions: 12, evaluations: 48, actif: true },
  { id: 2, titre: "Ponctualite des declarations", questions: 8, evaluations: 32, actif: true },
  { id: 3, titre: "Transparence financiere", questions: 15, evaluations: 20, actif: false },
  { id: 4, titre: "Historique de paiement", questions: 10, evaluations: 56, actif: true },
];

export default function QuestionnairesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Questionnaires</h1>
          <p className="text-sm text-gray-500 mt-1">{questionnaires.length} questionnaires disponibles</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          <Plus className="w-4 h-4" /> Nouveau questionnaire
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Titre</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Questions</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Evaluations</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Statut</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {questionnaires.map(q => (
              <tr key={q.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-medium text-gray-900">{q.titre}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{q.questions} questions</td>
                <td className="px-6 py-4 text-gray-600">{q.evaluations} evaluations</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${q.actif ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {q.actif ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"><Eye className="w-4 h-4" /></button>
                    <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition"><Edit className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
'

WF "src\app\dashboard\evaluations\page.tsx" '"use client";
import { Plus } from "lucide-react";
import ScoreBadge from "@/components/ui-custom/ScoreBadge";

const evaluations = [
  { id: 1, client: "Mamadou Diallo", questionnaire: "Conformite fiscale generale", score: 82, date: "2026-05-10", evaluateur: "Agent Kone" },
  { id: 2, client: "Fatou Ndiaye", questionnaire: "Ponctualite des declarations", score: 45, date: "2026-05-09", evaluateur: "Agent Sy" },
  { id: 3, client: "Ibrahima Sow", questionnaire: "Transparence financiere", score: 18, date: "2026-05-08", evaluateur: "Agent Kone" },
  { id: 4, client: "Aminata Ba", questionnaire: "Historique de paiement", score: 71, date: "2026-05-07", evaluateur: "Agent Diop" },
  { id: 5, client: "Omar Cisse", questionnaire: "Conformite fiscale generale", score: 35, date: "2026-05-06", evaluateur: "Agent Sy" },
];

export default function EvaluationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Evaluations</h1>
          <p className="text-sm text-gray-500 mt-1">{evaluations.length} evaluations recentes</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          <Plus className="w-4 h-4" /> Nouvelle evaluation
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Client</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Questionnaire</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Score</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Date</th>
              <th className="text-left px-6 py-3 text-gray-500 font-medium">Evaluateur</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {evaluations.map(e => (
              <tr key={e.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {e.client.split(" ").map((n: string) => n[0]).join("").slice(0,2)}
                    </div>
                    <span className="font-medium text-gray-900">{e.client}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{e.questionnaire}</td>
                <td className="px-6 py-4"><ScoreBadge score={e.score} /></td>
                <td className="px-6 py-4 text-gray-500">{e.date}</td>
                <td className="px-6 py-4 text-gray-600">{e.evaluateur}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
'

WF "src\components\layout\Sidebar.tsx" '"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FileText, ClipboardCheck, BarChart3, Settings, Shield } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/questionnaires", label: "Questionnaires", icon: FileText },
  { href: "/dashboard/evaluations", label: "Evaluations", icon: ClipboardCheck },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-full shrink-0">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">FiscalScore</p>
            <p className="text-xs text-gray-400">Plateforme fiscale</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Menu</p>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
              <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-gray-100">
        <Link href="/dashboard/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
          <Settings className="w-4 h-4 text-gray-400" /> Parametres
        </Link>
        <div className="flex items-center gap-3 px-3 py-2.5 mt-1">
          <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">A</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">Administrateur</p>
            <p className="text-xs text-gray-400 truncate">admin@fiscalscore.sn</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
'

WF "src\components\layout\Header.tsx" '"use client";
import { Bell, Search } from "lucide-react";

export default function Header() {
  return (
    <header className="h-16 bg-white border-b border-gray-100 px-6 flex items-center justify-between shrink-0">
      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Recherche globale..."
          className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition" />
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full border border-amber-200">
          Developpement
        </span>
      </div>
    </header>
  );
}
'

WF "src\components\dashboard\StatsCard.tsx" 'type Color = "blue" | "red" | "green" | "emerald";
interface StatsCardProps { title: string; value: string; change: string; positive: boolean; icon: React.ReactNode; color: Color; }
const colorMap: Record<Color, { bg: string; icon: string }> = {
  blue: { bg: "bg-blue-50", icon: "text-blue-600" },
  red: { bg: "bg-red-50", icon: "text-red-600" },
  green: { bg: "bg-green-50", icon: "text-green-600" },
  emerald: { bg: "bg-emerald-50", icon: "text-emerald-600" },
};
export default function StatsCard({ title, value, change, positive, icon, color }: StatsCardProps) {
  const colors = colorMap[color];
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <div className={`w-9 h-9 ${colors.bg} rounded-lg flex items-center justify-center ${colors.icon}`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className={`text-xs font-medium ${positive ? "text-green-600" : "text-red-500"}`}>{change}</p>
    </div>
  );
}
'

WF "src\components\dashboard\ScoreChart.tsx" '"use client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { mois: "Jan", score: 58 }, { mois: "Fev", score: 62 }, { mois: "Mar", score: 55 },
  { mois: "Avr", score: 70 }, { mois: "Mai", score: 67 }, { mois: "Jun", score: 74 },
  { mois: "Jul", score: 71 }, { mois: "Aou", score: 78 }, { mois: "Sep", score: 73 },
  { mois: "Oct", score: 80 }, { mois: "Nov", score: 76 }, { mois: "Dec", score: 82 },
];

export default function ScoreChart() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900">Evolution du score moyen</h3>
        <p className="text-xs text-gray-400 mt-0.5">Score moyen sur 12 mois</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="mois" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis domain={[40, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
            formatter={(value) => [`${value}/100`, "Score moyen"]} />
          <Area type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2}
            fill="url(#scoreGradient)" dot={false} activeDot={{ r: 4, fill: "#2563eb" }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
'

WF "src\components\dashboard\RiskTable.tsx" 'import ScoreBadge from "@/components/ui-custom/ScoreBadge";

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
'

WF "src\components\ui-custom\ScoreBadge.tsx" 'interface ScoreBadgeProps { score: number; }

function getScoreConfig(score: number) {
  if (score <= 20) return { label: "Critique", className: "bg-red-100 text-red-700" };
  if (score <= 40) return { label: "Risque eleve", className: "bg-orange-100 text-orange-700" };
  if (score <= 60) return { label: "Moyen", className: "bg-yellow-100 text-yellow-700" };
  if (score <= 80) return { label: "Bon", className: "bg-blue-100 text-blue-700" };
  return { label: "Excellent", className: "bg-green-100 text-green-700" };
}

export default function ScoreBadge({ score }: ScoreBadgeProps) {
  const config = getScoreConfig(score);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.className}`}>
      <span className="font-bold">{score}</span>
      <span className="opacity-75"> {config.label}</span>
    </span>
  );
}
'

WF "src\components\clients\ClientCard.tsx" 'import Link from "next/link";
import ScoreBadge from "@/components/ui-custom/ScoreBadge";
import { Phone, FileText } from "lucide-react";

interface Client { id: number; nom: string; prenom: string; identifiantFiscal: string; score: number; telephone: string; }

export default function ClientCard({ client }: { client: Client }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
          {client.prenom[0]}{client.nom[0]}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{client.prenom} {client.nom}</p>
          <p className="text-xs text-gray-400 font-mono">{client.identifiantFiscal}</p>
        </div>
      </div>
      <div className="mb-4"><ScoreBadge score={client.score} /></div>
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Phone className="w-3.5 h-3.5 text-gray-400" />{client.telephone}
        </div>
      </div>
      <div className="flex gap-2 pt-3 border-t border-gray-50">
        <Link href={`/dashboard/clients/${client.id}`}
          className="flex-1 text-center text-xs font-medium text-blue-600 hover:text-blue-700 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition">
          Voir fiche
        </Link>
        <Link href={`/dashboard/evaluations/new?client=${client.id}`}
          className="flex-1 text-center text-xs font-medium text-gray-600 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition flex items-center justify-center gap-1">
          <FileText className="w-3 h-3" /> Evaluer
        </Link>
      </div>
    </div>
  );
}
'

WF "src\lib\strapi.ts" 'const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

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
'

Write-Host ""
Write-Host "============================================"
Write-Host "  Ossature creee avec succes !"
Write-Host "  Lance maintenant : npm run dev"
Write-Host "============================================"