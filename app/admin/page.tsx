'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Header, Qr, StaleBadge } from '@/components/ui';
import { api, errorKey, usePoll } from '@/lib/client';
import { content } from '@/lib/content';
import { t, tx, useLang } from '@/lib/i18n';

interface AdminSession {
  code: string; title: string; status: 'open' | 'closed'; revealed: boolean; contentVersion: string;
  expectedCount: number | null; completedCount: number; joinUrl: string; groupCounts: Record<string, number>;
}

export default function Admin() {
  const lang = useLang();
  const { data, failed, at, reload } = usePoll<{ sessions: AdminSession[] }>('/api/admin/sessions');
  const hosting = usePoll<{ enabled: boolean }>('/api/admin/hosting');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function call(path: string, method: string, body?: object) {
    setBusy(true); setMsg(null);
    const r = await api(path, { method, body: body && JSON.stringify(body) });
    setBusy(false);
    if (!r.ok) setMsg(r.code === 'BAD_SECRET' ? t(lang, 'wrongSecret') : r.code === 'TOO_MANY_ATTEMPTS' ? t(lang, 'tooMany') : `${t(lang, errorKey(r.code))} (${r.code})`);
    reload(); hosting.reload();
    return r.ok;
  }

  const loggedIn = !!data;
  return (
    <main className="wide">
      <Header />
      <h1>{t(lang, 'adminTitle')}</h1>
      {msg && <p className="error" role="alert">{msg}</p>}
      <StaleBadge failed={failed && loggedIn} at={at} lang={lang} />

      {!loggedIn ? (
        <form className="card" onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); call('/api/admin/login', 'POST', { secret: f.get('secret') }); }}>
          <label className="field"><span>{t(lang, 'password')}</span><input name="secret" type="password" autoComplete="current-password" required /></label>
          <button className="primary" disabled={busy}>{t(lang, 'login')}</button>
        </form>
      ) : (
        <>
          <section className="card">
            <h2>{t(lang, 'hostingToggleTitle')}</h2>
            <p>{t(lang, 'hostingToggleNote')}</p>
            {hosting.failed && <p className="error">{t(lang, 'serverError')}</p>}
            <button disabled={busy || !hosting.data} onClick={() => call('/api/admin/hosting', 'PATCH', { enabled: !hosting.data?.enabled })}>
              {t(lang, hosting.data?.enabled ? 'disableHosting' : 'enableHosting')}
            </button>
          </section>
          <form className="card" onSubmit={e => {
            e.preventDefault(); const form = e.currentTarget, f = new FormData(form);
            call('/api/admin/sessions', 'POST', { title: f.get('title'), expectedCount: f.get('expected') || null }).then(ok => ok && form.reset());
          }}>
            <h2>{t(lang, 'newRoom')}</h2>
            <label className="field"><span>{t(lang, 'roomTitle')}</span><input name="title" required maxLength={80} placeholder="BTM101 10/27" /></label>
            <label className="field"><span>{t(lang, 'expectedOpt')}</span><input name="expected" type="number" min={1} max={999} /></label>
            <button className="primary" disabled={busy}>{t(lang, 'create')}</button>
          </form>

          {data.sessions.length === 0 && <p className="muted">{t(lang, 'noRooms')}</p>}
          {data.sessions.map(s => (
            <section key={s.code} className="card room">
              <div className="room-info">
                <h2>{s.code} · {s.title}</h2>
                <p>
                  <span className={`zone ${s.status === 'open' ? 'zone-L' : 'zone-X'}`}>{s.status === 'open' ? t(lang, 'statusOpen') : t(lang, 'statusClosed')}</span>{' '}
                  <span className={`zone ${s.revealed ? 'zone-M' : 'zone-X'}`}>{s.revealed ? t(lang, 'revealedOn') : t(lang, 'revealedOff')}</span>{' '}
                  <small className="muted">v{s.contentVersion}</small>
                </p>
                <p className="big-n">{t(lang, 'completed', { n: s.completedCount })}{s.expectedCount ? ` / ${t(lang, 'expected', { n: s.expectedCount })}` : ''}</p>
                <p className="small">{content.groups.map(g => `${tx(lang, g.label)} ${s.groupCounts[g.id]}`).join(' · ')}</p>
                <p className="url"><a href={s.joinUrl} target="_blank" rel="noreferrer">{s.joinUrl}</a></p>
                <div className="nav">
                  <button disabled={busy} onClick={() => call(`/api/admin/sessions/${s.code}`, 'PATCH', { status: s.status === 'open' ? 'closed' : 'open' })}>
                    {s.status === 'open' ? t(lang, 'closeBtn') : t(lang, 'reopenBtn')}
                  </button>
                  <button disabled={busy} className="primary" onClick={() => call(`/api/admin/sessions/${s.code}`, 'PATCH', { revealed: !s.revealed })}>
                    {s.revealed ? t(lang, 'hideBtn') : t(lang, 'revealBtn')}
                  </button>
                </div>
                <p><Link href={`/present/${s.code}`} target="_blank">{t(lang, 'presentLink')}</Link> · <Link href={`/s/${s.code}/stats`} target="_blank">{t(lang, 'statsLink')}</Link></p>
              </div>
              <Qr url={s.joinUrl} size={160} />
            </section>
          ))}
          <button onClick={() => call('/api/admin/logout', 'POST').then(() => location.reload())}>{t(lang, 'logout')}</button>
        </>
      )}
    </main>
  );
}
