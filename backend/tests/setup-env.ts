/**
 * Test-only defaults: loaded by Vitest before route modules are imported.
 * Production env.ts remains fail-closed. CI values are not overridden.
 */
const testEnv: Record<string, string> = {
  NODE_ENV: "test",
  PORT: "3000",
  FRONTEND_URL: "http://localhost:4321",
  DATABASE_URL: "postgresql://dale_test:local_only@127.0.0.1:5432/dale_test?schema=public",
  JWT_SECRET: "dale-test-only-secret-32-characters-minimum",
  JWT_EXPIRES_IN_SECONDS: "3600",
  AUTH_COOKIE_NAME: "dale_session",
  AUTH_COOKIE_SAME_SITE: "lax",
  AUTH_COOKIE_SECURE: "false",
};

for (const [key, value] of Object.entries(testEnv)) {
  if (!process.env[key]) process.env[key] = value;
}
