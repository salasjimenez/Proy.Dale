import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { APP_VERSION } from "../src/version.js";
import { resetAuthRateLimitForTests } from "../src/middleware/auth-rate-limit.js";

describe("health and security", () => {
  beforeEach(() => {
    resetAuthRateLimitForTests();
  });

  it("returns liveness without querying the database", async () => {
    const response = await request(app).get("/health/live");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.check).toBe("live");
    expect(response.body.version).toBe(APP_VERSION);
  });

  it("returns a request id header", async () => {
    const response = await request(app).get("/health/live");

    expect(response.headers["x-request-id"]).toBeTruthy();
  });

  it("preserves a valid incoming request id", async () => {
    const response = await request(app)
      .get("/health/live")
      .set("X-Request-Id", "dale-test-123");

    expect(response.headers["x-request-id"]).toBe("dale-test-123");
  });

  it("rate limits repeated authentication attempts", async () => {
    let response = await request(app)
      .post("/api/auth/login")
      .send({ email: "", password: "" });

    for (let index = 1; index <= 10; index += 1) {
      if (response.status === 429) break;
      response = await request(app)
        .post("/api/auth/login")
        .send({ email: "", password: "" });
    }

    expect(response.status).toBe(429);
    expect(response.body.error).toBe("RATE_LIMITED");
    expect(Number(response.headers["ratelimit-reset"])).toBeGreaterThan(0);
  });
});
