'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Header } from '@/components/ui';
import { api, errorKey, storeHostKey, usePoll } from '@/lib/client';
import { t, useLang } from '@/lib/i18n';

export default function CreateRoom() {
  const lang = useLang();
  const router = useRouter();
  const { data, failed } = usePoll<{ enabled: boolean }>('/api/host/sessions');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  return <main>
    <Header />
    <h1>{t(lang, 'hostTitle')}</h1>
    <p className="lead">{t(lang, 'hostIntro')}</p>
    {failed && <p className="error" role="alert">{t(lang, 'network')}</p>}
    {message && <p className="error" role="alert">{message}</p>}
    {data && !data.enabled && <p className="card">{t(lang, 'hostingClosed')}</p>}
    {data?.enabled && <form className="card" onSubmit={async e => {
      e.preventDefault(); setBusy(true); setMessage('');
      const f = new FormData(e.currentTarget);
      const r = await api<{ code: string; token: string }>('/api/host/sessions', {
        method: 'POST', body: JSON.stringify({ title: f.get('title'), expectedCount: f.get('expected') || null }),
      });
      setBusy(false);
      if (!r.ok) return setMessage(t(lang, errorKey(r.code)));
      try { storeHostKey(r.data.code, r.data.token); } catch {
        // A room must not be created without showing its recovery key.
        setMessage(`${t(lang, 'hostStorageFailure')} ${r.data.code} · ${r.data.token}`);
        return;
      }
      router.push(`/host/${r.data.code}`);
    }}>
      <label className="field"><span>{t(lang, 'roomTitle')}</span><input name="title" required maxLength={80} /></label>
      <label className="field"><span>{t(lang, 'expectedOpt')}</span><input name="expected" type="number" min={1} max={999} /></label>
      <p className="note">{t(lang, 'hostPrivacy')}</p>
      <button className="primary" disabled={busy}>{t(lang, 'create')}</button>
    </form>}
  </main>;
}
