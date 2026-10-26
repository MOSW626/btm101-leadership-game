'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { aggregate } from '@/lib/brief/scoring.mjs';
import { Header, StaleBadge, StatsView, type StatsData, type StatsResponse } from '@/components/ui';
import { DEMO, errorKey, usePoll, useRoom } from '@/lib/client';
import { content, questions } from '@/lib/content';
import { t, useLang } from '@/lib/i18n';

export default function Stats() {
  const code = useParams<{ code: string }>().code.toUpperCase();
  const demo = code === DEMO;
  const lang = useLang();
  const [room] = useRoom(code);
  const { data, failed, at } = usePoll<StatsResponse>(demo ? null : `/api/sessions/${code}/stats`);

  let view: StatsData | null = null;
  if (demo && room) {
    // 데모: 이 기기의 응답 하나만 집계한다.
    const rows = questions.every(q => room.answers[q.id]) ? [{ answers: room.answers }] : [];
    const overall = aggregate(content, rows);
    view = { overall, groups: content.groups.map(g => ({ id: g.id, ...aggregate(content, rows.filter(() => room.group === g.id)) })) };
  } else if (data?.revealed && data.overall && data.groups) view = { overall: data.overall, groups: data.groups };

  return (
    <main className="wide">
      <Header demo={demo} />
      <h1>{t(lang, 'statsTitle')}</h1>
      <StaleBadge failed={failed} at={at} lang={lang} />
      {!demo && !data && failed && <p className="error">{t(lang, errorKey('NETWORK'))}</p>}
      {data && <p className="big-n">{t(lang, 'completed', { n: data.completedCount })}</p>}
      {view ? <StatsView data={view} lang={lang} /> : data && <p className="card">{t(lang, 'waiting')}</p>}
      <p><Link href={`/s/${code}/result`}>{t(lang, 'myResult')}</Link></p>
    </main>
  );
}
