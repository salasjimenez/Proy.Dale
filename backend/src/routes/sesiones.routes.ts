import { Router, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  SessionServiceError,
  completeTextSession,
  createTextSession,
  getUserSession,
  listUserSessions,
} from "../services/sesiones.service.js";

export const sesionesRouter = Router();

type StartSessionBody = {
  escenarioSlug?: unknown;
  modalidad?: unknown;
};

type CompleteSessionBody = {
  transcripcion?: unknown;
  duracionMs?: unknown;
};

function handleSessionError(error: unknown, res: Response): boolean {
  if (!(error instanceof SessionServiceError)) return false;

  res.status(error.status).json({
    error: error.code,
    message: error.message,
  });
  return true;
}

sesionesRouter.get("/status", (_req, res) => {
  res.status(200).json({
    module: "sesiones",
    status: "ready",
    implemented: true,
    modes: {
      texto: true,
      voz: false,
    },
  });
});

sesionesRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const rawLimit = typeof req.query.limit === "string" ? Number(req.query.limit) : 10;
    const limit = Number.isInteger(rawLimit) ? rawLimit : 10;
    const result = await listUserSessions(req.authUser!.id, limit);
    res.status(200).json(result);
  } catch (error) {
    if (!handleSessionError(error, res)) next(error);
  }
});

sesionesRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const body = (req.body ?? {}) as StartSessionBody;
    const escenarioSlug = typeof body.escenarioSlug === "string" ? body.escenarioSlug : "";
    const modalidad = typeof body.modalidad === "string" ? body.modalidad.toUpperCase() : "TEXTO";

    if (modalidad !== "TEXTO") {
      res.status(400).json({
        error: "MODE_NOT_AVAILABLE",
        message: "La práctica por voz se habilitará en una siguiente etapa. Usa el modo texto por ahora.",
      });
      return;
    }

    const session = await createTextSession(req.authUser!.id, escenarioSlug);
    res.status(201).json({ data: { session } });
  } catch (error) {
    if (!handleSessionError(error, res)) next(error);
  }
});

sesionesRouter.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const session = await getUserSession(req.authUser!.id, req.params.id);
    res.status(200).json({ data: { session } });
  } catch (error) {
    if (!handleSessionError(error, res)) next(error);
  }
});

sesionesRouter.post("/:id/completar", requireAuth, async (req, res, next) => {
  try {
    const body = (req.body ?? {}) as CompleteSessionBody;
    const transcripcion = typeof body.transcripcion === "string" ? body.transcripcion : "";
    const duracionMs = typeof body.duracionMs === "number" ? body.duracionMs : undefined;

    const session = await completeTextSession(
      req.authUser!.id,
      req.params.id,
      transcripcion,
      duracionMs,
    );

    res.status(200).json({ data: { session } });
  } catch (error) {
    if (!handleSessionError(error, res)) next(error);
  }
});
