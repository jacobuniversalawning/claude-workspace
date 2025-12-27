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
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async jwt({ token, user, account }) {
      console.log("[Auth] JWT Callback", { userId: user?.id, tokenId: token?.id });
      // On initial sign in, user object is available from the provider
      if (user) {
        token.id = user.id;
        // User object from Google OAuth won't have role/isActive yet
        // These will be fetched in session callback from database
      }

      // If we have a user id but no role yet, try to fetch from database
      if (token.id && !token.role) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, isActive: true },
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.isActive = dbUser.isActive;
          } else {
            // User not yet in database, use defaults
            token.role = "estimator";
            token.isActive = true;
          }
        } catch (error) {
          console.error("[Auth] JWT callback error fetching user:", error);
          // Set defaults on error
          token.role = "estimator";
          token.isActive = true;
        }
      }

      return token;
    },
    async session({ session, token, user }) {
      console.log("[Auth] Session Callback", {
        sessionId: session?.user?.id,
        userId: user?.id,
        tokenId: token?.id
      });

      try {
        // Handle both JWT strategy (token) and database strategy (user)
        const userId = user?.id || (token?.id as string);

        if (!userId) {
          console.warn("[Auth] Session callback: No user ID available");
          // Return session with defaults
          if (session.user) {
            session.user.role = "estimator";
            session.user.isActive = true;
          }
          return session;
        }

        if (session.user) {
          session.user.id = userId;

          // Try to get role from token first (already fetched in jwt callback)
          if (token?.role) {
            session.user.role = token.role as string;
            session.user.isActive = token.isActive as boolean;
          } else {
            // Fallback: Get role from database
            try {
              const dbUser = await prisma.user.findUnique({
                where: { id: userId },
                select: { role: true, isActive: true },
              });
              session.user.role = dbUser?.role || "estimator";
              session.user.isActive = dbUser?.isActive ?? true;
            } catch (dbError) {
              console.error("[Auth] Session callback DB error:", dbError);
              session.user.role = "estimator";
              session.user.isActive = true;
            }
          }
        }
        return session;
      } catch (error) {
        console.error("[Auth] Session callback error:", error);
        // Return session with defaults to prevent redirect loops
        if (session.user) {
          session.user.role = "estimator";
          session.user.isActive = true;
        }
        return session;
      }
    },
    async signIn({ user, account }) {
      console.log("[Auth] SignIn Callback", { email: user.email });
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
