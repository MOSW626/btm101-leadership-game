import { content } from '@/lib/content';
import { aggregate } from '@/lib/brief/scoring.mjs';
import { check, db, getSession, json, route } from '@/lib/server';

import { canManageRoom } from '@/lib/hosting';

export const GET = route(async (req, ctx: RouteContext<'/api/sessions/[code]/stats'>) => {
  const s = await getSession((await ctx.params).code);
  const admin = canManageRoom(req, s);
  const base = { code: s.code, title: s.title, status: s.status, revealed: s.revealed, expectedCount: s.expected_count, admin };
  if (!s.revealed && !admin) {
    // 공개 전: 분포를 아예 계산·반환하지 않는다.
    const { count } = await db().from('submissions').select('id', { count: 'exact', head: true }).eq('session_id', s.id);
    return json({ ...base, completedCount: count ?? 0 });
  }
  // 한 번 읽은 스냅샷으로 전체·조별을 계산한다. 닉네임·원시 응답은 응답에 넣지 않는다.
  const rows = check(await db().from('submissions').select('group_id, answers').eq('session_id', s.id)) as { group_id: string; answers: Record<string, number> }[];
  const groups = content.groups.map(g => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { questionStats: _q, mostDivisive: _d, ...rest } = aggregate(content, rows.filter(r => r.group_id === g.id));
    return { id: g.id, ...rest };
  });
  return json({ ...base, completedCount: rows.length, overall: aggregate(content, rows), groups });
});
