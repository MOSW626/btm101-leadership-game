'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Header, Qr, StaleBadge, StatsView, type StatsResponse } from '@/components/ui';
import { api, errorKey, loadHostKey, usePoll } from '@/lib/client';
import { t, useLang } from '@/lib/i18n';

export default function Present() {
  const code = useParams<{ code: string }>().code.toUpperCase();
  const lang = useLang();
  const [hostKey, setHostKey] = useState('');
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setHostKey(loadHostKey(code)); }, [code]);
  const { data, failed, at, reload } = usePoll<StatsResponse>(`/api/sessions/${code}/stats`, hostKey || undefined);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [joinUrl, setJoinUrl] = useState('');
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setJoinUrl(`${location.origin}/s/${code}`); }, [code]);

  async function patch(body: object) {
    setError(null);
    const path = hostKey ? `/api/host/sessions/${code}` : `/api/admin/sessions/${code}`;
    const r = await api(path, { method: 'PATCH', token: hostKey || undefined, body: JSON.stringify(body) });
    if (!r.ok) setError(t(lang, errorKey(r.code)));
    reload();
  }

  const show = data && data.overall && data.groups && (data.revealed || (data.admin && preview));
  return (
    <main className="present">
      <Header />
      {error && <p className="error" role="alert">{error}</p>}
      <StaleBadge failed={failed} at={at} lang={lang} />
      {!data && failed && <p className="error">{t(lang, errorKey('NETWORK'))}</p>}
      {data && (
        <>
          <div className="present-top">
            <div>
              <p className="muted">{t(lang, 'room')} {code} · {data.title}</p>
              <p className="huge">{t(lang, 'completed', { n: data.completedCount })}</p>
              {data.expectedCount && <p className="muted">{t(lang, 'expected', { n: data.expectedCount })}</p>}
              <p className="muted">{data.status === 'open' ? t(lang, 'statusOpen') : t(lang, 'statusClosed')}</p>
            </div>
            {!show && joinUrl && (
              <div className="join">
                <Qr url={joinUrl} size={260} />
                <p className="muted">{t(lang, 'scanToJoin')}</p>
                <p className="url">{joinUrl.replace(/^https?:\/\//, '')}</p>
              </div>
            )}
          </div>
          {data.admin && (
            <div className="controls">
              <button onClick={() => patch({ status: data.status === 'open' ? 'closed' : 'open' })}>{data.status === 'open' ? t(lang, 'closeBtn') : t(lang, 'reopenBtn')}</button>
              <button className="primary" onClick={() => patch({ revealed: !data.revealed })}>{data.revealed ? t(lang, 'hideBtn') : t(lang, 'revealBtn')}</button>
              {!data.revealed && <label className="pick"><input type="checkbox" checked={preview} onChange={e => setPreview(e.target.checked)} /> {t(lang, 'previewNote')}</label>}
            </div>
          )}
          {show && !data.revealed && <p className="stale">{t(lang, 'previewNote')}</p>}
          {show ? <StatsView data={{ overall: data.overall!, groups: data.groups! }} lang={lang} /> : <p className="card">{t(lang, 'waiting')}</p>}
        </>
      )}
    </main>
  );
}
