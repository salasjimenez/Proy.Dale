---
layout: default
title: "frontend/src/lib/accessibility.ts | Dale"
---

# frontend/src/lib/accessibility.ts

Archivo de apoyo utilizado por los componentes de Dale. Copia el bloque completo a la misma ruta dentro de `frontend/src`, o ajusta sus imports segun la estructura del proyecto.

{% raw %}

```typescript
/** Preferencias exclusivamente locales: nunca se envian al backend. */
export const A11Y_TEXT_KEY = "dale-a11y-text-size";
export const A11Y_CONTRAST_KEY = "dale-a11y-contrast";
export const ONBOARDING_KEY = "dale-onboarding-v1-completed";

export type TextSize = "normal" | "large" | "extra";
export type ContrastMode = "standard" | "high";

export function normalizeTextSize(value: unknown): TextSize {
  return value === "large" || value === "extra" ? value : "normal";
}

export function normalizeContrastMode(value: unknown): ContrastMode {
  return value === "high" ? "high" : "standard";
}

export const ONBOARDING_STEPS = [
  {
    title: "Elige una situacion real",
    description: "Explora entrevistas, tramites, conversaciones sociales y situaciones academicas. Puedes elegir el ambito y despues como quieres entrenar.",
    href: "/#escenarios",
    linkLabel: "Explorar escenarios",
  },
  {
    title: "Practica por texto o por voz",
    description: "Selecciona un escenario para empezar. En voz puedes usar el microfono si tu navegador lo permite. Dale no almacena archivos de audio.",
    href: "/#escenarios",
    linkLabel: "Elegir una practica",
  },
  {
    title: "Revisa tu progreso",
    description: "Consulta tus intentos y puntajes en Mi voz, mi progreso. La plataforma diferencia las metricas que no tienen datos.",
    href: "/progreso",
    linkLabel: "Ver progreso",
  },
  {
    title: "Consulta tu mapa y controla tus datos",
    description: "Revisa las categorias que has practicado en el mapa. Desde Mi cuenta puedes exportar o eliminar tus datos.",
    href: "/cuenta",
    linkLabel: "Ir a Mi cuenta",
  },
] as const;
```

{% endraw %}

[Volver a codigo auxiliar](index.html) · [Componentes Vue](../components/index.html)
