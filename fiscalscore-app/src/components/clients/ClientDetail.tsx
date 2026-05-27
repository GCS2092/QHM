"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  getClientById,
  getAssignations,
  getEvaluatorUsers,
  createAssignation,
  deleteAssignation,
  updateClient,
  deleteClient,
} from "@/lib/api";
import { Pencil } from "lucide-react";
import ScoreBadge from "@/components/ui-custom/ScoreBadge";
import EvaluationPdfButton from "@/components/evaluations/EvaluationPdfButton";
import { isAdminRole } from "@/lib/scoring";
import type { Client, Evaluation } from "@/lib/types";

export default function ClientDetail({ clientId }: { clientId: string }) {
  const { data: session } = useSession();
  const isAdmin = isAdminRole((session?.user as { role?: string })?.role);
  const userId = Number((session?.user as { id?: string })?.id);
  const userName = session?.user?.name ?? "";

  const [client, setClient] = useState<
    (Client & { evaluations?: Evaluation[] }) | null
  >(null);
  const [assignationIds, setAssignationIds] = useState<Record<number, number>>(
    {},
  );
  const [evaluators, setEvaluators] = useState<
    Array<{ id: number; username: string }>
  >([]);
  const [selectedEvaluator, setSelectedEvaluator] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    nomEntreprise: "",
    nomResponsable: "",
    email: "",
    telephone: "",
    secteur: "",
  });

  async function reload() {
    const c = await getClientById(clientId);
    setClient(c);
    if (c) {
      setEditForm({
        nomEntreprise: c.nomEntreprise,
        nomResponsable: c.nomResponsable,
        email: c.email ?? "",
        telephone: c.telephone ?? "",
        secteur: c.secteur ?? "",
      });
    }
    if (isAdmin) {
      const assigns = await getAssignations();
      const map: Record<number, number> = {};
      assigns
        .filter((a) => a.clientId === Number(clientId))
        .forEach((a) => {
          map[a.evaluateurId] = a.id;
        });
      setAssignationIds(map);
    }
  }

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!cancelled) setLoading(true);
      await Promise.all([
        reload(),
        isAdmin
          ? getEvaluatorUsers()
              .then((data) => {
                if (!cancelled) setEvaluators(data);
              })
              .catch(() => {})
          : Promise.resolve(),
      ]);
      if (!cancelled) setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, isAdmin]);

  const evaluations = isAdmin
    ? (client?.evaluations ?? [])
    : (client?.evaluations ?? []).filter(
        (e) =>
          e.evaluateur === userName || e.evaluateurUtilisateurId === userId,
      );

  async function handleAssign() {
    if (!selectedEvaluator || !client) return;
    await createAssignation({
      client: client.id,
      evaluateur: Number(selectedEvaluator),
      dateAssignation: new Date().toISOString().slice(0, 10),
    });
    setSelectedEvaluator("");
    await reload();
  }

  async function handleUnassign(evaluatorId: number) {
    const assignId = assignationIds[evaluatorId];
    if (!assignId) return;
    await deleteAssignation(assignId);
    await reload();
  }

  async function toggleArchive() {
    if (!client) return;
    await updateClient(client.id, { archive: !client.archive });
    await reload();
  }

  async function saveEdit() {
    if (!client) return;
    await updateClient(client.id, {
      nomEntreprise: editForm.nomEntreprise.trim(),
      nomResponsable: editForm.nomResponsable.trim(),
      email: editForm.email.trim() || undefined,
      telephone: editForm.telephone.trim() || undefined,
      secteur: editForm.secteur.trim() || undefined,
    });
    setEditing(false);
    await reload();
  }

  async function handleDelete() {
    if (!client || !confirm("Supprimer définitivement ce client ?")) return;
    await deleteClient(client.id);
    window.location.href = "/dashboard/clients";
  }

  if (loading) return <div className="text-gray-500">Chargement...</div>;
  if (!client) return <div className="text-gray-500">Client introuvable</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {client.nomEntreprise}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{client.nomResponsable}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isAdmin ? (
            <>
              <button
                type="button"
                onClick={() => setEditing((v) => !v)}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
              >
                {editing ? "Annuler" : "Modifier"}
              </button>
              <button
                type="button"
                onClick={toggleArchive}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
              >
                {client.archive ? "Désarchiver" : "Archiver"}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-lg border border-red-200 text-red-700 px-4 py-2 text-sm hover:bg-red-50"
              >
                Supprimer
              </button>
            </>
          ) : null}
          {!client.archive ? (
            <Link
              href={`/dashboard/evaluations/new?client=${client.id}`}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              Commencer une évaluation
            </Link>
          ) : null}
        </div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
        {editing && isAdmin ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <input
                className="rounded-lg border px-3 py-2 text-sm"
                value={editForm.nomEntreprise}
                onChange={(e) =>
                  setEditForm({ ...editForm, nomEntreprise: e.target.value })
                }
                placeholder="Nom entreprise"
              />
              <input
                className="rounded-lg border px-3 py-2 text-sm"
                value={editForm.nomResponsable}
                onChange={(e) =>
                  setEditForm({ ...editForm, nomResponsable: e.target.value })
                }
                placeholder="Responsable"
              />
              <input
                className="rounded-lg border px-3 py-2 text-sm"
                value={editForm.telephone}
                onChange={(e) =>
                  setEditForm({ ...editForm, telephone: e.target.value })
                }
                placeholder="Téléphone"
              />
              <input
                className="rounded-lg border px-3 py-2 text-sm"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm({ ...editForm, email: e.target.value })
                }
                placeholder="Email"
              />
              <input
                className="rounded-lg border px-3 py-2 text-sm md:col-span-2"
                value={editForm.secteur}
                onChange={(e) =>
                  setEditForm({ ...editForm, secteur: e.target.value })
                }
                placeholder="Secteur"
              />
            </div>
            <button
              type="button"
              onClick={saveEdit}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
            >
              Enregistrer
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3 text-gray-600">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500">
                  Téléphone
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {client.telephone ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500">
                  Email
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {client.email ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500">
                  Secteur
                </p>
                <p className="mt-1 font-medium text-gray-900">
                  {client.secteur ?? "—"}
                </p>
              </div>
            </div>
            {client.dateCreation ? (
              <p className="mt-4 text-xs text-gray-400">
                Fiche créée le{" "}
                {new Date(client.dateCreation).toLocaleDateString("fr-FR")}
              </p>
            ) : null}
          </>
        )}
      </div>

      {isAdmin ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">
            Évaluateurs assignés
          </h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.keys(assignationIds).map((eid) => {
              const ev = evaluators.find((e) => e.id === Number(eid));
              return (
                <span
                  key={eid}
                  className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-800"
                >
                  {ev?.username ?? `Utilisateur #${eid}`}
                  <button
                    type="button"
                    onClick={() => handleUnassign(Number(eid))}
                    className="text-blue-600 hover:text-red-600"
                  >
                    ×
                  </button>
                </span>
              );
            })}
            {Object.keys(assignationIds).length === 0 ? (
              <span className="text-sm text-gray-500">
                Aucun évaluateur assigné
              </span>
            ) : null}
          </div>
          <div className="flex gap-2">
            <select
              value={selectedEvaluator}
              onChange={(e) => setSelectedEvaluator(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm flex-1"
            >
              <option value="">Choisir un évaluateur</option>
              {evaluators
                .filter((e) => !assignationIds[e.id])
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.username}
                  </option>
                ))}
            </select>
            <button
              type="button"
              onClick={handleAssign}
              disabled={!selectedEvaluator}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              Assigner
            </button>
          </div>
        </div>
      ) : null}

      <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-4">
          Historique des évaluations
        </h2>
        {evaluations.length === 0 ? (
          <p className="text-sm text-gray-500">
            Aucune évaluation pour ce client.
          </p>
        ) : (
          <div className="space-y-3">
            {evaluations.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-gray-100 p-4 bg-gray-50"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <Link
                      href={`/dashboard/evaluations/${item.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {item.questionnaire?.titre ?? "Questionnaire"}
                    </Link>
                    <p className="text-sm text-gray-500">
                      {item.dateEvaluation} — {item.evaluateur} —{" "}
                      {item.statut === "en_cours" ? "En cours" : "Terminée"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {item.statut === "terminee" ? (
                      <ScoreBadge
                        pourcentage={item.pourcentageScore}
                        type={item.questionnaire?.type}
                      />
                    ) : (
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                        En cours
                      </span>
                    )}
                    {item.statut === "en_cours" ? (
                      <Link
                        href={`/dashboard/evaluations/${item.id}/edit`}
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100"
                      >
                        <Pencil className="w-3 h-3" /> Reprendre
                      </Link>
                    ) : null}
                    <EvaluationPdfButton
                      evaluationId={item.id}
                      evaluation={item.statut === "terminee" ? item : undefined}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
