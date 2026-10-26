'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Header, Qr, StaleBadge } from '@/components/ui';
import { api, errorKey, loadHostKey, storeHostKey, usePoll } from '@/lib/client';
import { t, useLang } from '@/lib/i18n';

type RoomInfo = { title: string; status: string; revealed: boolean; completedCount: number; joinUrl: string; contentVersion: string };
export default function HostRoom() {
  const code = useParams<{ code: string }>().code.toUpperCase(), lang = useLang();
  const [token, setToken] = useState('');
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToken(loadHostKey(code)); setReady(true);
  }, [code]);
  const { data, failed, at, reload } = usePoll<RoomInfo>(token ? `/api/host/sessions/${code}` : null, token);
  async function patch(body: object) {
    setBusy(true); setMessage('');
    const r = await api(`/api/host/sessions/${code}`, { method: 'PATCH', token, body: JSON.stringify(body) });
    setBusy(false);
    if (!r.ok) setMessage(t(lang, errorKey(r.code)));
    reload();
  }
  return <main>
    <Header />
    <h1>{t(lang, 'manageMyRoom')} · {code}</h1>
    {message && <p className="error" role="alert">{message}</p>}
    {ready && (!token || (!data && failed)) && <form className="card" onSubmit={e => {
      e.preventDefault();
      const value = String(new FormData(e.currentTarget).get('key') || '').trim();
      if (!/^[A-Za-z0-9_-]{43}$/.test(value)) return setMessage(t(lang, 'invalidHostKey'));
      try { storeHostKey(code, value); } catch { return setMessage(t(lang, 'hostStorageFailure')); }
      setToken(value); setMessage(''); reload();
    }}>
      <p>{t(lang, 'hostRestore')}</p>
      <label className="field"><span>{t(lang, 'hostKey')}</span><input name="key" type="password" autoComplete="off" required /></label>
      <button className="primary">{t(lang, 'hostRestoreButton')}</button>
    </form>}
    {data && <>
      <StaleBadge failed={failed} at={at} lang={lang} />
      <section className="card">
        <h2>{data.title}</h2>
        <p className="big-n">{t(lang, 'completed', { n: data.completedCount })}</p>
        <p>{t(lang, data.status === 'open' ? 'statusOpen' : 'statusClosed')} · {t(lang, data.revealed ? 'revealedOn' : 'revealedOff')}</p>
        <Qr url={data.joinUrl} />
        <p className="url"><a href={data.joinUrl}>{data.joinUrl}</a></p>
        <div className="nav">
          <button disabled={busy} onClick={() => patch({ status: data.status === 'open' ? 'closed' : 'open' })}>{t(lang, data.status === 'open' ? 'closeBtn' : 'reopenBtn')}</button>
          <button disabled={busy} className="primary" onClick={() => patch({ revealed: !data.revealed })}>{t(lang, data.revealed ? 'hideBtn' : 'revealBtn')}</button>
        </div>
        <p><Link href={`/present/${code}`} target="_blank">{t(lang, 'presentLink')}</Link> · <Link href={`/s/${code}/stats`} target="_blank">{t(lang, 'statsLink')}</Link></p>
      </section>
      <details className="card">
        <summary>{t(lang, 'hostKey')}</summary>
        <p className="note">{t(lang, 'hostKeyNote')}</p>
        <code className="host-key">{token}</code>
        <button onClick={async () => {
          try { await navigator.clipboard.writeText(token); setMessage(t(lang, 'copied')); }
          catch { setMessage(t(lang, 'copyManually')); }
        }}>{t(lang, 'copyKey')}</button>
      </details>
    </>}
    <p><Link href="/host">{t(lang, 'newRoom')}</Link></p>
  </main>;
}
