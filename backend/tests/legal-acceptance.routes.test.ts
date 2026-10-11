import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../src/app.js";
import { resetAuthRateLimitForTests } from "../src/middleware/auth-rate-limit.js";
import { registerUser } from "../src/services/auth.service.js";

vi.mock("../src/services/auth.service.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/services/auth.service.js")>();
  return {
    ...actual,
    registerUser: vi.fn(async () => ({
      user: {
        id: "00000000-0000-0000-0000-000000000001",
        email: "ana@example.com",
        nombre: "Ana",
        creadoEn: new Date("2026-10-10T00:00:00Z"),
      },
      token: "test-session-token",
    })),
  };
});

const credentials = { nombre: "Ana", email: "ana@example.com", password: "Clave1234" };

describe("legal acceptance on registration", () => {
  beforeEach(() => {
    resetAuthRateLimitForTests();
    vi.mocked(registerUser).mockClear();
  });

  it("rejects registration without an acceptance value before touching the database", async () => {
    const response = await request(app).post("/api/auth/register").send(credentials);
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("VALIDATION_ERROR");
    expect(response.body.fields.aceptaTerminos).toBeTruthy();
    expect(registerUser).not.toHaveBeenCalled();
  });

  it("rejects false and string values; only boolean true is valid", async () => {
    for (const aceptaTerminos of [false, "true", 1, null]) {
      const response = await request(app).post("/api/auth/register").send({ ...credentials, aceptaTerminos });
      expect(response.status).toBe(400);
      expect(response.body.fields.aceptaTerminos).toBeTruthy();
    }
    expect(registerUser).not.toHaveBeenCalled();
  });

  it("allows a complete registration with explicit acceptance", async () => {
    const response = await request(app).post("/api/auth/register").send({ ...credentials, aceptaTerminos: true });
    expect(response.status).toBe(201);
    expect(response.body.data.user.email).toBe(credentials.email);
    expect(registerUser).toHaveBeenCalledWith(expect.objectContaining({ aceptaTerminos: true }));
    expect(response.headers["set-cookie"]).toBeTruthy();
    expect(String(response.headers["set-cookie"])).toContain("HttpOnly");
  });
});
