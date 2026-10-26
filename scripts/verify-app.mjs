// 앱 검증: ① 앱 사본 = brief 원본 ② 실행 중인 서버(BASE)에 대한 API·DB 종단 검증.
// 사용: node scripts/verify-app.mjs [BASE=http://localhost:3000]  (ADMIN_SECRET은 환경변수 또는 .env.local)
// 테스트 방은 제목이 'TEST ' 로 시작한다. 정리 방법은 README 참고.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const BASE = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');
const brief = new URL('../../leadership-game-brief/', import.meta.url);
const app = new URL('../lib/brief/', import.meta.url);
if (fs.existsSync(brief)) {
  for (const f of ['content.json', 'scoring.mjs'])
    assert.ok(fs.readFileSync(new URL(f, brief)).equals(fs.readFileSync(new URL(f, app))), `${f}: app copy differs from brief — run npm run sync`);
  console.log(execFileSync('node', [fileURLToPath(new URL('verify.mjs', brief))]).toString().trim());
}
const c = JSON.parse(fs.readFileSync(new URL('content.json', app), 'utf8'));
const envFile = new URL('../.env.local', import.meta.url);
const env = fs.existsSync(envFile) ? Object.fromEntries(fs.readFileSync(envFile, 'utf8').split('\n').filter(l => l.includes('=')).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])) : {};
const SECRET = process.env.ADMIN_SECRET || env.ADMIN_SECRET;

const forCode = code => Object.fromEntries(c.questions.map(q => {
  const mode = code[c.scoring.axisOrder.indexOf(q.axis)];
  return [q.id, mode === 'X' ? 4 : q.endpoints.left.mode === mode ? 1 : 7];
}));
let cookie = '';
async function req(method, path, { body, token, admin, origin = true, raw } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (origin) headers.Origin = BASE;
  if (token) headers.Authorization = `Bearer ${token}`;
  if (admin) headers.Cookie = cookie;
  const res = await fetch(BASE + path, { method, headers, body: raw ?? (body && JSON.stringify(body)) });
  return { status: res.status, body: await res.json().catch(() => null), headers: res.headers };
}
const submit = (code, token, answers, groupId = '1') =>
  req('PUT', `/api/sessions/${code}/submission`, { token, body: { contentVersion: c.version, answers, groupId } });
const join = async code => (await req('POST', `/api/sessions/${code}/join`)).body.token;
const newRoom = async title => (await req('POST', '/api/admin/sessions', { admin: true, body: { title } })).body.code;
let n = 0; const ok = (cond, msg) => { assert.ok(cond, msg); n++; };

// 관리자 인증
ok((await req('POST', '/api/admin/login', { body: { secret: 'wrong' } })).status === 401, 'wrong secret 401');
ok((await req('POST', '/api/admin/login', { body: { secret: SECRET }, origin: false })).status === 403, 'login without Origin 403');
ok((await req('POST', '/api/admin/sessions', { body: { title: 'x' } })).status === 401, 'create room without admin 401');
const login = await req('POST', '/api/admin/login', { body: { secret: SECRET } });
ok(login.status === 200, 'login ok');
cookie = login.headers.get('set-cookie').split(';')[0];
ok(/HttpOnly/i.test(login.headers.get('set-cookie')) && /SameSite=Strict/i.test(login.headers.get('set-cookie')), 'cookie flags');

