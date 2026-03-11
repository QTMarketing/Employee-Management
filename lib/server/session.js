import crypto from "crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "gravity_auth";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

function getSecret() {
  return process.env.AUTH_SECRET || "dev-auth-secret-change-me";
}

function sign(value) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

function encodePayload(payload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodePayload(value) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

export async function createSessionCookie(user) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = { user, exp };
  const encoded = encodePayload(payload);
  const token = `${encoded}.${sign(encoded)}`;
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionUser() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = sign(encoded);
  if (signature !== expected) return null;
  try {
    const payload = decodePayload(encoded);
    if (!payload?.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload.user || null;
  } catch {
    return null;
  }
}

