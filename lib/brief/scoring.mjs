/** v2: 18문항·1~7 응답. 기획 검증용 참조 코드이며 배포 앱은 아니다. */
function classify(mean, band) { return mean > band ? 'L' : mean < -band ? 'M' : 'X'; }
export function signedValue(question, rating) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 7) throw new Error(`INVALID_RATING:${question.id}`);
  return (rating - 4) * (question.endpoints.right.mode === 'L' ? 1 : -1);
}
function summarize(values, band) {
  const sum = values.reduce((a,b)=>a+b,0), total = values.length;
  const mean = sum / total;
  return {sum, total, maxAbs:3*total, mean, leadershipIndex:50+mean/3*50, zone:classify(mean,band),
    responses:{l:values.filter(v=>v>0).length,m:values.filter(v=>v<0).length,midpoint:values.filter(v=>v===0).length}};
}
export function score(content, answers) {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) throw new Error('INVALID_ANSWERS');
  const ids = content.questions.map(q=>q.id);
  if (Object.keys(answers).length!==ids.length || Object.keys(answers).some(k=>!ids.includes(k))) throw new Error('INCOMPLETE_OR_EXTRA_ANSWERS');
  const band = content.scoring.neutralBandPerItem;
  const values = Object.fromEntries(content.questions.map(q=>[q.id,signedValue(q,answers[q.id])]));
  const axes = content.scoring.axisOrder.map(id=>({id,...summarize(content.questions.filter(q=>q.axis===id).map(q=>values[q.id]),band)}));
  const code = axes.map(a=>a.zone).join('');
  return {version:content.version,code,profileCode:code.includes('X')?null:code,
    typeBucket:code.includes('X')?'mixed':code,axes,overall:summarize(Object.values(values),band)};
}

/** Completed, deduplicated rows only. The API must enforce session/token uniqueness. */
export function aggregate(content, rows) {
  const n=rows.length;
  const typeCounts=Object.fromEntries([...content.profiles.map(p=>p.code),'mixed'].map(k=>[k,0]));
  const patternCounts=Object.fromEntries(['L','M','X'].flatMap(a=>['L','M','X'].flatMap(b=>['L','M','X'].map(c=>[a+b+c,0]))));
  const byAxis=Object.fromEntries(content.scoring.axisOrder.map(id=>[id,[]]));
  const all=[], byQuestion=Object.fromEntries(content.questions.map(q=>[q.id,[]]));
  for (const row of rows) {
    const r=score(content,row.answers);
    typeCounts[r.typeBucket]++; patternCounts[r.code]++;
    for (const q of content.questions) {
      const v=signedValue(q,row.answers[q.id]);
      byAxis[q.axis].push(v); all.push(v); byQuestion[q.id].push({rating:row.answers[q.id],value:v});
    }
  }
  const empty={sum:0,total:0,maxAbs:0,mean:null,leadershipIndex:null,zone:null,responses:{l:0,m:0,midpoint:0}};
  const summarizeOrEmpty=values=>values.length?summarize(values,content.scoring.neutralBandPerItem):structuredClone(empty);
  const questionStats=content.questions.map(q=>{
    const vs=byQuestion[q.id];
    const counts=Object.fromEntries([1,2,3,4,5,6,7].map(i=>[i,0]));
    for (const v of vs) counts[v.rating]++;
    const l=vs.filter(v=>v.value>0).length,m=vs.filter(v=>v.value<0).length,midpoint=vs.filter(v=>v.value===0).length;
    const mean=n?vs.reduce((a,b)=>a+b.value,0)/n:null;
    const variance=n?vs.reduce((a,b)=>a+(b.value-mean)**2,0)/n:null;
    return {id:q.id,order:q.order,n,counts,l,m,midpoint,mean,variance,opposingCount:Math.min(l,m)};
  });
  const candidates=questionStats.filter(q=>q.l>0 && q.m>0).sort((a,b)=>b.opposingCount-a.opposingCount || b.variance-a.variance || a.order-b.order);
  const winner=n>=2?(candidates[0]??null):null;
  const mostDivisive=winner?{id:winner.id,tiedIds:candidates.filter(q=>q.opposingCount===winner.opposingCount && Math.abs(q.variance-winner.variance)<1e-10).map(q=>q.id)}:null;
  return {n,typeCounts,patternCounts,overall:summarizeOrEmpty(all),axes:content.scoring.axisOrder.map(id=>({id,...summarizeOrEmpty(byAxis[id])})),questionStats,mostDivisive};
}
