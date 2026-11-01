'use strict';
const M=Models,$=id=>document.getElementById(id),f=(x,n=3)=>Number(x).toFixed(n);
let seed=3071,fitData=null;
function number(id,min,max){const v=Number($(id).value);if(!Number.isFinite(v)||v<min||v>max)throw Error(`${$(id).parentElement.textContent.trim()}须在${min}至${max}之间。`);return v;}
function plot(series,n,bin,{reversal=false}={}){
 const X=t=>70+t/n*650,Y=v=>235-v*180,envY=v=>360-v*48;
 let svg='<figure class="model-chart"><div class="chart-scroll"><svg class="plot" viewBox="0 0 760 405" role="img" aria-label="上图为选择B的比例，下图为环境奖励概率；两图共享轮次轴。"><title>行为与环境分开显示</title>';
 svg+='<text x="70" y="26" font-size="15">行为：选择B的比例</text>';
 for(let q=0;q<=4;q++){const v=q/4;svg+=`<path d="M70 ${Y(v)}H720" stroke="#dde5df"/><text x="55" y="${Y(v)+5}" text-anchor="end" font-size="13">${Math.round(100*v)}%</text>`;}
 if(reversal){svg+=`<rect x="${X(n/2)}" y="45" width="325" height="199" fill="#b55432" opacity=".035"/><path d="M${X(n/2)} 45V245M${X(n/2)} 305V365" stroke="#b55432" stroke-dasharray="5 5"/><text x="${X(n/2)+9}" y="42" font-size="12" fill="#9e482b">第${n/2+1}轮起反转</text>`;}
 series.forEach((s,i)=>{
   const color=s.color||['#216c60','#b55432','#6974b2'][i],points=s.y.map((v,k)=>`${X((k+.5)*bin)},${Y(v)}`).join(' ');
   if(s.low){const pts=s.high.map((v,k)=>`${X((k+.5)*bin)},${Y(v)}`).concat(s.low.map((v,k)=>`${X((k+.5)*bin)},${Y(v)}`).reverse()).join(' ');svg+=`<polygon points="${pts}" fill="${color}" opacity=".12"/>`;}
   svg+=`<polyline points="${points}" fill="none" stroke="${color}" stroke-width="2.8" ${s.dash?'stroke-dasharray="7 5"':''}/>`;
 });
 svg+='<text x="70" y="291" font-size="15">环境：选B后获得奖励的概率 μB</text>';
 for(const v of [.2,.8])svg+=`<path d="M70 ${envY(v)}H720" stroke="#e4e8e1"/><text x="55" y="${envY(v)+5}" text-anchor="end" font-size="12">${v}</text>`;
 svg+=`<path d="M70 ${envY(.8)}H${reversal?X(n/2):720}${reversal?`V${envY(.2)}H720`:''}" fill="none" stroke="#6974b2" stroke-width="3"/>`;
 for(let i=0;i<=4;i++){const t=i*n/4;svg+=`<text x="${X(t)}" y="262" text-anchor="middle" font-size="12">${t}</text><text x="${X(t)}" y="384" text-anchor="middle" font-size="12">${t}</text>`;}
 svg+='<text x="735" y="262" font-size="12">轮</text><text x="735" y="384" font-size="12">轮</text></svg></div>';
 svg+='<figcaption class="chart-legend">'+series.map((s,i)=>`<span><i style="border-color:${s.color||['#216c60','#b55432','#6974b2'][i]};border-top-style:${s.dash?'dashed':'solid'}"></i>${s.name}</span>`).join('')+'</figcaption></figure>';
 return svg;
}
function avgSim(m,p,n,count,random,rev,bin){const all=[],sum=Array(n/bin).fill(0);let reward=0;for(let i=0;i<count;i++){const d=M.simulate(m,p,n,random,rev),ys=M.bins(d,bin);all.push(ys);ys.forEach((v,j)=>sum[j]+=v/count);reward+=d.reduce((s,r)=>s+r.r,0)/count;}const q=(j,frac)=>{const vals=all.map(a=>a[j]).sort((a,b)=>a-b),x=(vals.length-1)*frac,l=Math.floor(x);return vals[l]+(vals[Math.ceil(x)]-vals[l])*(x-l);};return {y:sum,reward,low:sum.map((_,j)=>q(j,.05)),high:sum.map((_,j)=>q(j,.95))};}
let play=[],playRandom=M.rng(911),revealed=false;
function showPlay(){const score=play.reduce((s,r)=>s+r.r,0);$('playStatus').textContent=`已完成${play.length}轮，总分${score}。${play.length?'最近一轮：'+(play.at(-1).a?'B':'A')+'箱，'+play.at(-1).r+'分。':''}${revealed?' 环境设定：A奖励概率0.2，B奖励概率0.8。':''}`;$('playHistory').innerHTML='<div class="chips">'+play.slice(-40).map(r=>`<span class="chip ${r.r?'win':''}">${r.t}: ${r.a?'B':'A'} ${r.r?'＋1':'0'}</span>`).join('')+'</div>';}
function choose(a){play.push({t:play.length+1,a,r:playRandom()<(a?.8:.2)?1:0});showPlay();}
function soft(){const gap=Number($('gap').value),b=Number($('temperature').value),p=M.sigmoid(b*gap);$('softResult').innerHTML=`<div class="eq">差值=${f(gap,2)}，β=${f(b,1)}<br>p(A)=1/(1+exp(−(${f(b*gap,2)})))=${f(p)}<br>p(B)=${f(1-p)}</div>`;}
$('gap').oninput=soft;$('temperature').oninput=soft;soft();
function heatmap(cells,truth,best){
 const values=cells.flat(),lo=Math.min(...values),hi=Math.max(...values),shade=q=>`hsl(160 35% ${25+q*65}%)`,X=a=>92.5+a*500,Y=b=>297.5-b*28;
 let s='<figure class="model-chart"><div class="chart-scroll"><svg class="plot" viewBox="0 0 760 385" role="img" aria-label="似然地形：横轴学习率，纵轴逆温度，深色表示较低NLL。橙圈为真值，白菱形为估计。"><title>参数与负对数似然</title><text x="80" y="26" font-size="15">深色区域：这些参数使实际选择更可能出现</text>';
 cells.forEach((row,bi)=>row.forEach((v,ai)=>{s+=`<rect x="${80+ai*25}" y="${294-bi*7}" width="25.1" height="7.1" fill="${shade((v-lo)/(hi-lo||1))}"><title>α=${ai/20}，β=${bi/4}，NLL=${f(v)}</title></rect>`;}));
 s+=`<circle cx="${X(truth.a)}" cy="${Y(truth.b)}" r="8" fill="none" stroke="#ffab51" stroke-width="3"/><path d="M${X(best.a)} ${Y(best.b)-5}l5 5-5 5-5-5Z" fill="white" stroke="#173e39" stroke-width="1.5"/>`;
 for(let t=0;t<=4;t++)s+=`<text x="${X(t/4)}" y="324" text-anchor="middle" font-size="12">${t/4}</text><text x="64" y="${Y(t*2)+4}" text-anchor="end" font-size="12">${t*2}</text>`;
 s+='<text x="336" y="350" text-anchor="middle" font-size="14">学习率 α</text><text x="43" y="53" font-size="14">β</text><text x="660" y="48" font-size="13">NLL</text>';
 for(let i=0;i<40;i++)s+=`<rect x="662" y="${70+i*5.6}" width="18" height="5.7" fill="${shade(1-i/39)}"/>`;
 s+=`<text x="690" y="79" font-size="12">${f(hi,1)}</text><text x="690" y="294" font-size="12">${f(lo,1)}</text><text x="80" y="378" font-size="13">橙圈：生成真值　◇：网格估计　色阶对应本次数据的NLL范围</text></svg></div></figure>`;
 return s;
}
function scatter(rows,key,max,label){
 const X=v=>48+v/max*270,Y=v=>270-v/max*235;
 let s=`<svg class="plot recovery-scatter" viewBox="0 0 360 345" role="img" aria-label="${label}参数恢复；横轴真值，纵轴估计，细线表示估计偏差。"><title>${label}参数恢复</title><text x="48" y="21" font-size="14">${label}：估计值</text>`;
 for(let i=0;i<=4;i++){const v=i*max/4;s+=`<path d="M48 ${Y(v)}H318" stroke="#e3e9e1"/><text x="${X(v)}" y="292" text-anchor="middle" font-size="12">${f(v,2)}</text><text x="40" y="${Y(v)+4}" text-anchor="end" font-size="12">${f(v,2)}</text>`;}
 s+='<path d="M48 35V270H318M48 270L318 35" fill="none" stroke="#859c8e" stroke-dasharray="4 4"/>';
 for(const row of rows){s+=`<path d="M${X(row.true[key])} ${Y(row.true[key])}V${Y(row.fit[key])}" stroke="#b55432" stroke-width="1.4" opacity=".55"/><circle cx="${X(row.true[key])}" cy="${Y(row.fit[key])}" r="4.5" fill="#216c60" opacity=".8"><title>真值${f(row.true[key])}；估计${f(row.fit[key])}；偏差${f(row.fit[key]-row.true[key])}</title></circle>`;}
 return s+'<text x="180" y="317" text-anchor="middle" font-size="13">生成真值</text><text x="48" y="341" font-size="12">虚线：完全恢复　细线：估计与真值的偏差</text></svg>';
}
function confusion(mat){
 const names=['M1 固定偏好','M2 赢留输换','M3 RW'];
 return '<div class="tablewrap"><table class="confusion"><caption>行：生成模型　列：选中模型</caption><thead><tr><th scope="col">生成 ↓ / 选中 →</th>'+names.map(x=>`<th scope="col">${x}</th>`).join('')+'</tr></thead><tbody>'+mat.map((r,i)=>'<tr><th scope="row">'+names[i]+'</th>'+r.map((x,k)=>`<td class="${i===k?'correct':'confused'}" style="background:${i===k?`rgba(33,108,96,${.04+x/12*.21})`:`rgba(181,84,50,${.02+x/12*.18})`}"><strong>${f(x/12*100,1)}%</strong><span>${x}/12</span></td>`).join('')+'</tr>').join('')+'</tbody></table></div><p class="small">对角线为正确识别，其他格为混淆。每行合计12份数据，颜色深浅表示该格比例。</p>';
}
function tab(head,rows){return '<div class="tablewrap"><table><tr>'+head.map(x=>`<th>${x}</th>`).join('')+'</tr>'+rows.map(r=>'<tr>'+r.map(x=>`<td>${x}</td>`).join('')+'</tr>').join('')+'</table></div>';}
const actions={chooseA:()=>choose(0),chooseB:()=>choose(1),reveal:()=>{revealed=true;showPlay();},resetPlay:()=>{play=[];playRandom=M.rng(seed);revealed=false;showPlay();},simulate:()=>{const m=$('simModel').value,a=number('simAlpha',0,1),b=number('simBeta',0,10),v=number('simBias',0,1),p={a,b:m==='random'?v:b,e:v,ac:m==='mix'?number('simAC',0,1):a,bc:m==='mix'?number('simBC',0,10):b},rev=$('reversal').checked;const d=avgSim(m,p,200,100,M.rng(seed),rev,20);$('simPlot').innerHTML=plot([{name:'固定RW对照',y:avgSim('rw',{a:.25,b:3},200,100,M.rng(seed),rev,20).y,color:'#79867e',dash:true},{name:'当前模型',y:d.y,color:'#216c60'}],200,20,{reversal:rev});$('simSummary').textContent=`100个模拟个体，平均总奖励${f(d.reward,1)}/200。初始Q与CK均为0。${m==='rw'&&a===.25&&b===3?'当前参数与固定对照相同，两条曲线重合。':''}`;},fit:()=>{const p={a:number('fitAlpha',0,1),b:number('fitBeta',0,8)},n=Number($('fitN').value);fitData=M.simulate('rw',p,n,M.rng(seed));const fit=M.fit('rw',fitData,true);$('fitPlot').innerHTML=heatmap(fit.cells,p,fit.p);$('fitResult').innerHTML=`<p>真值α=${p.a}、β=${p.b}；估计α=${fit.p.a}、β=${fit.p.b}；最低NLL=${f(fit.nll)}。</p><p>真值与最优估计不同可能来自有限样本与网格离散化。平坦区域提示多组参数产生相似预测。</p>`;},export:()=>{if(!fitData)throw Error('请先生成并拟合一份模拟数据。');const csv='trial,choice,reward,pA_before_choice,Q_A_before,Q_B_before\n'+fitData.map(r=>[r.t,r.a?'B':'A',r.r,r.pa,...r.q].join(',')).join('\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='simulated-bandit-data.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},recover:()=>{const n=Number($('recN').value),random=M.rng(seed),rows=[];for(let i=0;i<18;i++){const p={a:.1+(i%5)*.2,b:1+i%6};const d=M.simulate('rw',p,n,M.rng(seed+100+i));rows.push({true:p,fit:M.fit('rw',d).p});}$('recPlot').innerHTML='<div class="recovery-pair"><div>'+scatter(rows,'a',1,'α')+'</div><div>'+scatter(rows,'b',8,'β')+'</div></div>';const mae=k=>rows.reduce((s,r)=>s+Math.abs(r.true[k]-r.fit[k]),0)/rows.length;$('recResult').textContent=`18个个体，每人${n}轮。平均绝对误差：α ${f(mae('a'))}；β ${f(mae('b'))}。增加轮数会保留每个个体已有的记录；本次误差变化还受有限样本影响。`;},modelRecovery:()=>{const n=Number($('mrN').value),random=M.rng(seed),names=['random','wsls','rw'],mat=names.map(()=>[0,0,0]);names.forEach((name,i)=>{for(let j=0;j<12;j++){const pr=M.rng(seed+1000+i*100+j),p={a:.1+.8*pr(),b:name==='random'?.1+.8*pr():1+5*pr(),e:.05+.75*pr()};const d=M.simulate(name,p,n,M.rng(seed+2000+i*100+j));const fits=names.map(m=>M.fit(m,d));let best=0;for(let k=1;k<3;k++)if(fits[k].bic<fits[best].bic)best=k;mat[i][best]++;}});$('mrResult').innerHTML=confusion(mat);},validate:()=>{const random=M.rng(seed),d=M.simulate('rw',{a:.3,b:3},400,random,true),rw=M.fit('rw',d),ck=M.fit('ck',d);const r=avgSim('rw',rw.p,400,100,random,true,40),c=avgSim('ck',ck.p,400,100,random,true,40);$('valPlot').innerHTML=plot([{name:'参考记录（1个模拟个体）',y:M.bins(d,40),color:'#4a5550',dash:true},{name:'RW自由模拟均值',y:r.y,low:r.low,high:r.high,color:'#216c60'},{name:'CK自由模拟均值',y:c.y,low:c.low,high:c.high,color:'#b55432'}],400,40,{reversal:true});$('valResult').innerHTML=tab(['模型','拟合NLL','BIC','估计参数'],[['RW',f(rw.nll),f(rw.bic),`α=${rw.p.a}, β=${rw.p.b}`],['CK',f(ck.nll),f(ck.bic),`αc=${ck.p.a}, βc=${ck.p.b}`]])+`<p>比较反转前后的变化：CK更新不使用奖励；RW会更新奖励预期。排名与自由模拟检验回答不同问题。</p>`;}};
document.querySelectorAll('[data-act]').forEach(btn=>btn.onclick=async()=>{btn.disabled=true;let old=btn.textContent;try{if(['fit','recover','modelRecovery','validate'].includes(btn.dataset.act)){btn.textContent='计算中…';await new Promise(r=>setTimeout(r,30));}actions[btn.dataset.act]();}catch(e){alert(e.message);}finally{btn.disabled=false;btn.textContent=old;}});

function syncControls(){const m=$('simModel').value;const show=(id,yes)=>$(id).hidden=!yes;show('simAlphaLabel',['rw','ck','mix'].includes(m));show('simBetaLabel',['rw','ck','mix'].includes(m));show('simBiasLabel',['random','wsls'].includes(m));show('simACLabel',m==='mix');show('simBCLabel',m==='mix');$('simAlphaText').textContent=m==='ck'?'选择核学习率 αc ':'奖励学习率 α ';$('simBetaText').textContent=m==='ck'?'选择核逆温度 βc ':'价值逆温度 β ';$('simBiasText').textContent=m==='random'?'选择A的固定概率 b ':'随机选择分支概率 ε ';}
$('simModel').onchange=()=>{syncControls();simHelp();};syncControls();

function alphaExample(){const a=Number($('learnAlpha').value),delta=1-.4,change=a*delta; $('learnEffect').innerHTML=`<div class="eq">α=${f(a,2)}：吸收本次误差的${f(a*100,0)}%<br>δ=1−0.4=0.6<br>变化量=αδ=${f(change)}<br>新Q(A)=0.4+${f(change)}=${f(.4+change)}</div><p>保持奖励和旧估计不变，只有吸收比例α发生了变化。未选选项的Q保持原值。</p>`;}
function simHelp(){const m=$('simModel').value,a=Number($('simAlpha').value),b=Number($('simBeta').value),v=Number($('simBias').value),ac=Number($('simAC').value),bc=Number($('simBC').value);let t='';
if(m==='random')t=`<b>b=${f(v,2)}</b>：每轮以${f(100*v,0)}%概率选A，以${f(100*(1-v),0)}%概率选B。它不读取反馈，改变b只改变固定偏好。`;
if(m==='wsls')t=`<b>ε=${f(v,2)}</b>：${f(100*(1-v),0)}%进入赢留输换分支，${f(100*v,0)}%进入等概率随机分支。因此规则目标动作总概率为1−ε/2=${f(1-v/2)}。ε控制规则被随机选择替代的程度。`;
if(m==='rw')t=`<b>α=${f(a,2)}</b>控制学习：若旧Q=0.4、得到1分，新Q=0.4+${f(a,2)}×0.6=${f(.4+a*.6)}。<br><b>β=${f(b,2)}</b>控制选择：若当前Q(A)=0.6、Q(B)=0.2，p(A)=${f(M.sigmoid(b*.4))}。增加α不保证学习更准确，增加β也不保证选到真实更好的箱子。`;
if(m==='ck')t=`<b>αc=${f(a,2)}</b>控制选择痕迹：若旧CK(A)=0.4、CK(B)=0.6，本轮选A，新CK(A)=${f(.4+a*.6)}、CK(B)=${f(.6*(1-a))}，无论是否得到奖励。<br><b>βc=${f(b,2)}</b>控制痕迹影响选择的力度：若当前CK(A)=0.7、CK(B)=0.3，p(A)=${f(M.sigmoid(b*.4))}。`;
if(m==='mix')t=`<b>α=${f(a,2)}</b>更新奖励价值；<b>αc=${f(ac,2)}</b>更新选择痕迹。例如旧Q(A)=0.4、旧CK(A)=0.2，选A得1分后，两者分别变为${f(.4+a*.6)}和${f(.2+ac*.8)}。<br><b>β=${f(b,2)}、βc=${f(bc,2)}</b>合成两种信息。固定Q(A)=0.6、Q(B)=0.2、CK(A)=0.2、CK(B)=0.8时，分数差=${f(b)}×0.4−${f(bc)}×0.6=${f(b*.4-bc*.6)}，p(A)=${f(M.sigmoid(b*.4-bc*.6))}。`;
$('simHelp').innerHTML='<h4>参数的直接作用</h4><p>'+t+'</p><p class="small">这些小例子固定了内部状态，用于说明单个参数的作用；行为曲线则由200轮连续更新产生。</p>';}
$('learnAlpha').oninput=alphaExample;alphaExample();
['simAlpha','simBeta','simBias','simAC','simBC'].forEach(id=>$(id).addEventListener('input',simHelp));simHelp();
