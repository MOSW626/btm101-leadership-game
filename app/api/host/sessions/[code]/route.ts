import { patchRoom, requireRoomManager } from '@/lib/hosting';
import { appUrl, check, db, getSession, json, route } from '@/lib/server';

export const GET = route(async (req, ctx: RouteContext<'/api/host/sessions/[code]'>) => {
  const s = await getSession((await ctx.params).code);
  requireRoomManager(req, s);
  const rows = check(await db().from('submissions').select('id').eq('session_id', s.id));
  return json({ code: s.code, title: s.title, status: s.status, revealed: s.revealed,
    contentVersion: s.content_version, completedCount: (rows ?? []).length, joinUrl: `${appUrl(req)}/s/${s.code}` });
});
export const PATCH = route(async (req, ctx: RouteContext<'/api/host/sessions/[code]'>) => patchRoom(req, (await ctx.params).code));
