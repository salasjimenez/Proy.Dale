---
layout: default
title: "frontend/src/types/scenario.ts | Dale"
---

# frontend/src/types/scenario.ts

Archivo de apoyo utilizado por los componentes de Dale. Copia el bloque completo a la misma ruta dentro de `frontend/src`, o ajusta sus imports segun la estructura del proyecto.

{% raw %}

```typescript
export type ScenarioCardData = {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string;
  situacion: string;
  instrucciones: string;
  categoria: {
    codigo: string;
    nombre: string;
  };
  nivel: {
    codigo: string;
    nombre: string;
  };
};
```

{% endraw %}

[Volver a codigo auxiliar](index.html) · [Componentes Vue](../components/index.html)
