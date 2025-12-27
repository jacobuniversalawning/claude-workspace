import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  session: {
    strategy: "database",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true, isActive: true, name: true, email: true },
          });
          if (dbUser) {
            session.user.role = dbUser.role || "estimator";
            session.user.isActive = dbUser.isActive ?? true;
            if (dbUser.name) {
              session.user.name = dbUser.name;
            }
          } else {
            session.user.role = "estimator";
            session.user.isActive = true;
          }
        } catch {
          session.user.role = "estimator";
          session.user.isActive = true;
        }
      }
      return session;
    },
    async signIn({ user }) {
      const email = (user.email || "").toLowerCase();
      // Allow ALL @universalawning.com emails (case-insensitive)
      if (email.endsWith("@universalawning.com")) {
        return true;
      }
      // Reject all other emails
      return false;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
