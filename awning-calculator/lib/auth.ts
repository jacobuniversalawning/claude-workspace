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
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // Fetch user role from database
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, isActive: true },
        });
        token.role = dbUser?.role || "estimator";
        token.isActive = dbUser?.isActive ?? true;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.isActive = token.isActive as boolean;
      }
      return session;
    },
    async signIn({ user }) {
      // Only allow @universalawning.com email addresses
      const email = user.email || "";
      if (!email.endsWith("@universalawning.com")) {
        return false;
      }

      // Check if user is active
      const dbUser = await prisma.user.findUnique({
        where: { email },
        select: { isActive: true },
      });

      // Allow new users to sign in (they don't exist yet)
      if (!dbUser) return true;

      // Block inactive users
      return dbUser.isActive;
    },
    authorized: async ({ auth }) => {
      // Logged in users are authenticated
      return !!auth;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
