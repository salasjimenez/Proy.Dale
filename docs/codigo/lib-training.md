---
layout: default
title: "frontend/src/lib/training.ts | Dale"
---

# frontend/src/lib/training.ts

Archivo de apoyo utilizado por los componentes de Dale. Copia el bloque completo a la misma ruta dentro de `frontend/src`, o ajusta sus imports segun la estructura del proyecto.

{% raw %}

```typescript
/** Recomendaciones transparentes basadas en escenarios y métricas disponibles. */
export type TrainingStage = "BASICO" | "INTERMEDIO" | "DIFICIL";
export type TrainingMode = "TEXTO" | "VOZ";

export const SHORT_SESSION_SECONDS = 5 * 60;

export const TRAINING_STAGES: ReadonlyArray<{
  code: TrainingStage;
  title: string;
  description: string;
}> = [
  { code: "BASICO", title: "Preparación", description: "Ordena las primeras ideas." },
  { code: "INTERMEDIO", title: "Práctica guiada", description: "Responde con más contexto." },
  { code: "DIFICIL", title: "Simulación real", description: "Ensaya un reto más exigente." },
];

/** Todos los slugs base existen en backend/prisma/seed.ts. */
export const TRAINING_GOALS = [
  {
    id: "entrevista",
    title: "Preparar una entrevista",
    description: "Preséntate y responde preguntas laborales con estructura.",
    baseSlug: "entrevista-trabajo",
    image: "/landing/entrevista-laboral.webp",
    category: "Trabajo",
  },
  {
    id: "exposicion",
    title: "Hablar ante otras personas",
    description: "Ordena tus ideas antes de una exposición.",
    baseSlug: "exposicion-clase",
    image: "/landing/exposicion-clase.webp",
    category: "Presentaciones",
  },
  {
    id: "conversacion",
    title: "Iniciar conversaciones",
    description: "Ensaya una apertura y aprende a continuar el diálogo.",
    baseSlug: "iniciar-conversacion",
    image: "/landing/conversacion-social.webp",
    category: "Vida social",
  },
  {
    id: "reclamo",
    title: "Resolver un problema",
    description: "Explica un reclamo y solicita una solución concreta.",
    baseSlug: "hacer-reclamo",
    image: "/landing/hacer-reclamo.webp",
    category: "Situaciones cotidianas",
  },
  {
    id: "informacion",
    title: "Pedir información",
    description: "Haz preguntas claras y confirma lo que entendiste.",
    baseSlug: "pedir-informacion",
    image: "/landing/pedir-informacion.webp",
    category: "Trámites",
  },
  {
    id: "jefatura",
    title: "Hablar con mi responsable",
    description: "Comunica una dificultad o una propuesta en el trabajo.",
    baseSlug: "hablar-con-jefatura",
    image: "/landing/atencion-cliente.webp",
    category: "Trabajo",
  },
] as const;

export type TrainingGoalId = (typeof TRAINING_GOALS)[number]["id"];
const suffixByStage: Record<TrainingStage, string> = {
  BASICO: "basico",
  INTERMEDIO: "intermedio",
  DIFICIL: "dificil",
};

export function toTrainingSlug(baseSlug: string, stage: TrainingStage): string {
  return `${baseSlug}-${suffixByStage[stage]}`;
}

export function trainingHref(
  baseSlug: string,
  stage: TrainingStage,
  mode: TrainingMode = "VOZ",
  short = false,
): string {
  const params = new URLSearchParams({
    escenario: toTrainingSlug(baseSlug, stage),
    modalidad: mode,
  });
  if (short) params.set("rapido", "1");
  return `/simulacion?${params.toString()}`;
}

export function stageFromSlug(slug: string): TrainingStage {
  if (slug.endsWith("-intermedio")) return "INTERMEDIO";
  if (slug.endsWith("-dificil")) return "DIFICIL";
  return "BASICO";
}

export function trainingStageName(stage: TrainingStage): string {
  return TRAINING_STAGES.find((item) => item.code === stage)?.title ?? "Preparación";
}

/** Avanzar es una sugerencia, no un diagnóstico ni un desbloqueo obligatorio. */
export function recommendNextStage(slug: string, score: number | null): {
  slug: string;
  title: string;
  message: string;
  advanced: boolean;
} {
  const stage = stageFromSlug(slug);
  const stages: TrainingStage[] = ["BASICO", "INTERMEDIO", "DIFICIL"];
  const index = stages.indexOf(stage);
  const advanced = score !== null && Number.isFinite(score) && score >= 75 && index < stages.length - 1;
  const nextStage = advanced ? stages[index + 1]! : stage;
  const baseSlug = slug.replace(/-(basico|intermedio|dificil)$/, "");
  return {
    slug: toTrainingSlug(baseSlug, nextStage),
    title: advanced ? `Probar ${trainingStageName(nextStage)}` : `Repetir ${trainingStageName(stage)}`,
    message: advanced
      ? "Puedes probar la siguiente etapa si deseas un reto mayor. También puedes repetir esta práctica."
      : "Practicar de nuevo la misma situación te permitirá comparar tus intentos.",
    advanced,
  };
}

export type MetricSignals = {
  palabras: number;
  muletillasTotal: number;
  repeticiones: number;
  puntajeRitmo: number | null;
  puntajePausas: number | null;
};

export function focusSuggestion(metrics: MetricSignals, mode: TrainingMode): string {
  if (metrics.muletillasTotal >= 3) {
    return "En el siguiente intento, identifica y reduce las muletillas detectadas en tu respuesta.";
  }
  if (metrics.repeticiones >= 2) {
    return "Intenta expresar cada idea una sola vez antes de pasar a la siguiente.";
  }
  if (mode === "VOZ" && metrics.puntajePausas !== null && metrics.puntajePausas < 60) {
    return "Revisa las pausas estimadas y ensaya transiciones más claras entre tus ideas.";
  }
  if (mode === "VOZ" && metrics.puntajeRitmo !== null && metrics.puntajeRitmo < 60) {
    return "Prueba un ritmo más constante. Las mediciones de voz son aproximadas.";
  }
  if (metrics.palabras < 25) {
    return "Amplía tu respuesta con una idea principal, un ejemplo y un cierre breve.";
  }
  return "Mantén la estructura de tu respuesta y prueba un nuevo contexto al repetirla.";
}

export function remainingTimeLabel(elapsedSeconds: number): string {
  const remaining = Math.max(0, SHORT_SESSION_SECONDS - Math.max(0, Math.floor(elapsedSeconds)));
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
```

{% endraw %}

[Volver a codigo auxiliar](index.html) · [Componentes Vue](../components/index.html)
