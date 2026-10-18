import type { ScenarioCardData } from "../types/scenario";
import type { VoiceCaptureResult } from "../components/vue/VoiceCapture.vue";

/** v0.16.4: guion determinista, no es una conversacion con IA. */
export type SequenceMode = "VOZ" | "TEXTO";
export type SequencePhase = {
  id: "apertura" | "objecion" | "presion";
  title: string;
  interaction: string;
  hint: string;
  intensity: "Normal" | "Desafiante" | "Alta";
  minimumWords: number;
  /** Pistas de evaluación explícitas para la simulación exigente. */
  goals?: readonly string[];
};
export type PhaseAnswer = {
  text: string;
  durationMs: number;
  pauses: { inicioMs: number; duracionMs: number }[];
};

const byCategory: Record<string, [string, string]> = {
  LABORAL: [
    "La otra persona te pide un ejemplo concreto y pregunta qué resultados obtuviste.",
    "La otra persona duda de tu propuesta y solicita una respuesta clara antes de tomar una decisión.",
  ],
  TRAMITES_CALLE: [
    "Te indican que la solicitud no está clara y piden que precises los hechos.",
    "Te informan que no pueden resolverlo de inmediato. Explica qué alternativa o siguiente paso solicitas.",
  ],
  SOCIAL: [
    "La otra persona interpreta tus palabras de otra manera. Aclara lo que quisiste expresar.",
    "La conversación se vuelve tensa y te interrumpen. Retoma tu idea de forma respetuosa.",
  ],
  JOVENES_ESTUDIANTES: [
    "Te piden justificar tu argumento con un ejemplo o evidencia.",
    "Surge una pregunta inesperada y te piden resumir tu posición sin perder el hilo.",
  ],
};

/** Objeciones difíciles por contexto; no afirman conversar con una IA. */
const extremeByCategory: Record<string, [string, string]> = {
  LABORAL: [
    "Tu interlocutor cuestiona una afirmación que hiciste y exige un ejemplo verificable de resultados. Responde a esa objeción sin desviarte del objetivo.",
    "La persona rechaza tu primera propuesta y solicita una alternativa concreta con responsables o plazos. Explica límites realistas sin prometer algo imposible.",
  ],
  TRAMITES_CALLE: [
    "Te comunican que la información es contradictoria y que tu solicitud podría rechazarse. Precisa los hechos y pide que aclaren el criterio aplicado.",
    "El trámite queda suspendido y te exigen resolverlo de inmediato. No puedes asegurar el resultado: pide una alternativa formal y acuerda qué comprobante o paso sigue.",
  ],
  SOCIAL: [
    "La otra persona atribuye a tu mensaje una intención distinta y cuestiona lo que dijiste. Reconoce el malentendido y aclara tu postura con un ejemplo.",
    "El diálogo se vuelve tenso, hay una interrupción y te piden decidir en ese momento. Explica tu límite, ofrece una alternativa respetuosa y concreta el siguiente paso.",
  ],
  JOVENES_ESTUDIANTES: [
    "Cuestionan la evidencia de tu argumento y presentan un contraejemplo. Explica qué dato respalda tu postura y qué aspecto revisarías.",
    "Te interrumpen con una pregunta inesperada mientras debes cerrar tu exposición. Prioriza la idea esencial, reconoce la duda y propone una conclusión verificable.",
  ],
};

