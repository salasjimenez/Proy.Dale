---
layout: default
title: "frontend/src/lib/legal.ts | Dale"
---

# frontend/src/lib/legal.ts

Archivo de apoyo utilizado por los componentes de Dale. Copia el bloque completo a la misma ruta dentro de `frontend/src`, o ajusta sus imports segun la estructura del proyecto.

{% raw %}

```typescript
// Fecha única para las tres páginas legales de Dale.
export const LEGAL_VERSION = "2026-10-10";
export const LEGAL_LAST_UPDATED = new Intl.DateTimeFormat("es", {
  day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
}).format(new Date(`${LEGAL_VERSION}T12:00:00Z`));
```

{% endraw %}

[Volver a codigo auxiliar](index.html) · [Componentes Vue](../components/index.html)
