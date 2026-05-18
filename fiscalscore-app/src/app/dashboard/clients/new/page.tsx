"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/api";

export default function NewClientPage() {
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [identifiantFiscal, setIdentifiantFiscal] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!nom.trim() || !prenom.trim() || !identifiantFiscal.trim()) {
      setFeedback("Les champs nom, prénom et identifiant fiscal sont requis.");
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      await createClient({
        nom: nom.trim(),
        prenom: prenom.trim(),
        identifiantFiscal: identifiantFiscal.trim(),
        email: email.trim() || undefined,
        telephone: telephone.trim() || undefined,
      });
      router.push('/dashboard/clients');
    } catch (error: any) {
      setFeedback(error?.message ?? "Impossible de creer le client.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nouveau client</h1>
        <p className="text-sm text-gray-500 mt-1">Ajouter un nouveau client fiscal a votre base.</p>
      </div>
      <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Prénom</label>
              <input
                type="text"
                value={prenom}
                onChange={(event) => setPrenom(event.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder="Prénom"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nom</label>
              <input
                type="text"
                value={nom}
                onChange={(event) => setNom(event.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder="Nom"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Identifiant fiscal</label>
            <input
              type="text"
              value={identifiantFiscal}
              onChange={(event) => setIdentifiantFiscal(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Ex: FR123456789"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Telephone</label>
              <input
                type="text"
                value={telephone}
                onChange={(event) => setTelephone(event.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder="Téléphone"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder="Adresse email"
              />
            </div>
          </div>
          {feedback ? <div className="text-sm text-red-600">{feedback}</div> : null}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : 'Creer le client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
