'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/ui';
import { content } from '@/lib/content';
import { t, useLang } from '@/lib/i18n';

export default function Home() {
  const lang = useLang();
  const router = useRouter();
  return (
    <main>
      <Header />
      <h1>{content.title[lang]}</h1>
      <p className="lead">{content.subtitle[lang]}</p>
      <form className="card" onSubmit={e => {
        e.preventDefault();
        const c = String(new FormData(e.currentTarget).get('code') ?? '').trim().toUpperCase();
        if (c) router.push(`/s/${c}`);
      }}>
        <label className="field"><span>{t(lang, 'roomCode')}</span><input name="code" maxLength={6} autoCapitalize="characters" autoComplete="off" required /></label>
        <button className="primary">{t(lang, 'enter')}</button>
      </form>
      <p><Link href="/s/DEMO">{t(lang, 'tryDemo')}</Link></p>
      <p className="note">{content.notice[lang]}</p>
      <p><Link href="/host">{t(lang, 'hostTitle')}</Link></p>
      <p className="small"><Link href="/admin">{t(lang, 'adminTitle')}</Link></p>
    </main>
  );
}
