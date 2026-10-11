---
layout: default
title: "frontend/src/lib/api.ts | Dale"
---

# frontend/src/lib/api.ts

Archivo de apoyo utilizado por los componentes de Dale. Copia el bloque completo a la misma ruta dentro de `frontend/src`, o ajusta sus imports segun la estructura del proyecto.

{% raw %}

```typescript
export const API_BASE_URL = (import.meta.env.PUBLIC_API_URL || "http://localhost:3000").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  code?: string;
  fields?: Record<string, string>;

  constructor(
    message: string,
    status: number,
    code?: string,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

type ApiOptions = {
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
};

async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Accept: "application/json",
      ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    credentials: "include",
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    ...(options.signal ? { signal: options.signal } : {}),
  });

  if (!response.ok) {
    let message = "No se pudo completar la solicitud.";
    let code: string | undefined;
    let fields: Record<string, string> | undefined;

    try {
      const body = (await response.json()) as {
        message?: string;
        error?: string;
        fields?: Record<string, string>;
      };
      message = body.message || message;
      code = body.error;
      fields = body.fields;
    } catch {
      // Mantener mensaje genérico si el backend no devuelve JSON.
    }

    throw new ApiError(message, response.status, code, fields);
  }

  return (await response.json()) as T;
}

export function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  return apiRequest<T>(path, { method: "GET", signal });
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, { method: "POST", body });
}

export function apiDelete<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, { method: "DELETE", body });
}
```

{% endraw %}

[Volver a codigo auxiliar](index.html) · [Componentes Vue](../components/index.html)
