'use client';
import Link from 'next/link';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import type { Aggregate, Summary } from '@/lib/brief/scoring.mjs';
import { axisById, content, questionById, type Lang } from '@/lib/content';
import { setLang, t, tx, useLang } from '@/lib/i18n';
import { zoneLabel } from '@/lib/labels';
export { zoneLabel } from '@/lib/labels';

export function Header({ demo }: { demo?: boolean }) {
  const lang = useLang();
  return (
    <>
      <header className="top">
        <Link href="/" className="brand">{content.title[lang]}</Link>
        <div className="lang" role="group" aria-label={t(lang, 'language')}>
          {(['ko', 'en'] as const).map(l => (
            <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)}>{l === 'ko' ? '한국어' : 'English'}</button>
          ))}
        </div>
      </header>
      {demo && <p className="demo-badge" role="status">{t(lang, 'demoBadge')}</p>}
    </>
  );
}

export const fmt = (v: number | null) => (v == null ? '–' : v.toFixed(1));
const pct = (n: number, total: number) => (total ? `${((n / total) * 100).toFixed(1)}%` : '–');

// 0(M 끝)~100(L 끝) 가로 지수 막대. 색과 함께 숫자·글자로 구분한다.
export function IndexBar({ label, s, axisId, lang }: { label: string; s: Summary; axisId: string | null; lang: Lang }) {
  const z = s.zone ?? 'none';
  return (
    <div className="ibar">
      <div className="ibar-head">
        <span className="ibar-label">{label}</span>
        <span className={`zone zone-${z}`}>{s.zone ? `${s.zone} · ${zoneLabel(lang, axisId, s.zone)}` : t(lang, 'noResponses')}</span>
        <span className="ibar-val">{fmt(s.leadershipIndex)}</span>
      </div>
      <div className="track" role="img" aria-label={`${t(lang, 'axisPosition')} ${fmt(s.leadershipIndex)} / 100`}>
        <span className="mid" />
        {s.leadershipIndex != null && <span className={`dot zone-${z}`} style={{ left: `${s.leadershipIndex}%` }} />}
      </div>
      <div className="ends"><span>{t(lang, 'sideM')}</span><span>{t(lang, 'sideL')}</span></div>
      {s.total > 0 && (
        <p className="counts">
          {t(lang, 'lCount', { count: s.responses.l })} · {t(lang, 'mCount', { count: s.responses.m })} · {t(lang, 'midpointCount', { count: s.responses.midpoint, total: s.total })}
        </p>
      )}
    </div>
  );
}

export function Qr({ url, size = 220 }: { url: string; size?: number }) {
  const [svg, setSvg] = useState('');
  useEffect(() => { QRCode.toString(url, { type: 'svg', margin: 1 }).then(setSvg); }, [url]);
  return <div className="qr" style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: svg }} />;
}

export function Bar({ value, max, cls }: { value: number; max: number; cls: string }) {
  return <span className="hbar"><span className={cls} style={{ width: max ? `${(value / max) * 100}%` : 0 }} /></span>;
}

export function QuestionDist({ id, qs, lang }: { id: string; qs: Aggregate['questionStats'][number]; lang: Lang }) {
  const q = questionById(id);
  const max = Math.max(1, ...Object.values(qs.counts));
  const modeAt = (r: number) => (r === 4 ? 'X' : (r < 4 ? q.endpoints.left.mode : q.endpoints.right.mode));
  return (
    <div className="qdist">
      <p className="q-scene">{String(q.order).padStart(2, '0')}. {tx(lang, q.scene)}</p>
      <p className="q-prompt">{tx(lang, q.prompt)}</p>
      <div className="q-ends">
        <p><b>1 ←</b> {tx(lang, q.endpoints.left.text)}</p>
        <p><b>→ 7</b> {tx(lang, q.endpoints.right.text)}</p>
      </div>
      <div className="cols" role="img" aria-label={[1, 2, 3, 4, 5, 6, 7].map(r => `${r}: ${qs.counts[r]}`).join(', ')}>
        {[1, 2, 3, 4, 5, 6, 7].map(r => (
          <div key={r} className="col">
            <span className="col-n">{qs.counts[r]}</span>
            <span className={`col-bar zone-${modeAt(r)}`} style={{ height: `${(qs.counts[r] / max) * 100}%` }} />
            <span className="col-r">{r}</span>
          </div>
        ))}
      </div>
      <p className="counts">{t(lang, 'lPeople', { n: qs.l })} · {t(lang, 'mPeople', { n: qs.m })} · {t(lang, 'midPeople', { n: qs.midpoint })}</p>
    </div>
  );
}