// 방 A: 극단 L 1명 + 극단 M 1명
const A = await newRoom('TEST A L+M');
const info = (await req('GET', `/api/sessions/${A}`)).body;
ok(info.contentVersion === c.version && info.completedCount === 0 && info.status === 'open', 'new room uses current content version');
const t1 = await join(A), t2 = await join(A);
ok((await req('GET', `/api/sessions/${A}`)).body.completedCount === 0, 'join alone does not count');
ok((await req('POST', `/api/sessions/${A}/join`, { token: t1 })).body.reused === true, 'join reuses existing token');
const partial = forCode('LLL'); delete partial.q07;
ok((await submit(A, t1, partial)).status === 400, 'missing answer rejected (not filled with 4)');
for (const bad of [0, 8, 3.5, '4', null]) ok((await submit(A, t1, { ...forCode('LLL'), q01: bad })).status === 400, `invalid rating ${bad} rejected`);
ok((await req('PUT', `/api/sessions/${A}/submission`, { token: t1, body: { contentVersion: '2.0.0', answers: forCode('LLL'), groupId: '1' } })).status === 409, 'old content version rejected');
ok((await submit(A, t1, forCode('LLL'), '9')).status === 400, 'bad group rejected');
ok((await submit(A, undefined, forCode('LLL'))).status === 401, 'missing token 401');
ok((await req('PUT', `/api/sessions/${A}/submission`, { token: t1, raw: 'x'.repeat(9000) })).status === 413, 'oversized body 413');
const s1 = await submit(A, t1, forCode('LLL'), '1');
ok(s1.status === 200 && s1.body.result.code === 'LLL', 'L submit -> LLL');
ok((await submit(A, t2, forCode('MMM'), '1')).body.result.code === 'MMM', 'M submit -> MMM');
for (let i = 0; i < 3; i++) await submit(A, t1, forCode('LLL'), '1');
ok((await req('GET', `/api/sessions/${A}`)).body.completedCount === 2, 'resubmits keep 2');
ok((await submit(A, t1, forCode('LLL'), '2')).status === 200, 'group change');
// 공개 전 차단
const pre = (await req('GET', `/api/sessions/${A}/stats`)).body;
ok(pre.revealed === false && pre.completedCount === 2 && !('overall' in pre) && !('groups' in pre), 'pre-reveal stats has no distributions');
ok('overall' in (await req('GET', `/api/sessions/${A}/stats`, { admin: true })).body, 'admin preview before reveal');
ok((await req('PATCH', `/api/admin/sessions/${A}`, { body: { revealed: true } })).status === 401, 'reveal without admin 401');
ok((await req('PATCH', `/api/admin/sessions/${A}`, { admin: true, origin: false, body: { revealed: true } })).status === 403, 'reveal without Origin 403');
ok((await req('PATCH', `/api/admin/sessions/${A}`, { admin: true, body: { revealed: true } })).status === 200, 'reveal');
const st = (await req('GET', `/api/sessions/${A}/stats`)).body;
ok(st.overall.n === 2 && st.overall.typeCounts.LLL === 1 && st.overall.typeCounts.MMM === 1, 'LLL 1 + MMM 1');
ok(st.overall.overall.leadershipIndex === 50 && st.overall.axes.every(a => a.leadershipIndex === 50), 'all indices 50');
ok(st.overall.overall.responses.midpoint === 0, 'midpoint 0');
ok(st.groups.reduce((s, g) => s + g.n, 0) === 2 && st.groups.find(g => g.id === '1').n === 1 && st.groups.find(g => g.id === '2').n === 1, 'group change moved the person');
ok(st.groups.find(g => g.id === '3').overall.leadershipIndex === null, 'empty group index null');
ok(!JSON.stringify(st).includes('nickname') && !JSON.stringify(st).includes('"answers"'), 'no nicknames / raw answers in stats');

// 다른 방 토큰
const B = await newRoom('TEST B all 4');
ok((await submit(B, t1, forCode('LLL'))).status === 403, 'other-room token 403');
ok((await req('GET', `/api/sessions/${B}/me`, { token: t1 })).status === 403, 'other-room /me 403');
// 방 B: 모두 4 두 명
const b1 = await join(B), b2 = await join(B);
const r4 = await submit(B, b1, forCode('XXX'));
ok(r4.body.result.code === 'XXX' && r4.body.result.profileCode === null && r4.body.result.typeBucket === 'mixed', 'all 4 -> XXX mixed');
await submit(B, b2, forCode('XXX'));
const sb = (await req('GET', `/api/sessions/${B}/stats`, { admin: true })).body.overall;
ok(sb.typeCounts.mixed === 2 && sb.patternCounts.XXX === 2 && sb.overall.responses.midpoint === 36 && sb.mostDivisive === null, 'all-4 aggregate');

// 마감
await req('PATCH', `/api/admin/sessions/${A}`, { admin: true, body: { status: 'closed' } });
ok((await submit(A, t1, forCode('MMM'))).status === 409, 'submit after close 409');
ok((await req('POST', `/api/sessions/${A}/join`)).status === 409, 'join after close 409');
const me = (await req('GET', `/api/sessions/${A}/me`, { token: t1 })).body;
ok(me.submission.result.code === 'LLL', '/me after close returns saved result, not the rejected edit');

