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

export const env = {
  nodeEnv: process.env.NODE_ENV?.trim() || "development",
  port: parsePort(process.env.PORT),
  frontendOrigins: parseOrigins(requireEnv("FRONTEND_URL")),
  databaseUrl: requireEnv("DATABASE_URL"),
} as const;
