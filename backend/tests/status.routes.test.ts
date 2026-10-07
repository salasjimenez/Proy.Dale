import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import type { Express } from "express";

let app: Express;

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.PORT = "3000";
  process.env.FRONTEND_URL = "http://localhost:4321";
  process.env.DATABASE_URL =
    "postgresql://dale_app:ci_only@127.0.0.1:5432/dale?schema=public";
  process.env.JWT_SECRET = "ci-only-secret-with-more-than-32-characters";
  process.env.JWT_EXPIRES_IN_SECONDS = "3600";
  process.env.AUTH_COOKIE_NAME = "dale_session";
  process.env.AUTH_COOKIE_SAME_SITE = "lax";
  process.env.AUTH_COOKIE_SECURE = "false";

  ({ app } = await import("../src/app.js"));
});

describe("status routes", () => {
  it("reports authentication as implemented", async () => {
    const response = await request(app).get("/api/auth/status");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      module: "auth",
      status: "ready",
      implemented: true,
      session: "jwt-http-only-cookie",
    });
  });

  it("reports both text and voice practice modes", async () => {
    const response = await request(app).get("/api/sesiones/status");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      module: "sesiones",
      status: "ready",
      implemented: true,
      modes: {
        texto: true,
        voz: true,
      },
    });
  });

  it("reports the progress dashboard as available", async () => {
    const response = await request(app).get("/api/progreso/status");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      module: "progreso",
      status: "ready",
      implemented: true,
      dashboard: "mi-voz-mi-progreso",
    });
  });

  it("reports the four scenario-map categories", async () => {
    const response = await request(app).get("/api/mapa/status");

    expect(response.status).toBe(200);
    expect(response.body.categories).toEqual([
      "LABORAL",
      "TRAMITES_CALLE",
      "SOCIAL",
      "JOVENES_ESTUDIANTES",
    ]);
  });
});

describe("route guards", () => {
  it("rejects a protected route when there is no session", async () => {
    const response = await request(app).get("/api/progreso");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: "AUTH_REQUIRED",
      message: "Inicia sesión para continuar.",
    });
  });

  it("returns JSON 404 for an unknown route", async () => {
    const response = await request(app).get("/api/no-existe");

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      error: "NOT_FOUND",
    });
  });
});
