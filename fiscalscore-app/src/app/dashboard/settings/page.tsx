"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  getUsers,
  getAssignations,
  createEvaluatorUser,
  deleteUser,
  updateUser,
} from "@/lib/api";
import { isAdminRole } from "@/lib/scoring";
import { Trash2, Edit2, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

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
  const [editingUser, setEditingUser] = useState<NormalizedUser | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editFeedback, setEditFeedback] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{
    id: number | string;
    name: string;
  } | null>(null);

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
    const tkn = (session?.user as { accessToken?: string })?.accessToken;
    try {
      await createEvaluatorUser(
        {
          username: username.trim(),
          email: email.trim(),
          password,
        },
        tkn,
      );
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

  async function handleDeleteEvaluator() {
    if (!userToDelete) return;
    const { id, name } = userToDelete;
    const tkn = (session?.user as { accessToken?: string })?.accessToken;
    setDeletingId(id);
    setFeedback(null);
    try {
      await deleteUser(id, tkn);
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
      setUserToDelete(null);
      setDeleteDialogOpen(false);
    }
  }

  function openDeleteDialog(id: number | string, name: string) {
    setUserToDelete({ id, name });
    setDeleteDialogOpen(true);
  }

  function openEditModal(user: NormalizedUser) {
    setEditingUser(user);
    setEditEmail(user.email);
    setEditPassword("");
    setEditFeedback(null);
  }

  function closeEditModal() {
    setEditingUser(null);
    setEditEmail("");
    setEditPassword("");
    setEditFeedback(null);
  }

  async function handleUpdateEvaluator(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;

    setEditFeedback(null);
    const tkn = (session?.user as { accessToken?: string })?.accessToken;
    try {
      await updateUser(
        editingUser.id,
        {
          email: editEmail.trim(),
          password: editPassword.length > 0 ? editPassword : undefined,
        },
        tkn,
      );
      setEditFeedback("Évaluateur modifié avec succès.");
      closeEditModal();
      await loadData();
    } catch (err: unknown) {
      setEditFeedback(
        err instanceof Error
          ? err.message
          : "Impossible de modifier le compte.",
      );
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
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(u)}
                    className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-2.5 py-1 text-xs text-blue-700 hover:bg-blue-50"
                    title="Modifier ce compte"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Modifier
                  </button>
                  <AlertDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                  >
                    <AlertDialogTrigger asChild>
                      <button
                        type="button"
                        onClick={() => openDeleteDialog(u.id, u.username)}
                        disabled={deletingId === u.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
                        title="Supprimer ce compte"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {deletingId === u.id ? "Suppression..." : "Supprimer"}
                      </button>
                    </AlertDialogTrigger>
                    {userToDelete && (
                      <AlertDialogContent>
                        <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Êtes-vous sûr de vouloir supprimer{" "}
                          <strong>{userToDelete.name}</strong> ?
                        </AlertDialogDescription>
                        <AlertDialogDescription>
                          Cette action est irréversible et supprimera tous les
                          accès de cet évaluateur.
                        </AlertDialogDescription>
                        <div className="flex gap-2 pt-4">
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            destructive
                            onClick={handleDeleteEvaluator}
                            disabled={deletingId === userToDelete.id}
                          >
                            {deletingId === userToDelete.id
                              ? "Suppression..."
                              : "Supprimer"}
                          </AlertDialogAction>
                        </div>
                      </AlertDialogContent>
                    )}
                  </AlertDialog>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal de modification */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">
                Modifier l&apos;évaluateur
              </h3>
              <button
                onClick={closeEditModal}
                className="p-1 hover:bg-gray-100 rounded-lg"
                title="Fermer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleUpdateEvaluator} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe (optionnel)
                </label>
                <input
                  type="password"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  placeholder="Laisser vide pour ne pas changer"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  minLength={editPassword.length > 0 ? 8 : undefined}
                />
              </div>

              {editFeedback ? (
                <p
                  className={`text-sm ${
                    editFeedback.includes("succès")
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {editFeedback}
                </p>
              ) : null}

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Valider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