// 마감·저장 경쟁: 성공 응답 수 = 집계 인원
const C = await newRoom('TEST C race');
const tokens = await Promise.all(Array.from({ length: 12 }, () => join(C)));
const results = await Promise.all([
  ...tokens.map(tk => submit(C, tk, forCode('LML'))),
  new Promise(r => setTimeout(r, 15)).then(() => req('PATCH', `/api/admin/sessions/${C}`, { admin: true, body: { status: 'closed' } })),
]);
const saved = results.slice(0, -1).filter(r => r.status === 200).length;
const closedN = results.slice(0, -1).filter(r => r.status === 409).length;
ok(saved + closedN === 12 && (await req('GET', `/api/sessions/${C}`)).body.completedCount === saved, `race: ${saved} saved + ${closedN} rejected = count ${saved}`);

ok((await req('GET', '/api/sessions/ZZZZZ9')).status === 404, 'unknown room 404');
// 공개 새 방 생성: 설정 복원과 방별 권한 격리.
const settings = await req('GET', '/api/admin/hosting', { admin: true });
ok(settings.status === 200 && typeof settings.body.enabled === 'boolean', 'hosting switch exists');
const originalEnabled = settings.body.enabled;
try {
  ok((await req('PATCH', '/api/admin/hosting', { body: { enabled: true } })).status === 401, 'public cannot change hosting switch');
  await req('PATCH', '/api/admin/hosting', { admin: true, body: { enabled: false } });
  ok((await req('GET', '/api/host/sessions')).body.enabled === false, 'creation starts disabled when switched off');
  ok((await req('POST', '/api/host/sessions', { body: { title: 'TEST blocked host' } })).status === 409, 'disabled public creation rejected');
  await req('PATCH', '/api/admin/hosting', { admin: true, body: { enabled: true } });
  const first = await req('POST', '/api/host/sessions', { body: { title: 'TEST public host A' } });
  const second = await req('POST', '/api/host/sessions', { body: { title: 'TEST public host B' } });
  ok(first.status === 201 && second.status === 201, 'two public host rooms created (hourly network quota applies)');
  const h1 = first.body, h2 = second.body;
  const hp = `/api/host/sessions/${h1.code}`;
  ok((await req('GET', hp, { token: h1.token })).status === 200, 'owner can read own dashboard');
  ok((await req('GET', hp, { token: h2.token })).status === 401, 'other owner cannot read dashboard');
  ok((await req('PATCH', hp, { token: h2.token, body: { revealed: true } })).status === 401, 'other owner cannot reveal');
  ok((await req('PATCH', `/api/host/sessions/${A}`, { token: h1.token, body: { revealed: true } })).status === 401, 'public owner cannot control old admin room');
  ok((await req('GET', '/api/admin/sessions', { token: h1.token })).status === 401, 'room key does not confer global admin');
  const privateStats = await req('GET', `/api/sessions/${h1.code}/stats`);
  ok(!('overall' in privateStats.body), 'public host room stats hidden before reveal');
  ok((await req('GET', `/api/sessions/${h1.code}/stats`, { token: h1.token })).body.admin === true, 'owning host can preview');
  ok(!('overall' in (await req('GET', `/api/sessions/${h1.code}/stats`, { token: h2.token })).body), 'other host cannot preview');
  ok((await req('PATCH', hp, { token: h1.token, body: { revealed: true } })).status === 200, 'owner can reveal own room');
  ok('overall' in (await req('GET', `/api/sessions/${h1.code}/stats`)).body, 'revealed own-room stats public');
  const publicInfo = (await req('GET', `/api/sessions/${h1.code}`)).body;
  ok(!JSON.stringify(publicInfo).includes('host_token') && !JSON.stringify(publicInfo).includes(h1.token), 'public metadata has no host key or hash');
  await req('PATCH', '/api/admin/hosting', { admin: true, body: { enabled: false } });
  ok((await req('PATCH', hp, { token: h1.token, body: { status: 'closed' } })).status === 200, 'existing host still operates when new creation closes');
  ok((await req('POST', '/api/host/sessions', { body: { title: 'TEST blocked after switch' } })).status === 409, 'new creation blocked again');
} finally {
  const restored = await req('PATCH', '/api/admin/hosting', { admin: true, body: { enabled: originalEnabled } });
  assert.equal(restored.status, 200, 'restore hosting switch');
}
console.log(`PASS: app API ${n} checks against ${BASE} (TEST rooms only; hosting switch restored)`);
