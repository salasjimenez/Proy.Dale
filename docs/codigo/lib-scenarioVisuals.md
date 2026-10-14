---
layout: default
title: "frontend/src/lib/scenarioVisuals.ts | Dale"
---

# frontend/src/lib/scenarioVisuals.ts

Archivo de apoyo utilizado por los componentes de Dale. Copia el bloque completo a la misma ruta dentro de `frontend/src`, o ajusta sus imports segun la estructura del proyecto.

{% raw %}

```typescript
/** Ilustraciones locales creadas para Dale: sin llamadas a servicios externos. */
export type ScenarioVisual = { src: string; alt: string };

const visualByBase: Record<string, ScenarioVisual> = {
  "entrevista-trabajo": {
    src: "/landing/entrevista-laboral.webp",
    alt: "Ilustración de una entrevista laboral entre dos personas",
  },
  "pedir-aumento": {
    src: "/landing/entrevista-laboral.webp",
    alt: "Ilustración de una conversación profesional en una oficina",
  },
  "hablar-con-jefatura": {
    src: "/landing/atencion-cliente.webp",
    alt: "Ilustración de una persona conversando en su entorno de trabajo",
  },
  "hacer-reclamo": {
    src: "/landing/hacer-reclamo.webp",
    alt: "Ilustración de una persona hablando por teléfono para resolver un problema",
  },
  "pedir-informacion": {
    src: "/landing/pedir-informacion.webp",
    alt: "Ilustración de una persona solicitando información",
  },
  "cobro-incorrecto": {
    src: "/landing/atencion-cliente.webp",
    alt: "Ilustración de atención a una consulta en una oficina",
  },
  "iniciar-conversacion": {
    src: "/landing/conversacion-social.webp",
    alt: "Ilustración de dos personas conversando amistosamente",
  },
  "expresar-desacuerdo": {
    src: "/landing/conversacion-social.webp",
    alt: "Ilustración de una conversación cara a cara",
  },
  "pedir-ayuda": {
    src: "/landing/pedir-informacion.webp",
    alt: "Ilustración de una persona que pide ayuda en su comunidad",
  },
  "exposicion-clase": {
    src: "/landing/exposicion-clase.webp",
    alt: "Ilustración de un estudiante presentando un tema ante la clase",
  },
  "hablar-con-profesor": {
    src: "/landing/exposicion-clase.webp",
    alt: "Ilustración de una conversación sobre asuntos académicos",
  },
  "entrevista-beca": {
    src: "/landing/entrevista-laboral.webp",
    alt: "Ilustración de una persona respondiendo en una entrevista",
  },
};

export function scenarioBase(slug: string): string {
  return slug.replace(/-(basico|intermedio|dificil)$/i, "");
}

export function scenarioVisual(slug: string): ScenarioVisual {
  return visualByBase[scenarioBase(slug)] ?? {
    src: "/landing/conversacion-social.webp",
    alt: "Ilustración de una conversación en un entorno cotidiano",
  };
}

/** Slugs correspondientes a los escenarios realmente existentes en el seed. */
export const FEATURED_SCENARIOS = [
  {
    slug: "entrevista-trabajo-basico",
    title: "Entrevista laboral",
    description: "Ensaya cómo presentarte y responder con claridad.",
    category: "Trabajo",
  },
  {
    slug: "exposicion-clase-basico",
    title: "Exposición en clase",
    description: "Ordena tus ideas antes de hablar en público.",
    category: "Estudios",
  },
  {
    slug: "hacer-reclamo-basico",
    title: "Hacer un reclamo",
    description: "Explica un problema y pide una solución concreta.",
    category: "Trámites",
  },
  {
    slug: "iniciar-conversacion-basico",
    title: "Iniciar una conversación",
    description: "Practica cómo empezar y mantener un diálogo.",
    category: "Vida social",
  },
  {
    slug: "cobro-incorrecto-basico",
    title: "Resolver un cobro",
    description: "Plantea una consulta y argumenta con tranquilidad.",
    category: "Servicios",
  },
  {
    slug: "pedir-informacion-basico",
    title: "Pedir información",
    description: "Haz preguntas precisas en situaciones cotidianas.",
    category: "Vida diaria",
  },
] as const;
```

{% endraw %}

[Volver a codigo auxiliar](index.html) · [Componentes Vue](../components/index.html)
