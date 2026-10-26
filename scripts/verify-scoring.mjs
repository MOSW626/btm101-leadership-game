import fs from 'node:fs';
import assert from 'node:assert/strict';
import {score,aggregate} from '../lib/brief/scoring.mjs';
const c=JSON.parse(fs.readFileSync(new URL('../lib/brief/content.json',import.meta.url),'utf8'));
assert.equal(c.version,'2.0.1');
assert.equal(c.questions.length,18);
assert.equal(new Set(c.questions.map(q=>q.id)).size,18);
assert.equal(c.profiles.length,8);
function bilingual(x) { assert.ok(x && typeof x.ko==='string' && x.ko.length && typeof x.en==='string' && x.en.length); }
for (const k of ['title','subtitle','intro','notice']) bilingual(c[k]);
for (const v of Object.values(c.ui)) bilingual(v);
for (const v of Object.values(c.mixedProfile)) bilingual(v);
for (const g of c.groups) bilingual(g.label);
for (const a of c.axes) for (const k of ['name','question','leadership','management']) bilingual(a[k]);
assert.deepEqual(c.scoring.axisOrder,c.axes.map(a=>a.id));
assert.deepEqual(c.scale.labels.map(s=>s.value),[1,2,3,4,5,6,7]);
assert.equal(new Set(c.questions.map(q=>q.order)).size,18);
for (const s of c.scale.labels) bilingual(s.label);
for (const p of c.profiles) for (const k of ['name','summary','usefulWhen','watchFor','tryNext']) bilingual(p[k]);
for (const q of c.questions) {
  for(const k of ['scene','prompt']) bilingual(q[k]);
  for(const side of ['left','right']) bilingual(q.endpoints[side].text);
  for(const m of ['L','M']) bilingual(q.explanation[m]);
  assert.deepEqual([q.endpoints.left.mode,q.endpoints.right.mode].sort(),['L','M']);
}
for(const id of c.scoring.axisOrder) {
  const qs=c.questions.filter(q=>q.axis===id);
  assert.equal(qs.length,6);
  assert.equal(qs.filter(q=>q.endpoints.left.mode==='L').length,3);
}
const all4=()=>Object.fromEntries(c.questions.map(q=>[q.id,4]));
const forCode=code=>Object.fromEntries(c.questions.map(q=>{
  const mode=code[c.scoring.axisOrder.indexOf(q.axis)];
  return [q.id,mode==='X'?4:q.endpoints.left.mode===mode?1:7];
}));
for(const a of ['L','M','X']) for(const b of ['L','M','X']) for(const d of ['L','M','X']) {
  const code=a+b+d, r=score(c,forCode(code));
  assert.equal(r.code,code);
  assert.equal(r.profileCode,code.includes('X')?null:code);
}
const neutral=score(c,all4());
assert.equal(neutral.code,'XXX'); assert.equal(neutral.overall.leadershipIndex,50);
assert.equal(neutral.overall.responses.midpoint,18);
// Independent enumeration of every 1–7 response vector for each axis: 3 × 7^6.
let checked=0;
for(const id of c.scoring.axisOrder) {
  const qs=c.questions.filter(q=>q.axis===id);
  for(let mask=0;mask<7**6;mask++) {
    let rest=mask, expected=0;
    const answers=all4();
    for(const q of qs) {
      const rating=rest%7+1; rest=Math.floor(rest/7); answers[q.id]=rating;
      expected+=(4-rating)*(q.endpoints.left.mode==='L'?1:-1);
    }
    const axis=score(c,answers).axes.find(a=>a.id===id);
    assert.equal(axis.sum,expected);
    assert.equal(axis.zone,expected>3?'L':expected< -3?'M':'X');
    assert.ok(axis.leadershipIndex>=0 && axis.leadershipIndex<=100);
    const inverse=Object.fromEntries(Object.entries(answers).map(([k,v])=>[k,8-v]));
    const opposite=score(c,inverse).axes.find(a=>a.id===id);
    assert.ok(axis.sum+opposite.sum===0);
    assert.ok(Math.abs(axis.leadershipIndex+opposite.leadershipIndex-100)<1e-10);
    checked++;
  }
}
// Exact boundary and just outside the neutral band.
for(const expected of [-4,-3,3,4]) {
  const ans=all4(), qs=c.questions.filter(q=>q.axis==='direction');
  for(let i=0;i<Math.abs(expected);i++) ans[qs[i].id]=4+Math.sign(expected)*(qs[i].endpoints.right.mode==='L'?1:-1);
  const a=score(c,ans).axes[0];
  assert.equal(a.sum,expected); assert.equal(a.zone,expected>3?'L':expected< -3?'M':'X');
}
for(const invalid of [0,8,3.5,'4',null,NaN,undefined]) assert.throws(()=>score(c,{...all4(),q01:invalid}));
assert.throws(()=>score(c,{})); assert.throws(()=>score(c,{...all4(),extra:4}));
const no=aggregate(c,[]); assert.equal(no.overall.leadershipIndex,null); assert.equal(no.mostDivisive,null);
const even=aggregate(c,[{answers:forCode('LLL')},{answers:forCode('MMM')}]);
assert.equal(even.n,2); assert.equal(even.overall.leadershipIndex,50);
assert.ok(even.axes.every(a=>a.leadershipIndex===50));
assert.equal(even.typeCounts.LLL,1); assert.equal(even.typeCounts.MMM,1);
assert.equal(Object.values(even.typeCounts).reduce((a,b)=>a+b),2);
assert.equal(Object.values(even.patternCounts).reduce((a,b)=>a+b),2);
assert.ok(even.questionStats.every(q=>Object.values(q.counts).reduce((a,b)=>a+b)===2 && q.midpoint===0 && q.variance===9));
assert.equal(even.mostDivisive.id,'q01');
const mids=aggregate(c,[{answers:all4()},{answers:all4()}]);
assert.equal(mids.typeCounts.mixed,2); assert.equal(mids.mostDivisive,null);
assert.equal(mids.overall.responses.midpoint,36);
assert.equal(aggregate(c,[{answers:forCode('LLL')}]).mostDivisive,null);
// All left is not all L, because each axis has balanced orientation.
assert.equal(score(c,Object.fromEntries(c.questions.map(q=>[q.id,1]))).code,'XXX');
console.log(`PASS: 한영 필드·18문항·축별 배치·27개 L/M/X 패턴·축별 응답 ${checked.toLocaleString()}개·경계·역방향·잘못된 입력·집계·중간 응답·갈린 질문`);
