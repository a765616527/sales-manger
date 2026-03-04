import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

import { isAppRole, type SessionUser } from "@/lib/auth/types";

export const SESSION_COOKIE_NAME = "sales_manager_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

type SessionPayload = SessionUser & {
  exp: number;
};

function getSessionSecret() {
  return process.env.SESSION_SECRET ?? "dev-only-secret-change-me";
}

function toBase64Url(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function fromBase64Url(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(content: string) {
  return createHmac("sha256", getSessionSecret()).update(content).digest("base64url");
}

function isPayloadValid(payload: unknown): payload is SessionPayload {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const maybe = payload as Partial<SessionPayload>;

  return (
    typeof maybe.userId === "number" &&
    Number.isInteger(maybe.userId) &&
    typeof maybe.username === "string" &&
    maybe.username.length > 0 &&
    typeof maybe.role === "string" &&
    isAppRole(maybe.role) &&
    typeof maybe.exp === "number" &&
    Number.isFinite(maybe.exp)
  );
}

export function createSessionToken(user: SessionUser) {
  const payload: SessionPayload = {
    ...user,
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  };

  const encoded = toBase64Url(JSON.stringify(payload));
  const signature = sign(encoded);

  return `${encoded}.${signature}`;
}

export function parseSessionToken(token?: string | null): SessionUser | null {
  if (!token) {
    return null;
  }

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) {
    return null;
  }

  const expectedSignature = sign(encoded);
  const givenBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (givenBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(givenBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const parsed = JSON.parse(fromBase64Url(encoded));
    if (!isPayloadValid(parsed)) {
      return null;
    }

    if (Date.now() > parsed.exp) {
      return null;
    }

    return {
      userId: parsed.userId,
      username: parsed.username,
      role: parsed.role,
    };
  } catch {
    return null;
  }
}

export function getSessionFromRequest(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return parseSessionToken(token);
}

export function attachSessionCookie(response: NextResponse, user: SessionUser) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: createSessionToken(user),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
