import { db, getSession, json, route } from '@/lib/server';

export const GET = route(async (_req, ctx: RouteContext<'/api/sessions/[code]'>) => {
  const s = await getSession((await ctx.params).code);
  const { count } = await db().from('submissions').select('id', { count: 'exact', head: true }).eq('session_id', s.id);
  return json({
    code: s.code, title: s.title, status: s.status, revealed: s.revealed, contentVersion: s.content_version,
    expectedCount: s.expected_count, completedCount: count ?? 0,
  });
});
