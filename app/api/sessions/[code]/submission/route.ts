import { content, GROUP_IDS } from '@/lib/content';
import { score } from '@/lib/brief/scoring.mjs';
import { ApiError, bearer, check, db, getSession, hashToken, json, readJson, route } from '@/lib/server';

export const PUT = route(async (req, ctx: RouteContext<'/api/sessions/[code]/submission'>) => {
  const token = bearer(req, true);
  const s = await getSession((await ctx.params).code);
  const body = await readJson(req);
  if (body.contentVersion !== content.version || s.content_version !== content.version)
    throw new ApiError(409, 'VERSION_MISMATCH', 'Content version mismatch');
  if (typeof body.groupId !== 'string' || !GROUP_IDS.includes(body.groupId)) throw new ApiError(400, 'BAD_GROUP', 'Invalid group');
  const nickname = typeof body.nickname === 'string' ? body.nickname.trim() || null : null;
  if (nickname && nickname.length > 20) throw new ApiError(400, 'BAD_NICKNAME', 'Nickname must be 20 characters or fewer');
  // 서버가 답변으로 다시 채점한다. 클라이언트가 보낸 결과는 받지 않는다.
  let result;
  try { result = score(content, body.answers); } catch { throw new ApiError(400, 'BAD_ANSWERS', 'Answers must cover all 18 questions with integers 1-7'); }
  const answers = Object.fromEntries(content.questions.map(q => [q.id, (body.answers as Record<string, number>)[q.id]]));
  const savedAt = check(await db().rpc('upsert_submission', {
    p_code: s.code, p_token_hash: hashToken(token), p_group: body.groupId, p_nickname: nickname,
    p_answers: answers, p_result: result, p_version: content.version,
  }));
  return json({ result, savedAt });
});
