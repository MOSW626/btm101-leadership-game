import { randomInt } from 'node:crypto';
import { content } from '@/lib/content';
import { ApiError, appUrl, check, db, json, readJson, requireAdmin, route } from '@/lib/server';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 0/O·1/I 제외

export const GET = route(async req => {
  requireAdmin(req, false);
  const sessions = check(await db().from('sessions').select('*').order('created_at', { ascending: false }));
  const subs = check(await db().from('submissions').select('session_id, group_id')) as { session_id: string; group_id: string }[];
  const base = appUrl(req);
  return json({
    sessions: (sessions ?? []).map(s => {
      const mine = subs.filter(x => x.session_id === s.id);
      return {
        code: s.code, title: s.title, status: s.status, revealed: s.revealed, contentVersion: s.content_version,
        expectedCount: s.expected_count, createdAt: s.created_at, updatedAt: s.updated_at,
        completedCount: mine.length, joinUrl: `${base}/s/${s.code}`,
        groupCounts: Object.fromEntries(content.groups.map(g => [g.id, mine.filter(x => x.group_id === g.id).length])),
      };
    }),
  });
});

export const POST = route(async req => {
  requireAdmin(req);
  const body = await readJson(req, 1024);
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title || title.length > 80) throw new ApiError(400, 'BAD_TITLE', 'Title must be 1-80 characters');
  const expected = body.expectedCount == null || body.expectedCount === '' ? null : Number(body.expectedCount);
  if (expected !== null && !(Number.isInteger(expected) && expected > 0 && expected < 1000)) throw new ApiError(400, 'BAD_EXPECTED', 'Expected count must be a positive integer');
  for (let i = 0; i < 5; i++) {
    const code = Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
    const { error } = await db().from('sessions').insert({ code, title, expected_count: expected, content_version: content.version });
    if (!error) return json({ code, joinUrl: `${appUrl(req)}/s/${code}` }, 201);
    if (error.code !== '23505') throw new Error(error.message);
  }
  throw new Error('code collision');
});
