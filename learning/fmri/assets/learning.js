'use strict';
document.querySelectorAll('.knowledge-check').forEach(check=>{
  const choices=[...check.querySelectorAll('[data-option]')];
  choices.forEach(button=>button.addEventListener('click',()=>{
    choices.forEach(b=>{b.setAttribute('aria-pressed',String(b===button));b.classList.remove('correct','retry');});
    const right=Number(button.dataset.option)===Number(check.dataset.correct);
    button.classList.add(right?'correct':'retry');
    check.querySelector('.check-feedback').textContent=(right?'判断正确。':'再想一想。')+check.dataset.explanation;
  }));
});
// One fixed dataset, reused at the opening and conclusion. All values are simulated.
const taskCase={TR:2,N:200,onsets:[40,100,160,220,280,340]};
const caseHRF=t=>t<=0?0:(t/5)**5*Math.exp(5-t);
const caseData=Array.from({length:taskCase.N},(_,n)=>{
  const t=n*2,x=taskCase.onsets.reduce((a,on)=>a+caseHRF(t-on),0);
  const motion=[46,174,254].reduce((a,on)=>a+Math.exp(-(((t-on)/3)**2)),0);
  const noise=.12*Math.sin(2*Math.PI*.177*t)+.08*Math.cos(2*Math.PI*.231*t);
  const warm=n<4?6*.5**n:0;
  return {t,x,motion,drift:t/400,truth:1.2*x,y:100+1.2*x+2.4*t/400+2*motion+noise+warm};
});
function caseOLS(rows){
  const X=rows.map(r=>[1,r.x,r.drift,r.motion]);
  const M=Array.from({length:4},(_,i)=>[...Array.from({length:4},(_,j)=>X.reduce((a,row)=>a+row[i]*row[j],0)),X.reduce((a,row,k)=>a+row[i]*rows[k].y,0)]);
  for(let col=0;col<4;col++){
    let pivot=col;for(let r=col+1;r<4;r++)if(Math.abs(M[r][col])>Math.abs(M[pivot][col]))pivot=r;
    [M[col],M[pivot]]=[M[pivot],M[col]];const divisor=M[col][col];
    if(Math.abs(divisor)<1e-10)throw new Error('教学模型秩不足');
    for(let j=col;j<=4;j++)M[col][j]/=divisor;
    for(let r=0;r<4;r++){if(r===col)continue;const factor=M[r][col];for(let j=col;j<=4;j++)M[r][j]-=factor*M[col][j];}
  }
  return M.map(r=>r[4]);
}
document.querySelectorAll('[data-case-lab]').forEach((lab,index)=>{
  const initial=index===0?'observed':'joint';
  lab.innerHTML=`<div class="case-controls"><label>查看阶段 <select aria-label="贯穿案例的处理阶段"><option value="observed">原始观测 · 200 帧</option><option value="crop">排除初始 4 帧 · 196 帧</option><option value="joint">任务与混杂联合建模</option></select></label><label class="truth-toggle"><input type="checkbox"> 揭示模拟中的目标真值</label></div><div class="case-plot"></div><p class="case-result" role="status"></p><details class="deep-math"><summary>这份模拟数据如何生成与分析</summary><p>y=100+1.2x+2.4d+2m+ε+初始非稳态项。x 为六次事件与峰值约在 5 s 的简化 gamma HRF 叠加；d=t/400；m 为 46、174、254 s 附近的窄脉冲；ε 是两条固定小振幅正弦/余弦之和。TR 为 2 s。</p><p>先排除原始 n=0…3，再用 196 行的 [1,x,d,m] 设计矩阵共同拟合。联合建模图显示 y−â−ĉd−ĝm，保留估计的任务成分及残差；它不是完整 GLM 残差。这里只演示普通最小二乘，没有模拟时间预白化、空间处理或完整的扫描过程。</p><p>绘图时将原始观测减去已知模拟基线 100，便于观察波动。这种显示缩放不等于已经从真实数据估计出基线。</p></details>`;
  const select=lab.querySelector('select'),truth=lab.querySelector('input');select.value=initial;
  function render(){
    const phase=select.value,rows=phase==='observed'?caseData:caseData.slice(4);
    const beta=caseOLS(caseData.slice(4));
    const y=rows.map(r=>[r.t,phase==='joint'?r.y-beta[0]-beta[2]*r.drift-beta[3]*r.motion:r.y-100]);
    const raw=caseData.map(r=>[r.t,r.y-100]);
    lab.querySelector('.case-plot').innerHTML='<div class="case-comparison">'+casePanel(raw,'原始观测（减去模拟基线 100）',false,truth.checked)+casePanel(y,phase==='observed'?'当前：原始观测':phase==='crop'?'当前：排除初始 4 帧':'当前：联合建模后保留的信号',phase!=='observed',truth.checked)+'</div>'+legend([['信号',C.teal],['事件时刻',C.blue],['运动脉冲中心',C.orange],...(truth.checked?[['模拟目标真值（虚线）','#59656c']]:[])])+'<p class="visual-note">两图始终使用相同坐标。浅色区域标出原始 0–8 s；裁剪后的时间 t′=t−8 s，因此原始 40 s 的事件对应 t′=32 s。图中仍按原始时刻对齐，便于比较同一观测。</p>';
    lab.querySelector('.case-result').textContent=phase==='observed'?'原始第 40 s 有事件，46 s 附近还叠加了运动脉冲；单看随后升高的信号，无法把二者分开。':phase==='crop'?'剩余 196 帧。首个保留体积的原始 8 s 现在是 0 s；首个事件移到 32 s。裁剪没有去掉漂移和运动脉冲。':`共同拟合截距、任务、漂移和运动列后，任务系数估计为 ${beta[1].toFixed(3)}，模拟设定为 1.200。小幅扰动仍然存在；这里使用的 HRF 和混杂形状恰好与生成模型一致。`;
  }
  select.addEventListener('change',render);truth.addEventListener('change',render);let compact=innerWidth<600;window.addEventListener('resize',()=>{if(compact!==(innerWidth<600)){compact=innerWidth<600;render();}});render();
});
let closedMath=[];
window.addEventListener('beforeprint',()=>{closedMath=[...document.querySelectorAll('.deep-math,.optional-topic,.source-context')].filter(x=>!x.open);closedMath.forEach(x=>x.open=true);});
window.addEventListener('afterprint',()=>closedMath.forEach(x=>x.open=false));

