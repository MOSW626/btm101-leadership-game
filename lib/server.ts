import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

export const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

type Handler<C> = (req: NextRequest, ctx: C) => Promise<Response>;
export const route = <C>(h: Handler<C>): Handler<C> => async (req, ctx) => {
  try { return await h(req, ctx); } catch (e) {
    if (e instanceof ApiError) return json({ error: { code: e.code, message: e.message } }, e.status);
    console.error('api error', e instanceof Error ? e.message : e);
    return json({ error: { code: 'SERVER_UNAVAILABLE', message: 'Temporary server error' } }, 503);
  }
};

let client: SupabaseClient | null = null;
export function db() {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new ApiError(503, 'DB_NOT_CONFIGURED', 'Database is not configured');
  return (client ??= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }));
}

// DB 함수가 raise하는 코드 → HTTP 상태
const RPC_ERRORS: Record<string, [number, string]> = {
  NOT_FOUND: [404, 'Session not found'],
  SESSION_CLOSED: [409, 'Responses are closed'],
  BAD_TOKEN: [401, 'Invalid participant token'],
  WRONG_SESSION: [403, 'Token belongs to another session'],
  VERSION_MISMATCH: [409, 'Content version mismatch'],
};
export function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) {
    const hit = RPC_ERRORS[res.error.message];
    if (hit) throw new ApiError(hit[0], res.error.message, hit[1]);
    throw new Error(res.error.message);
  }
  return res.data;
}

export async function getSession(rawCode: string) {
  const code = rawCode.toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) throw new ApiError(404, 'NOT_FOUND', 'Session not found');
  const s = check(await db().from('sessions').select('*').eq('code', code).maybeSingle());
  if (!s) throw new ApiError(404, 'NOT_FOUND', 'Session not found');
  return s as {
    id: string; code: string; title: string; expected_count: number | null; status: 'open' | 'closed';
    revealed: boolean; content_version: string; updated_at: string; host_token_hash: string | null;
  };
}

export const hashToken = (t: string) => createHash('sha256').update(t).digest('hex');
export const newToken = () => randomBytes(32).toString('base64url');
export function bearer(req: NextRequest, required: true): string;
export function bearer(req: NextRequest, required?: false): string | null;
export function bearer(req: NextRequest, required = false) {
  const m = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(req.headers.get('authorization') ?? '');
  if (!m && required) throw new ApiError(401, 'BAD_TOKEN', 'Missing participant token');
  return m ? m[1] : null;
}

export async function readJson(req: NextRequest, max = 8192): Promise<Record<string, unknown>> {
  const text = await req.text();
  if (text.length > max) throw new ApiError(413, 'TOO_LARGE', 'Request body too large');
  try {
    const v = JSON.parse(text || '{}');
    if (v && typeof v === 'object' && !Array.isArray(v)) return v;
  } catch {}
  throw new ApiError(400, 'BAD_REQUEST', 'Invalid JSON body');
}

// ---- 관리자: 서명된 HttpOnly 쿠키 ----
export const ADMIN_COOKIE = 'lg_admin';
const ADMIN_TTL_MS = 8 * 60 * 60 * 1000;
const sign = (v: string) => {
  const k = process.env.ADMIN_COOKIE_SECRET;
  if (!k) throw new ApiError(503, 'ADMIN_NOT_CONFIGURED', 'Admin is not configured');
  return createHmac('sha256', k).update(v).digest('base64url');
};
const safeEqual = (a: string, b: string) => {
  const x = createHash('sha256').update(a).digest(), y = createHash('sha256').update(b).digest();
  return timingSafeEqual(x, y);
};
export function adminCookieValue() {
  const exp = String(Date.now() + ADMIN_TTL_MS);
  return { value: `${exp}.${sign(exp)}`, maxAge: ADMIN_TTL_MS / 1000 };
}
export function isAdmin(req: NextRequest) {
  const [exp, sig] = (req.cookies.get(ADMIN_COOKIE)?.value ?? '').split('.');
  if (!exp || !sig || !process.env.ADMIN_COOKIE_SECRET) return false;
  return Number(exp) > Date.now() && safeEqual(sig, sign(exp));
}
export const checkAdminSecret = (given: string) => !!process.env.ADMIN_SECRET && safeEqual(given, process.env.ADMIN_SECRET);

export function requireSameOrigin(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (!origin || new URL(origin).host !== req.headers.get('host')) throw new ApiError(403, 'BAD_ORIGIN', 'Cross-origin request rejected');
}
export function requireAdmin(req: NextRequest, mutating = true) {
  if (mutating) requireSameOrigin(req);
  if (!isAdmin(req)) throw new ApiError(401, 'ADMIN_REQUIRED', 'Admin login required');
}

export const appUrl = (req: NextRequest) => (process.env.APP_URL || req.nextUrl.origin).replace(/\/$/, '');
