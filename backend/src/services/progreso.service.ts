import { EstadoSesion, ModalidadRespuesta, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { categoriaLabels, nivelLabels } from "./escenarios.service.js";

export type ProgressMode = "TODAS" | ModalidadRespuesta;

export class ProgressServiceError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ProgressServiceError";
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

export function parseProgressMode(value: unknown): ProgressMode {
  if (typeof value !== "string" || value.trim() === "") return "TODAS";

  const normalized = value.trim().toUpperCase();
  if (normalized === "TODAS") return "TODAS";
  if (normalized === ModalidadRespuesta.VOZ) return ModalidadRespuesta.VOZ;
  if (normalized === ModalidadRespuesta.TEXTO) return ModalidadRespuesta.TEXTO;

  throw new ProgressServiceError(
    400,
    "INVALID_PROGRESS_MODE",
    "La modalidad debe ser TODAS, VOZ o TEXTO.",
  );
}

export async function getUserProgress(
  userId: string,
  mode: ProgressMode,
  limit: number,
) {
  const safeLimit = Math.min(50, Math.max(2, limit));
  const where: Prisma.SesionWhereInput = {
    usuarioId: userId,
    estado: EstadoSesion.COMPLETADA,
    metrica: { isNot: null },
    ...(mode === "TODAS" ? {} : { modalidad: mode as ModalidadRespuesta }),
  };

  const [totalCompleted, sessions] = await prisma.$transaction([
    prisma.sesion.count({ where }),
    prisma.sesion.findMany({
      where,
      orderBy: { finalizadaEn: "desc" },
      take: safeLimit,
      select: {
        id: true,
        modalidad: true,
        finalizadaEn: true,
        creadoEn: true,
        escenario: {
          select: {
            slug: true,
            titulo: true,
            categoria: true,
            nivel: true,
          },
        },
        metrica: {
          select: {
            palabras: true,
            palabrasPorMinuto: true,
            cantidadPausas: true,
            pausaPromedioMs: true,
            muletillasTotal: true,
            repeticiones: true,
            puntajeRitmo: true,
            puntajePausas: true,
            puntajeMuletillas: true,
            puntajeGeneral: true,
          },
        },
      },
    }),
  ]);

  const chronological = [...sessions].reverse();
  const points = chronological
    .filter((session) => session.metrica !== null && session.metrica.puntajeGeneral !== null)
    .map((session) => ({
      id: session.id,
      fecha: session.finalizadaEn ?? session.creadoEn,
      modalidad: session.modalidad,
      escenario: {
        slug: session.escenario.slug,
        titulo: session.escenario.titulo,
        categoria: {
          codigo: session.escenario.categoria,
          nombre: categoriaLabels[session.escenario.categoria],
        },
        nivel: {
          codigo: session.escenario.nivel,
          nombre: nivelLabels[session.escenario.nivel],
        },
      },
      metricas: {
        palabras: session.metrica!.palabras,
        palabrasPorMinuto: session.metrica!.palabrasPorMinuto,
        cantidadPausas: session.metrica!.cantidadPausas,
        pausaPromedioMs: session.metrica!.pausaPromedioMs,
        muletillasTotal: session.metrica!.muletillasTotal,
        repeticiones: session.metrica!.repeticiones,
        puntajeRitmo: session.metrica!.puntajeRitmo,
        puntajePausas: session.metrica!.puntajePausas,
        puntajeMuletillas: session.metrica!.puntajeMuletillas,
        puntajeGeneral: session.metrica!.puntajeGeneral,
      },
    }));

  const generalScores = points
    .map((point) => point.metricas.puntajeGeneral)
    .filter((value): value is number => value !== null);
  const voicePoints = points.filter((point) => point.modalidad === ModalidadRespuesta.VOZ);
  const textPoints = points.filter((point) => point.modalidad === ModalidadRespuesta.TEXTO);
  const wordsPerMinute = voicePoints
    .map((point) => point.metricas.palabrasPorMinuto)
    .filter((value): value is number => value !== null);

  const firstScore = generalScores.at(0) ?? null;
  const latestScore = generalScores.at(-1) ?? null;

  return {
    data: {
      resumen: {
        totalCompletadas: totalCompleted,
        puntosMostrados: points.length,
        puntajePromedio: average(generalScores),
        puntajeActual: latestScore,
        mejorPuntaje: generalScores.length > 0 ? Math.max(...generalScores) : null,
        cambioDesdePrimera:
          firstScore !== null && latestScore !== null && generalScores.length >= 2
            ? latestScore - firstScore
            : null,
        practicasVoz: voicePoints.length,
        practicasTexto: textPoints.length,
        promedioPalabrasPorMinuto: average(wordsPerMinute),
      },
      serie: points,
    },
    meta: {
      modalidad: mode,
      limit: safeLimit,
      totalCompletadas: totalCompleted,
    },
  };
}
