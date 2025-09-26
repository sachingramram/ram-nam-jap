// lib/auth.ts
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import type { JWTPayload } from "./types";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change";

const COOKIE_NAME = "rn_session";
const COOKIE_OPTIONS = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30 // 30 days
};

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string): Promise<void> {
  const c = await cookies();
  c.set(COOKIE_NAME, token, COOKIE_OPTIONS);
}

export async function clearSessionCookie(): Promise<void> {
  const c = await cookies();
  c.set(COOKIE_NAME, "", { ...COOKIE_OPTIONS, maxAge: 0 });
}

export async function getUserFromCookie(): Promise<JWTPayload | null> {
  const c = await cookies();
  const value = c.get(COOKIE_NAME)?.value;
  if (!value) return null;
  return verifyToken(value);
}