export function sequencePhases(scenario: Pick<ScenarioCardData, "situacion" | "instrucciones" | "categoria" | "nivel">): SequencePhase[] {
  const high = scenario.nivel.codigo === "DIFICIL";
  const medium = scenario.nivel.codigo === "INTERMEDIO";
  const [objection, pressure] = high
    ? (extremeByCategory[scenario.categoria.codigo] ?? extremeByCategory.SOCIAL!)
    : (byCategory[scenario.categoria.codigo] ?? byCategory.SOCIAL!);
  return [
    {
      id: "apertura",
      title: "1. Abre la conversación",
      interaction: scenario.situacion,
      hint: high
        ? `${scenario.instrucciones} Expón el contexto, qué buscas lograr y una primera acción concreta.`
        : scenario.instrucciones,
      intensity: high ? "Desafiante" : "Normal",
      minimumWords: high ? 24 : 5,
      ...(high ? { goals: ["Explica el contexto", "Expresa un objetivo", "Propón un primer paso"] } : {}),
    },
    {
      id: "objecion",
      title: "2. Responde una objeción",
      interaction: objection,
      hint: high
        ? "Reconoce la objeción, aporta una razón o evidencia, plantea una alternativa y concreta cómo avanzar."
        : "Responde a la otra persona con una idea y un ejemplo concreto.",
      intensity: high ? "Alta" : medium ? "Desafiante" : "Normal",
      minimumWords: high ? 30 : 7,
      ...(high ? { goals: ["Reconoce la objeción", "Apoya tu respuesta con datos o ejemplos", "Plantea una alternativa", "Acuerda un paso verificable"] } : {}),
    },
    {
      id: "presion",
      title: "3. Gestiona la presión",
      interaction: pressure,
      hint: high
        ? "Responde sin prometer resultados imposibles. Reconoce la objeción, fija una condición o prioridad y propón un cierre verificable."
        : "Mantén la calma, resume tu idea y plantea el siguiente paso.",
      intensity: high ? "Alta" : "Desafiante",
      minimumWords: high ? 35 : 8,
      ...(high ? { goals: ["Responde a la objeción", "Señala límites o prioridades", "Ofrece una salida realista", "Concreta un seguimiento"] } : {}),
    },
  ];
}

export function answerWordCount(text: string): number {
  const clean = text.trim();
  return clean ? clean.split(/\s+/u).length : 0;
}

export function answerReady(text: string, phase: SequencePhase): boolean {
  return answerWordCount(text) >= phase.minimumWords;
}

/** Combina las tres capturas locales; el backend recibe UNA sola sesion habitual. */
export function assembleSequence(answers: readonly PhaseAnswer[], mode: SequenceMode): {
  transcripcion: string;
  duracionMs: number;
  pausasDetalle?: VoiceCaptureResult["pausasDetalle"];
} {
  if (answers.length !== 3 || answers.some(answer => !answer.text.trim())) {
    throw new Error("Debes completar las tres fases antes de guardar.");
  }
  const transcripcion = answers.map(answer => answer.text.trim()).join("\n\n");
  if (transcripcion.length > 5000) throw new Error("La transcripción supera el máximo de 5000 caracteres. Reduce la respuesta.");
  let elapsed = 0;
  const pausasDetalle: VoiceCaptureResult["pausasDetalle"] = [];
  for (const answer of answers) {
    const duration = Math.floor(answer.durationMs);
    if (!Number.isFinite(duration) || duration < 0) throw new Error("Duración de fase no válida.");
    if (mode === "VOZ") {
      for (const pause of answer.pauses) {
        if (pausasDetalle.length >= 200) break;
        const start = Math.floor(pause.inicioMs);
        const length = Math.floor(pause.duracionMs);
        if (start >= 0 && length >= 600 && length <= 30000 && start + length <= duration + 1500) {
          pausasDetalle.push({ inicioMs: elapsed + start, duracionMs: length });
        }
      }
    }
    elapsed += duration;
  }
  if (elapsed > 7_200_000) throw new Error("La duración supera el máximo permitido. Inicia una nueva práctica.");
  if (mode === "VOZ" && elapsed < 500) throw new Error("La grabación es demasiado corta para analizarla.");
  return {
    transcripcion,
    duracionMs: elapsed,
    ...(mode === "VOZ" ? { pausasDetalle } : {}),
  };
}

/** El umbral es pedagogico; NO mide si se resolvio el conflicto ni emociones. */
export function sequenceVerdict(score: number | null, completed: boolean): {
  label: string;
  description: string;
  kind: "success" | "progress" | "review" | "incomplete";
} {
  if (!completed) return { label: "Simulación no completada", description: "No hay puntuación final; puedes volver a entrenar cuando quieras.", kind: "incomplete" };
  if (score === null || !Number.isFinite(score)) return { label: "Completada sin puntaje", description: "No hay suficientes métricas para compararla.", kind: "progress" };
  if (score < 55) return { label: "Refuerzo recomendado", description: "La puntuación preliminar no alcanzó el umbral orientativo (55/100). No significa que hayas fracasado en una conversación real.", kind: "review" };
  if (score < 75) return { label: "En progreso", description: "Completaste las fases. Repite para practicar el ritmo y la claridad de tus respuestas.", kind: "progress" };
  return { label: "Entrenamiento superado", description: "Completaste todas las fases y alcanzaste el umbral orientativo. No es una evaluación de competencias personales.", kind: "success" };
}
