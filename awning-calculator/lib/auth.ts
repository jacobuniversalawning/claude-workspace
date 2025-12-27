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
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // Fetch user role from database with error handling
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true, isActive: true },
          });
          token.role = dbUser?.role || "estimator";
          token.isActive = dbUser?.isActive ?? true;
        } catch (error) {
          console.error("Error fetching user role:", error);
          token.role = "estimator";
          token.isActive = true;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) || "estimator";
        session.user.isActive = (token.isActive as boolean) ?? true;
      }
      return session;
    },
    async signIn({ user }) {
      try {
        // Check if user is active
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email || "" },
          select: { isActive: true },
        });

        // Allow new users to sign in (they don't exist yet)
        if (!dbUser) return true;

        // Block inactive users
        return dbUser.isActive;
      } catch (error) {
        console.error("Error during sign in check:", error);
        // Allow sign in if database check fails
        return true;
      }
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
