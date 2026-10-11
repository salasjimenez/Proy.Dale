---
layout: default
title: "frontend/src/types/auth.ts | Dale"
---

# frontend/src/types/auth.ts

Archivo de apoyo utilizado por los componentes de Dale. Copia el bloque completo a la misma ruta dentro de `frontend/src`, o ajusta sus imports segun la estructura del proyecto.

{% raw %}

```typescript
export type AuthUser = {
  id: string;
  email: string;
  nombre: string | null;
  creadoEn: string;
};

export type AuthResponse = {
  data: {
    user: AuthUser;
  };
};
```

{% endraw %}

[Volver a codigo auxiliar](index.html) · [Componentes Vue](../components/index.html)
