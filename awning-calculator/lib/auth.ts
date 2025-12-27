import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "database",
  },
  callbacks: {
    async session({ session, user }) {
      try {
        if (session.user) {
          session.user.id = user.id;
          // Get role from database with error handling
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true, isActive: true },
          });
          session.user.role = dbUser?.role || "estimator";
          session.user.isActive = dbUser?.isActive ?? true;
        }
        return session;
      } catch (error) {
        console.error("[Auth] Session callback error:", error);
        // Return session with defaults to prevent redirect loops
        if (session.user) {
          session.user.id = user.id;
          session.user.role = "estimator";
          session.user.isActive = true;
        }
        return session;
      }
    },
    async signIn({ user, account }) {
      try {
        // SIMPLE CHECK: Only @universalawning.com emails
        const email = user.email?.toLowerCase() || "";

        if (!email) {
          console.error("[Auth] SignIn failed: No email provided");
          return false;
        }

        if (!email.endsWith("@universalawning.com")) {
          console.log("[Auth] SignIn denied: Email not from @universalawning.com:", email);
          return false;
        }

        // Verify we have valid OAuth tokens
        if (!account?.access_token) {
          console.error("[Auth] SignIn failed: No access token from Google");
          return false;
        }

        console.log("[Auth] SignIn successful for:", email);
        return true;
      } catch (error) {
        console.error("[Auth] SignIn callback error:", error);
        return false;
      }
    },
  },
  pages: {
    signIn: "/login",
    error: "/login", // Redirect auth errors to login page
  },
  debug: process.env.NODE_ENV === "development",
});
