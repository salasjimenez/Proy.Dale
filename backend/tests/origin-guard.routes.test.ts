import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";

describe("P2 - origin guard", () => {
  it("allows a non-destructive request without Origin", async () => {
    const response = await request(app).get("/health/live");
    expect(response.status).toBe(200);
  });

  it("refuses mutations from untrusted origins without touching the database", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .set("Origin", "https://untrusted.invalid")
      .send({ email: "", password: "" });
    expect(response.status).toBe(403);
    expect(response.body.error).toBe("UNTRUSTED_ORIGIN");
  });

  it("allows trusted origin to reach validation", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .set("Origin", "http://localhost:4321")
      .send({ email: "", password: "" });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("VALIDATION_ERROR");
  });

  it("allows a trusted frontend on a different site with an explicit allowed Origin", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .set("Origin", "http://localhost:4321")
      .set("Sec-Fetch-Site", "cross-site")
      .send({ email: "", password: "" });
    expect(response.status).toBe(400);
  });

  it("blocks cross-site fetch metadata without Origin", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .set("Sec-Fetch-Site", "cross-site")
      .send({ email: "", password: "" });
    expect(response.status).toBe(403);
  });

  it("does not expose an allow-origin header to a disallowed origin", async () => {
    const response = await request(app).get("/health/live").set("Origin", "https://untrusted.invalid");
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
