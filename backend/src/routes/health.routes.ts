import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { APP_VERSION } from "../version.js";

export const healthRouter = Router();

healthRouter.get("/live", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "dale-backend",
    version: APP_VERSION,
    check: "live",
    timestamp: new Date().toISOString(),
  });
});

healthRouter.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: "ok",
      service: "dale-backend",
      version: APP_VERSION,
      check: "ready",
      database: "ok",
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({
      status: "error",
      service: "dale-backend",
      version: APP_VERSION,
      check: "ready",
      database: "unavailable",
      timestamp: new Date().toISOString(),
    });
  }
});
