'use strict';
(function(){
 const $=id=>document.getElementById(id),F=(x,n=3)=>Number(x).toFixed(n),pct=x=>F(x*100,1)+'%';
 const record=[{a:0,r:1},{a:0,r:0},{a:1,r:1},{a:0,r:1}];
 function replay(a,b){
  const state=Models.state(),rows=[];
  for(const [i,event] of record.entries()){
   const before=[...state.q],pa=Models.prob('rw',{a,b},state),chosen=event.a===0?pa:1-pa,delta=event.r-before[event.a];
   Models.update(state,event.a,event.r,{a});
   rows.push({t:i+1,...event,before,after:[...state.q],pa,chosen,delta,nll:-Math.log(chosen)});
  }
  return rows;
 }
 const reference=replay(.5,2);
 function bar(label,x,color='#216c60',value=pct(x)) {return `<div class="pv-bar-row"><span>${label}</span><div class="pv-bar-track"><div class="pv-bar" style="width:${100*x}%;background:${color}"></div></div><strong>${value}</strong></div>`;}
 function table(head,rows){return '<div class="tablewrap"><table><thead><tr>'+head.map(x=>`<th>${x}</th>`).join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(x=>`<td>${x}</td>`).join('')+'</tr>').join('')+'</tbody></table></div>';}
 function meaning(){
  const mu=+$('coreMu').value,q=+$('coreQ').value,pa=Models.sigmoid(2*q);
  $('coreMeaning').innerHTML=`<div class="core-three"><div><b>环境 μ(A)=${F(mu,2)}</b><p>每次打开A，有${pct(mu)}的机会得1分。</p></div><div><b>估计 Q(A)=${F(q,2)}</b><p>模型当前预计A的平均收益为${F(q,2)}。</p></div><div><b>选择 p(A)=${F(pa)}</b><p>使用固定选择规则，模型以${pct(pa)}的概率选A。</p></div></div>${bar('奖励概率 μ(A)',mu,'#6974b2')}${bar('价值估计 Q(A)',q,'#b55432',F(q))}${bar('选择概率 p(A)',pa)}<p class="pv-takeaway">改变μ，只改变环境的奖励机会；这里没有新反馈，Q和p都不会自动跟着改变。改变Q会改变p，但不会改变箱子本身的μ。</p>`;
 }
 function alphaStep(){
  const alpha=+$('coreAlpha').value,row=reference[+$('coreTrial').value],old=row.before[row.a],delta=row.r-old,q=old+alpha*delta,X=x=>60+540*x;
  let svg=`<div class="pv-chart-scroll"><svg class="pv-chart" viewBox="0 0 680 215" role="img" aria-label="固定本轮旧Q与反馈，学习率决定更新量和新Q的位置"><title>同一次反馈中的学习率作用</title><text x="60" y="25">第${row.t}轮：选${row.a?'B':'A'}，奖励${row.r}；α=${F(alpha,2)}</text><path d="M60 95H600" stroke="#dce3dc" stroke-width="5"/><path d="M${X(old)} 95H${X(row.r)}" stroke="#d0dbd3" stroke-width="12"/><path d="M${X(old)} 95H${X(q)}" stroke="#216c60" stroke-width="12"/>`;
  for(let i=0;i<=5;i++)svg+=`<text x="${X(i/5)}" y="127" text-anchor="middle">${i/5}</text>`;
  svg+=`<circle cx="${X(old)}" cy="95" r="6" fill="#b55432"/><circle cx="${X(row.r)}" cy="95" r="6" fill="#6974b2"/><circle data-core-q="${F(q)}" cx="${X(q)}" cy="95" r="8" stroke="white" stroke-width="2" fill="#216c60"/><text x="${X(q)}" y="65" text-anchor="middle">新Q=${F(q)}</text><text x="60" y="164">橙点：旧Q=${F(old)}　紫点：奖励=${row.r}　绿段：本次变化</text><text x="60" y="199">δ=${row.r}−${F(old)}=${F(delta)}；αδ=${F(alpha*delta)}</text></svg></div>`;
  $('coreLearning').innerHTML=svg+`<div class="eq">Q新=${F(old)}+${F(alpha,2)}×(${row.r}−${F(old)})=${F(q)}</div><p class="pv-takeaway">${alpha===0?'α=0：没有吸收这次反馈，估计保持原值。':delta>0?'实际奖励高于预期，估计向上调整；α越大，上调越多。':'实际奖励低于预期，估计向下调整；α越大，下调越多。'} 本次只改变这一轮的更新；该轮旧Q固定取自α=0.5的参考经历。</p>`;
 }
 const cases={a:[.5,0],equal:[0,0],b:[.25,.5]};
 function choice(){
  const [qa,qb]=cases[$('coreCase').value],beta=+$('coreBeta').value,gap=qa-qb,pa=Models.sigmoid(beta*gap);
  $('coreChoice').innerHTML=`<p class="pv-setting">Q(A)=${F(qa,2)}，Q(B)=${F(qb,2)}；β=${F(beta,2)}</p><div class="eq">p(A)=1 / {1+exp[−${F(beta,2)}×(${F(qa,2)}−${F(qb,2)})]}<br>=1 / {1+exp[${F(-beta*gap)}]}≈${F(pa)}</div>${bar('选择A',pa)}${bar('选择B',1-pa,'#b55432')}<p class="pv-takeaway">${gap===0?'价值差为0，因此概率始终各为50%；提高β也不会产生偏好。':beta===0?'β=0：当前价值差没有影响选择，两者各为50%。':`当前${gap>0?'A':'B'}的Q较高。提高β会更偏向${gap>0?'A':'B'}，但两个Q本身保持不变。`}</p>`;
 }
 function recordTable(){
  $('coreRecord').innerHTML=table(['轮次','选择前Q(A), Q(B)','实际选择／奖励','p(A)','实际动作的概率','更新后Q(A), Q(B)'],reference.map(r=>[r.t,r.before.map(x=>F(x)).join('，'),`${r.a?'B':'A'}／${r.r}`,F(r.pa),F(r.chosen),r.after.map(x=>F(x)).join('，')]));
 }
 function fixedFit(){
  const alpha=+$('coreFitAlpha').value,beta=+$('coreFitBeta').value,rows=replay(alpha,beta),nll=rows.reduce((s,r)=>s+r.nll,0),baseline=reference.reduce((s,r)=>s+r.nll,0);
  $('coreFit').innerHTML=`<p class="pv-setting">候选α=${F(alpha,2)}、β=${F(beta,2)}；选择与奖励记录固定</p>`+table(['轮次','选择前Q(A),Q(B)','实际动作／奖励','该动作的概率','−ln(概率)'],rows.map(r=>[r.t,r.before.map(x=>F(x)).join('，'),`${r.a?'B':'A'}／${r.r}`,F(r.chosen),F(r.nll)]))+rows.map(r=>bar(`第${r.t}轮 NLL`,r.nll/10,'#216c60',F(r.nll))).join('')+`<p class="small">各条共用0至10的NLL刻度。概率越低，这一轮的条形越长。</p><div class="eq">总NLL=${rows.map(r=>F(r.nll)).join(' + ')}≈${F(nll)}</div><p class="pv-takeaway">参考α=0.5、β=2时，总NLL约${F(baseline)}。${Math.abs(nll-baseline)<1e-9?'当前候选与参考结果相同。':`当前候选的NLL${nll<baseline?'更低，对这份记录的拟合更好':'更高，对这份记录的拟合较差'}。`}这只比较对同一记录的解释，不表示参数已经被可靠识别。</p>`;
 }
 for(const [ids,fn] of [['coreMu coreQ',meaning],['coreAlpha coreTrial',alphaStep],['coreBeta coreCase',choice],['coreFitAlpha coreFitBeta',fixedFit]]){ids.split(' ').forEach(id=>$(id).addEventListener('input',fn));fn();}
 recordTable();
 globalThis.CoreTeaching={record,replay,reference,meaning,alphaStep,choice,fixedFit};
})();
