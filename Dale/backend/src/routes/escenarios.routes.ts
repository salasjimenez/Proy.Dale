import { CategoriaEscenario, NivelDificultad } from "@prisma/client";
import { Router } from "express";
import {
  countEscenarios,
  getCategoriasSummary,
  getEscenarioBySlug,
  listEscenarios,
  type EscenarioFilters,
} from "../services/escenarios.service.js";

export const escenariosRouter = Router();

function singleQueryValue(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim() : undefined;
}

function parseCategoria(value: unknown): CategoriaEscenario | undefined {
  const normalized = singleQueryValue(value)?.toUpperCase();

  if (!normalized) {
    return undefined;
  }

  return Object.values(CategoriaEscenario).includes(
    normalized as CategoriaEscenario,
  )
    ? (normalized as CategoriaEscenario)
    : undefined;
}

function parseNivel(value: unknown): NivelDificultad | undefined {
  const normalized = singleQueryValue(value)?.toUpperCase();

  if (!normalized) {
    return undefined;
  }

  return Object.values(NivelDificultad).includes(normalized as NivelDificultad)
    ? (normalized as NivelDificultad)
    : undefined;
}

escenariosRouter.get("/status", async (_req, res, next) => {
  try {
    const total = await countEscenarios();

    res.status(200).json({
      module: "escenarios",
      status: "ready",
      implemented: true,
      total,
    });
  } catch (error) {
    next(error);
  }
});

escenariosRouter.get("/categorias", async (_req, res, next) => {
  try {
    const categorias = await getCategoriasSummary();

    res.status(200).json({
      data: categorias,
    });
  } catch (error) {
    next(error);
  }
});

escenariosRouter.get("/", async (req, res, next) => {
  try {
    const rawCategoria = singleQueryValue(req.query.categoria);
    const rawNivel = singleQueryValue(req.query.nivel);
    const categoria = parseCategoria(req.query.categoria);
    const nivel = parseNivel(req.query.nivel);
    const q = singleQueryValue(req.query.q);

    if (rawCategoria && !categoria) {
      res.status(400).json({
        error: "INVALID_CATEGORY",
        message: "La categoría indicada no es válida.",
        allowed: Object.values(CategoriaEscenario),
      });
      return;
    }

    if (rawNivel && !nivel) {
      res.status(400).json({
        error: "INVALID_LEVEL",
        message: "El nivel indicado no es válido.",
        allowed: Object.values(NivelDificultad),
      });
      return;
    }

    if (q && q.length > 100) {
      res.status(400).json({
        error: "INVALID_SEARCH",
        message: "La búsqueda no puede superar 100 caracteres.",
      });
      return;
    }

    const filters: EscenarioFilters = {
      ...(categoria ? { categoria } : {}),
      ...(nivel ? { nivel } : {}),
      ...(q ? { q } : {}),
    };

    const scenarios = await listEscenarios(filters);

    res.status(200).json({
      data: scenarios,
      meta: {
        total: scenarios.length,
        filters: {
          categoria: categoria ?? null,
          nivel: nivel ?? null,
          q: q ?? null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

escenariosRouter.get("/:slug", async (req, res, next) => {
  try {
    const scenario = await getEscenarioBySlug(req.params.slug);

    if (!scenario) {
      res.status(404).json({
        error: "SCENARIO_NOT_FOUND",
        message: "El escenario solicitado no existe o no está disponible.",
      });
      return;
    }

    res.status(200).json({ data: scenario });
  } catch (error) {
    next(error);
  }
});
