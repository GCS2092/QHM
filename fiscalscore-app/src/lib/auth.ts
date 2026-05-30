import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import { STRAPI_URL } from "./strapi";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Strapi",
      credentials: {
        identifier: { label: "Email ou nom d'utilisateur", type: "text" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials.password) {
          return null;
        }

        // ── Tentative 1 : Users & Permissions (/api/auth/local) ──────────
        const response = await fetch(`${STRAPI_URL}/api/auth/local`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier: credentials.identifier,
            password: credentials.password,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data?.jwt && data.user) {
            // Récupérer le rôle via /api/users/me?populate=role
            let roleName: string | null = data.user.role?.name ?? null;
            if (!roleName) {
              try {
                const meRes = await fetch(
                  `${STRAPI_URL}/api/users/me?populate=role`,
                  { headers: { Authorization: `Bearer ${data.jwt}` } },
                );
                if (meRes.ok) {
                  const meData = await meRes.json();
                  roleName = meData.role?.name ?? null;
                }
              } catch {
                // ignore
              }
            }

            return {
              id: String(data.user.id),
              name:
                data.user.username ||
                data.user.email ||
                `${data.user.firstname ?? ""} ${data.user.lastname ?? ""}`.trim(),
              email: data.user.email,
              accessToken: data.jwt,
              role: roleName ?? "authenticated",
              strapiUserId: data.user.id,
            } as unknown as Parameters<typeof CredentialsProvider>[0] extends { authorize: (...args: unknown[]) => Promise<infer T> } ? NonNullable<T> : never;
          }
        }

        // ── Tentative 2 : Admin Strapi (/admin/login) ────────────────────
        // Les comptes créés dans le panel Strapi (/admin) ne passent pas
        // par /api/auth/local. On tente /admin/login pour les détecter.
        try {
          const adminRes = await fetch(`${STRAPI_URL}/admin/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.identifier,
              password: credentials.password,
            }),
          });

          if (adminRes.ok) {
            const adminData = await adminRes.json();
            const adminUser = adminData?.data?.user;
            const adminToken = adminData?.data?.token;

            if (adminUser && adminToken) {
              return {
                id: String(adminUser.id),
                name:
                  adminUser.username ||
                  `${adminUser.firstname ?? ""} ${adminUser.lastname ?? ""}`.trim() ||
                  adminUser.email,
                email: adminUser.email,
                accessToken: adminToken,
                role: "administrator",
                strapiUserId: adminUser.id,
              } as unknown as Parameters<typeof CredentialsProvider>[0] extends { authorize: (...args: unknown[]) => Promise<infer T> } ? NonNullable<T> : never;
            }
          }
        } catch {
          // ignore
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      interface ExtendedUser {
        id: string;
        accessToken: string;
        role: string | null;
      }
      if (user) {
        const extUser = user as unknown as ExtendedUser;
        return {
          ...token,
          accessToken: extUser.accessToken,
          role: extUser.role,
          sub: extUser.id,
        };
      }
      return token;
    },
    async session({ session, token }) {
      const userSession = session.user as Record<string, unknown>;
      return {
        ...session,
        user: {
          ...userSession,
          id: token.sub as string,
          accessToken: token.accessToken as string,
          role: token.role as string,
        },
      };
    },
  },
  secret: process.env.NEXTAUTH_SECRET ?? "dev-secret",
};