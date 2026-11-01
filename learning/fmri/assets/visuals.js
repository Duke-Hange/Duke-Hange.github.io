'use strict';
// Numerical illustrations: fixed inputs and common scales across comparisons.
function smoothField(sigma){
 const N=31,truth=seq(N,y=>seq(N,x=>y>=9&&y<=21?(x>=10&&x<=13?10:x>=17&&x<=20?6:0):0));
 const raw=truth.map((row,y)=>row.map((v,x)=>v+1.2*Math.sin(x*2.7+y*.9)+.8*Math.cos(y*1.9-x*.4)));
 const kernel=seq(N*2-1,k=>sigma===0?(k===N-1?1:0):Math.exp(-.5*((k-N+1)/sigma)**2));
 const pass=(a,vertical)=>a.map((row,y)=>row.map((_,x)=>{let v=0,w=0;for(let j=0;j<N;j++){const k=kernel[(vertical?y:x)-j+N-1];v+=k*(vertical?a[j][x]:a[y][j]);w+=k;}return v/w;}));
 return {truth,raw,out:pass(pass(raw,false),true),sigma};
}
function fieldColor(v){const a=Math.max(0,Math.min(1,(v+3)/16)),lo=[248,243,229],hi=[0,105,111];return `rgb(${lo.map((c,i)=>Math.round(c+(hi[i]-c)*a)).join(',')})`;}
function fieldPanel(a,title){let s=`<div class="scientific-panel"><h4>${title}</h4><svg viewBox="0 0 190 210" role="img" aria-label="${title}的二维空间图，横纵坐标均为体素索引">`;
 a.forEach((row,y)=>row.forEach((v,x)=>s+=`<rect x="${27+x*5}" y="${15+y*5}" width="5.1" height="5.1" fill="${fieldColor(v)}"/>`));
 s+='<path d="M27 92.5H182" stroke="#b54722" stroke-width="1" stroke-dasharray="3 3"/>';
 for(const v of [0,15,30])s+=`<text x="${29.5+v*5}" y="187" text-anchor="middle" class="svg-label">${v}</text><text x="20" y="${20+v*5}" text-anchor="end" class="svg-label">${v}</text>`;
 return s+'<text x="182" y="205" text-anchor="end" class="svg-label">x / 体素</text><text x="4" y="10" class="svg-label">y</text></svg></div>';
}
function smoothVisual(d){
 const panels='<div class="scientific-panels">'+fieldPanel(d.truth,'设定信号')+fieldPanel(d.raw,'加入固定扰动')+fieldPanel(d.out,'高斯平滑后')+'</div>';
 const colorbar='<div class="field-scale"><span>−3</span><span class="color-ramp"></span><span>13 · 信号单位</span></div>';
 const series=[{data:d.truth[15].map((v,i)=>[i,v]),color:C.gray,dash:true},{data:d.raw[15].map((v,i)=>[i,v]),color:C.orange,width:1.5},{data:d.out[15].map((v,i)=>[i,v]),color:C.teal}];
 return panels+colorbar+'<p class="visual-note">三图共用色标，均表示同一时刻；虚线行 y=15 的数值见下图。两块区域之间原本有 3 个体素的空隙。</p>'+lineChart(series,{xmax:30,ymin:-3,ymax:13,xlabel:'空间位置 x / 体素',ylabel:'y=15 行的信号'})+legend([['设定信号',C.gray],['加入扰动',C.orange],['平滑后',C.teal]]);
}
function phantomLabel(x,y){
 const a=x-23.5,b=y-23.5;
 if((a/18)**2+(b/21)**2>1)return 0;
 if(((a-5)/3)**2+((b+2)/6)**2<=1||((a+5)/3)**2+((b+2)/6)**2<=1)return 3;
 return (a/14)**2+(b/17)**2<=1?2:1;
}
function phantomPanel(dx,title,mode){
 const palette=mode==='epi'?['#f8f6ee','#c8c8c8','#666','#e4e4e4']:['#f8f6ee','#888','#c8c8c8','#333'];
 let s=`<div class="scientific-panel"><h4>${title}</h4><svg viewBox="0 0 190 220" role="img" aria-label="${title}，合成几何模型"><rect x="17" y="12" width="156" height="156" fill="#f8f6ee"/>`;
 for(let y=0;y<48;y++)for(let x=0;x<48;x++){const target=phantomLabel(x,y),moving=phantomLabel(x-dx,y),c=mode==='epi'?moving:target;s+=`<rect x="${17+x*3.25}" y="${12+y*3.25}" width="3.3" height="3.3" fill="${palette[c]}"/>`;}
 if(mode==='overlay')for(let y=1;y<47;y++)for(let x=1;x<47;x++){const m=phantomLabel(x-dx,y);if(m>0&&(m!==phantomLabel(x-dx-1,y)||m!==phantomLabel(x-dx+1,y)||m!==phantomLabel(x-dx,y-1)||m!==phantomLabel(x-dx,y+1)))s+=`<rect x="${17+x*3.25}" y="${12+y*3.25}" width="3.25" height="3.25" fill="${C.orange}"/>`;}
 return s+'<text x="17" y="189" class="svg-label">0</text><text x="170" y="189" text-anchor="end" class="svg-label">47</text><text x="170" y="211" text-anchor="end" class="svg-label">x / 像素</text></svg></div>';
}
function coregVisual(dx){return '<div class="scientific-panels">'+phantomPanel(0,'结构像式对比','t1')+phantomPanel(dx,'功能像式对比','epi')+phantomPanel(dx,'移动图边界叠加','overlay')+'</div><p class="visual-note">同一合成几何模型赋予不同灰度，橙色标出移动图的边界。坐标与像素大小完全一致；这不是实际脑图，也没有模拟 EPI 的分辨率和信号脱落。</p>';}
function frequencyVisual(cut){
 const fs=[.005,.05,.15],amps=[2,1,.5],X=f=>55+f/.16*465,Y=a=>183-a/2.2*140;
 let s='<svg viewBox="0 0 560 245" role="img" aria-label="三个已知正弦分量的滤波前后振幅，横轴为频率"><text x="55" y="19" class="svg-label">已知分量的振幅（非功率谱）</text>';
 s+=`<rect x="55" y="38" width="${X(cut)-55}" height="145" fill="#f3e7d8"/><path d="M${X(cut)} 38V183" stroke="${C.orange}" stroke-dasharray="4 3"/>`;
 for(const a of [0,1,2])s+=`<path d="M55 ${Y(a)}H520" stroke="#dce3df"/><text x="45" y="${Y(a)+4}" text-anchor="end" class="svg-label">${a}</text>`;
 fs.forEach((f,i)=>{const a=amps[i],out=f>=cut?a:0;s+=`<path d="M${X(f)-3} 183V${Y(a)}" stroke="${C.gray}" stroke-width="4"/><path d="M${X(f)+3} 183V${Y(out)}" stroke="${C.teal}" stroke-width="4"/><circle cx="${X(f)+3}" cy="${Y(out)}" r="3" fill="${C.teal}"/><text x="${X(f)}" y="207" text-anchor="middle" class="svg-label">${f}</text>`;});
 return s+'<text x="520" y="232" text-anchor="end" class="svg-label">频率 / Hz</text></svg><p class="visual-note">理想高通响应：H(f)=0（f&lt;截止频率），H(f)=1（f≥截止频率）；输出振幅为 H(f)A。浅色区域是本例的抑制频段，成分位置与时域图使用同一组频率。</p>';
}
