"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { createClient } from "@/lib/api";

function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function validatePhone(phone: string): boolean {
  const regex = /^[\d\s\-+()]+$/;
  return regex.test(phone) && phone.trim().length >= 7;
}

export default function NewClientPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [nomEntreprise, setNomEntreprise] = useState("");
  const [nomResponsable, setNomResponsable] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [secteur, setSecteur] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!nomEntreprise.trim() || !nomResponsable.trim()) {
      setFeedback(
        "Le nom de l'entreprise et le nom du responsable sont obligatoires.",
      );
      return;
    }

    if (email && !validateEmail(email)) {
      newErrors.email = "Email invalide";
    }

    if (telephone && !validatePhone(telephone)) {
      newErrors.telephone =
        "Téléphone invalide (chiffres et tirets uniquement)";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    setFeedback(null);
    setErrors({});

    try {
      const tkn = (session?.user as { accessToken?: string })?.accessToken;
      const response = await createClient(
        {
          nomEntreprise: nomEntreprise.trim(),
          nomResponsable: nomResponsable.trim(),
          email: email.trim() || undefined,
          telephone: telephone.trim() || undefined,
          secteur: secteur.trim() || undefined,
        },
        tkn,
      );
      const clientId = (response as { id: string }).id;
      router.push(`/dashboard/clients/${clientId}`);
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
                className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm ${
                  errors.telephone
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200"
                }`}
              />
              {errors.telephone && (
                <p className="mt-1 text-sm text-red-600">{errors.telephone}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm ${
                  errors.email ? "border-red-500 bg-red-50" : "border-gray-200"
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
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
