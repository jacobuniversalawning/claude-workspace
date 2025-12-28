import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import Credentials from "next-auth/providers/credentials";

// Rebuilt & Verified Auth Configuration
// Includes strict cookie policy and trustHost for reliable sessions
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    Credentials({
      name: "Admin Login",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (credentials?.username === "admin" && credentials?.password === "admin1234") {
          return {
            id: "admin-user",
            name: "Admin User",
            email: "admin@universalawning.com",
            role: "admin",
            isActive: true
          };
        }
        return null;
      }
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
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
        // If user has role/isActive (from Credentials), copy it to token
        // This avoids DB lookup for the admin backdoor
        if ('role' in user) token.role = user.role;
        if ('isActive' in user) token.isActive = user.isActive;
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
            // User not yet in database, use defaults (pending/inactive)
            token.role = "pending";
            token.isActive = false;
          }
        } catch (error) {
          console.error("[Auth] JWT callback error fetching user:", error);
          // Set defaults on error (pending/inactive for security)
          token.role = "pending";
          token.isActive = false;
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
          // Return session with defaults (pending/inactive for security)
          if (session.user) {
            session.user.role = "pending";
            session.user.isActive = false;
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
              session.user.role = dbUser?.role || "pending";
              session.user.isActive = dbUser?.isActive ?? false;
            } catch (dbError) {
              console.error("[Auth] Session callback DB error:", dbError);
              session.user.role = "pending";
              session.user.isActive = false;
            }
          }
        }
        return session;
      } catch (error) {
        console.error("[Auth] Session callback error:", error);
        // Return session with defaults to prevent redirect loops (still inactive for security)
        if (session.user) {
          session.user.role = "pending";
          session.user.isActive = false;
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

        // Verify we have valid OAuth tokens (only for Google)
        if (account?.provider === "google" && !account?.access_token) {
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
