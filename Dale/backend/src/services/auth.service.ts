import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";

const PASSWORD_ROUNDS = 12;
const JWT_ISSUER = "dale-backend";
const JWT_AUDIENCE = "dale-web";

const userSelect = {
  id: true,
  email: true,
  nombre: true,
  creadoEn: true,
} satisfies Prisma.UsuarioSelect;

export type PublicUser = Prisma.UsuarioGetPayload<{ select: typeof userSelect }>;

export class AuthServiceError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AuthServiceError";
  }
}

export type RegisterInput = {
  email: string;
  password: string;
  nombre?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateEmail(email: string): string | null {
  const normalized = normalizeEmail(email);

  if (normalized.length < 3 || normalized.length > 254) {
    return "Ingresa un correo electrónico válido.";
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(normalized)
    ? null
    : "Ingresa un correo electrónico válido.";
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres.";
  }

  if (Buffer.byteLength(password, "utf8") > 72) {
    return "La contraseña es demasiado larga.";
  }

  if (!/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(password) || !/\d/.test(password)) {
    return "La contraseña debe incluir al menos una letra y un número.";
  }

  return null;
}

export function validateName(nombre?: string): string | null {
  if (nombre === undefined || nombre.trim() === "") {
    return null;
  }

  const trimmed = nombre.trim();
  if (trimmed.length < 2 || trimmed.length > 100) {
    return "El nombre debe tener entre 2 y 100 caracteres.";
  }

  return null;
}

function signSessionToken(userId: string): string {
  return jwt.sign({}, env.jwtSecret, {
    subject: userId,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    expiresIn: env.jwtExpiresInSeconds,
    algorithm: "HS256",
  });
}

export function verifySessionToken(token: string): string {
  try {
    const payload = jwt.verify(token, env.jwtSecret, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithms: ["HS256"],
    });

    if (typeof payload === "string" || !payload.sub) {
      throw new Error("Invalid token payload");
    }

    return payload.sub;
  } catch {
    throw new AuthServiceError(
      401,
      "INVALID_SESSION",
      "La sesión no es válida o ha expirado.",
    );
  }
}

export async function registerUser(input: RegisterInput): Promise<{
  user: PublicUser;
  token: string;
}> {
  const email = normalizeEmail(input.email);
  const nombre = input.nombre?.trim() || null;

  const existingUser = await prisma.usuario.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    throw new AuthServiceError(
      409,
      "EMAIL_ALREADY_REGISTERED",
      "Ya existe una cuenta con ese correo electrónico.",
    );
  }

  const passwordHash = await bcrypt.hash(input.password, PASSWORD_ROUNDS);

  try {
    const user = await prisma.usuario.create({
      data: {
        email,
        passwordHash,
        nombre,
      },
      select: userSelect,
    });

    return {
      user,
      token: signSessionToken(user.id),
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AuthServiceError(
        409,
        "EMAIL_ALREADY_REGISTERED",
        "Ya existe una cuenta con ese correo electrónico.",
      );
    }

    throw error;
  }
}

export async function loginUser(input: LoginInput): Promise<{
  user: PublicUser;
  token: string;
}> {
  const email = normalizeEmail(input.email);

  const user = await prisma.usuario.findUnique({
    where: { email },
    select: {
      ...userSelect,
      passwordHash: true,
    },
  });

  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new AuthServiceError(
      401,
      "INVALID_CREDENTIALS",
      "Correo o contraseña incorrectos.",
    );
  }

  const { passwordHash: _passwordHash, ...publicUser } = user;

  return {
    user: publicUser,
    token: signSessionToken(user.id),
  };
}

export async function getUserById(userId: string): Promise<PublicUser | null> {
  return prisma.usuario.findUnique({
    where: { id: userId },
    select: userSelect,
  });
}
