// leadership-game-brief/의 content.json·scoring.mjs가 단일 기준이다. 앱은 복사본을 쓰고, 수정은 brief 쪽에서만 한다.
import fs from 'node:fs';
const src = new URL('../../leadership-game-brief/', import.meta.url), dst = new URL('../lib/brief/', import.meta.url);
if (!fs.existsSync(src)) { console.log('brief folder not found; using committed copy'); process.exit(0); }
for (const f of ['content.json', 'scoring.mjs']) fs.copyFileSync(new URL(f, src), new URL(f, dst));
console.log('synced content.json + scoring.mjs from leadership-game-brief');
