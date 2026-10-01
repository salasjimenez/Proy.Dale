import {
  EstadoSesion,
  ModalidadRespuesta,
  Prisma,
} from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { categoriaLabels, nivelLabels } from "./escenarios.service.js";

const MAX_TRANSCRIPT_LENGTH = 5000;
const MIN_TRANSCRIPT_LENGTH = 3;

const sessionInclude = {
  escenario: {
    select: {
      id: true,
      slug: true,
      titulo: true,
      descripcion: true,
      situacion: true,
      instrucciones: true,
      categoria: true,
      nivel: true,
    },
  },
  metrica: true,
} satisfies Prisma.SesionInclude;

export class SessionServiceError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "SessionServiceError";
    this.status = status;
    this.code = code;
  }
}

export type TextFeedback = {
  strengths: string[];
  suggestions: string[];
  note: string;
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeForAnalysis(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function tokenize(text: string): string[] {
  return normalizeForAnalysis(text).match(/[a-z0-9]+(?:['’-][a-z0-9]+)*/g) ?? [];
}

const fillerDefinitions = [
  { label: "eh", pattern: /\beh+\b/g },
  { label: "em", pattern: /\bem+\b/g },
  { label: "mmm", pattern: /\bmmm+\b/g },
  { label: "este", pattern: /\beste\b/g },
  { label: "pues", pattern: /\bpues\b/g },
  { label: "bueno", pattern: /\bbueno\b/g },
  { label: "digamos", pattern: /\bdigamos\b/g },
  { label: "tipo", pattern: /\btipo\b/g },
  { label: "o sea", pattern: /\bo\s+sea\b/g },
] as const;

function analyzeFillers(text: string): { total: number; detail: Record<string, number> } {
  const normalized = normalizeForAnalysis(text);
  const detail: Record<string, number> = {};
  let total = 0;

  for (const filler of fillerDefinitions) {
    const matches = normalized.match(filler.pattern) ?? [];
    if (matches.length > 0) {
      detail[filler.label] = matches.length;
      total += matches.length;
    }
  }

  return { total, detail };
}

function countImmediateRepetitions(words: string[]): number {
  let repetitions = 0;

  for (let index = 1; index < words.length; index += 1) {
    if (words[index] === words[index - 1]) repetitions += 1;
  }

  return repetitions;
}

function buildTextMetrics(transcript: string) {
  const words = tokenize(transcript);
  const fillers = analyzeFillers(transcript);
  const repetitions = countImmediateRepetitions(words);

  const fillerPenalty = Math.min(40, fillers.total * 6);
  const repetitionPenalty = Math.min(25, repetitions * 7);
  const shortAnswerPenalty = words.length < 20 ? Math.min(30, (20 - words.length) * 2) : 0;

  const fillerScore = clamp(100 - fillerPenalty);
  const generalScore = clamp(100 - fillerPenalty - repetitionPenalty - shortAnswerPenalty);

  return {
    words: words.length,
    fillers,
    repetitions,
    fillerScore,
    generalScore,
  };
}

function buildFeedback(metrics: ReturnType<typeof buildTextMetrics>): TextFeedback {
  const strengths: string[] = [];
  const suggestions: string[] = [];

  if (metrics.words >= 35) {
    strengths.push("Desarrollaste una respuesta con suficiente detalle para practicar la idea completa.");
  } else if (metrics.words >= 20) {
    strengths.push("La respuesta tiene una extensión útil para una práctica breve.");
  }

  if (metrics.fillers.total === 0) {
    strengths.push("No detectamos muletillas escritas de la lista analizada.");
  } else if (metrics.fillers.total <= 2) {
    strengths.push("El uso de muletillas fue bajo en esta respuesta.");
  }

  if (metrics.repetitions === 0) {
    strengths.push("No detectamos repeticiones consecutivas de palabras.");
  }

  if (metrics.words < 20) {
    suggestions.push("Amplía la respuesta con contexto, una idea principal y un cierre concreto.");
  }

  if (metrics.fillers.total > 0) {
    suggestions.push("Revisa las muletillas detectadas y reemplázalas por una pausa o una frase más directa.");
  }

  if (metrics.repetitions > 0) {
    suggestions.push("Evita repetir la misma palabra de forma consecutiva; reformula antes de continuar.");
  }

  if (suggestions.length === 0) {
    suggestions.push("Repite el escenario intentando responder con menos preparación previa para aumentar la dificultad.");
  }

  if (strengths.length === 0) {
    strengths.push("Completaste la práctica y ya tienes una primera medición para comparar futuros intentos.");
  }

  return {
    strengths,
    suggestions,
    note:
      "Este puntaje es preliminar y se basa en el texto. Ritmo, pausas y características de voz se medirán cuando uses práctica por voz.",
  };
}

function serializeSession(session: Prisma.SesionGetPayload<{ include: typeof sessionInclude }>) {
  return {
    id: session.id,
    modalidad: session.modalidad,
    estado: session.estado,
    transcripcion: session.transcripcion,
    duracionMs: session.duracionMs,
    iniciadaEn: session.iniciadaEn,
    finalizadaEn: session.finalizadaEn,
    creadoEn: session.creadoEn,
    escenario: {
      ...session.escenario,
      categoria: {
        codigo: session.escenario.categoria,
        nombre: categoriaLabels[session.escenario.categoria],
      },
      nivel: {
        codigo: session.escenario.nivel,
        nombre: nivelLabels[session.escenario.nivel],
      },
    },
    metrica: session.metrica,
    ...(session.metrica
      ? {
          feedback: buildFeedback({
            words: session.metrica.palabras,
            fillers: {
              total: session.metrica.muletillasTotal,
              detail:
                session.metrica.muletillasDetalle &&
                typeof session.metrica.muletillasDetalle === "object" &&
                !Array.isArray(session.metrica.muletillasDetalle)
                  ? (session.metrica.muletillasDetalle as Record<string, number>)
                  : {},
            },
            repetitions: session.metrica.repeticiones,
            fillerScore: session.metrica.puntajeMuletillas ?? 0,
            generalScore: session.metrica.puntajeGeneral ?? 0,
          }),
        }
      : {}),
  };
}

export async function createTextSession(userId: string, escenarioSlug: string) {
  const slug = escenarioSlug.trim();

  if (!slug) {
    throw new SessionServiceError(400, "SCENARIO_REQUIRED", "Selecciona un escenario para comenzar.");
  }

  const escenario = await prisma.escenario.findFirst({
    where: { slug, activo: true },
    select: { id: true },
  });

  if (!escenario) {
    throw new SessionServiceError(404, "SCENARIO_NOT_FOUND", "El escenario solicitado no existe o no está disponible.");
  }

  const session = await prisma.sesion.create({
    data: {
      usuarioId: userId,
      escenarioId: escenario.id,
      modalidad: ModalidadRespuesta.TEXTO,
      estado: EstadoSesion.INICIADA,
    },
    include: sessionInclude,
  });

  return serializeSession(session);
}

export async function getUserSession(userId: string, sessionId: string) {
  const session = await prisma.sesion.findFirst({
    where: { id: sessionId, usuarioId: userId },
    include: sessionInclude,
  });

  if (!session) {
    throw new SessionServiceError(404, "SESSION_NOT_FOUND", "La práctica solicitada no existe.");
  }

  return serializeSession(session);
}

export async function listUserSessions(userId: string, limit: number) {
  const safeLimit = Math.min(50, Math.max(1, limit));

  const [total, sessions] = await prisma.$transaction([
    prisma.sesion.count({ where: { usuarioId: userId } }),
    prisma.sesion.findMany({
      where: { usuarioId: userId },
      orderBy: { creadoEn: "desc" },
      take: safeLimit,
      include: sessionInclude,
    }),
  ]);

  return {
    data: sessions.map(serializeSession),
    meta: { total, limit: safeLimit },
  };
}

export async function completeTextSession(
  userId: string,
  sessionId: string,
  transcript: string,
  durationMs?: number,
) {
  const cleanTranscript = transcript.trim();

  if (cleanTranscript.length < MIN_TRANSCRIPT_LENGTH) {
    throw new SessionServiceError(400, "TRANSCRIPT_TOO_SHORT", "Escribe una respuesta antes de finalizar la práctica.");
  }

  if (cleanTranscript.length > MAX_TRANSCRIPT_LENGTH) {
    throw new SessionServiceError(400, "TRANSCRIPT_TOO_LONG", `La respuesta no puede superar ${MAX_TRANSCRIPT_LENGTH} caracteres.`);
  }

  if (durationMs !== undefined && (!Number.isInteger(durationMs) || durationMs < 0 || durationMs > 7_200_000)) {
    throw new SessionServiceError(400, "INVALID_DURATION", "La duración de la práctica no es válida.");
  }

  const existing = await prisma.sesion.findFirst({
    where: { id: sessionId, usuarioId: userId },
    select: { id: true, estado: true, modalidad: true },
  });

  if (!existing) {
    throw new SessionServiceError(404, "SESSION_NOT_FOUND", "La práctica solicitada no existe.");
  }

  if (existing.modalidad !== ModalidadRespuesta.TEXTO) {
    throw new SessionServiceError(409, "SESSION_MODE_NOT_SUPPORTED", "Esta práctica no corresponde al modo texto.");
  }

  if (existing.estado !== EstadoSesion.INICIADA) {
    throw new SessionServiceError(409, "SESSION_ALREADY_FINISHED", "Esta práctica ya fue finalizada.");
  }

  const analysis = buildTextMetrics(cleanTranscript);

  await prisma.$transaction([
    prisma.sesion.update({
      where: { id: existing.id },
      data: {
        estado: EstadoSesion.COMPLETADA,
        transcripcion: cleanTranscript,
        duracionMs: durationMs ?? null,
        finalizadaEn: new Date(),
      },
    }),
    prisma.metrica.upsert({
      where: { sesionId: existing.id },
      create: {
        sesionId: existing.id,
        palabras: analysis.words,
        cantidadPausas: 0,
        duracionPausasMs: 0,
        muletillasTotal: analysis.fillers.total,
        muletillasDetalle: analysis.fillers.detail,
        repeticiones: analysis.repetitions,
        puntajeMuletillas: analysis.fillerScore,
        puntajeGeneral: analysis.generalScore,
      },
      update: {
        palabras: analysis.words,
        cantidadPausas: 0,
        duracionPausasMs: 0,
        muletillasTotal: analysis.fillers.total,
        muletillasDetalle: analysis.fillers.detail,
        repeticiones: analysis.repetitions,
        puntajeMuletillas: analysis.fillerScore,
        puntajeGeneral: analysis.generalScore,
      },
    }),
  ]);

  const completed = await prisma.sesion.findUniqueOrThrow({
    where: { id: existing.id },
    include: sessionInclude,
  });

  return serializeSession(completed);
}
