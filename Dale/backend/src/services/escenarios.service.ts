import {
  CategoriaEscenario,
  NivelDificultad,
  type Prisma,
} from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export type EscenarioFilters = {
  categoria?: CategoriaEscenario;
  nivel?: NivelDificultad;
  q?: string;
};

const scenarioSelect = {
  id: true,
  slug: true,
  titulo: true,
  descripcion: true,
  situacion: true,
  instrucciones: true,
  categoria: true,
  nivel: true,
  orden: true,
} satisfies Prisma.EscenarioSelect;

export const categoriaLabels: Record<CategoriaEscenario, string> = {
  LABORAL: "Laboral",
  TRAMITES_CALLE: "Trámites y calle",
  SOCIAL: "Social",
  JOVENES_ESTUDIANTES: "Jóvenes y estudiantes",
};

export const nivelLabels: Record<NivelDificultad, string> = {
  BASICO: "Básico",
  INTERMEDIO: "Intermedio",
  DIFICIL: "Difícil",
};

function presentScenario<T extends {
  categoria: CategoriaEscenario;
  nivel: NivelDificultad;
}>(scenario: T) {
  return {
    ...scenario,
    categoria: {
      codigo: scenario.categoria,
      nombre: categoriaLabels[scenario.categoria],
    },
    nivel: {
      codigo: scenario.nivel,
      nombre: nivelLabels[scenario.nivel],
    },
  };
}

export async function listEscenarios(filters: EscenarioFilters) {
  const where: Prisma.EscenarioWhereInput = {
    activo: true,
    ...(filters.categoria ? { categoria: filters.categoria } : {}),
    ...(filters.nivel ? { nivel: filters.nivel } : {}),
    ...(filters.q
      ? {
          OR: [
            { titulo: { contains: filters.q, mode: "insensitive" } },
            { descripcion: { contains: filters.q, mode: "insensitive" } },
            { situacion: { contains: filters.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const scenarios = await prisma.escenario.findMany({
    where,
    select: scenarioSelect,
    orderBy: [{ orden: "asc" }, { titulo: "asc" }, { nivel: "asc" }],
  });

  return scenarios.map(presentScenario);
}

export async function getEscenarioBySlug(slug: string) {
  const scenario = await prisma.escenario.findFirst({
    where: {
      slug,
      activo: true,
    },
    select: scenarioSelect,
  });

  return scenario ? presentScenario(scenario) : null;
}

export async function getCategoriasSummary() {
  const rows = await prisma.escenario.groupBy({
    by: ["categoria", "nivel"],
    where: { activo: true },
    _count: { _all: true },
  });

  return Object.values(CategoriaEscenario).map((categoria) => {
    const categoryRows = rows.filter((row) => row.categoria === categoria);
    const niveles = Object.values(NivelDificultad).map((nivel) => ({
      codigo: nivel,
      nombre: nivelLabels[nivel],
      total:
        categoryRows.find((row) => row.nivel === nivel)?._count._all ?? 0,
    }));

    return {
      codigo: categoria,
      nombre: categoriaLabels[categoria],
      total: niveles.reduce((sum, item) => sum + item.total, 0),
      niveles,
    };
  });
}

export async function countEscenarios() {
  return prisma.escenario.count({ where: { activo: true } });
}
