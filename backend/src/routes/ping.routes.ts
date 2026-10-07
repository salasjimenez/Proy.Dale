import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const pingRouter = Router();

pingRouter.get("/", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: "ok",
      service: "dale-backend",
      version: "0.11.0",
      database: "ok",
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({
      status: "error",
      service: "dale-backend",
      version: "0.11.0",
      database: "unavailable",
      timestamp: new Date().toISOString(),
    });
  }
});
