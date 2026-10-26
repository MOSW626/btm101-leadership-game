import { bearer, check, db, getSession, hashToken, json, newToken, route } from '@/lib/server';

// 기존 토큰이 이 방 참가자면 재사용, 아니면 새 토큰 발급. 입장만으로 완료 인원은 늘지 않는다.
export const POST = route(async (req, ctx: RouteContext<'/api/sessions/[code]/join'>) => {
  const s = await getSession((await ctx.params).code);
  const old = bearer(req);
  if (old) {
    const p = check(await db().from('participants').select('id').eq('token_hash', hashToken(old)).eq('session_id', s.id).maybeSingle());
    if (p) return json({ participantId: p.id, reused: true });
  }
  const token = newToken();
  const participantId = check(await db().rpc('join_session', { p_code: s.code, p_token_hash: hashToken(token) }));
  return json({ participantId, token, reused: false });
});
