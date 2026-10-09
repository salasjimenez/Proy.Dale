import {
  EstadoSesion,
  ModalidadRespuesta,
  Prisma,
} from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { categoriaLabels, nivelLabels } from "./escenarios.service.js";

const MAX_TRANSCRIPT_LENGTH = 5000;
const MIN_TRANSCRIPT_LENGTH = 3;
const MAX_SESSION_DURATION_MS = 7_200_000;
const MIN_VOICE_PAUSE_MS = 600;
const MAX_VOICE_PAUSES = 200;

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

type PauseDetail = {
  inicioMs: number;
  duracionMs: number;
};

type Feedback = {
  strengths: string[];
  suggestions: string[];
  note: string;
};

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

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
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

function validateTranscript(transcript: string): string {
  const cleanTranscript = transcript.trim();

  if (cleanTranscript.length < MIN_TRANSCRIPT_LENGTH) {
    throw new SessionServiceError(400, "TRANSCRIPT_TOO_SHORT", "Completa una respuesta antes de finalizar la práctica.");
  }

  if (cleanTranscript.length > MAX_TRANSCRIPT_LENGTH) {
    throw new SessionServiceError(400, "TRANSCRIPT_TOO_LONG", `La respuesta no puede superar ${MAX_TRANSCRIPT_LENGTH} caracteres.`);
  }

  return cleanTranscript;
}

function validateDuration(durationMs?: number, required = false): number | undefined {
  if (durationMs === undefined) {
    if (required) {
      throw new SessionServiceError(400, "DURATION_REQUIRED", "No pudimos medir la duración de la práctica por voz.");
    }
    return undefined;
  }

  if (!Number.isInteger(durationMs) || durationMs < 0 || durationMs > MAX_SESSION_DURATION_MS) {
    throw new SessionServiceError(400, "INVALID_DURATION", "La duración de la práctica no es válida.");
  }

  if (required && durationMs < 500) {
    throw new SessionServiceError(400, "VOICE_DURATION_TOO_SHORT", "La práctica por voz fue demasiado corta para analizarla.");
  }

  return durationMs;
}

function parsePauseDetails(value: unknown, durationMs: number): PauseDetail[] {
  if (value === undefined || value === null) return [];

  if (!Array.isArray(value)) {
    throw new SessionServiceError(400, "INVALID_PAUSE_DATA", "Los datos de pausas no tienen un formato válido.");
  }

  if (value.length > MAX_VOICE_PAUSES) {
    throw new SessionServiceError(400, "TOO_MANY_PAUSES", "La práctica contiene demasiadas muestras de pausa.");
  }

  const parsed: PauseDetail[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new SessionServiceError(400, "INVALID_PAUSE_DATA", "Los datos de pausas no tienen un formato válido.");
    }

    const record = item as Record<string, unknown>;
    const inicioMs = record.inicioMs;
    const duracionPausaMs = record.duracionMs;

    if (
      typeof inicioMs !== "number" ||
      !Number.isInteger(inicioMs) ||
      inicioMs < 0 ||
      typeof duracionPausaMs !== "number" ||
      !Number.isInteger(duracionPausaMs) ||
      duracionPausaMs < 0 ||
      duracionPausaMs > 30_000 ||
      inicioMs > durationMs + 1_000 ||
      inicioMs + duracionPausaMs > durationMs + 1_500
    ) {
      throw new SessionServiceError(400, "INVALID_PAUSE_DATA", "Los datos de pausas no tienen un formato válido.");
    }

    if (duracionPausaMs >= MIN_VOICE_PAUSE_MS) {
      parsed.push({ inicioMs, duracionMs: duracionPausaMs });
    }
  }

  return parsed;
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

function scoreRhythm(wordsPerMinute: number): number {
  if (wordsPerMinute >= 105 && wordsPerMinute <= 165) return 100;
  if (wordsPerMinute < 105) return Math.round(clamp(100 - (105 - wordsPerMinute) * 1.4));
  return Math.round(clamp(100 - (wordsPerMinute - 165) * 1.2));
}

function scorePauses(pauses: PauseDetail[], durationMs: number): number {
  if (durationMs <= 0) return 0;

  const totalPauseMs = pauses.reduce((sum, pause) => sum + pause.duracionMs, 0);
  const averagePauseMs = pauses.length > 0 ? totalPauseMs / pauses.length : 0;
  const pauseRatio = totalPauseMs / durationMs;

  let score = 100;

  if (averagePauseMs > 2_500) score -= Math.min(35, Math.round((averagePauseMs - 2_500) / 100));
  if (pauseRatio > 0.4) score -= Math.min(40, Math.round((pauseRatio - 0.4) * 100));
  if (durationMs >= 20_000 && pauses.length === 0) score -= 10;

  return Math.round(clamp(score));
}

