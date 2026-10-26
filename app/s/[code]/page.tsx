'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Header } from '@/components/ui';
import { api, DEMO, errorKey, useRoom } from '@/lib/client';
import { content } from '@/lib/content';
import { t, tx, useLang } from '@/lib/i18n';

interface SessionInfo { title: string; status: 'open' | 'closed'; contentVersion: string }

export default function Landing() {
  const code = useParams<{ code: string }>().code.toUpperCase();
  const demo = code === DEMO;
  const lang = useLang();
  const router = useRouter();
  const [room, update] = useRoom(code);
  const [info, setInfo] = useState<SessionInfo | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (demo) return;
    api<SessionInfo>(`/api/sessions/${code}`).then(r => {
      if (!r.ok) return setErr(r.code);
      setInfo(r.data);
      if (r.data.contentVersion !== content.version) setErr('VERSION_MISMATCH');
    });
  }, [code, demo]);

  async function start() {
    if (!room?.group) return;
    setBusy(true); setErr(null);
    if (demo) { update({ token: 'demo' }); return router.push(`/s/${code}/quiz`); }
    const r = await api<{ token?: string }>(`/api/sessions/${code}/join`, { method: 'POST', token: room.token });
    setBusy(false);
    if (!r.ok) return setErr(r.code);
    if (r.data.token) update({ token: r.data.token });
    router.push(`/s/${code}/quiz`);
  }

  const hasSaved = room?.save === 'saved';
  const closed = info?.status === 'closed';
  return (
    <main>
      <Header demo={demo} />
      <h1>{content.title[lang]}</h1>
      <p className="lead">{content.subtitle[lang]}</p>
      {info && <p className="muted">{t(lang, 'room')} {code} · {info.title}</p>}
      <p className="muted">{t(lang, 'duration')}</p>
      <p>{content.intro[lang]}</p>
      <p className="note">{content.notice[lang]}</p>

      {err && <p className="error" role="alert">{t(lang, errorKey(err))}</p>}
      {closed && <p className="error" role="alert">{t(lang, 'roomClosed')}</p>}
      {closed && hasSaved && <button className="primary" onClick={() => router.push(`/s/${code}/result`)}>{t(lang, 'myResult')}</button>}

      {room && !closed && (demo || (info && !err)) && (
        <form className="card" onSubmit={e => { e.preventDefault(); start(); }}>
          <fieldset>
            <legend>{t(lang, 'group')}</legend>
            <div className="groups-pick">
              {content.groups.map(g => (
                <label key={g.id} className="pick">
                  <input type="radio" name="group" value={g.id} checked={room.group === g.id} onChange={() => update({ group: g.id })} />
                  <span>{tx(lang, g.label)}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="field">
            <span>{t(lang, 'nickname')}</span>
            <input type="text" maxLength={20} value={room.nickname ?? ''} onChange={e => update({ nickname: e.target.value })} autoComplete="off" />
          </label>
          <p className="note">{t(lang, 'publicNotice')}</p>
          {!room.group && <p className="muted">{t(lang, 'chooseGroup')}</p>}
          <button className="primary" type="submit" disabled={!room.group || busy}>
            {Object.keys(room.answers).length ? t(lang, 'continue') : t(lang, 'start')}
          </button>
          {hasSaved && <button type="button" onClick={() => router.push(`/s/${code}/result`)}>{t(lang, 'myResult')}</button>}
        </form>
      )}
    </main>
  );
}
