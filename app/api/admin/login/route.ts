import { createHash } from 'node:crypto';
import { ADMIN_COOKIE, adminCookieValue, ApiError, check, checkAdminSecret, db, json, readJson, requireSameOrigin, route } from '@/lib/server';

const WINDOW_MS = 15 * 60 * 1000, MAX_FAILS = 10;

export const POST = route(async req => {
  requireSameOrigin(req);
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  const ipHash = createHash('sha256').update(ip + (process.env.ADMIN_COOKIE_SECRET ?? '')).digest('hex');
  // 실패 기록은 DB에 둔다(서버리스 메모리는 인스턴스마다 사라지므로 제한이 유지되지 않는다).
  const { count } = await db().from('admin_login_failures').select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash).gt('at', new Date(Date.now() - WINDOW_MS).toISOString());
  if ((count ?? 0) >= MAX_FAILS) throw new ApiError(429, 'TOO_MANY_ATTEMPTS', 'Too many attempts. Try again later');
  const { secret } = await readJson(req, 1024);
  if (typeof secret !== 'string' || !checkAdminSecret(secret)) {
    check(await db().from('admin_login_failures').insert({ ip_hash: ipHash }));
    throw new ApiError(401, 'BAD_SECRET', 'Wrong admin password');
  }
  const { value, maxAge } = adminCookieValue();
  const res = json({ ok: true });
  res.headers.append('Set-Cookie', `${ADMIN_COOKIE}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
  return res;
});
