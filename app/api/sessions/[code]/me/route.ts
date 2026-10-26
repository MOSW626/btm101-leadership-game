import { ApiError, bearer, check, db, getSession, hashToken, json, route } from '@/lib/server';

export const GET = route(async (req, ctx: RouteContext<'/api/sessions/[code]/me'>) => {
  const s = await getSession((await ctx.params).code);
  const p = check(await db().from('participants').select('id, session_id').eq('token_hash', hashToken(bearer(req, true))).maybeSingle());
  if (!p) throw new ApiError(401, 'BAD_TOKEN', 'Invalid participant token');
  if (p.session_id !== s.id) throw new ApiError(403, 'WRONG_SESSION', 'Token belongs to another session');
  const sub = check(await db().from('submissions').select('group_id, nickname, answers, result, updated_at').eq('participant_id', p.id).maybeSingle());
  return json({
    status: s.status,
    submission: sub && { groupId: sub.group_id, nickname: sub.nickname, answers: sub.answers, result: sub.result, savedAt: sub.updated_at },
  });
});
