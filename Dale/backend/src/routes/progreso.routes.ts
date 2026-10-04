import { Router, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getUserProgress,
  parseProgressMode,
  ProgressServiceError,
} from "../services/progreso.service.js";

export const progresoRouter = Router();

function handleProgressError(error: unknown, res: Response): boolean {
  if (!(error instanceof ProgressServiceError)) return false;

  res.status(error.status).json({
    error: error.code,
    message: error.message,
  });
  return true;
}

progresoRouter.get("/status", (_req, res) => {
  res.status(200).json({
    module: "progreso",
    status: "ready",
    implemented: true,
    dashboard: "mi-voz-mi-progreso",
    metrics: ["puntaje_general", "ritmo", "pausas", "muletillas"],
  });
});

progresoRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const mode = parseProgressMode(req.query.modalidad);
    const rawLimit = typeof req.query.limit === "string" ? Number(req.query.limit) : 30;
    const limit = Number.isInteger(rawLimit) ? rawLimit : 30;
    const result = await getUserProgress(req.authUser!.id, mode, limit);
    res.status(200).json(result);
  } catch (error) {
    if (!handleProgressError(error, res)) next(error);
  }
});
