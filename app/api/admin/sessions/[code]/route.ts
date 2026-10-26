import { ApiError, check, db, getSession, json, readJson, requireAdmin, route } from '@/lib/server';

export const PATCH = route(async (req, ctx: RouteContext<'/api/admin/sessions/[code]'>) => {
  requireAdmin(req);
  const s = await getSession((await ctx.params).code);
  const body = await readJson(req, 1024);
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.status !== undefined) {
    if (body.status !== 'open' && body.status !== 'closed') throw new ApiError(400, 'BAD_STATUS', 'Invalid status');
    patch.status = body.status;
  }
  if (body.revealed !== undefined) {
    if (typeof body.revealed !== 'boolean') throw new ApiError(400, 'BAD_REVEALED', 'Invalid revealed flag');
    patch.revealed = body.revealed;
  }
  // 단일 UPDATE가 방 행을 잠근다. 제출 RPC는 같은 행을 FOR SHARE로 잠그므로 마감과 저장이 직렬화된다.
  const row = check(await db().from('sessions').update(patch).eq('id', s.id).select('status, revealed, updated_at').single());
  return json({ code: s.code, ...row });
});
