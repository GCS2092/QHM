"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { setApiAuthToken } from "@/lib/api";

/** Synchronise le JWT Strapi pour les appels API côté client. */
export default function ApiTokenSync() {
  const { data: session } = useSession();
  useEffect(() => {
    setApiAuthToken((session?.user as { accessToken?: string })?.accessToken);
  }, [session]);
  return null;
}
