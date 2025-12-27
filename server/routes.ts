import type { Express } from "express";
import { type Server } from "http";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // No authentication - app is open access
  // Add your API routes here
  
  return httpServer;
}
