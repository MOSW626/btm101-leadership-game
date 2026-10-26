import type { Result } from '@/lib/brief/scoring.mjs';
import type { Lang } from '@/lib/content';
import { axisById } from '@/lib/content';
import { combinationFor, mixedPattern, mixedPatterns, readingFor } from '@/lib/interpretation';
import { t, tx } from '@/lib/i18n';
import { zoneLabel } from '@/lib/labels';

export function ResultInterpretation({ result: r, lang }: { result: Result; lang: Lang }) {
  return (
      <section className="card result-reading" aria-labelledby="reading-title">
        <h2 id="reading-title">{t(lang, 'interpretationTitle')}</h2>
        <p className="note">{t(lang, 'interpretationNote')}</p>
        {combinationFor(r) && <div className="combination-reading">
          <h3>{t(lang, 'combinationTitle')}</h3>
          <p>{tx(lang, combinationFor(r)!)}</p>
        </div>}
        <h3>{t(lang, 'axisReadingTitle')}</h3>
        {r.axes.map(a => {
          const reading = readingFor(a);
          return <article key={a.id} className="axis-reading">
            <div className="reading-heading"><h4>{tx(lang, axisById(a.id).name)}</h4><span className={`zone zone-${a.zone}`}>{zoneLabel(lang, a.id, a.zone)}</span></div>
            <p>{tx(lang, reading.reading)}</p>
            {a.zone === 'X' && <p className="pattern-note">{tx(lang, mixedPatterns[mixedPattern(a)])}</p>}
            <details>
              <summary>{t(lang, 'usefulWhen')} · {t(lang, 'watchFor')}</summary>
              <dl className="advice"><dt>{t(lang, 'usefulWhen')}</dt><dd>{tx(lang, reading.useful)}</dd><dt>{t(lang, 'watchFor')}</dt><dd>{tx(lang, reading.watch)}</dd></dl>
            </details>
            <div className="next-action"><strong>{t(lang, 'tryNext')}</strong><p>{tx(lang, reading.next)}</p></div>
          </article>;
        })}
      </section>

  );
}
