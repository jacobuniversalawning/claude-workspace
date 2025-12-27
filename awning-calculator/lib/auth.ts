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
      // With database strategy, user comes from the database
      if (session.user) {
        session.user.id = user.id;
        // Fetch additional user fields
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, isActive: true },
        });
        session.user.role = dbUser?.role || "estimator";
        session.user.isActive = dbUser?.isActive ?? true;
      }
      return session;
    },
    async signIn({ user, profile }) {
      // Only allow @universalawning.com email addresses
      const email = user.email || profile?.email || "";
      if (!email.endsWith("@universalawning.com")) {
        return false;
      }

      // Check if user is active (only for existing users)
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
