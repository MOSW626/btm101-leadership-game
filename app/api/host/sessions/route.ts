import { createHash } from 'node:crypto';
import { content } from '@/lib/content';
import { publicHostingEnabled, roomCode, roomInput } from '@/lib/hosting';
import { ApiError, appUrl, db, hashToken, json, newToken, readJson, requireSameOrigin, route } from '@/lib/server';

export const GET = route(async () => json({ enabled: await publicHostingEnabled() }));
export const POST = route(async req => {
  requireSameOrigin(req);
  const { title, expected } = roomInput(await readJson(req, 1024));
  const token = newToken();
  const salt = process.env.ADMIN_COOKIE_SECRET;
  if (!salt) throw new ApiError(503, 'ADMIN_NOT_CONFIGURED', 'Hosting is not configured');
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  const ipHash = createHash('sha256').update(ip + salt).digest('hex');
  for (let i = 0; i < 5; i++) {
    const code = roomCode();
    const { error } = await db().rpc('create_hosted_session', {
      p_code: code, p_title: title, p_expected: expected, p_version: content.version,
      p_host_hash: hashToken(token), p_ip_hash: ipHash,
    });
    if (!error) return json({ code, token, joinUrl: `${appUrl(req)}/s/${code}`, manageUrl: `${appUrl(req)}/host/${code}` }, 201);
    if (error.message === 'HOSTING_CLOSED') throw new ApiError(409, 'HOSTING_CLOSED', 'Public room creation is not open');
    if (error.message === 'HOST_RATE_LIMIT') throw new ApiError(429, 'HOST_RATE_LIMIT', 'Room creation limit reached; try again in one hour');
    if (error.code !== '23505') throw new Error(error.message);
  }
  throw new Error('room code collision');
});
