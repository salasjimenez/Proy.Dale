import { ModalidadRespuesta } from "@prisma/client";
import { Router, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  SessionServiceError,
  completeSession,
  createSession,
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
  pausasDetalle?: unknown;
};

function handleSessionError(error: unknown, res: Response): boolean {
  if (!(error instanceof SessionServiceError)) return false;

  res.status(error.status).json({
    error: error.code,
    message: error.message,
  });
  return true;
}

function readRouteParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

sesionesRouter.get("/status", (_req, res) => {
  res.status(200).json({
    module: "sesiones",
    status: "ready",
    implemented: true,
    modes: {
      texto: true,
      voz: true,
    },
    voiceMetrics: ["palabras_por_minuto", "pausas", "muletillas", "repeticiones"],
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
    const rawMode = typeof body.modalidad === "string" ? body.modalidad.toUpperCase() : "TEXTO";

    if (rawMode !== ModalidadRespuesta.TEXTO && rawMode !== ModalidadRespuesta.VOZ) {
      res.status(400).json({
        error: "INVALID_MODE",
        message: "La modalidad debe ser TEXTO o VOZ.",
      });
      return;
    }

    const session = await createSession(
      req.authUser!.id,
      escenarioSlug,
      rawMode as ModalidadRespuesta,
    );
    res.status(201).json({ data: { session } });
  } catch (error) {
    if (!handleSessionError(error, res)) next(error);
  }
});

sesionesRouter.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const sessionId = readRouteParam(req.params.id);
    if (!sessionId) {
      res.status(400).json({ error: "INVALID_SESSION_ID", message: "El identificador de sesión no es válido." });
      return;
    }

    const session = await getUserSession(req.authUser!.id, sessionId);
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

    const sessionId = readRouteParam(req.params.id);
    if (!sessionId) {
      res.status(400).json({ error: "INVALID_SESSION_ID", message: "El identificador de sesión no es válido." });
      return;
    }

    const session = await completeSession(
      req.authUser!.id,
      sessionId,
      transcripcion,
      duracionMs,
      body.pausasDetalle,
    );

    res.status(200).json({ data: { session } });
  } catch (error) {
    if (!handleSessionError(error, res)) next(error);
  }
});
