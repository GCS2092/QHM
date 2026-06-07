// lib/api-auth.ts
"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { setApiAuthToken } from "./api";

export function ApiAuthProvider() {
  const { data: session } = useSession();

  useEffect(() => {
    const token = (session as { accessToken?: string })?.accessToken;
    setApiAuthToken(token);
  }, [session]);

  return null;
}