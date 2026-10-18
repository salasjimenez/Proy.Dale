import type { PhaseAnswer, SequenceMode, SequencePhase } from "./sequence";

/**
 * Parche v0.16.4-P1. Reglas explicitas de practica, NO analisis semantico ni emocional.
 * El desglose por fase vive solamente en memoria mientras esta abierta la simulacion.
 */
export type VerbalSignal = {
  label: string;
  detected: boolean;
  /** Coincidencia visible del patron, no prueba de conducta o intencion. */
  example: string | null;
};

export type HardPhaseDiagnostic = {
  phaseId: SequencePhase["id"];
  title: string;
  score: number;
  communicationScore: number;
  voiceScore: number | null;
  words: number;
  durationMs: number;
  wordsPerMinute: number | null;
  pauseCount: number | null;
  pauseTotalMs: number | null;
  pauseRatioPercent: number | null;
  longestPauseMs: number | null;
  fillers: number;
  repetitions: number;
  signals: VerbalSignal[];
  suggestions: string[];
};

type Indicator = { label: string; pattern: RegExp };

const opening: Indicator[] = [
  { label: "Contexto o ejemplo", pattern: /\b(porque|debido|sucedio|ocurrio|cuando|ejemplo|hecho|dato|resultado|situacion|experiencia)\b/u },
  { label: "Objetivo expresado", pattern: /\b(quiero|necesito|busco|solicito|propongo|objetivo|gustaria|pretendo|interesa)\b/u },
  { label: "Accion o siguiente paso", pattern: /\b(podemos|podria|propongo|confirmar|acordar|revisar|resolver|enviar|realizar|siguiente|paso|plazo|fecha)\b/u },
];
const objection: Indicator[] = [
  { label: "Reconoce el punto de la otra persona", pattern: /\b(entiendo|comprendo|escucho|considero|reconozco|agradezco|claro|preocupacion|duda|punto)\b/u },
  { label: "Aporta una razon o ejemplo", pattern: /\b(porque|debido|ejemplo|dato|evidencia|resultado|experiencia|hecho|motivo|razon|demostrar)\b/u },
  { label: "Plantea una alternativa", pattern: /\b(propongo|podemos|podria|alternativa|sugiero|opcion|solicito|ofrezco|planteo)\b/u },
  { label: "Define un paso verificable", pattern: /\b(confirmar|confirmemos|acordar|acordemos|revisar|enviar|fecha|plazo|dia|dias|semana|manana|hoy|siguiente|responsable|verificar)\b/u },
];
const pressure: Indicator[] = [
  { label: "Reconoce la objecion sin ignorarla", pattern: /\b(entiendo|comprendo|escucho|reconozco|considero|preocupacion|duda|punto)\b/u },
  { label: "Declara una prioridad o condicion", pattern: /\b(primero|prioridad|condicion|limite|necesito|requiere|importante|esencial|urgente|antes|despues)\b/u },
  { label: "Propone una salida o alternativa", pattern: /\b(propongo|podemos|podria|alternativa|sugiero|opcion|solucion|acuerdo|solicito|planteo)\b/u },
  { label: "Concreta un cierre o seguimiento", pattern: /\b(confirmar|confirmemos|acordar|acordemos|fecha|plazo|manana|hoy|semana|siguiente|responsable|verificar|enviar|revisar)\b/u },
];

