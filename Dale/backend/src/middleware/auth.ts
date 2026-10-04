import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import {
  AuthServiceError,
  getUserById,
  verifySessionToken,
  type PublicUser,
} from "../services/auth.service.js";

declare global {
  namespace Express {
    interface Request {
      authUser?: PublicUser;
    }
  }
}

function getCookieValue(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;

  const prefix = `${encodeURIComponent(name)}=`;
  const raw = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix));

  if (!raw) return null;

  try {
    return decodeURIComponent(raw.slice(prefix.length));
  } catch {
    return null;
  }
}

function getBearerToken(authorization: string | undefined): string | null {
  if (!authorization) return null;

  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token =
      getCookieValue(req.headers.cookie, env.authCookieName) ??
      getBearerToken(req.headers.authorization);

    if (!token) {
      res.status(401).json({
        error: "AUTH_REQUIRED",
        message: "Inicia sesión para continuar.",
      });
      return;
    }

    const userId = verifySessionToken(token);
    const user = await getUserById(userId);

    if (!user) {
      throw new AuthServiceError(
        401,
        "INVALID_SESSION",
        "La sesión no es válida o ha expirado.",
      );
    }

    req.authUser = user;
    next();
  } catch (error) {
    if (error instanceof AuthServiceError) {
      res.status(error.status).json({
        error: error.code,
        message: error.message,
      });
      return;
    }

    next(error);
  }
}
