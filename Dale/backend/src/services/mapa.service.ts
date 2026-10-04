import {
  CategoriaEscenario,
  EstadoSesion,
  ModalidadRespuesta,
  type Prisma,
} from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { categoriaLabels } from "./escenarios.service.js";

export type ScenarioMapMode = "TODAS" | ModalidadRespuesta;

export class ScenarioMapServiceError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ScenarioMapServiceError";
    this.status = status;
    this.code = code;
  }
}

function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function parseScenarioMapMode(value: unknown): ScenarioMapMode {
  if (typeof value !== "string" || value.trim() === "") return "TODAS";

  const normalized = value.trim().toUpperCase();
  if (normalized === "TODAS") return "TODAS";
  if (normalized === ModalidadRespuesta.VOZ) return ModalidadRespuesta.VOZ;
  if (normalized === ModalidadRespuesta.TEXTO) return ModalidadRespuesta.TEXTO;

  throw new ScenarioMapServiceError(
    400,
    "INVALID_MAP_MODE",
    "La modalidad debe ser TODAS, VOZ o TEXTO.",
  );
}

export async function getScenarioMap(userId: string, mode: ScenarioMapMode) {
  const where: Prisma.SesionWhereInput = {
    usuarioId: userId,
    estado: EstadoSesion.COMPLETADA,
    metrica: { isNot: null },
    ...(mode === "TODAS" ? {} : { modalidad: mode as ModalidadRespuesta }),
  };

  const sessions = await prisma.sesion.findMany({
    where,
    orderBy: { finalizadaEn: "asc" },
    select: {
      modalidad: true,
      finalizadaEn: true,
      creadoEn: true,
      escenario: {
        select: {
          categoria: true,
          nivel: true,
        },
      },
      metrica: {
        select: {
          puntajeGeneral: true,
        },
      },
    },
  });

  const categorias = Object.values(CategoriaEscenario).map((codigo) => {
    const categorySessions = sessions.filter(
      (session) =>
        session.escenario.categoria === codigo &&
        session.metrica?.puntajeGeneral !== null &&
        session.metrica?.puntajeGeneral !== undefined,
    );

    const scores = categorySessions
      .map((session) => session.metrica!.puntajeGeneral)
      .filter((value): value is number => value !== null);

    const latest = categorySessions.at(-1);
    const nivelesPracticados = new Set(
      categorySessions.map((session) => session.escenario.nivel),
    ).size;

    return {
      codigo,
      nombre: categoriaLabels[codigo],
      puntajePromedio: average(scores),
      intentos: categorySessions.length,
      ultimoPuntaje: latest?.metrica?.puntajeGeneral ?? null,
      mejorPuntaje: scores.length > 0 ? Math.max(...scores) : null,
      nivelesPracticados,
      ultimaPractica: latest?.finalizadaEn ?? latest?.creadoEn ?? null,
    };
  });

  const conDatos = categorias.filter(
    (categoria) => categoria.intentos > 0 && categoria.puntajePromedio !== null,
  );
  const sinDatos = categorias.filter((categoria) => categoria.intentos === 0);

  const fortaleza =
    conDatos.length > 0
      ? [...conDatos].sort(
          (a, b) => (b.puntajePromedio ?? 0) - (a.puntajePromedio ?? 0),
        )[0]
      : null;

  const areaMenorPromedio =
    conDatos.length >= 2
      ? [...conDatos].sort(
          (a, b) => (a.puntajePromedio ?? 0) - (b.puntajePromedio ?? 0),
        )[0]
      : null;

  const siguienteCategoriaSugerida =
    sinDatos[0] ?? areaMenorPromedio ?? fortaleza ?? null;

  const allScores = conDatos
    .map((categoria) => categoria.puntajePromedio)
    .filter((value): value is number => value !== null);

  return {
    data: {
      resumen: {
        totalCompletadas: sessions.filter(
          (session) => session.metrica?.puntajeGeneral != null,
        ).length,
        categoriasConDatos: conDatos.length,
        categoriasTotales: categorias.length,
        coberturaPorcentaje: round((conDatos.length / categorias.length) * 100, 0),
        puntajePromedioGlobal: average(allScores),
        fortalezaActual: fortaleza
          ? {
              codigo: fortaleza.codigo,
              nombre: fortaleza.nombre,
              puntaje: fortaleza.puntajePromedio,
            }
          : null,
        areaMenorPromedio: areaMenorPromedio
          ? {
              codigo: areaMenorPromedio.codigo,
              nombre: areaMenorPromedio.nombre,
              puntaje: areaMenorPromedio.puntajePromedio,
            }
          : null,
        siguienteCategoriaSugerida: siguienteCategoriaSugerida
          ? {
              codigo: siguienteCategoriaSugerida.codigo,
              nombre: siguienteCategoriaSugerida.nombre,
              tieneDatos: siguienteCategoriaSugerida.intentos > 0,
            }
          : null,
      },
      categorias,
    },
    meta: {
      modalidad: mode,
    },
  };
}
