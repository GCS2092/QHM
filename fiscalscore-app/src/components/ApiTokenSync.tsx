"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { setApiAuthToken } from "@/lib/api";

/** Synchronise le JWT Strapi pour les appels API côté client. */
export default function ApiTokenSync() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return; // attendre que la session soit prête
    const token = (session?.user as { accessToken?: string })?.accessToken;
    setApiAuthToken(token);
  }, [session, status]);

  return null;
}