import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE_NAME = "merry_tree_admin";
const SESSION_HOURS = 12;

function getSecret() {
  return process.env.ADMIN_PASSWORD || "";
}

function sign(value) {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function createAdminSession() {
  const expires = String(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
  return expires + "." + sign(expires);
}

export function isAdminRequest(request) {
  if (!getSecret()) return false;
  const cookieHeader = request.headers.get("cookie") || "";
  const found = cookieHeader.match(new RegExp("(?:^|;\\s*)" + ADMIN_COOKIE_NAME + "=([^;]+)"));
  if (!found) return false;

  let token;
  try { token = decodeURIComponent(found[1]); } catch { return false; }
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [expires, signature] = parts;
  if (!expires || [...expires].some((char) => char < "0" || char > "9")) return false;
  if (Number(expires) < Date.now()) return false;

  const expected = sign(expires);
  const actualBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  if (actualBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(actualBuffer, expectedBuffer);
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_HOURS * 60 * 60,
  };
}

export function compareAdminPassword(candidate) {
  const expected = getSecret();
  if (!expected || typeof candidate !== "string") return false;
  const a = createHash("sha256").update(candidate).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}
