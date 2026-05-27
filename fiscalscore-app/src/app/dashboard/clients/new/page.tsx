"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/api";

export default function NewClientPage() {
  const router = useRouter();
  const [nomEntreprise, setNomEntreprise] = useState("");
  const [nomResponsable, setNomResponsable] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [secteur, setSecteur] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!nomEntreprise.trim() || !nomResponsable.trim()) {
      setFeedback(
        "Le nom de l&apos;entreprise et le nom du responsable sont obligatoires.",
      );
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      await createClient({
        nomEntreprise: nomEntreprise.trim(),
        nomResponsable: nomResponsable.trim(),
        email: email.trim() || undefined,
        telephone: telephone.trim() || undefined,
        secteur: secteur.trim() || undefined,
      });
      router.push("/dashboard/clients");
    } catch (error: unknown) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "Impossible de créer le client.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nouveau client</h1>
        <p className="text-sm text-gray-500 mt-1">
          Ajouter une fiche client pour l&apos;évaluation comportementale.
        </p>
      </div>
      <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nom de l&apos;entreprise *
            </label>
            <input
              type="text"
              value={nomEntreprise}
              onChange={(e) => setNomEntreprise(e.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Responsable financier / comptable *
            </label>
            <input
              type="text"
              value={nomResponsable}
              onChange={(e) => setNomResponsable(e.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Téléphone
              </label>
              <input
                type="text"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Secteur d&apos;activité
            </label>
            <input
              type="text"
              value={secteur}
              onChange={(e) => setSecteur(e.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          {feedback ? (
            <div className="text-sm text-red-600">{feedback}</div>
          ) : null}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Enregistrement..." : "Créer le client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