function buildVoiceMetrics(transcript: string, durationMs: number, pauses: PauseDetail[]) {
  const words = tokenize(transcript);
  const fillers = analyzeFillers(transcript);
  const repetitions = countImmediateRepetitions(words);
  const spokenMinutes = durationMs / 60_000;
  const wordsPerMinute = spokenMinutes > 0 ? round(words.length / spokenMinutes) : 0;

  const totalPauseMs = pauses.reduce((sum, pause) => sum + pause.duracionMs, 0);
  const averagePauseMs = pauses.length > 0 ? round(totalPauseMs / pauses.length) : null;
  const maximumPauseMs = pauses.length > 0 ? Math.max(...pauses.map((pause) => pause.duracionMs)) : null;

  const rhythmScore = scoreRhythm(wordsPerMinute);
  const pauseScore = scorePauses(pauses, durationMs);
  const fillerScore = Math.round(clamp(100 - Math.min(50, fillers.total * 6)));
  const repetitionScore = Math.round(clamp(100 - Math.min(40, repetitions * 8)));
  const lengthScore = words.length >= 20 ? 100 : Math.round(clamp(100 - (20 - words.length) * 3));

  const generalScore = Math.round(
    clamp(
      rhythmScore * 0.3 +
        pauseScore * 0.25 +
        fillerScore * 0.25 +
        repetitionScore * 0.1 +
        lengthScore * 0.1,
    ),
  );

  return {
    words: words.length,
    wordsPerMinute,
    pauses,
    totalPauseMs,
    averagePauseMs,
    maximumPauseMs,
    fillers,
    repetitions,
    rhythmScore,
    pauseScore,
    fillerScore,
    generalScore,
  };
}

function buildTextFeedback(metrics: ReturnType<typeof buildTextMetrics>): Feedback {
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

  if (metrics.repetitions === 0) strengths.push("No detectamos repeticiones consecutivas de palabras.");

  if (metrics.words < 20) suggestions.push("Amplía la respuesta con contexto, una idea principal y un cierre concreto.");
  if (metrics.fillers.total > 0) suggestions.push("Revisa las muletillas detectadas y reemplázalas por una pausa o una frase más directa.");
  if (metrics.repetitions > 0) suggestions.push("Evita repetir la misma palabra de forma consecutiva; reformula antes de continuar.");

  if (suggestions.length === 0) suggestions.push("Repite el escenario intentando responder con menos preparación previa para aumentar la dificultad.");
  if (strengths.length === 0) strengths.push("Completaste la práctica y ya tienes una primera medición para comparar futuros intentos.");

  return {
    strengths,
    suggestions,
    note: "Este puntaje se basa en el texto escrito. Las métricas de voz solo se calculan cuando realizas una práctica por micrófono.",
  };
}

function buildVoiceFeedback(metric: {
  palabras: number;
  palabrasPorMinuto: number | null;
  cantidadPausas: number;
  pausaPromedioMs: number | null;
  muletillasTotal: number;
  repeticiones: number;
}): Feedback {
  const strengths: string[] = [];
  const suggestions: string[] = [];
  const wpm = metric.palabrasPorMinuto ?? 0;

  if (wpm >= 105 && wpm <= 165) strengths.push(`Tu ritmo estuvo en un rango conversacional equilibrado: ${Math.round(wpm)} palabras por minuto.`);
  if (metric.cantidadPausas > 0 && (metric.pausaPromedioMs ?? 0) <= 2_500) strengths.push("Usaste pausas breves que pueden ayudar a separar ideas sin cortar demasiado el flujo.");
  if (metric.muletillasTotal === 0) strengths.push("No detectamos muletillas de la lista analizada en la transcripción.");
  if (metric.repeticiones === 0) strengths.push("No detectamos repeticiones consecutivas de palabras.");

  if (wpm > 165) suggestions.push("Prueba bajar un poco la velocidad para dar más espacio a cada idea.");
  if (wpm > 0 && wpm < 105) suggestions.push("Prueba enlazar las ideas con mayor continuidad para evitar que el ritmo se vuelva demasiado lento.");
  if ((metric.pausaPromedioMs ?? 0) > 2_500) suggestions.push("Algunas pausas fueron largas; intenta usarlas de forma más intencional entre ideas principales.");
  if (metric.muletillasTotal > 0) suggestions.push("Cambia algunas muletillas por una pausa breve antes de continuar.");
  if (metric.palabras < 20) suggestions.push("Amplía la respuesta para que la práctica represente mejor una conversación real.");

  if (strengths.length === 0) strengths.push("Completaste una práctica por voz y ya tienes una línea base para comparar próximos intentos.");
  if (suggestions.length === 0) suggestions.push("Repite el escenario con una dificultad mayor o con menos preparación previa.");

  return {
    strengths,
    suggestions,
    note: "Las pausas se estiman en el navegador a partir de silencios del micrófono y pueden verse afectadas por ruido ambiental. Dale guarda la transcripción y las métricas, no el audio.",
  };
}

function getFillerDetail(value: Prisma.JsonValue | null): Record<string, number> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, number>;
  }
  return {};
}

