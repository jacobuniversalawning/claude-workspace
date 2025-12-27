// Auth module exports - JWT-based for Vercel serverless
export { setupJWTAuth as setupAuth, isAuthenticated } from "./jwtAuth";
export { authStorage, type IAuthStorage } from "./storage";

// No-op for compatibility - routes are registered in setupJWTAuth
export function registerAuthRoutes() {}
