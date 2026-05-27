export const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

type StrapiParams = Record<
  string,
  string | number | boolean | Array<string | number | boolean>
>;

function buildStrapiUrl(path: string, params?: StrapiParams) {
  const base = `${STRAPI_URL}/api${path}`;
  if (!params || Object.keys(params).length === 0) return base;

  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      value.forEach((item) =>
        parts.push(`${key}=${encodeURIComponent(String(item))}`),
      );
    } else {
      parts.push(`${key}=${encodeURIComponent(String(value))}`);
    }
  }
  return `${base}?${parts.join("&")}`;
}

export async function strapiGet(
  path: string,
  params?: StrapiParams,
  token?: string,
) {
  const url = buildStrapiUrl(path, params);
  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    });
  } catch (cause: unknown) {
    const error = new Error(
      `Impossible de joindre Strapi (${STRAPI_URL}). Vérifiez que le serveur est bien démarré. URL: ${url}`,
    );
    (error as Error & { cause?: unknown }).cause = cause;
    throw error;
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Strapi GET error: ${res.status} ${res.statusText} - ${text}`,
    );
  }
  return res.json();
}

export async function strapiPost(path: string, data: unknown, token?: string) {
  const res = await fetch(`${STRAPI_URL}/api${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ data }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Strapi POST error: ${res.status} ${res.statusText} - ${text}`,
    );
  }
  return res.json();
}

export async function strapiPut(path: string, data: unknown, token?: string) {
  const res = await fetch(`${STRAPI_URL}/api${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ data }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Strapi PUT error: ${res.status} ${res.statusText} - ${text}`,
    );
  }
  return res.json();
}

export async function strapiDelete(path: string, token?: string) {
  const res = await fetch(`${STRAPI_URL}/api${path}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Strapi DELETE error: ${res.status} ${res.statusText} - ${text}`,
    );
  }
  return res.json();
}

export { computeScoreFromNotes, getSeuil } from "./scoring";