function serializeSession(session: Prisma.SesionGetPayload<{ include: typeof sessionInclude }>) {
  const feedback = session.metrica
    ? session.modalidad === ModalidadRespuesta.VOZ
      ? buildVoiceFeedback(session.metrica)
      : buildTextFeedback({
          words: session.metrica.palabras,
          fillers: {
            total: session.metrica.muletillasTotal,
            detail: getFillerDetail(session.metrica.muletillasDetalle),
          },
          repetitions: session.metrica.repeticiones,
          fillerScore: session.metrica.puntajeMuletillas ?? 0,
          generalScore: session.metrica.puntajeGeneral ?? 0,
        })
    : undefined;

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
    ...(feedback ? { feedback } : {}),
  };
}

export async function createSession(
  userId: string,
  escenarioSlug: string,
  modalidad: ModalidadRespuesta,
) {
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
      modalidad,
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

export async function completeSession(
  userId: string,
  sessionId: string,
  transcript: string,
  durationMs?: number,
  rawPauseDetails?: unknown,
) {
  const cleanTranscript = validateTranscript(transcript);

  const existing = await prisma.sesion.findFirst({
    where: { id: sessionId, usuarioId: userId },
    select: { id: true, estado: true, modalidad: true },
  });

  if (!existing) {
    throw new SessionServiceError(404, "SESSION_NOT_FOUND", "La práctica solicitada no existe.");
  }

  if (existing.estado !== EstadoSesion.INICIADA) {
    throw new SessionServiceError(409, "SESSION_ALREADY_FINISHED", "Esta práctica ya fue finalizada.");
  }

  if (existing.modalidad === ModalidadRespuesta.TEXTO) {
    const validDuration = validateDuration(durationMs);
    const analysis = buildTextMetrics(cleanTranscript);

    await prisma.$transaction([
      prisma.sesion.update({
        where: { id: existing.id },
        data: {
          estado: EstadoSesion.COMPLETADA,
          transcripcion: cleanTranscript,
          duracionMs: validDuration ?? null,
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
          palabrasPorMinuto: null,
          cantidadPausas: 0,
          duracionPausasMs: 0,
          pausaPromedioMs: null,
          pausaMaximaMs: null,
          muletillasTotal: analysis.fillers.total,
          muletillasDetalle: analysis.fillers.detail,
          repeticiones: analysis.repetitions,
          puntajeRitmo: null,
          puntajePausas: null,
          puntajeMuletillas: analysis.fillerScore,
          puntajeGeneral: analysis.generalScore,
          pausasDetalle: Prisma.JsonNull,
        },
      }),
    ]);
  } else {
    const validDuration = validateDuration(durationMs, true)!;
    const pauses = parsePauseDetails(rawPauseDetails, validDuration);
    const analysis = buildVoiceMetrics(cleanTranscript, validDuration, pauses);

    await prisma.$transaction([
      prisma.sesion.update({
        where: { id: existing.id },
        data: {
          estado: EstadoSesion.COMPLETADA,
          transcripcion: cleanTranscript,
          duracionMs: validDuration,
          finalizadaEn: new Date(),
        },
      }),
      prisma.metrica.upsert({
        where: { sesionId: existing.id },
        create: {
          sesionId: existing.id,
          palabras: analysis.words,
          palabrasPorMinuto: analysis.wordsPerMinute,
          cantidadPausas: analysis.pauses.length,
          duracionPausasMs: analysis.totalPauseMs,
          pausaPromedioMs: analysis.averagePauseMs,
          pausaMaximaMs: analysis.maximumPauseMs,
          muletillasTotal: analysis.fillers.total,
          muletillasDetalle: analysis.fillers.detail,
          repeticiones: analysis.repetitions,
          puntajeRitmo: analysis.rhythmScore,
          puntajePausas: analysis.pauseScore,
          puntajeMuletillas: analysis.fillerScore,
          puntajeGeneral: analysis.generalScore,
          pausasDetalle: analysis.pauses,
        },
        update: {
          palabras: analysis.words,
          palabrasPorMinuto: analysis.wordsPerMinute,
          cantidadPausas: analysis.pauses.length,
          duracionPausasMs: analysis.totalPauseMs,
          pausaPromedioMs: analysis.averagePauseMs,
          pausaMaximaMs: analysis.maximumPauseMs,
          muletillasTotal: analysis.fillers.total,
          muletillasDetalle: analysis.fillers.detail,
          repeticiones: analysis.repetitions,
          puntajeRitmo: analysis.rhythmScore,
          puntajePausas: analysis.pauseScore,
          puntajeMuletillas: analysis.fillerScore,
          puntajeGeneral: analysis.generalScore,
          pausasDetalle: analysis.pauses,
        },
      }),
    ]);
  }

  const completed = await prisma.sesion.findUniqueOrThrow({
    where: { id: existing.id },
    include: sessionInclude,
  });

  return serializeSession(completed);
}


export async function deleteUserSession(userId: string, sessionId: string): Promise<void> {
  const result = await prisma.sesion.deleteMany({
    where: { id: sessionId, usuarioId: userId },
  });

  if (result.count === 0) {
    throw new SessionServiceError(404, "SESSION_NOT_FOUND", "La práctica solicitada no existe.");
  }
}

export async function deleteAllUserSessions(userId: string): Promise<number> {
  const result = await prisma.sesion.deleteMany({
    where: { usuarioId: userId },
  });

  return result.count;
}
