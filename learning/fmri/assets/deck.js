"use strict";
const $=s=>document.querySelector(s);
const tocPanel=$('#toc'), menu=$('#toc-toggle');
function closeMenu(){document.body.classList.remove('menu-open');menu.setAttribute('aria-expanded','false');$('#shade').hidden=true;}
menu.onclick=()=>{const open=!document.body.classList.contains('menu-open');document.body.classList.toggle('menu-open',open);menu.setAttribute('aria-expanded',String(open));$('#shade').hidden=!open;if(open)$('#search').focus();};
$('#toc-close').onclick=()=>{closeMenu();menu.focus();};$('#shade').onclick=closeMenu;
document.querySelectorAll('#toc a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu();menu.focus();}});
const groups=[...document.querySelectorAll('.toc-group')];
$('#search').addEventListener('input',e=>{const q=e.target.value.trim().toLowerCase();let count=0;groups.forEach(g=>{let visible=0;g.querySelectorAll('.topic-link').forEach(a=>{const section=document.querySelector(a.getAttribute('href'));const match=!q||section.textContent.toLowerCase().includes(q);a.hidden=!match;if(match){visible++;count++;}});g.hidden=visible===0;g.classList.toggle('searching',!!q);});$('#search-status').textContent=q?`找到 ${count} 个相关小节` : '';});
const chapters=[...document.querySelectorAll('main > .chapter')];let scheduled=false;
function updateReading(){scheduled=false;const target=chapters.filter(x=>x.getBoundingClientRect().top<160).at(-1);groups.forEach(g=>{const active=g.querySelector('.chapter-link').hash==='#'+target?.id;g.classList.toggle('active',active);const a=g.querySelector('.chapter-link');if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});const height=document.documentElement.scrollHeight-innerHeight;$('#progress').style.width=(height>0?Math.min(100,100*scrollY/height):100)+'%';}
window.addEventListener('scroll',()=>{if(!scheduled){requestAnimationFrame(updateReading);scheduled=true;}},{passive:true});window.addEventListener('resize',()=>{if(innerWidth>1000)closeMenu();updateReading();});
const quizzes=[...document.querySelectorAll('.quiz')];
function syncAnswers(){const all=quizzes.length>0&&quizzes.every(x=>x.open);$('#answers').textContent=all?'收起练习答案':'展开练习答案';$('#answers').setAttribute('aria-pressed',String(all));}
$('#answers').onclick=()=>{const open=!quizzes.every(x=>x.open);quizzes.forEach(x=>x.open=open);syncAnswers();};quizzes.forEach(q=>q.addEventListener('toggle',syncAnswers));
$('#print').onclick=()=>window.print();let printClosed=[];window.addEventListener('beforeprint',()=>{printClosed=quizzes.filter(x=>!x.open);printClosed.forEach(x=>x.open=true);});window.addEventListener('afterprint',()=>{printClosed.forEach(x=>x.open=false);syncAnswers();});
requestAnimationFrame(updateReading);
// Support links from the earlier paginated edition without hiding any article content.
if(/^#\/\d+$/.test(location.hash)){const n=+location.hash.slice(2);const target=document.getElementById('topic-'+n);history.replaceState(null,'',target?'#topic-'+n:'#top');requestAnimationFrame(()=>target?.scrollIntoView());}

const C={teal:'#00787c',orange:'#bd542c',gray:'#9ba8b0',blue:'#5268aa'};
function lineChart(series,{xmin=0,xmax=10,ymin=0,ymax=20,xlabel='时间',ylabel='信号',markers=false}={}){
 const compact=innerWidth<600,W=compact?400:560,H=compact?240:220,L=48,R=16,T=26,B=39,x=v=>L+(v-xmin)/(xmax-xmin)*(W-L-R),y=v=>H-B-(v-ymin)/(ymax-ymin)*(H-T-B);
 let svg=`<svg class="line-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${ylabel}随${xlabel}变化的教学图"><rect width="${W}" height="${H}" fill="#fffdf7"/>`;
 for(let i=0;i<5;i++){let yy=ymin+(ymax-ymin)*i/4,xx=xmin+(xmax-xmin)*i/4;svg+=`<path d="M${L} ${y(yy)}H${W-R}" stroke="#e3e8e1"/><text x="${L-8}" y="${y(yy)+4}" text-anchor="end" class="svg-label">${Number(yy.toFixed(2))}</text><text x="${x(xx)}" y="${H-19}" text-anchor="middle" class="svg-label">${Number(xx.toFixed(2))}</text>`;}
 svg+=`<text x="${W-R}" y="${H-3}" text-anchor="end" class="svg-label">${xlabel}</text><text x="${L}" y="17" class="svg-label">${ylabel}</text>`;
 series.forEach(s=>{svg+=`<path d="${s.data.map((p,i)=>(i?'L':'M')+x(p[0]).toFixed(2)+' '+y(p[1]).toFixed(2)).join(' ')}" fill="none" stroke="${s.color}" stroke-width="${s.width||2.5}" ${s.dash?'stroke-dasharray="5 4"':''}/>`;if(s.markers||markers)s.data.forEach(p=>svg+=`<circle cx="${x(p[0])}" cy="${y(p[1])}" r="4" fill="${s.color}"/>`);});return svg+'</svg>';
}
function legend(items){return '<div class="legend">'+items.map(([name,c])=>`<span><b style="background:${c}"></b>${name}</span>`).join('')+'</div>'}
function rigidChart(dx,dy,px,py){const X=v=>280+v*23,Y=v=>110-v*23;let s='<svg viewBox="0 0 560 240" role="img" aria-label="等比例坐标中的刚体旋转和平移"><text x="18" y="20" class="svg-label">等比例坐标 · 单位长度不变</text>';for(let k=-4;k<=4;k++){s+=`<path d="M${X(-4)} ${Y(k)}H${X(4)} M${X(k)} ${Y(-4)}V${Y(4)}" stroke="${k===0?'#a3b4ad':'#e0e8df'}"/><text x="${X(k)}" y="218" text-anchor="middle" class="svg-label">${k}</text>`;}s+=`<text x="392" y="115" class="svg-label">x</text><text x="285" y="14" class="svg-label">y</text><path d="M${X(0)} ${Y(0)}L${X(1)} ${Y(0)}" stroke="${C.gray}" stroke-width="4"/><circle cx="${X(1)}" cy="${Y(0)}" r="5" fill="${C.gray}"/><path d="M${X(dx)} ${Y(dy)}L${X(px)} ${Y(py)}" stroke="${C.teal}" stroke-width="4"/><circle cx="${X(dx)}" cy="${Y(dy)}" r="3" fill="${C.teal}"/><circle cx="${X(px)}" cy="${Y(py)}" r="5" fill="${C.teal}"/></svg>`;return s;}
function slider(id,label,min,max,step,value,unit=''){return `<label class="control"><span>${label}</span><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}"><output for="${id}">${value}${unit}</output></label>`}
function initDemo(el,type,controls,draw){const node=el.querySelector('.demo-content');node.innerHTML=controls+'<div class="plot"></div><div class="result" aria-live="polite"></div><button class="reset">重置例子</button>';const inputs=[...node.querySelectorAll('input')],defaults=inputs.map(x=>x.value);function update(){inputs.forEach(x=>x.nextElementSibling.textContent=x.value);draw(node,inputs.map(x=>+x.value));}inputs.forEach(x=>x.addEventListener('input',update));let compact=innerWidth<600;window.addEventListener('resize',()=>{if(compact!==(innerWidth<600)){compact=innerWidth<600;update();}});node.querySelector('.reset').onclick=()=>{inputs.forEach((x,i)=>x.value=defaults[i]);update()};update();}
const seq=(n,f)=>Array.from({length:n},(_,i)=>f(i));
for(const el of document.querySelectorAll('[data-demo]')){
 const type=el.dataset.demo;
 if(type==='combined')initDemo(el,type,slider('drift-a','漂移幅度 a',0,4,.2,2)+slider('motion-b','运动脉冲幅度 b',0,5,.2,3)+slider('strategy','回归方案 0–3',0,3,1,3),(n,[a,b,strategy])=>{const N=200,t=seq(N,i=>i),s=t.map(v=>Math.sin(2*Math.PI*.05*v)),d=t.map(v=>(v-99.5)/100),m=t.map(v=>Math.exp(-(((v-80)/4)**2))),y=s.map((v,i)=>v+a*d[i]+b*m[i]+.25*Math.sin(2*Math.PI*.177*i)+.15*Math.cos(2*Math.PI*.231*i));let cols=[Array(N).fill(1)];if(strategy===1||strategy===3)cols.push(d);if(strategy===2||strategy===3)cols.push(m);let Q=[];for(const col of cols){let q=[...col];for(const basis of Q){const dot=q.reduce((z,v,i)=>z+v*basis[i],0);q=q.map((v,i)=>v-dot*basis[i]);}const norm=Math.hypot(...q);if(norm>1e-9)Q.push(q.map(v=>v/norm));}let e=[...y];for(const q of Q){const dot=y.reduce((z,v,i)=>z+v*q[i],0);e=e.map((v,i)=>v-dot*q[i]);}const rmse=v=>Math.sqrt(v.reduce((z,x,i)=>z+(x-s[i])**2,0)/N);n.querySelector('.plot').innerHTML=lineChart([{data:s.map((v,i)=>[i,v]),color:C.gray,dash:true},{data:y.map((v,i)=>[i,v]),color:C.orange,width:1.3},{data:e.map((v,i)=>[i,v]),color:C.teal}],{xmax:200,ymin:-6,ymax:8,xlabel:'时间 / s',ylabel:'信号 / 任意单位'})+legend([['设定目标',C.gray],['观测',C.orange],['处理后',C.teal]]);n.querySelector('.result').textContent=`方案 ${strategy}；模型秩 ${Q.length}。与真值的 RMSE：处理前 ${rmse(y).toFixed(3)}，处理后 ${rmse(e).toFixed(3)}。残差仍含扰动，部分目标成分也可能被模型移除。`;});
 if(type==='hrf')initDemo(el,type,slider('event-gap','事件间隔 / s',0,20,1,6),(n,[gap])=>{const h=t=>t<=0?0:Math.pow(t/5,5)*Math.exp(5-t);const a=seq(161,i=>[i/4,h(i/4)]),b=seq(161,i=>[i/4,h(i/4-gap)]),total=a.map((p,i)=>[p[0],p[1]+b[i][1]]);n.querySelector('.plot').innerHTML=lineChart([{data:a,color:C.gray,dash:true},{data:b,color:C.orange,dash:true},{data:total,color:C.teal}],{xmax:40,ymax:2.1,xlabel:'时间 / s',ylabel:'响应 / 任意单位'})+legend([['第一次',C.gray],['第二次',C.orange],['叠加',C.teal]]);n.querySelector('.result').textContent=`事件分别在 0 s 与 ${gap} s。使用峰值在 5 s 的简化 gamma 核，无负后波；两次响应线性叠加，峰值为 ${Math.max(...total.map(p=>p[1])).toFixed(2)}。`;});
 if(type==='steady')initDemo(el,type,slider('steady-q','偏差保留比例 q',0.1,0.9,0.05,0.5),(n,[q])=>{const data=seq(11,i=>[i,16*q**i]);n.querySelector('.plot').innerHTML=lineChart([{data,color:C.teal,markers:true}],{xmax:10,ymax:17,xlabel:'重复激发次数 n',ylabel:'与稳态的偏差'});n.querySelector('.result').textContent=`dₙ=16×${q}ⁿ。第 4 次偏差 ${data[4][1].toFixed(2)}，第 8 次 ${data[8][1].toFixed(2)}。q 越接近 1，趋近稳态越慢。`;});
 if(type==='slice-timing')initDemo(el,type,slider('slice-ref','参考偏移 τref / s',0,1.5,.25,1),(n,[ref])=>{n.querySelector('.plot').innerHTML=sliceTiming(ref);n.querySelector('.result').textContent=`TR=2 s；四层偏移分别为 0、1、0.5、1.5 s。以第 n=1 个体积为例，共同目标时刻为 2+${ref}=${(2+ref).toFixed(2)} s。每层从自己的相邻样本估计该时刻；本图用线性插值，实际 STC 可采用其他重建方法。`;});
 if(type==='interp')initDemo(el,type,slider('interp-t','目标时刻 / s',0,2,0.05,0.5),(n,[t])=>{const a=t/2,v=10+2*t;n.querySelector('.plot').innerHTML=lineChart([{data:[[0,10],[2,14]],color:C.teal,markers:true},{data:[[t,8],[t,v]],color:C.orange,dash:true,markers:true}],{xmax:2,ymin:8,ymax:16,xlabel:'时间 / s',ylabel:'信号 / 任意单位'});n.querySelector('.result').textContent=`a=${a.toFixed(3)}；ŷ=(${(1-a).toFixed(3)}×10)+(${a.toFixed(3)}×14)=${v.toFixed(2)}。橙色点是估计值。`;});
 if(type==='rigid')initDemo(el,type,slider('rot','旋转角 θ / °',-180,180,5,90)+slider('dx','平移 dx',-2,2,.1,2)+slider('dy','平移 dy',-2,2,.1,1),(n,[deg,dx,dy])=>{const t=deg*Math.PI/180,x=Math.cos(t)+dx,y=Math.sin(t)+dy;n.querySelector('.plot').innerHTML=rigidChart(dx,dy,x,y)+legend([['原始线段',C.gray],['变换后',C.teal]]);n.querySelector('.result').textContent=`(1,0) → 旋转 (${Math.cos(t).toFixed(2)}, ${Math.sin(t).toFixed(2)}) → 平移 (${x.toFixed(2)}, ${y.toFixed(2)})。线段保持单位长度；变化的是位置与方向。`;});
 if(type==='distort')initDemo(el,type,slider('offres','中心频偏 A / Hz',-40,40,2,20)+slider('bandwidth','带宽 / (Hz/像素)',5,20,1,10),(n,[freq,bw])=>{const d=freq/bw;n.querySelector('.plot').innerHTML=distortionGrid(d)+legend([['无畸变网格',C.gray],['局部位移后的网格',C.orange]]);n.querySelector('.result').textContent=`中心处 Δf=A=${freq} Hz，位移 A/BW=${d.toFixed(2)} 像素；若为 2 mm/像素，即 ${(2*d).toFixed(2)} mm。频偏随位置变化，网格间距因此发生变化。此处规定正频偏沿正相位编码方向，真实方向还需核对采集约定。`;});
 if(type==='smooth')initDemo(el,type,slider('smooth-sigma','核宽 σ / 体素',0,3,0.1,0.8),(n,[sigma])=>{const d=smoothField(sigma);n.querySelector('.plot').innerHTML=smoothVisual(d);n.querySelector('.result').textContent=`FWHM≈${(2.355*sigma).toFixed(2)} 体素。间隙中心 (15,15) 的设定信号为 0，平滑后为 ${d.out[15][15].toFixed(2)}；核越宽，邻近区域越容易混合。使用二维可分离高斯卷积，边缘重新归一化；扰动为固定波形。`;});
 if(type==='regress')initDemo(el,type,slider('reg-slope','尝试斜率 b',0,6,.1,3),(n,[b])=>{const y=[9,9,11,15],c=[-1,0,0,1],fit=c.map(v=>11+b*v),res=y.map((v,i)=>v-fit[i]),sse=res.reduce((a,v)=>a+v*v,0);n.querySelector('.plot').innerHTML=lineChart([{data:y.map((v,i)=>[i+1,v]),color:C.orange,markers:true},{data:fit.map((v,i)=>[i+1,v]),color:C.teal,markers:true}],{xmin:1,xmax:4,ymin:4,ymax:18,xlabel:'时间点',ylabel:'信号 / 任意单位'})+legend([['观测',C.orange],['拟合，截距固定 11',C.teal]]);n.querySelector('.result').textContent=`残差=[${res.map(v=>v.toFixed(1)).join(', ')}]；平方和=${sse.toFixed(2)}。b=3 时平方和最小为 6。试着偏离 3，看误差如何增加。`;});
 if(type==='filter')initDemo(el,type,slider('cutoff','高通截止 / Hz',0,.08,.005,.01),(n,[cut])=>{const f=[.005,.05,.15],amp=[2,1,.5],gain=f.map(v=>v>=cut?1:0),data=seq(401,i=>{const t=i;return [t,f.reduce((s,v,j)=>s+amp[j]*Math.sin(2*Math.PI*v*t),0)]}),out=data.map(([t])=>[t,f.reduce((s,v,j)=>s+gain[j]*amp[j]*Math.sin(2*Math.PI*v*t),0)]);n.querySelector('.plot').innerHTML=lineChart([{data,color:C.gray,width:1.5},{data:out,color:C.teal}],{xmax:400,ymin:-4,ymax:4,xlabel:'时间 / s',ylabel:'信号 / 任意单位'})+frequencyVisual(cut)+legend([['三种频率相加',C.gray],['理想高通输出',C.teal]]);n.querySelector('.result').textContent=`保留：${f.filter((v,i)=>gain[i]).map(v=>v+' Hz').join('、')||'无'}。采用对已知正弦分量直接开关的理想演示，不是实际滤波器；未模拟过渡带、振铃与边缘效应。`;});
 if(type==='coreg')initDemo(el,type,slider('coreg-shift','残余水平偏移 / 像素',-6,6,1,4),(n,[dx])=>{n.querySelector('.plot').innerHTML=coregVisual(dx);n.querySelector('.result').textContent=`残余偏移 ${dx} 像素。${dx===0?'外缘与内部边界重合，灰度差异仍然存在。':'观察橙色边界与背景边界的错开，再将偏移调到 0。'}本例只考察水平位置，不把形状简化等同于真实解剖对应。`;});
 if(type==='qc')initDemo(el,type,slider('qc-rot','旋转变化 / rad',0,.01,.0005,.001)+slider('qc-radius','近似头半径 / mm',30,70,1,50),(n,[rot,r])=>{const fd=.3+r*rot;n.querySelector('.plot').innerHTML=fdBar(r*rot)+legend([['平移绝对变化之和',C.teal],['旋转折算弧长之和',C.orange]]);n.querySelector('.result').textContent=`平移贡献 0.1+0.2=0.30 mm；旋转贡献 ${r}×${rot}=${(r*rot).toFixed(3)} mm；总 FD=${fd.toFixed(3)} mm。横轴是贡献累加后的毫米数，不是时间。`;});
}


function distortionGrid(d){
 const X=x=>280+6*x,Y=y=>140-6*y;
 const warp=(x,y)=>x+d*Math.exp(-(x*x+y*y)/200);
 let svg='<svg viewBox="0 0 560 290" role="img" aria-label="空间变化的频偏导致网格局部拉伸和压缩"><text x="20" y="20" class="svg-label">Δf(x,y)=A·exp[−(x²+y²)/200]；x、y 以像素计</text>';
 for(let v=-18;v<=18;v+=3){
  svg+=`<path d="M${X(v)} ${Y(-18)}V${Y(18)} M${X(-18)} ${Y(v)}H${X(18)}" stroke="${C.gray}" stroke-width="1"/>`;
  for(const vertical of [true,false]){const pts=seq(73,i=>{const u=-18+i/2,x=vertical?v:u,y=vertical?u:v;return [X(warp(x,y)),Y(y)]});svg+=`<path d="${pts.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' ')}" fill="none" stroke="${C.orange}" stroke-width="1.4"/>`;}
 }
 svg+=`<path d="M${X(0)} ${Y(0)}H${X(d)}" stroke="${C.teal}" stroke-width="4"/><circle cx="${X(d)}" cy="${Y(0)}" r="4" fill="${C.teal}"/><text x="20" y="270" class="svg-label">仅沿相位编码方向位移 →；局部间距改变，非整体平移</text></svg>`;
 return svg;
}
function fdBar(rotation){
 const X=v=>48+460*v,fd=.3+rotation;
 let s='<svg viewBox="0 0 560 185" role="img" aria-label="FD由平移贡献和旋转折算贡献相加构成"><text x="48" y="22" class="svg-label">单对相邻帧的 FD 贡献分解</text>';
 s+=`<rect x="48" y="64" width="${460*.3}" height="32" fill="${C.teal}"/><rect x="${X(.3)}" y="64" width="${460*rotation}" height="32" fill="${C.orange}"/><path d="M${X(fd)} 55V105" stroke="#203441"/><text x="${X(fd)}" y="46" text-anchor="middle" class="svg-label">总 FD ${fd.toFixed(3)}</text>`;
 for(let v=0;v<=1.01;v+=.2)s+=`<path d="M${X(v)} 112v5" stroke="#526877"/><text x="${X(v)}" y="137" text-anchor="middle" class="svg-label">${v.toFixed(1)}</text>`;
 return s+'<text x="508" y="165" text-anchor="end" class="svg-label">累计位移 / mm</text></svg>';
}
function sliceTiming(ref){
 const offsets=[0,1,.5,1.5],X=t=>105+t*66,target=2+ref,f=t=>10+2*Math.sin(Math.PI*t/4);
 let s='<svg viewBox="0 0 560 270" role="img" aria-label="四层实际采样时刻与共同参考时刻的估计"><text x="12" y="20" class="svg-label">圆点：实际采集　菱形：共同目标时刻</text>';
 for(let n=0;n<4;n++)s+=`<path d="M${X(n*2)} 34V212" stroke="#c7d1cb" stroke-dasharray="3 4"/><text x="${X(n*2)}" y="235" text-anchor="middle" class="svg-label">${n*2}</text>`;
 s+=`<path d="M${X(target)} 34V212" stroke="${C.orange}" stroke-width="2"/>`;
 offsets.forEach((tau,j)=>{const y=58+j*44,k=Math.floor((target-tau)/2),a=(target-(k*2+tau))/2,v=(1-a)*f(k*2+tau)+a*f((k+1)*2+tau);
 s+=`<text x="8" y="${y+4}" class="svg-label">层 ${j+1} · ${tau} s</text><path d="M105 ${y}H520" stroke="#e0e7df"/>`;
 for(let n=0;n<3;n++)s+=`<circle cx="${X(n*2+tau)}" cy="${y}" r="5" fill="${C.teal}"/>`;
 s+=`<path d="M${X(target)} ${y-7}l6 7 -6 7 -6 -7Z" fill="${C.orange}"/><text x="${X(target)+12}" y="${y-13}" class="svg-label">估计 ${v.toFixed(2)}</text>`;
 });
 return s+'<text x="520" y="259" text-anchor="end" class="svg-label">原始时间 / s；竖虚线间隔为一个 TR</text></svg><p class="visual-note">为单独观察采样时刻的影响，四层都取同一示例函数 y(t)=10+2sin(πt/4)。插值估计可以略有不同；真实脑中各层也不必具有相同信号。</p>';
}
