import { ADMIN_COOKIE, json, requireSameOrigin, route } from '@/lib/server';

export const POST = route(async req => {
  requireSameOrigin(req);
  const res = json({ ok: true });
  res.headers.append('Set-Cookie', `${ADMIN_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict`);
  return res;
});