function casePanel(data,title,cropped,truth){
 const W=innerWidth<600?400:560,X=t=>52+t*(W-84)/400,Y=v=>213-(v+1)*21;
 let s=`<div class="case-panel"><h4>${title}</h4><svg viewBox="0 0 ${W} 270" role="img" aria-label="${title}，固定横轴0到400秒，纵轴负1到7"><rect x="52" y="45" width="${X(8)-X(0)}" height="168" fill="#ead8bd"/>`;
 for(let v=-1;v<=7;v+=2)s+=`<path d="M52 ${Y(v)}H${W-32}" stroke="#e0e7df"/><text x="42" y="${Y(v)+4}" text-anchor="end" class="svg-label">${v}</text>`;
 for(let t=0;t<=400;t+=100)s+=`<text x="${X(t)}" y="234" text-anchor="middle" class="svg-label">${t}</text>`;
 taskCase.onsets.forEach(t=>s+=`<path d="M${X(t)} 45V213" stroke="${C.blue}" stroke-opacity=".25" stroke-dasharray="3 4"/><path d="M${X(t)} 34v9" stroke="${C.blue}" stroke-width="3"/>`);
 [46,174,254].forEach(t=>s+=`<path d="M${X(t)-4} 27l4 -7 4 7Z" fill="${C.orange}"/>`);
 const draw=(data,c,dash=false)=>`<path d="${data.map((p,i)=>(i?'L':'M')+X(p[0]).toFixed(2)+' '+Y(p[1]).toFixed(2)).join(' ')}" fill="none" stroke="${c}" stroke-width="2" ${dash?'stroke-dasharray="5 4"':''}/>`;
 s+=draw(data,C.teal);if(truth)s+=draw((cropped?caseData.slice(4):caseData).map(r=>[r.t,r.truth]),'#59656c',true);
 return s+`<text x="52" y="16" class="svg-label">信号变化 / 任意单位</text><text x="${W-32}" y="257" text-anchor="end" class="svg-label">原始时间 / s</text></svg></div>`;
}
