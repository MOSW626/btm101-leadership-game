'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { score, type Result } from '@/lib/brief/scoring.mjs';
import { Header, IndexBar, zoneLabel } from '@/components/ui';
import { api, DEMO, errorKey, sigOf, useRoom, type Room } from '@/lib/client';
import { axisById, content, profileByCode, questions } from '@/lib/content';
import { ResultInterpretation } from '@/components/result-interpretation';
import { t, tx, useLang } from '@/lib/i18n';

type Saved = { result: Result; savedAt: string };
type Me = { submission: { groupId: string; nickname: string | null; answers: Record<string, number>; result: Result; savedAt: string } | null };

export default function ResultPage() {
  const code = useParams<{ code: string }>().code.toUpperCase();
  const demo = code === DEMO;
  const lang = useLang();
  const router = useRouter();
  const [room, update] = useRoom(code);
  const [saving, setSaving] = useState(false);
  const [errCode, setErrCode] = useState<string | null>(null);
  const attempted = useRef(false);
  const complete = !!room && questions.every(q => room.answers[q.id]);

  async function save(r: Room) {
    setSaving(true); setErrCode(null);
    const body = JSON.stringify({ contentVersion: content.version, answers: r.answers, groupId: r.group, nickname: r.nickname?.trim() || null });
    const put = (token?: string) => api<Saved>(`/api/sessions/${code}/submission`, { method: 'PUT', token, body });
    let token = r.token;
    let res = await put(token);
    if (!res.ok && res.code === 'BAD_TOKEN') {
      // 토큰 소실·무효: 새 참가 토큰을 받아 한 번만 다시 저장한다.
      const j = await api<{ token?: string }>(`/api/sessions/${code}/join`, { method: 'POST' });
      if (j.ok && j.data.token) { token = j.data.token; update({ token }); res = await put(token); } else if (!j.ok) res = j;
    }
    setSaving(false);
    if (res.ok) return update({ save: 'saved', savedSig: sigOf(r), savedAt: res.data.savedAt, serverResult: res.data.result, closedShowingSaved: false });
    if (res.code === 'SESSION_CLOSED') {
      // 마감 후: 이미 저장된 결과가 있으면 그것만 보여 준다(로컬 수정안과 섞지 않음).
      const me = await api<Me>(`/api/sessions/${code}/me`, { token });
      const s = me.ok ? me.data.submission : null;
      if (s) {
        const restored = { answers: s.answers, group: s.groupId, nickname: s.nickname ?? '' };
        return update({ ...restored, save: 'saved', savedSig: sigOf(restored), savedAt: s.savedAt, serverResult: s.result, closedShowingSaved: true });
      }
      return update({ save: 'closed' });
    }
    setErrCode(res.code);
    update({ save: 'failed' });
  }

  useEffect(() => {
    if (!room) return;
    if (!complete) return router.replace(`/s/${code}/quiz`);
    if (!demo && !attempted.current && room.savedSig !== sigOf(room)) { attempted.current = true; save(room); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, complete]);

  if (!room || !complete) return <main><Header demo={demo} /></main>;

  const sig = sigOf(room);
  const savedNow = !demo && room.save === 'saved' && room.savedSig === sig;
  const r: Result = savedNow && room.serverResult ? room.serverResult : score(content, room.answers);
  const profile = r.profileCode ? profileByCode(r.profileCode) : null;
  const ov = r.overall;
  const status = demo ? 'demo' : saving ? 'saving' : savedNow ? 'saved' : room.save === 'closed' ? 'closed' : room.save === 'failed' ? 'failed' : 'saving';

  return (
    <main>
      <Header demo={demo} />
      {(status === 'failed' || status === 'closed') && (
        <p className="error" role="alert">{t(lang, status === 'failed' ? 'saveFailed' : 'sessionClosed')}</p>
      )}

      <section className="card hero">
        <span className="chip">{r.code}</span>
        <h1>{profile ? tx(lang, profile.name) : tx(lang, content.mixedProfile.name)}</h1>
        <p>{profile ? tx(lang, profile.summary) : tx(lang, content.mixedProfile.summary)}</p>
        <p className="note">{t(lang, 'nicknameNote')}</p>
      </section>

      <section className="card">
        <h2>{t(lang, 'overallTitle')}</h2>
        <p>{ov.zone === 'L' ? t(lang, 'overallL') : ov.zone === 'M' ? t(lang, 'overallM') : t(lang, 'similarOverall')}</p>
        <IndexBar lang={lang} axisId={null} label={t(lang, 'axisPosition')} s={ov} />
        <p className="note">{t(lang, 'notAbility')}</p>
      </section>

      <section className="card">
        <h2>{t(lang, 'axesTitle')}</h2>
        {r.axes.map(a => (
          <div key={a.id}>
            <IndexBar lang={lang} axisId={a.id} label={tx(lang, axisById(a.id).name)} s={a} />
            {a.zone === 'X' && <p className="note">{t(lang, 'thinAxis')}</p>}
          </div>
        ))}
      </section>

      <section className="card">
        <h2>{t(lang, 'distTitle')}</h2>
        <div className="tiles">
          <div className="tile zone-L"><b>{ov.responses.l}</b><span>{t(lang, 'sideL')}</span></div>
          <div className="tile zone-M"><b>{ov.responses.m}</b><span>{t(lang, 'sideM')}</span></div>
          <div className="tile zone-X"><b>{ov.responses.midpoint}</b><span>4</span></div>
        </div>
        <p className="counts">{t(lang, 'lCount', { count: ov.responses.l })} · {t(lang, 'mCount', { count: ov.responses.m })} · {t(lang, 'midpointCount', { count: ov.responses.midpoint, total: ov.total })}</p>
      </section>

      <section className="card">
        {profile ? (
          <dl className="advice">
            <dt>{t(lang, 'usefulWhen')}</dt><dd>{tx(lang, profile.usefulWhen)}</dd>
            <dt>{t(lang, 'watchFor')}</dt><dd>{tx(lang, profile.watchFor)}</dd>
            <dt>{t(lang, 'tryNext')}</dt><dd>{tx(lang, profile.tryNext)}</dd>
          </dl>
        ) : (
          <dl className="advice">
            {r.axes.map(a => (
              <div key={a.id}>
                <dt>{tx(lang, axisById(a.id).name)} · {a.zone}</dt>
                <dd>{a.zone === 'X' ? tx(lang, content.mixedProfile.neutralAxis) : zoneLabel(lang, a.id, a.zone)}</dd>
              </div>
            ))}
            <dt>{t(lang, 'tryNext')}</dt><dd>{tx(lang, content.mixedProfile.tryNext)}</dd>
          </dl>
        )}
      </section>

      <ResultInterpretation result={r} lang={lang} />

      <details className="card">
        <summary>{t(lang, 'myAnswers')}</summary>
        <p className="note">{t(lang, 'noRight')}</p>
        {questions.map(q => {
          const v = room.answers[q.id];
          const side = v < 4 ? q.endpoints.left : v > 4 ? q.endpoints.right : null;
          return (
            <div key={q.id} className="answer">
              <p className="q-scene">{String(q.order).padStart(2, '0')}. {tx(lang, q.scene)}</p>
              <p className="q-prompt">{tx(lang, q.prompt)}</p>
              <p className="small"><b>1 ←</b> {tx(lang, q.endpoints.left.text)}<br /><b>→ 7</b> {tx(lang, q.endpoints.right.text)}</p>
              <p className="chosen">{t(lang, 'yourChoice')}: {v} · {tx(lang, content.scale.labels[v - 1].label)}</p>
              <p className="small muted">{side ? tx(lang, q.explanation[side.mode]) : `${tx(lang, q.explanation.L)} / ${tx(lang, q.explanation.M)}`}</p>
            </div>
          );
        })}
      </details>

      <section className="card" aria-live="polite">
        {status === 'saving' && <p>{t(lang, 'saving')}</p>}
        {status === 'saved' && <p className="ok">{t(lang, 'saved')} <small>{t(lang, 'savedAt', { time: new Date(room.savedAt!).toLocaleTimeString() })}</small></p>}
        {room.closedShowingSaved && savedNow && <p className="note">{t(lang, 'closedShowingSaved')}</p>}
        {status === 'failed' && (
          <>
            {errCode && <p className="muted">{t(lang, errorKey(errCode))}</p>}
            <button className="primary" disabled={saving} onClick={() => save(room)}>{t(lang, 'retrySave')}</button>
          </>
        )}
        <div className="nav">
          <button onClick={() => { update({ idx: 0 }); router.push(`/s/${code}/quiz`); }}>{t(lang, 'editAnswers')}</button>
          <button className="primary" onClick={() => router.push(`/s/${code}/stats`)}>{t(lang, 'viewClass')}</button>
        </div>
      </section>
      <p className="note">{t(lang, 'footer')} {content.notice[lang]}</p>
    </main>
  );
}
