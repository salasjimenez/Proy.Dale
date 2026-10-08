import { Router, type Response } from "express";
import { env } from "../config/env.js";
import { authRateLimit } from "../middleware/auth-rate-limit.js";
import { requireAuth } from "../middleware/auth.js";
import {
  AuthServiceError,
  loginUser,
  registerUser,
  validateEmail,
  validateName,
  validatePassword,
} from "../services/auth.service.js";

export const authRouter = Router();

type CredentialsBody = {
  email?: unknown;
  password?: unknown;
  nombre?: unknown;
};

function setSessionCookie(res: Response, token: string): void {
  res.cookie(env.authCookieName, token, {
    httpOnly: true,
    secure: env.authCookieSecure,
    sameSite: env.authCookieSameSite,
    maxAge: env.jwtExpiresInSeconds * 1000,
    path: "/",
  });
}

function clearSessionCookie(res: Response): void {
  res.clearCookie(env.authCookieName, {
    httpOnly: true,
    secure: env.authCookieSecure,
    sameSite: env.authCookieSameSite,
    path: "/",
  });
}

function readCredentials(body: CredentialsBody, includeName: boolean) {
  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";
  const nombre = typeof body.nombre === "string" ? body.nombre : undefined;

  const errors: Record<string, string> = {};
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);
  const nameError = includeName ? validateName(nombre) : null;

  if (emailError) errors.email = emailError;
  if (passwordError) errors.password = passwordError;
  if (nameError) errors.nombre = nameError;

  return { email, password, nombre, errors };
}

function handleAuthError(error: unknown, res: Response): boolean {
  if (!(error instanceof AuthServiceError)) {
    return false;
  }

  res.status(error.status).json({
    error: error.code,
    message: error.message,
  });
  return true;
}

authRouter.get("/status", (_req, res) => {
  res.status(200).json({
    module: "auth",
    status: "ready",
    implemented: true,
    session: "jwt-http-only-cookie",
  });
});

authRouter.post("/register", authRateLimit, async (req, res, next) => {
  try {
    const input = readCredentials((req.body ?? {}) as CredentialsBody, true);

    if (Object.keys(input.errors).length > 0) {
      res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "Revisa los datos ingresados.",
        fields: input.errors,
      });
      return;
    }

    const result = await registerUser({
      email: input.email,
      password: input.password,
      ...(input.nombre ? { nombre: input.nombre } : {}),
    });

    setSessionCookie(res, result.token);
    res.status(201).json({ data: { user: result.user } });
  } catch (error) {
    if (!handleAuthError(error, res)) next(error);
  }
});

authRouter.post("/login", authRateLimit, async (req, res, next) => {
  try {
    const input = readCredentials((req.body ?? {}) as CredentialsBody, false);

    if (Object.keys(input.errors).length > 0) {
      res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "Revisa los datos ingresados.",
        fields: input.errors,
      });
      return;
    }

    const result = await loginUser({
      email: input.email,
      password: input.password,
    });

    setSessionCookie(res, result.token);
    res.status(200).json({ data: { user: result.user } });
  } catch (error) {
    if (!handleAuthError(error, res)) next(error);
  }
});

authRouter.post("/logout", (_req, res) => {
  clearSessionCookie(res);
  res.status(200).json({ message: "Sesión cerrada correctamente." });
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.status(200).json({ data: { user: req.authUser } });
});
