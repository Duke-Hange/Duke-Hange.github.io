'use strict';
// Local, deterministic teaching examples. These do not modify other laboratories.
(function () {
  const $ = id => document.getElementById(id), M = Models;
  const v = id => Number($(id).value), f = (x, n=3) => Number(x).toFixed(n);
  const green = '#216c60', orange = '#b55432', purple = '#6974b2';
  const pct = x => f(x*100,1)+'%';
  function bar(label,x,cls='',value=pct(x),reference=null) {
    return `<div class="pv-bar-row"><span>${label}</span><div class="pv-bar-track"><div class="pv-bar ${cls}" style="width:${x*100}%"></div>${reference===null?'':`<i class="pv-reference" style="left:${reference*100}%"></i>`}</div><strong>${value}</strong></div>`;
  }
  function choices(pa) { return bar('选择A',pa)+bar('选择B',1-pa,'pv-orange'); }
  const svgStart = (label,h=300) => `<div class="pv-chart-scroll"><svg viewBox="0 0 680 ${h}" class="pv-chart" role="img" aria-label="${label}"><title>${label}</title>`;
  const svgEnd = '</svg></div>';
  function lineChart(series,{xmin=0,xmax=12,xlabel='反馈轮次',ylabel='更新后Q(A)',ticks=[0,3,6,9,12],point=null,rewards=null}={}) {
    const X=x=>60+(x-xmin)/(xmax-xmin)*570,Y=y=>235-y*185,legendY=rewards?377:310;
    let out=svgStart(`${ylabel}随${xlabel}的变化。${rewards?'下方反馈与曲线按轮次对齐。':''}`,rewards?395:330);
    for(let i=0;i<=4;i++)out+=`<path d="M60 ${Y(i/4)}H630" stroke="#dce3dc"/><text x="48" y="${Y(i/4)+5}" text-anchor="end">${i/4}</text>`;
    for(const t of ticks)out+=`<text x="${X(t)}" y="257" text-anchor="middle">${t}</text>`;
    out+=`<text x="60" y="25">${ylabel}</text><text x="345" y="281" text-anchor="middle">${xlabel}</text>`;
    series.forEach((s,i)=>{
      const color=s.color||[green,orange,purple][i];
      out+=`<polyline fill="none" stroke="${color}" stroke-width="3" ${s.dash?'stroke-dasharray="7 5"':''} points="${s.values.map(([x,y])=>`${X(x)},${Y(y)}`).join(' ')}"/>`;
      if(s.markers)out+=s.values.map(([x,y])=>`<circle cx="${X(x)}" cy="${Y(y)}" r="3.5" fill="${color}"><title>第${x}轮：Q=${f(y)}</title></circle>`).join('');
      out+=`<path d="M${60+i*285} ${legendY}h25" stroke="${color}" stroke-width="3" ${s.dash?'stroke-dasharray="7 5"':''}/><text x="${92+i*285}" y="${legendY+5}">${s.name}</text>`;
    });
    if(point){out+=`<path d="M${X(0)} 235V50M60 ${Y(.5)}H630" stroke="#bac9bd" stroke-dasharray="3 4"/><path d="M${X(point[0])} 235V${Y(point[1])}H60" fill="none" stroke="${purple}" stroke-dasharray="3 4"/><circle cx="${X(point[0])}" cy="${Y(point[1])}" r="6" fill="${green}" stroke="white" stroke-width="2"/>`;}
    if(rewards){out+='<text x="60" y="306">反馈 r</text>';rewards.forEach((r,i)=>{out+=`<path d="M${X(i+1)} 50V322" stroke="#dce3dc" stroke-dasharray="2 4" opacity=".4"/><circle cx="${X(i+1)}" cy="333" r="11" fill="${r?green:'#fff'}" stroke="${green}"/><text x="${X(i+1)}" y="338" text-anchor="middle" fill="${r?'#fff':green}" font-size="12">${r}</text>`;});}
    return out+svgEnd;
  }
  function overviewValues(a,b){return {q:.4+a*.6,before:M.sigmoid(b*.2),after:M.sigmoid(b*(.4+a*.6-.2))};}
  function alphaOverview(a){
    const q=.4+.6*a,X=x=>64+552*x;
    let out=svgStart('学习率直接控制更新幅度：旧Q固定为0.4，奖励为1，新Q随alpha从0.4移动到1。',285);
    out+=`<text x="64" y="27" font-size="16">α=${f(a,2)}：吸收这次预测误差的${pct(a)}</text><path d="M64 105H616" stroke="#dce3dc" stroke-width="5"/><path d="M${X(.4)} 105H616" stroke="#d0dbd3" stroke-width="13"/><path data-alpha-change="${f(a*.6)}" d="M${X(.4)} 105H${X(q)}" stroke="${green}" stroke-width="13"/>`;
    for(const t of [0,.2,.4,.6,.8,1])out+=`<path d="M${X(t)} 116v5" stroke="#91a99a"/><text x="${X(t)}" y="140" text-anchor="middle">${t}</text>`;
    out+=`<circle cx="${X(.4)}" cy="105" r="6" fill="${orange}"/><circle cx="616" cy="105" r="6" fill="${purple}"/><path d="M${X(q)} 73V94" stroke="${green}" stroke-width="2"/><circle data-new-q="${f(q)}" cx="${X(q)}" cy="105" r="8" fill="${green}" stroke="white" stroke-width="2"/><text x="${X(q)}" y="62" text-anchor="middle" fill="${green}">新Q=${f(q)}</text><text x="${X(.4)}" y="166" text-anchor="middle" fill="${orange}">旧Q=0.4</text><text x="616" y="166" text-anchor="end" fill="${purple}">奖励 r=1</text><text x="64" y="203">更新量 αδ=${f(a*.6)}；灰色剩余段表示未吸收的差异。</text><rect x="64" y="220" width="552" height="14" rx="3" fill="#e3e9e1"/><rect data-alpha-share="${f(a)}" x="64" y="220" width="${552*a}" height="14" rx="3" fill="${green}"/><text x="64" y="266">Q新=0.4+${f(a,2)}×(1−0.4)=${f(q)}</text>`;
    return out+svgEnd;
  }
  function overview(){
    const a=v('pvAlpha'),b=v('pvBeta'),r=overviewValues(a,b);
    $('pvOverview').innerHTML=alphaOverview(a)+`<p class="pv-setting">α控制更新幅度，β控制如何按价值选择（当前β=${f(b,1)}）。</p><div class="pv-pipeline pv-overview">
      <div class="pv-step"><small>① 选择前 · β决定价值的影响</small><h5>用旧Q计算本轮选择概率</h5><div class="step-calculation">p旧(A)=1 / {1+exp[−${f(b,2)}×(0.4−0.2)]}<br>=1 / [1+exp(−${f(b*.2)})]<br>≈ <b>${f(r.before)}</b></div>${choices(r.before)}</div>
      <div class="pv-step"><small>② 得到反馈 · 本轮经历固定</small><h5>选A，得到1分</h5><div class="step-calculation">δ=r−Q旧(A)<br>=1−0.4=<b>0.6</b></div><p>实际奖励高于预期，因此更新方向为正。</p></div>
      <div class="pv-step"><small>③ 更新期待 · α决定吸收比例</small><h5>把α份预测误差加入旧值</h5><div class="step-calculation">变化量=αδ=${f(a,2)}×0.6=${f(a*.6)}<br>Q新(A)=0.4+${f(a*.6)}=<b>${f(r.q)}</b></div><p>未选B：Q新(B)=Q旧(B)=0.2。</p></div>
      <div class="pv-step"><small>④ 下一次选择 · β再次起作用</small><h5>用新Q计算下一次选择概率</h5><div class="step-calculation">p新(A)=1 / {1+exp[−${f(b,2)}×(${f(r.q)}−0.2)]}<br>=1 / [1+exp(−${f(b*(r.q-.2))})]<br>≈ <b>${f(r.after)}</b></div>${choices(r.after)}</div>
      </div><p class="pv-takeaway">${a===0?'α=0，反馈不改变Q。':`α使Q(A)增加${f(a*.6)}。`}${b===0?' β=0，选择始终各为50%。':` 下一次选择A的概率由${pct(r.before)}变为${pct(r.after)}。`}</p>`;
  }
  const envRandom=M.rng(4041), uniforms=Array.from({length:40},()=>envRandom());
  function environment(){
    const mu=v('pvMu'),rewards=uniforms.map(u=>u<mu?1:0),count=rewards.reduce((a,b)=>a+b,0);
    $('pvEnvironment').innerHTML=`<p class="pv-setting">μ=${f(mu,2)} · 40轮期望奖励次数=${f(40*mu,1)} · 本次得到${count}次</p><div class="pv-dots" aria-label="40轮固定随机序列下的奖励记录">${rewards.map((r,i)=>`<span class="pv-dot ${r?'reward':''}" title="第${i+1}轮：${r}分">${r}</span>`).join('')}</div>${bar('设定概率 μ',mu)}${bar('本次奖励比例',count/40,'pv-orange')}<p>绿色条是任务的设定；橙色条是这40轮实际发生的比例。拖动μ时复用同一组随机数，便于看清奖励机会的改变。</p>`;
  }
  function strategies(){
    const b=v('pvBias'),e=v('pvNoise');
    $('pvStrategies').innerHTML=`<div class="pv-pipeline"><div class="pv-step"><h5>M1 · b=${f(b,2)}</h5>${choices(b)}<p>p(A)=b。不管刚才是否得奖，每轮都使用相同概率。</p></div><div class="pv-step"><h5>M2 · ε=${f(e,2)}</h5><div class="pv-branch"><p>遵循规则：1−ε=${pct(1-e)} → A</p><p>随机分支：ε=${pct(e)} → A占${pct(e/2)}，B占${pct(e/2)}</p></div><p>p(A)=(1−ε)+ε/2=${f(1-e/2)}</p>${choices(1-e/2)}</div></div><p class="pv-takeaway">ε是“进入随机分支”的概率；在这个情境中，真正偏离目标动作A的概率只有ε/2=${pct(e/2)}。</p>`;
  }
  function alphaStep(){
    const a=v('learnAlpha'),q=.4+a*.6,X=x=>70+540*x;
    $('pvAlphaStep').innerHTML=svgStart('旧Q为0.4，目标奖励为1，更新后Q位于两者之间；alpha决定移动的比例。',190)+
      `<text x="70" y="25">同一条价值刻度：α=${f(a,2)}，移动${f(a*.6)}</text><path d="M70 95H610" stroke="#b9c9c0" stroke-width="4"/><path d="M${X(.4)} 95H${X(q)}" stroke="${green}" stroke-width="10"/><circle cx="${X(.4)}" cy="95" r="7" fill="${orange}"/><circle cx="610" cy="95" r="7" fill="${purple}"/><circle cx="${X(q)}" cy="95" r="6" fill="${green}" stroke="white" stroke-width="2"/><text x="${X(q)}" y="64" text-anchor="middle" fill="${green}">新Q=${f(q)}</text><text x="70" y="126">0</text><text x="${X(.4)}" y="144" text-anchor="middle">旧Q=0.4</text><text x="610" y="126" text-anchor="end">奖励r=1</text><text x="70" y="178">绿线长短 = α ×（奖励 − 旧Q）</text>`+svgEnd;
  }
  function trajectory(a,rewards){let q=0;return [[0,q],...rewards.map((r,i)=>{q+=a*(r-q);return [i+1,q];})];}
  function learning(){
    const a=v('pvTraceAlpha'),rewards=$('pvFeedback').value==='switch'?[1,1,1,1,1,1,0,0,0,0,0,0]:[1,1,0,1,1,0,1,1,1,0,1,1],tr=trajectory(a,rewards),baseline=trajectory(.1,rewards);
    const qbefore=tr[11][1],r=rewards[11],q=tr[12][1];
    $('pvLearning').innerHTML=`<p class="pv-setting">当前α=${f(a,2)} · 对照α=0.10 · 两条曲线都从Q₀(A)=0开始</p>`+
      lineChart([{name:`当前 α=${f(a,2)}（实线）`,values:tr,markers:true},{name:'对照 α=0.10（虚线）',values:baseline,dash:true}],{rewards})+
      `<p>最后一轮：Q新=${f(qbefore)}+${f(a,2)}×(${r}−${f(qbefore)})=<b>${f(q)}</b>。同一轮对照模型的Q为${f(baseline[12][1])}。</p>`;

  }
  function softVisual(){
    const gap=v('gap'),b=v('temperature'),pa=M.sigmoid(b*gap),xs=Array.from({length:81},(_,i)=>-1+i/40);
    $('pvSoft').innerHTML=choices(pa)+lineChart([
      {name:`当前 β=${f(b,1)}（实线）`,values:xs.map(x=>[x,M.sigmoid(b*x)])},
      {name:'对照 β=1（虚线）',values:xs.map(x=>[x,M.sigmoid(x)]),dash:true}
    ],{xmin:-1,xmax:1,xlabel:'价值差 Q(A)−Q(B)',ylabel:'选择A的概率 p(A)',ticks:[-1,-.5,0,.5,1],point:[gap,pa]})+
      `<p>圆点：当前价值差${f(gap,2)}，p(A)=${pct(pa)}。拖动价值差会沿曲线移动；拖动β会改变曲线的陡峭程度。所有曲线在价值差为0时经过50%。</p>`;
  }
  function kernelValues(a,b){const ca=.4+a*.6,cb=.6*(1-a);return {ca,cb,pa:M.sigmoid(b*(ca-cb))};}
  function kernel(){
    const a=v('pvAC'),b=v('pvBC'),r=kernelValues(a,b);
    $('pvKernel').innerHTML=`<p class="pv-setting">αc=${f(a,2)} · βc=${f(b,1)}</p><div class="pv-pipeline"><div class="pv-step"><h5>更新两份选择痕迹</h5><p>CK新(A)=0.4+${f(a,2)}×(1−0.4)=${f(r.ca)}<br>CK新(B)=0.6+${f(a,2)}×(0−0.6)=${f(r.cb)}</p>${bar('CK新(A)',r.ca,'',f(r.ca),.4)}${bar('CK新(B)',r.cb,'pv-orange',f(r.cb),.6)}<p class="small">细竖线为更新前的痕迹，条长为更新后的痕迹。CK在0至1之间，不要求所有选项的CK之和为1。</p></div><div class="pv-step"><h5>用更新后的痕迹预测下一次</h5><p>CK差=${f(r.ca-r.cb)}<br>p(A)=1/[1+e<sup>−${f(b,1)}×(${f(r.ca-r.cb)})</sup>]</p>${choices(r.pa)}<p class="small">βc=0时，选择不受痕迹影响，两者各为50%。</p></div></div>`;
  }
  function mixValues(b,bc){const reward=b*.4,habit=bc*(-.6),sum=reward+habit;return {reward,habit,sum,pa:M.sigmoid(sum)};}
  function mixed(){
    const b=v('pvMixB'),bc=v('pvMixC'),r=mixValues(b,bc),items=[['价值项 βΔQ',r.reward,green],['痕迹项 βcΔCK',r.habit,orange],['合计分数差',r.sum,purple]];
    let chart=svgStart('价值项指向A，痕迹项指向B，两项相加形成总选择分数差。',260);
    chart+='<text x="180" y="25">负数：偏向B</text><text x="490" y="25">正数：偏向A</text><path d="M390 40V205" stroke="#82978c" stroke-dasharray="4 4"/>';
    items.forEach(([name,x,col],i)=>{const y=55+i*55;chart+=`<text x="10" y="${y+19}">${name}</text><rect x="${390+Math.min(0,x)*42}" y="${y}" width="${Math.abs(x)*42}" height="28" fill="${col}" rx="3"/><text x="650" y="${y+19}" text-anchor="end">${x>0?'+':''}${f(x,2)}</text>`;});
    chart+='<path d="M180 215H600" stroke="#b9c9c0"/><text x="180" y="240">−5</text><text x="390" y="240" text-anchor="middle">0</text><text x="600" y="240" text-anchor="end">+5</text>';
    $('pvMixed').innerHTML=`<p class="pv-setting">β=${f(b,2)} · βc=${f(bc,2)}</p>`+chart+svgEnd+`<p>合计=${f(b,2)}×0.4+${f(bc,2)}×(−0.6)=${f(r.sum)}；p(A)=1/[1+e<sup>−(${f(r.sum)})</sup>]。</p>`+choices(r.pa)+`<p class="pv-takeaway">${Math.abs(r.sum)<1e-10?'两项恰好抵消，所以各选50%。':`两项相加后偏向${r.sum>0?'A':'B'}，其选择概率为${pct(r.sum>0?r.pa:1-r.pa)}。`} 调整βc改变了选择时对痕迹的使用力度，没有直接改变Q或CK本身。</p>`;
  }
  function bicValues(gain){return {one:100+Math.log(100),two:100-2*gain+2*Math.log(100),threshold:Math.log(100)/2};}
  function bic(){
    const gain=v('pvBicGain'),r=bicValues(gain),rows=[['模型1',100,Math.log(100)],['模型2',100-2*gain,2*Math.log(100)]];
    let chart=svgStart('BIC由拟合项2NLL和复杂度惩罚k乘lnT组成，总长度越短越好。',205);
    rows.forEach(([label,fit,pen],i)=>{const y=25+i*65;chart+=`<text x="10" y="${y+24}">${label}</text><rect x="85" y="${y}" width="${fit*4.6}" height="35" fill="${green}"/><rect x="${85+fit*4.6}" y="${y}" width="${pen*4.6}" height="35" fill="${orange}"/><text x="${95+(fit+pen)*4.6}" y="${y+24}">${f(fit+pen,2)}</text>`;});
    chart+='<text x="85" y="160" fill="'+green+'">绿色部分：2NLL（拟合项）</text><text x="355" y="160" fill="'+orange+'">橙色部分：kₘ lnT（惩罚）</text><text x="85" y="190">同一刻度的条长表示BIC；总值越小越受支持。</text>';
    $('pvBic').innerHTML=`<p class="pv-setting">NLL改善 Δ=${f(gain,1)} · 模型2的NLL=${f(50-gain,1)}</p>`+chart+svgEnd+`<p>BIC₂−BIC₁=−2Δ+ln100=${f(r.two-r.one)}。每增加1个参数，拟合项至少要改善ln100≈4.605，也就是NLL的下降需超过约<b>${f(r.threshold)}</b>。</p><p class="pv-takeaway">当前${r.one<r.two?'模型1':r.one>r.two?'模型2':'两模型'}${r.one===r.two?'的BIC相同':'的BIC较低'}。</p>`;
  }
  const groups=[['pvAlpha pvBeta',overview],['pvMu',environment],['pvBias pvNoise',strategies],['learnAlpha',alphaStep],['pvTraceAlpha pvFeedback',learning],['gap temperature',softVisual],['pvAC pvBC',kernel],['pvMixB pvMixC',mixed],['pvBicGain',bic]];
  for(const [ids,fn] of groups){for(const id of ids.split(' '))$(id).addEventListener('input',fn);fn();}
  // Exposed for deterministic equation and wiring checks; no personal data stored.
  globalThis.ParamVisuals={alphaOverview,overview,environment,strategies,alphaStep,learning,softVisual,kernel,mixed,bic,overviewValues,trajectory,kernelValues,mixValues,bicValues};
})();
