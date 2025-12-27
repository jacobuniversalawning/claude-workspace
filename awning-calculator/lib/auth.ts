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
      if (session.user) {
        session.user.id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, isActive: true },
        });
        session.user.role = dbUser?.role || "estimator";
        session.user.isActive = dbUser?.isActive ?? true;
      }
      return session;
    },
    async signIn({ user }) {
      const email = user.email || "";
      // Only allow @universalawning.com emails
      if (!email.endsWith("@universalawning.com")) {
        return "/login?error=AccessDenied";
      }
      return true;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