function normalize(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
function tokenize(text: string): string[] {
  return normalize(text).match(/[a-z0-9]+/gu) ?? [];
}
function formatPercent(value: number): number {
  return Math.round(value * 10) / 10;
}
function countFillers(text: string): number {
  return [...normalize(text).matchAll(/\b(?:eh+|em+|mmm+|este|pues|bueno|digamos|tipo|o\s+sea)\b/gu)].length;
}
function countRepetitions(words: readonly string[]): number {
  let total = 0;
  for (let i = 1; i < words.length; i += 1) {
    if (words[i] === words[i - 1]) total += 1;
  }
  return total;
}

/** Union de intervalos: evita contar dos veces pausas solapadas o fuera de fase. */
function pauseStatistics(answer: PhaseAnswer): { count: number; totalMs: number; longestMs: number } {
  const duration = Math.max(0, answer.durationMs);
  const ranges = answer.pauses
    .filter(p => Number.isFinite(p.inicioMs) && Number.isFinite(p.duracionMs)
      && p.inicioMs >= 0 && p.duracionMs >= 600 && p.duracionMs <= 30_000
      && p.inicioMs <= duration + 1_000 && p.inicioMs + p.duracionMs <= duration + 1_500)
    .map(p => [Math.max(0, p.inicioMs), Math.min(duration, p.inicioMs + p.duracionMs)] as const)
    .filter(([start, end]) => end > start)
    .sort((a, b) => a[0] - b[0]);
  let start = -1;
  let end = -1;
  let totalMs = 0;
  for (const [a, b] of ranges) {
    if (start < 0) { start = a; end = b; }
    else if (a <= end) end = Math.max(end, b);
    else { totalMs += end - start; start = a; end = b; }
  }
  if (start >= 0) totalMs += end - start;
  return {
    count: ranges.length,
    totalMs: Math.round(totalMs),
    longestMs: ranges.length ? Math.round(Math.max(...ranges.map(([a, b]) => b - a))) : 0,
  };
}

export function assessHardPhase(phase: SequencePhase, answer: PhaseAnswer, mode: SequenceMode): HardPhaseDiagnostic {
  const wordsArray = tokenize(answer.text);
  const words = wordsArray.length;
  const durationMs = Number.isFinite(answer.durationMs) && answer.durationMs >= 0 ? answer.durationMs : 0;
  const normalized = normalize(answer.text);
  const patterns = phase.id === "apertura" ? opening : phase.id === "objecion" ? objection : pressure;
  const signals = patterns.map(item => {
    const match = normalized.match(item.pattern);
    return { label: item.label, detected: Boolean(match), example: match?.[0] ?? null };
  });
  const signalCount = signals.filter(item => item.detected).length;
  const repetitions = countRepetitions(wordsArray);
  const fillers = countFillers(answer.text);
  const coverage = Math.min(1, words / Math.max(1, phase.minimumWords));
  const communicationScore = clampScore(35 * coverage + 65 * signalCount / Math.max(1, patterns.length));

  let wordsPerMinute: number | null = null;
  let voiceScore: number | null = null;
  let pauseCount: number | null = null;
  let pauseTotalMs: number | null = null;
  let longestPauseMs: number | null = null;
  let pauseRatioPercent: number | null = null;
  if (mode === "VOZ" && durationMs >= 500) {
    wordsPerMinute = formatPercent(words * 60_000 / durationMs);
    const pause = pauseStatistics(answer);
    pauseCount = pause.count;
    pauseTotalMs = pause.totalMs;
    longestPauseMs = pause.longestMs;
    pauseRatioPercent = formatPercent(pause.totalMs * 100 / durationMs);
    // La velocidad es orientativa: no equivale a claridad ni seguridad emocional.
    const paceScore = wordsPerMinute >= 105 && wordsPerMinute <= 170
      ? 100 : wordsPerMinute < 105 ? clampScore(100 - (105 - wordsPerMinute) * 1.1)
      : clampScore(100 - (wordsPerMinute - 170) * 1.2);
    const pauseScore = pauseRatioPercent <= 35 ? 100 : clampScore(100 - (pauseRatioPercent - 35) * 1.6);
    const fillerScore = clampScore(100 - fillers * 7 - repetitions * 5);
    voiceScore = clampScore(paceScore * 0.50 + pauseScore * 0.25 + fillerScore * 0.25);
  }
  const score = voiceScore === null ? communicationScore : clampScore(communicationScore * 0.70 + voiceScore * 0.30);
  const suggestions: string[] = [];
  for (const item of signals) {
    if (!item.detected && suggestions.length < 2) {
      suggestions.push(`Haz explícito: ${item.label.toLowerCase()}. Una expresión diferente también puede ser válida.`);
    }
  }
  if (mode === "VOZ" && wordsPerMinute !== null && wordsPerMinute > 185) {
    suggestions.push("Prueba una velocidad menor y separa las ideas; las palabras/min son aproximadas.");
  } else if (mode === "VOZ" && wordsPerMinute !== null && wordsPerMinute < 85) {
    suggestions.push("Ensaya una respuesta más continua; la velocidad calculada depende de la duración registrada.");
  }
  if (mode === "VOZ" && pauseRatioPercent !== null && pauseRatioPercent > 40) {
    suggestions.push("Revisa los silencios prolongados; el ruido del micrófono puede afectar la detección.");
  }
  if (fillers >= 3) suggestions.push("Escucha las muletillas reconocidas y ensaya una frase más directa.");
  if (repetitions >= 2) suggestions.push("Reduce las repeticiones consecutivas de palabras.");
  if (!suggestions.length) suggestions.push("Intenta responder la misma objeción con un ejemplo distinto y un cierre más concreto.");

  return {
    phaseId: phase.id, title: phase.title, score, communicationScore, voiceScore, words,
    durationMs: Math.round(durationMs), wordsPerMinute, pauseCount, pauseTotalMs,
    longestPauseMs, pauseRatioPercent, fillers, repetitions, signals, suggestions,
  };
}

export function hardSimulationVerdict(diagnostics: readonly HardPhaseDiagnostic[], backendScore: number | null): {
  label: string;
  description: string;
  kind: "success" | "progress" | "review" | "incomplete";
  localScore: number | null;
} {
  if (diagnostics.length !== 3) return {
    label: "Simulación no completada", description: "Faltan fases. No hay resultado final.", kind: "incomplete", localScore: null,
  };
  const localScore = clampScore(diagnostics.reduce((sum, item) => sum + item.score, 0) / 3);
  const weakest = Math.min(...diagnostics.map(item => item.score));
  if (backendScore === null || !Number.isFinite(backendScore)) return {
    label: "Resultado parcial", description: "Falta el puntaje consolidado del servidor. Los indicadores por fase son orientativos.", kind: "progress", localScore,
  };
  if (backendScore < 45 || weakest < 45) return {
    label: "Reto no superado", description: "Uno o más indicadores de esta simulación exigente no alcanzaron el umbral de práctica. No significa que fracasarías en una conversación real.", kind: "review", localScore,
  };
  if (backendScore >= 75 && localScore >= 75 && weakest >= 65) return {
    label: "Simulación exigente superada", description: "Completaste los tres retos con indicadores por fase y puntaje general dentro de los umbrales orientativos.", kind: "success", localScore,
  };
  return {
    label: "Completada: refuerzo recomendado", description: "Completaste todas las fases. Repite la de menor puntaje para seguir practicando respuestas bajo presión.", kind: "progress", localScore,
  };
}
