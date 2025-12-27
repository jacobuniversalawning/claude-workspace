import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, registerAuthRoutes } from "./auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Google OAuth authentication (MUST be before other routes)
  await setupAuth(app);
  registerAuthRoutes(app);

  // Protected API routes can use isAuthenticated middleware
  // Example: app.get("/api/protected", isAuthenticated, async (req, res) => { ... });

  return httpServer;
}
