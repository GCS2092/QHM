"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  getUsers,
  getAssignations,
  createEvaluatorUser,
  deleteUser,
} from "@/lib/api";
import { isAdminRole } from "@/lib/scoring";
import { Trash2 } from "lucide-react";

interface NormalizedUser {
  id: number | string;
  username: string;
  email: string;
  role?: string;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const isAdmin = isAdminRole((session?.user as { role?: string })?.role);
  const [users, setUsers] = useState<NormalizedUser[]>([]);
  const [assignations, setAssignations] = useState<
    Array<{
      id: number | string;
      client?: { nomEntreprise?: string };
      evaluateur?: { username?: string };
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);

  async function loadData() {
    const [u, a] = await Promise.all([getUsers(), getAssignations()]);
    setUsers(u);
    setAssignations(a);
  }

  useEffect(() => {
    let cancelled = false;

    if (!isAdmin) {
      Promise.resolve().then(() => {
        if (!cancelled) setLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }

    loadData()
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  async function handleCreateEvaluator(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    try {
      await createEvaluatorUser({
        username: username.trim(),
        email: email.trim(),
        password,
      });
      setFeedback("Compte évaluateur créé.");
      setUsername("");
      setEmail("");
      setPassword("");
      await loadData();
    } catch (err: unknown) {
      setFeedback(
        err instanceof Error ? err.message : "Impossible de créer le compte.",
      );
    }
  }

  async function handleDeleteEvaluator(id: number | string, name: string) {
    if (!confirm(`Supprimer définitivement le compte « ${name} » ?`)) return;
    setDeletingId(id);
    setFeedback(null);
    try {
      await deleteUser(id);
      setFeedback(`Compte « ${name} » supprimé.`);
      await loadData();
    } catch (err: unknown) {
      setFeedback(
        err instanceof Error
          ? err.message
          : "Impossible de supprimer le compte.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-sm text-gray-500">Réservé aux administrateurs.</p>
      </div>
    );
  }

  const evaluators = users.filter(
    (u) => (u.role ?? "").toLowerCase() === "evaluateur",
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Paramètres — Administration
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Gestion des comptes évaluateurs et vue des assignations.
        </p>
      </div>

      {/* Créer un évaluateur */}
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">
          Créer un compte évaluateur
        </h2>
        <form
          onSubmit={handleCreateEvaluator}
          className="grid gap-4 md:grid-cols-3 max-w-3xl"
        >
          <input
            className="rounded-lg border px-3 py-2 text-sm"
            placeholder="Nom d'utilisateur"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="email"
            className="rounded-lg border px-3 py-2 text-sm"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="rounded-lg border px-3 py-2 text-sm"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <button
            type="submit"
            className="md:col-span-3 w-fit rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
          >
            Créer l&apos;évaluateur
          </button>
        </form>
        {feedback ? (
          <p className="mt-3 text-sm text-gray-600">{feedback}</p>
        ) : null}
      </div>

      {/* Liste évaluateurs */}
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">
          Évaluateurs ({evaluators.length})
        </h2>
        {loading ? (
          <p className="text-sm text-gray-500">Chargement...</p>
        ) : evaluators.length === 0 ? (
          <p className="text-sm text-gray-500">
            Aucun évaluateur. Créez-en un ci-dessus ou lancez{" "}
            <code className="text-xs bg-gray-100 px-1 rounded">
              npm run seed:qhm
            </code>{" "}
            dans fiscalscore-cms.
          </p>
        ) : (
          <ul className="divide-y">
            {evaluators.map((u) => (
              <li
                key={String(u.id)}
                className="py-3 flex items-center justify-between gap-4 text-sm"
              >
                <div>
                  <span className="font-medium text-gray-900">
                    {u.username}
                  </span>
                  <span className="ml-3 text-gray-500">{u.email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteEvaluator(u.id, u.username)}
                  disabled={deletingId === u.id}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
                  title="Supprimer ce compte"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {deletingId === u.id ? "Suppression..." : "Supprimer"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Assignations */}
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">Assignations</h2>
        <p className="text-sm text-gray-500 mb-4">
          Gérez les assignations depuis la fiche de chaque client.
        </p>
        {assignations.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune assignation.</p>
        ) : (
          <ul className="divide-y text-sm">
            {assignations.map((a) => (
              <li key={String(a.id)} className="py-2 flex justify-between">
                <span>{a.client?.nomEntreprise ?? "Client"}</span>
                <span className="text-gray-500">
                  → {a.evaluateur?.username ?? "Évaluateur"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}