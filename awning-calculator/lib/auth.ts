import { NextResponse } from "next/server";

// Mock session data for development/bypass
// Giving admin role to allow full access
const MOCK_SESSION = {
  user: {
    id: "dev-user-id",
    name: "Dev User",
    email: "dev@universalawning.com",
    image: null,
    role: "admin",
    isActive: true,
  },
  expires: "9999-12-31T23:59:59.999Z",
};

// Mock handlers for /api/auth/* routes
export const handlers = {
  GET: async (req: any) => {
    return NextResponse.json(MOCK_SESSION);
  },
  POST: async (req: any) => {
    return NextResponse.json(MOCK_SESSION);
  },
};

// Mock auth function for server-side session retrieval
export const auth = async (...args: any[]) => {
  return MOCK_SESSION;
};

// Mock signIn/signOut for server-side usage (if any)
export const signIn = async () => {
  console.log("[Auth Mock] SignIn called");
  return true;
};

export const signOut = async () => {
  console.log("[Auth Mock] SignOut called");
  return true;
};
