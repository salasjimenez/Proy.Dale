export const API_BASE_URL = (import.meta.env.PUBLIC_API_URL || "http://localhost:3000").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  if (!response.ok) {
    let message = "No se pudo completar la solicitud.";

    try {
      const body = (await response.json()) as { message?: string };
      message = body.message || message;
    } catch {
      // Mantener mensaje genérico si el backend no devuelve JSON.
    }

    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}
