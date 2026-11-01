'use strict';
(function(){
 const M=window.Lesson,$=id=>document.getElementById(id),v=id=>+$(id).value;
 const f=(x,n=3)=>x.toFixed(n),pct=x=>(100*x).toFixed(1)+'%';
 const svg=(body,w=640,h=290,label='示意图')=>`<svg xmlns="http://www.w3.org/2000/svg" class="plot" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}"><title>${label}</title>${body}</svg>`;
 const text=(x,y,s,extra='')=>`<text x="${x}" y="${y}" fill="#294e44" font-size="14" ${extra}>${s}</text>`;
 const line=(x,y,x2,y2,col='#c9d6cc',extra='')=>`<line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" stroke="${col}" ${extra}/>`;
 const dot=(x,y,col,r=7,extra='')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${col}" ${extra}/>`;
 const bar=(name,p,orange=false,format=pct)=>`<div class="pv-bar-row"><span>${name}</span><div class="pv-bar-track"><div class="pv-bar ${orange?'pv-orange':''}" style="width:${100*p}%"></div></div><strong>${format(p)}</strong></div>`;
 const table=(heads,rows)=>`<div class="tablewrap"><table><thead><tr>${heads.map(s=>`<th scope="col">${s}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(s=>`<td>${s}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
 function wire(ids,fn){ids.forEach(id=>$(id).addEventListener('input',()=>{const out=$(id+'Value');if(out)out.value=$(id).value;fn();}));fn();}
 function set(id,value){$(id).value=value;$(id+'Value').value=value;}
 function prediction(){
  const s=v('shape'),t=v('texture'),e=v('lapse'),a=M.q(s,e),b=M.q(t,e),r=8+(s+1)*39;
  let marks='';for(let i=0;i<7;i++){const x=68+i*22,dx=Math.max(60+r-x,0,x-(240-r)),inset=r-Math.sqrt(r*r-dx*dx)+3;marks+=`<path d="M ${x} ${35+inset} V ${215-inset}" stroke="#216c60" stroke-width="4" opacity="${(1-t)/2}"/>`;}
  for(let x=73;x<220;x+=26)for(let y=53;y<200;y+=26){const ri=r-5,dx=Math.max(65+ri-x,0,x-(235-ri)),dy=Math.max(40+ri-y,0,y-(210-ri));if(dx*dx+dy*dy<=ri*ri)marks+=dot(x,y,'#b55432',5,`opacity="${(1+t)/2}"`);}
  const pic=svg(`<rect x="60" y="35" width="180" height="180" rx="${r}" fill="#edf3e6"/>${marks}<rect x="60" y="35" width="180" height="180" rx="${r}" fill="none" stroke="#254f44" stroke-width="3"/>${text(150,245,`s=${f(s,2)} · t=${f(t,2)}`,'text-anchor="middle"')}`,300,270,'形状与纹理线索的抽象示意');
  $('prediction').innerHTML=`<div class="split"><div>${pic}</div><div><p>预测观察者选择甲的概率</p>${bar('形状模型',a)}${bar('纹理模型',b,true)}<p class="small">条长表示 0–100%；两条使用相同刻度。</p></div></div><div class="step-calculation">qₛ = (1−${f(e,2)}) × ${f(M.q(s))} + ${f(e,2)} × 0.5 = <b>${f(a)}</b><br/>qₜ = (1−${f(e,2)}) × ${f(M.q(t))} + ${f(e,2)} × 0.5 = <b>${f(b)}</b></div><p>${Math.abs(a-b)<1e-9?'两种模型的反应分布完全相同：这一次观察不能区分它们。':`甲类概率相差 ${f(Math.abs(a-b)*100,1)} 个百分点。${e>0?'随机作答把两个预测都拉向 0.5。':'两条线索的冲突转化成了反应预测的分歧。'}`}</p>`;
 }
 wire(['shape','texture','lapse'],prediction);
 [['familiar',1,1],['conflict',1,-1],['ambiguous',0,0]].forEach(([id,s,t])=>$(id).addEventListener('click',()=>{set('shape',s);set('texture',t);prediction();}));
 let truth,logOdds,trial,history,revealed;
 const posterior=()=>1/(1+Math.exp(-logOdds));
 function game(){const p=posterior();$('game').innerHTML=`<p class="metric">已观察 ${trial} 次反应</p>${bar('形状模型后验',p)}${bar('纹理模型后验',1-p,true)}<p>当前对数赔率：${f(logOdds,2)}。${revealed?`本轮数据由<strong>${truth?'形状':'纹理'}模型</strong>生成。`:'隐藏模型保持不变。'}</p>${history.length?table(['轮次','刺激','模拟反应','形状模型后验'],history.slice(-8).map(r=>[r.i,r.stim,r.y?'甲':'乙',pct(r.p)])):'<p class="small">初始先验各为 50%。点击一种刺激，收集一次反应。</p>'}<p class="small">表格保留最近 8 次。显示到 100% 时是四舍五入，并不表示逻辑上的确定。</p>`;}
 function restart(){truth=Math.random()<.5;logOdds=0;trial=0;history=[];revealed=false;game();}
 document.querySelectorAll('[data-stim]').forEach(button=>button.addEventListener('click',()=>{
  const type=button.dataset.stim,[s,t]=type==='conflict'?[1,-1]:type==='same'?[1,1]:[0,0],a=M.q(s),b=M.q(t),y=Math.random()<(truth?a:b);
  logOdds+=Math.log(y?a/b:(1-a)/(1-b));trial++;
  history.push({i:trial,stim:type==='conflict'?'形＋／纹−':type==='same'?'形＋／纹＋':'两者中性',y,p:posterior()});game();
 }));
 $('reveal').addEventListener('click',()=>{revealed=true;game();});$('restart').addEventListener('click',restart);restart();
 function information(){
  const prior=v('prior'),e=v('infoNoise'),kind=$('design').value,[s,t]=kind==='conflict'?[1,-1]:kind==='same'?[1,1]:[0,0],a=M.q(s,e),b=M.q(t,e),z=M.evidence(prior,a,b);
  $('information').innerHTML=`<p>qₛ=${f(a)}，qₜ=${f(b)}；先验熵 h(${f(prior,2)})=${f(z.before)} bit。</p>${table(['可能结果','结果概率','形状模型后验','后验熵 / bit','本次熵减少 / bit'],[['甲',f(z.py),f(z.yes),f(M.h(z.yes)),f(z.before-M.h(z.yes))],['乙',f(1-z.py),f(z.no),f(M.h(z.no)),f(z.before-M.h(z.no))]])}<div class="step-calculation">EIG = ${f(z.before)} − [${f(z.py)}×${f(M.h(z.yes))} + ${f(1-z.py)}×${f(M.h(z.no))}]<br/>= <b>${f(z.eig)} bit</b></div>${bar('先验熵',z.before,false,x=>f(x)+' bit')}${bar('预期后验熵',z.after,true,x=>f(x)+' bit')}<p class="small">两条的满刻度均为 1 bit；相差 ${f(z.eig)} bit。显示值经过舍入，计算使用完整精度。</p>`;
 }
 wire(['prior','infoNoise','design'],information);
 function search(){
  const z=M.search(v('distance'),v('penalty')),winner=p=>z.winners.includes(p);let body='';
  for(const p of z.points){const x=105+(p.s+1)*170,y=35+(1-p.t)*110;const strength=Math.min(1,Math.max(0,p.gain/.5311)),col=p.allowed?`rgb(${Math.round(240-strength*95)},${Math.round(247-strength*65)},${Math.round(232-strength*65)})`:'#e6e6e3';body+=`<rect x="${x}" y="${y}" width="80" height="49" rx="4" fill="${col}" stroke="${winner(p)?'#b55432':'#fff'}" stroke-width="${winner(p)?4:1}"/>${text(x+40,y+30,p.allowed?f(p.u,2):'排除','text-anchor="middle"')}`;}
  for(let i=0;i<5;i++){body+=text(145+i*85,329,[-1,-.5,0,.5,1][i],'text-anchor="middle"');body+=text(85,66+i*55,[1,.5,0,-.5,-1][i],'text-anchor="end"');}
  body+=text(315,359,'形状 s','text-anchor="middle"')+text(25,175,'纹理 t','transform="rotate(-90 25 175)" text-anchor="middle"');
  const first=z.winners[0];$('search').innerHTML=svg(body,640,380,'25 个刺激的效用网格；橙框为并列最优')+`<p class="small">格内数字：综合效用 U（bit）。绿色深浅：惩罚前的信息增益。橙框：${z.winners.length} 个并列最优点。</p><div class="step-calculation">以其中 (s,t)=(${first.s},${first.t}) 为例：<br/>U = ${f(first.gain)} − ${f(v('penalty'),2)} × ${f(first.cost)} = <b>${f(z.best)} bit</b></div><p>允许 ${z.points.filter(p=>p.allowed).length} / 25 个刺激。${v('distance')===0?'只允许线索一致的刺激，所有信息增益均为 0。':'最优只针对这个有限网格和当前效用定义。'}</p>`;
 }
 wire(['distance','penalty'],search);
 function offset(){
  const n=v('conditions'),sigma=v('sigma'),z=M.offset(n,sigma),y=a=>205-a*43;let body='';
  for(let tick=-2;tick<=3;tick++)body+=line(65,y(tick),590,y(tick))+text(50,y(tick)+5,tick,'text-anchor="end"');
  z.a.forEach((a,i)=>{const x=210+i*245;body+=text(x,320,'条件 '+(i+1),'text-anchor="middle"');[[a,x-20,'#216c60'],[z.adjusted[i],x+20,'#b55432']].forEach(([val,cx,col])=>{body+=line(cx,y(val-sigma),cx,y(val+sigma),col,'stroke-width="3"')+line(cx-6,y(val-sigma),cx+6,y(val-sigma),col)+line(cx-6,y(val+sigma),cx+6,y(val+sigma),col)+dot(cx,y(val),col);});body+=dot(x+40,y(z.b[i]),'#fff',7,'stroke="#8b9490" stroke-width="2"');});
  body+=text(70,25,'预测均值与 ±1σ 噪声范围');
  $('offset').innerHTML=svg(body,640,345,'两个模型在允许共享偏移之后的预测')+'<div class="chart-legend"><span>● 绿色：A</span><span>● 橙色：B 调整后</span><span>○ 灰色：B 调整前</span></div>'+`<div class="step-calculation">b*=${f(z.shift,2)}；调整后 B=(${z.adjusted.map(x=>f(x,2)).join(', ')})<br/>最小 KL=${f(z.sse,2)} / (2×${f(sigma,2)}²)=<b>${f(z.kl)} nat</b></div><p>${n===1?'共享偏移完全消除了这个条件下的预测差异。':'同一个偏移无法同时消除两个条件下的差异。噪声越大，剩余差异越难辨别。'}</p>`;
 }
 wire(['conditions','sigma'],offset);
 function matrix(values,title,x){const m=[[0,values[0],values[1]],[values[0],0,values[2]],[values[1],values[2],0]];let b=text(x+75,28,title,'text-anchor="middle"');for(let i=0;i<3;i++)for(let j=0;j<3;j++){const val=m[i][j],a=Math.min(1,val/6),col=`rgb(${Math.round(247-145*a)},${Math.round(249-75*a)},${Math.round(240-80*a)})`;b+=`<rect x="${x+j*50}" y="${45+i*50}" width="49" height="49" fill="${col}"/>${text(x+j*50+25,75+i*50,f(val,1),'text-anchor="middle"')}`;}for(let i=0;i<3;i++)b+=text(x+25+i*50,216,i+1,'text-anchor="middle"')+text(x-8,75+i*50,i+1,'text-anchor="end"');return b;}
 function rdm(){
  const eta=v('amplitude'),sigma=v('rdmNoise'),z=M.rdm(eta,sigma);
  $('rdm').innerHTML=svg(matrix(z.a,'模型 A',35)+matrix(z.b,'模型 B',245)+matrix(z.data,'一份模拟观测',455),640,235,'三个刺激的预测距离与模拟距离矩阵')+`<div class="metric-row"><p>模型间相关<br/><strong>${z.r===null?'无定义':f(z.r,2)}</strong></p><p>信号方差 / 噪声方差<br/><strong>${f(z.snr,2)}</strong></p></div><p class="small">模拟观测 = A + σ×(0.7,−1.1,0.4)。这是固定的一组示意噪声，不是一次实验的统计结论。信号方差按三个真实距离相对均值的平方偏差取平均，等于 2η²；假定测量噪声方差为 σ²。</p><p>${eta===0?'两模型的所有非对角距离都为 3，预测完全相同。':'相关系数忽略整体平移和正比例缩放，因此不能单独反映绝对差异相对于噪声的大小。'}</p>`;
 }
 wire(['amplitude','rdmNoise'],rdm);
 function pareto(){
  const w=v('weight'),points=M.pareto(w),best=Math.max(...points.map(p=>p.score)),wins=points.filter(p=>Math.abs(p.score-best)<1e-9),x=p=>95+(p-.5)*940,y=p=>300-(p-.5)*510;let body='';
  for(let i=5;i<=10;i++){const t=i/10;body+=line(x(t),45,x(t),300)+text(x(t),324,Math.round(t*100)+'%','text-anchor="middle"');body+=line(95,y(t),565,y(t))+text(82,y(t)+5,Math.round(t*100)+'%','text-anchor="end"');}
  const front=points.filter(p=>!p.dominated).sort((a,b)=>a.x-b.x);body+=`<polyline points="${front.map(p=>`${x(p.x)},${y(p.y)}`).join(' ')}" fill="none" stroke="#216c60" stroke-dasharray="5 5"/>`;
  for(const p of points)body+=dot(x(p.x),y(p.y),p.dominated?'#9baba2':'#216c60',8,wins.includes(p)?'stroke="#b55432" stroke-width="4"':'')+text(x(p.x)+14,y(p.y)-10,p.name);
  body+=text(330,355,'普通刺激上的正确率','text-anchor="middle"')+text(22,170,'争议刺激上的正确率','transform="rotate(-90 22 170)" text-anchor="middle"');
  $('pareto').innerHTML=svg(body,640,375,'普通刺激与争议刺激表现的 Pareto 比较')+table(['模型','普通 / 争议','加权总分','支配关系'],points.map(p=>[p.name,`${pct(p.x)} / ${pct(p.y)}`,pct(p.score),p.dominated?'被其他模型支配':'未被支配']))+`<p>当前总分最高：<strong>${wins.map(p=>p.name).join('、')}</strong>（图中橙框）。C 被支配；A、B、D 均未被支配。虚线仅连接已有模型，不代表存在中间模型。</p>`;
 }
 wire(['weight'],pareto);
})();
