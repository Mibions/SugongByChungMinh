import { and, eq, gt, isNull } from "drizzle-orm";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDatabase } from "../db/client.js";
import { adminAuditLogs, adminLoginAttempts, adminSessions } from "../db/schema.js";
import { createRandomToken, safeEqual, sha256, verifyAdminToken } from "./crypto.js";

const sessionCookieName = "sugong_admin_session";
const csrfCookieName = "sugong_admin_csrf";
const loginWindowMs = 15 * 60 * 1000;
const loginBlockMs = 15 * 60 * 1000;
const maxLoginAttempts = 5;

function parseCookies(header: string | undefined) {
  return Object.fromEntries(
    (header ?? "")
      .split(";")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const separator = entry.indexOf("=");
        return [entry.slice(0, separator), decodeURIComponent(entry.slice(separator + 1))];
      }),
  );
}

function getRequestIp(req: VercelRequest) {
  const forwarded = req.headers["x-forwarded-for"];
  return (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0])?.trim() || req.socket.remoteAddress || "unknown";
}

function getRequestIdentifier(req: VercelRequest) {
  return sha256(`${getRequestIp(req)}|${process.env.ADMIN_TOKEN_HASH ?? ""}`);
}

export function isAllowedAdminOrigin(req: VercelRequest) {
  const origin = req.headers.origin;
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol =
    (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto) ||
    (process.env.NODE_ENV === "production" ? "https" : "http");
  const host = req.headers.host;
  const expectedOrigin =
    process.env.ADMIN_ALLOWED_ORIGIN?.replace(/\/$/, "") || (host ? `${protocol}://${host}` : "");
  return Boolean(origin && expectedOrigin && origin.replace(/\/$/, "") === expectedOrigin);
}

function appendCookies(res: VercelResponse, cookies: string[]) {
  res.setHeader("Set-Cookie", cookies);
}

function cookie(value: string, options: { httpOnly?: boolean; maxAge: number }) {
  return [
    value,
    "Path=/",
    "SameSite=Strict",
    process.env.NODE_ENV === "production" ? "Secure" : "",
    options.httpOnly ? "HttpOnly" : "",
    `Max-Age=${options.maxAge}`,
  ]
    .filter(Boolean)
    .join("; ");
}

export type AdminSession = {
  id: string;
  csrfToken: string;
  ipHash: string;
};

export async function loginAdmin(req: VercelRequest, res: VercelResponse, token: string) {
  const tokenHash = process.env.ADMIN_TOKEN_HASH;
  if (!tokenHash) throw new Error("ADMIN_TOKEN_HASH is not configured");

  const db = getDatabase();
  const identifier = getRequestIdentifier(req);
  const now = new Date();
  const attempt = await db.query.adminLoginAttempts.findFirst({
    where: eq(adminLoginAttempts.identifier, identifier),
  });

  if (attempt?.blockedUntil && attempt.blockedUntil > now) {
    return { ok: false as const, status: 429, message: "Đăng nhập tạm khóa. Vui lòng thử lại sau." };
  }

  const valid = await verifyAdminToken(token, tokenHash);
  if (!valid) {
    const resetWindow = !attempt || now.getTime() - attempt.windowStartedAt.getTime() > loginWindowMs;
    const attemptCount = resetWindow ? 1 : attempt.attemptCount + 1;
    const blockedUntil = attemptCount >= maxLoginAttempts ? new Date(now.getTime() + loginBlockMs) : null;

    await db
      .insert(adminLoginAttempts)
      .values({
        identifier,
        attemptCount,
        windowStartedAt: resetWindow ? now : attempt?.windowStartedAt ?? now,
        blockedUntil,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: adminLoginAttempts.identifier,
        set: {
          attemptCount,
          windowStartedAt: resetWindow ? now : attempt?.windowStartedAt ?? now,
          blockedUntil,
          updatedAt: now,
        },
      });

    return { ok: false as const, status: 401, message: "Token không hợp lệ." };
  }

  await db.delete(adminLoginAttempts).where(eq(adminLoginAttempts.identifier, identifier));
  const sessionToken = createRandomToken(32);
  const csrfToken = createRandomToken(24);
  const ttlHours = Math.min(Math.max(Number(process.env.ADMIN_SESSION_TTL_HOURS ?? 8), 1), 24);
  const maxAge = ttlHours * 60 * 60;
  const expiresAt = new Date(now.getTime() + maxAge * 1000);
  const [session] = await db
    .insert(adminSessions)
    .values({
      tokenHash: sha256(sessionToken),
      expiresAt,
      ipHash: sha256(getRequestIp(req)),
      userAgent: String(req.headers["user-agent"] ?? "").slice(0, 500),
    })
    .returning({ id: adminSessions.id });

  appendCookies(res, [
    cookie(`${sessionCookieName}=${encodeURIComponent(sessionToken)}`, { httpOnly: true, maxAge }),
    cookie(`${csrfCookieName}=${encodeURIComponent(csrfToken)}`, { maxAge }),
  ]);

  await writeAuditLog(req, session.id, "login", "admin_session", session.id);
  return { ok: true as const, csrfToken, expiresAt: expiresAt.toISOString() };
}

export async function getAdminSession(req: VercelRequest): Promise<AdminSession | null> {
  const cookies = parseCookies(req.headers.cookie);
  const rawToken = cookies[sessionCookieName];
  const csrfToken = cookies[csrfCookieName];
  if (!rawToken || !csrfToken) return null;

  const db = getDatabase();
  const session = await db.query.adminSessions.findFirst({
    where: and(
      eq(adminSessions.tokenHash, sha256(rawToken)),
      gt(adminSessions.expiresAt, new Date()),
      isNull(adminSessions.revokedAt),
    ),
  });
  if (!session) return null;

  await db.update(adminSessions).set({ lastSeenAt: new Date() }).where(eq(adminSessions.id, session.id));
  return { id: session.id, csrfToken, ipHash: sha256(getRequestIp(req)) };
}

export async function requireAdmin(req: VercelRequest, options: { mutation?: boolean } = {}) {
  const session = await getAdminSession(req);
  if (!session) return { ok: false as const, status: 401, message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn." };

  if (options.mutation) {
    if (!isAllowedAdminOrigin(req)) {
      return { ok: false as const, status: 403, message: "Origin không được phép." };
    }

    const csrfHeader = req.headers["x-csrf-token"];
    const csrfValue = Array.isArray(csrfHeader) ? csrfHeader[0] : csrfHeader;
    if (!csrfValue || !safeEqual(csrfValue, session.csrfToken)) {
      return { ok: false as const, status: 403, message: "CSRF token không hợp lệ." };
    }
  }

  return { ok: true as const, session };
}

export async function logoutAdmin(req: VercelRequest, res: VercelResponse) {
  const session = await getAdminSession(req);
  if (session) {
    const db = getDatabase();
    await db.update(adminSessions).set({ revokedAt: new Date() }).where(eq(adminSessions.id, session.id));
    await writeAuditLog(req, session.id, "logout", "admin_session", session.id);
  }
  appendCookies(res, [
    cookie(`${sessionCookieName}=`, { httpOnly: true, maxAge: 0 }),
    cookie(`${csrfCookieName}=`, { maxAge: 0 }),
  ]);
}

export async function writeAuditLog(
  req: VercelRequest,
  sessionId: string | null,
  action: string,
  entityType: string,
  entityId?: string,
  metadata: Record<string, unknown> = {},
) {
  const db = getDatabase();
  await db.insert(adminAuditLogs).values({
    sessionId,
    action,
    entityType,
    entityId,
    metadata,
    ipHash: sha256(getRequestIp(req)),
  });
}
