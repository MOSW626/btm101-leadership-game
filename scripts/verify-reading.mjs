// Render the actual bilingual result component without a browser or network.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { registerHooks } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import assert from 'node:assert/strict';
import { score } from '../lib/brief/scoring.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'next/link') return nextResolve('next/link.js', context);
    const candidate = specifier.startsWith('@/') ? path.join(root, specifier.slice(2))
      : specifier.startsWith('.') && context.parentURL?.startsWith('file:') ? fileURLToPath(new URL(specifier, context.parentURL)) : null;
    if (candidate) {
      for (const ext of ['', '.ts', '.tsx', '.mjs']) {
        if (fs.existsSync(candidate + ext) && fs.statSync(candidate + ext).isFile())
          return { url: pathToFileURL(candidate + ext).href, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.endsWith('/lib/brief/content.json')) {
      return { format: 'module', shortCircuit: true, source: `export default ${fs.readFileSync(fileURLToPath(url), 'utf8')};` };
    }
    if (/\.(tsx|ts)$/.test(url) && url.startsWith(pathToFileURL(root).href)) {
      return { format: 'module', shortCircuit: true, source: ts.transpileModule(fs.readFileSync(fileURLToPath(url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
      }).outputText };
    }
    return nextLoad(url, context);
  },
});
const { ResultInterpretation } = await import('../components/result-interpretation.tsx');
const { mixedPattern } = await import('../lib/interpretation.ts');
const c = JSON.parse(fs.readFileSync(new URL('../lib/brief/content.json', import.meta.url), 'utf8'));
const answersFor = code => Object.fromEntries(c.questions.map(q => {
  const mode = code[c.scoring.axisOrder.indexOf(q.axis)];
  return [q.id, mode === 'X' ? 4 : q.endpoints.left.mode === mode ? 1 : 7];
}));
let renders = 0;
for (const a of ['L','M','X']) for (const b of ['L','M','X']) for (const d of ['L','M','X']) {
  const code = a+b+d, result = score(c, answersFor(code));
  for (const lang of ['ko','en']) {
    const html = renderToStaticMarkup(React.createElement(ResultInterpretation, { result, lang }));
    assert.ok(html.includes(lang === 'ko' ? '내 응답을 조금 더 풀어 보면' : 'A closer reading of your answers'));
    assert.equal((html.match(/class="axis-reading"/g) ?? []).length, 3);
    assert.equal(html.includes('combination-reading'), !code.includes('X'));
    assert.equal((html.match(/class="pattern-note"/g) ?? []).length, code.split('').filter(z=>z==='X').length);
    assert.ok(!html.includes('undefined') && !html.includes('NaN'));
    renders++;
  }
}
const all4 = answersFor('XXX');
assert.equal(mixedPattern(score(c,all4).axes[0]), 'midpoint');
const qs = c.questions.filter(q=>q.axis==='direction');
const opposed = { ...all4, [qs[0].id]:qs[0].endpoints.left.mode==='L'?1:7, [qs[1].id]:qs[1].endpoints.left.mode==='M'?1:7 };
assert.equal(mixedPattern(score(c,opposed).axes[0]), 'opposed');
const soft = { ...all4, [qs[0].id]:qs[0].endpoints.left.mode==='L'?3:5 };
assert.equal(mixedPattern(score(c,soft).axes[0]), 'soft');
console.log(`PASS: ${renders} actual result renders (27 patterns × KO/EN), three distinct neutral explanations`);
