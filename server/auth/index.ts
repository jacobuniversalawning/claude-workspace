// Auth module exports for Google OAuth (Vercel-compatible)
export { setupAuth, isAuthenticated, getSession } from "./googleAuth";
export { authStorage, type IAuthStorage } from "./storage";
export { registerAuthRoutes } from "./routes";
