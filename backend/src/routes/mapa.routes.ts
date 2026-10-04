import { Router, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getScenarioMap,
  parseScenarioMapMode,
  ScenarioMapServiceError,
} from "../services/mapa.service.js";

export const mapaRouter = Router();

function handleScenarioMapError(error: unknown, res: Response): boolean {
  if (!(error instanceof ScenarioMapServiceError)) return false;

  res.status(error.status).json({
    error: error.code,
    message: error.message,
  });
  return true;
}

mapaRouter.get("/status", (_req, res) => {
  res.status(200).json({
    module: "mapa",
    status: "ready",
    implemented: true,
    dashboard: "mapa-de-escenarios",
    categories: [
      "LABORAL",
      "TRAMITES_CALLE",
      "SOCIAL",
      "JOVENES_ESTUDIANTES",
    ],
  });
});

mapaRouter.get("/", requireAuth, async (req, res, next) => {
  try {
    const mode = parseScenarioMapMode(req.query.modalidad);
    const result = await getScenarioMap(req.authUser!.id, mode);
    res.status(200).json(result);
  } catch (error) {
    if (!handleScenarioMapError(error, res)) next(error);
  }
});