type GroupAgg = Omit<Aggregate, 'questionStats' | 'mostDivisive'> & { id: string };
export interface StatsData { overall: Aggregate; groups: GroupAgg[] }
export type StatsResponse = Partial<StatsData> & { title: string; status: string; revealed: boolean; completedCount: number; expectedCount: number | null; admin: boolean };

const BUCKETS = [...content.profiles.map(p => p.code), 'mixed'];
const bucketName = (lang: Lang, b: string) => (b === 'mixed' ? content.mixedProfile.name : content.profiles.find(p => p.code === b)!.name)[lang];

export function StatsView({ data, lang }: { data: StatsData; lang: Lang }) {
  const o = data.overall;
  if (o.n === 0) return <p className="empty">{t(lang, 'empty')}</p>;
  const maxType = Math.max(1, ...Object.values(o.typeCounts));
  const mixedPatterns = Object.entries(o.patternCounts).filter(([c, n]) => c.includes('X') && n > 0);
  const div = o.mostDivisive;
  return (
    <div className="stats">
      <section className="card">
        <h2>{t(lang, 'typesTitle')}</h2>
        <ul className="types">
          {BUCKETS.map(b => (
            <li key={b}>
              <span className="type-name">{bucketName(lang, b)} <small>{b === 'mixed' ? 'X' : b}</small></span>
              <Bar value={o.typeCounts[b]} max={maxType} cls={b === 'mixed' ? 'fill-X' : 'fill-T'} />
              <span className="type-n">{t(lang, 'people', { n: o.typeCounts[b] })} <small>{pct(o.typeCounts[b], o.n)}</small></span>
            </li>
          ))}
        </ul>
        {mixedPatterns.length > 0 && (
          <details>
            <summary>{t(lang, 'patternsTitle')}</summary>
            <p className="counts">{mixedPatterns.map(([c, n]) => `${c} ${t(lang, 'people', { n })}`).join(' · ')}</p>
          </details>
        )}
      </section>

      <section className="card">
        <h2>{t(lang, 'classAxes')}</h2>
        {o.axes.map(a => <IndexBar key={a.id} lang={lang} axisId={a.id} label={tx(lang, axisById(a.id).name)} s={a} />)}
        <IndexBar lang={lang} axisId={null} label={t(lang, 'overallRow')} s={o.overall} />
        <p className="note">{t(lang, 'indexNote')}</p>
      </section>

      <section className="card">
        <h2>{t(lang, 'groupsTitle')}</h2>
        <div className="table-wrap">
          <table className="groups">
            <thead>
              <tr>
                <th />
                <th>n</th>
                {content.axes.map(a => <th key={a.id}>{tx(lang, a.name)}</th>)}
                <th>{t(lang, 'typesTitle')}</th>
              </tr>
            </thead>
            <tbody>
              {data.groups.map(g => {
                const label = content.groups.find(x => x.id === g.id)!.label;
                return (
                  <tr key={g.id}>
                    <th>{tx(lang, label)}</th>
                    <td>{g.n}</td>
                    {g.n === 0
                      ? <td colSpan={4} className="muted">{t(lang, 'noResponses')}</td>
                      : <>
                          {g.axes.map(a => <td key={a.id}><span className={`zone zone-${a.zone}`}>{a.zone}</span> {fmt(a.leadershipIndex)}</td>)}
                          <td className="small">{BUCKETS.filter(b => g.typeCounts[b] > 0).map(b => `${bucketName(lang, b)} ${g.typeCounts[b]}`).join(' · ')}</td>
                        </>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>{t(lang, 'divisiveTitle')}</h2>
        {div ? (
          <>
            <QuestionDist lang={lang} id={div.id} qs={o.questionStats.find(q => q.id === div.id)!} />
            {div.tiedIds.length > 1 && (
              <p className="note">{t(lang, 'tied', { list: div.tiedIds.map(id => questionById(id).order).join(', ') })}</p>
            )}
          </>
        ) : <p className="empty">{t(lang, 'noDivisive')}</p>}
        <details>
          <summary>{t(lang, 'allQuestions')}</summary>
          {o.questionStats.map(q => <QuestionDist key={q.id} lang={lang} id={q.id} qs={q} />)}
        </details>
      </section>
      <p className="note">{t(lang, 'footer')}</p>
    </div>
  );
}

export function StaleBadge({ failed, at, lang }: { failed: boolean; at: Date | null; lang: Lang }) {
  if (!failed) return null;
  return <p className="stale" role="status">{t(lang, 'stale', { time: at ? at.toLocaleTimeString() : '–' })}</p>;
}
