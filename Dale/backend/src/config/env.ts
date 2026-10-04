import "dotenv/config";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function parsePort(value: string | undefined): number {
  const port = Number(value ?? "3000");

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  return port;
}

function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
  name: string,
): number {
  const parsed = Number(value ?? fallback);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }

  return parsed;
}

function parseOrigins(value: string): string[] {
  const origins = value
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);

  if (origins.length === 0) {
    throw new Error("FRONTEND_URL must contain at least one origin");
  }

  return origins;
}

function parseSameSite(value: string | undefined): "lax" | "strict" | "none" {
  const normalized = (value ?? "lax").trim().toLowerCase();

  if (normalized !== "lax" && normalized !== "strict" && normalized !== "none") {
    throw new Error("AUTH_COOKIE_SAME_SITE must be lax, strict or none");
  }

  return normalized;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  if (value === "true") return true;
  if (value === "false") return false;

  throw new Error("Boolean environment values must be true or false");
}

const nodeEnv = process.env.NODE_ENV?.trim() || "development";

export const env = {
  nodeEnv,
  port: parsePort(process.env.PORT),
  frontendOrigins: parseOrigins(requireEnv("FRONTEND_URL")),
  databaseUrl: requireEnv("DATABASE_URL"),
  jwtSecret: requireEnv("JWT_SECRET"),
  jwtExpiresInSeconds: parsePositiveInteger(
    process.env.JWT_EXPIRES_IN_SECONDS,
    60 * 60 * 24 * 7,
    "JWT_EXPIRES_IN_SECONDS",
  ),
  authCookieName: process.env.AUTH_COOKIE_NAME?.trim() || "dale_session",
  authCookieSameSite: parseSameSite(process.env.AUTH_COOKIE_SAME_SITE),
  authCookieSecure: parseBoolean(
    process.env.AUTH_COOKIE_SECURE,
    nodeEnv === "production",
  ),
} as const;
