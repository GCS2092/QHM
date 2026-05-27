"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  ClipboardCheck,
  BarChart3,
  Settings,
  Shield,
} from "lucide-react";
import { isAdminRole } from "@/lib/scoring";

const allNavItems = [
  {
    href: "/dashboard",
    label: "Tableau de bord",
    icon: LayoutDashboard,
    adminOnly: false,
  },
  {
    href: "/dashboard/clients",
    label: "Clients",
    icon: Users,
    adminOnly: false,
  },
  {
    href: "/dashboard/questionnaires",
    label: "Questionnaires",
    icon: FileText,
    adminOnly: true,
  },
  {
    href: "/dashboard/evaluations",
    label: "Évaluations",
    icon: ClipboardCheck,
    adminOnly: false,
  },
  {
    href: "/dashboard/analytics",
    label: "Analytics",
    icon: BarChart3,
    adminOnly: true,
  },
];

export default function Sidebar({
  userRole,
  userName,
  userEmail,
}: {
  userRole?: string;
  userName?: string;
  userEmail?: string;
}) {
  const pathname = usePathname();
  const isAdmin = isAdminRole(userRole);
  const navItems = allNavItems.filter((item) => !item.adminOnly || isAdmin);
  const initials = (userName ?? userEmail ?? "U").slice(0, 2).toUpperCase();

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-full shrink-0">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">Auditude</p>
            <p className="text-xs text-gray-400">Évaluation comportementale</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
          Menu
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
            >
              <Icon
                className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-gray-400"}`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-gray-100">
        {isAdmin ? (
          <Link
            href="/dashboard/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${pathname === "/dashboard/settings" ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}
          >
            <Settings className="w-4 h-4 text-gray-400" /> Paramètres
          </Link>
        ) : null}
        <div className="flex items-center gap-3 px-3 py-2.5 mt-1">
          <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">
              {userName ?? "Utilisateur"}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {isAdmin ? "Administrateur" : "Évaluateur"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
