'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Header } from '@/components/ui';
import { DEMO, useRoom } from '@/lib/client';
import { content, questions } from '@/lib/content';
import { t, tx, useLang } from '@/lib/i18n';

const SCALE = content.scale.labels;

export default function Quiz() {
  const code = useParams<{ code: string }>().code.toUpperCase();
  const lang = useLang();
  const router = useRouter();
  const [room, update] = useRoom(code);
  const [missing, setMissing] = useState<number | null>(null);

  useEffect(() => { if (room && (!room.group || !room.token)) router.replace(`/s/${code}`); }, [room, code, router]);
  if (!room || !room.group) return <main><Header demo={code === DEMO} /></main>;

  const idx = Math.min(Math.max(room.idx, 0), questions.length - 1);
  const q = questions[idx];
  const value = room.answers[q.id];
  const last = idx === questions.length - 1;
  const go = (i: number) => { setMissing(null); update({ idx: i }); window.scrollTo(0, 0); };

  function finish() {
    const first = questions.findIndex(x => !room!.answers[x.id]);
    if (first >= 0) { setMissing(first + 1); return update({ idx: first }); }
    router.push(`/s/${code}/result`);
  }

  return (
    <main>
      <Header demo={code === DEMO} />
      <div className="progress" aria-label={t(lang, 'progress', { current: idx + 1, total: questions.length })}>
        <span>{t(lang, 'progress', { current: idx + 1, total: questions.length })}</span>
        <span className="pbar"><span style={{ width: `${((idx + 1) / questions.length) * 100}%` }} /></span>
      </div>

      <p className="q-scene">{tx(lang, q.scene)}</p>
      <h1 className="q-title">{tx(lang, q.prompt)}</h1>

      <div className="endpoints">
        <div className="endpoint">
          <span className="ep-tag">1 ← {t(lang, 'leftAction')}</span>
          <p>{tx(lang, q.endpoints.left.text)}</p>
        </div>
        <div className="endpoint">
          <span className="ep-tag">{t(lang, 'rightAction')} → 7</span>
          <p>{tx(lang, q.endpoints.right.text)}</p>
        </div>
      </div>

      <fieldset className="scale">
        <legend>{t(lang, 'choose')}</legend>
        <div className="scale-row">
          {SCALE.map(s => (
            <label key={s.value} className="scale-btn">
              <input type="radio" name={`q-${q.id}`} value={s.value} checked={value === s.value}
                onChange={() => { setMissing(null); update({ answers: { ...room.answers, [q.id]: s.value } }); }}
                aria-label={`${s.value} · ${tx(lang, s.label)}`} />
              <span>{s.value}</span>
            </label>
          ))}
        </div>
        <div className="scale-ends" aria-hidden><span>{tx(lang, SCALE[0].label)}</span><span>{tx(lang, SCALE[6].label)}</span></div>
      </fieldset>
      <p className={value ? 'chosen' : 'muted'} aria-live="polite">
        {value ? `${t(lang, 'yourChoice')}: ${value} · ${tx(lang, SCALE[value - 1].label)}` : t(lang, 'unanswered')}
      </p>
      <p className="note">{tx(lang, content.scale.help)}</p>
      {missing && <p className="error" role="alert">{t(lang, 'missing', { n: missing })}</p>}

      <nav className="nav">
        <button type="button" disabled={idx === 0} onClick={() => go(idx - 1)}>{t(lang, 'previous')}</button>
        {last
          ? <button type="button" className="primary" disabled={!value} onClick={finish}>{t(lang, 'submit')}</button>
          : <button type="button" className="primary" disabled={!value} onClick={() => go(idx + 1)}>{t(lang, 'next')}</button>}
      </nav>
    </main>
  );
}
