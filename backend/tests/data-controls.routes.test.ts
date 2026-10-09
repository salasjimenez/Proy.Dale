import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";

describe("data control route guards", () => {
  it("protects personal data export", async () => {
    const response = await request(app).get("/api/auth/export");

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("AUTH_REQUIRED");
  });

  it("protects account deletion", async () => {
    const response = await request(app).delete("/api/auth/me").send({ password: "example123" });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("AUTH_REQUIRED");
  });

  it("protects bulk practice deletion", async () => {
    const response = await request(app).delete("/api/sesiones");

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("AUTH_REQUIRED");
  });

  it("protects individual practice deletion", async () => {
    const response = await request(app).delete("/api/sesiones/00000000-0000-0000-0000-000000000000");

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("AUTH_REQUIRED");
  });
});
