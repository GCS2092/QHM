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

        const response = await fetch(`${STRAPI_URL}/api/auth/local`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier: credentials.identifier,
            password: credentials.password,
          }),
        });

        if (!response.ok) {
          return null;
        }

        const data = await response.json();
        if (!data?.jwt || !data.user) {
          return null;
        }

        return {
          id: String(data.user.id),
          name: data.user.username || data.user.email || `${data.user.firstname ?? ""} ${data.user.lastname ?? ""}`.trim(),
          email: data.user.email,
          accessToken: data.jwt,
          role: data.user.role?.name ?? null,
        } as any;
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
      if (user) {
        return {
          ...token,
          accessToken: (user as any).accessToken,
          role: (user as any).role,
        };
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          accessToken: token.accessToken as string,
          role: token.role as string,
        },
      };
    },
  },
  secret: process.env.NEXTAUTH_SECRET ?? "dev-secret",
};
