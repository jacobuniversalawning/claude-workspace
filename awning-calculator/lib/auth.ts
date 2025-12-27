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
            // Ensure name is available from the database
            if (dbUser.name) {
              session.user.name = dbUser.name;
            }
          } else {
            // User not found in DB yet - use defaults
            session.user.role = "estimator";
            session.user.isActive = true;
          }
        } catch {
          // Database error - use safe defaults
          session.user.role = "estimator";
          session.user.isActive = true;
        }
      }
      return session;
    },
    async signIn({ user }) {
      const email = user.email || "";
      // Only allow @universalawning.com emails
      if (!email.endsWith("@universalawning.com")) {
        // Return false to reject - NextAuth will handle redirect to error page
        return false;
      }
      return true;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
