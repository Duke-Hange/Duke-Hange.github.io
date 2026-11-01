'use strict';
(function(root){
 const h=p=>p<=0||p>=1?0:-p*Math.log2(p)-(1-p)*Math.log2(1-p);
 const q=(x,e=0)=>(1-e)/(1+Math.exp(-Math.log(9)*x))+e/2;
 function evidence(prior,a,b){
  const py=prior*a+(1-prior)*b;
  const yes=py>0?prior*a/py:prior;
  const no=py<1?prior*(1-a)/(1-py):prior;
  const before=h(prior),after=py*h(yes)+(1-py)*h(no);
  return {py,yes,no,before,after,eig:Math.max(0,before-after)};
 }
 function search(d,lambda){
  const points=[];
  for(const t of [-1,-.5,0,.5,1])for(const s of [-1,-.5,0,.5,1]){
   const gain=evidence(.5,q(s),q(t)).eig,cost=(s-t)**2/4;
   points.push({s,t,gain,cost,u:gain-lambda*cost,allowed:Math.abs(s-t)<=d+1e-9});
  }
  const best=Math.max(...points.filter(p=>p.allowed).map(p=>p.u));
  return {points,best,winners:points.filter(p=>p.allowed&&Math.abs(p.u-best)<1e-9)};
 }
 function offset(n,sigma){const a=[0,1].slice(0,n),b=[1,0].slice(0,n),shift=a.reduce((z,v,i)=>z+v-b[i],0)/n,adjusted=b.map(v=>v+shift),sse=a.reduce((z,v,i)=>z+(v-adjusted[i])**2,0);return {a,b,shift,adjusted,sse,kl:sse/(2*sigma*sigma)};}
 function corr(a,b){const mean=x=>x.reduce((s,v)=>s+v,0)/x.length,am=mean(a),bm=mean(b),da=a.map(v=>v-am),db=b.map(v=>v-bm),den=Math.sqrt(da.reduce((s,v)=>s+v*v,0)*db.reduce((s,v)=>s+v*v,0));return den<1e-14?null:da.reduce((s,v,i)=>s+v*db[i],0)/den;}
 function rdm(eta,sigma){const a=[-1,2,-1].map(v=>3+eta*v),b=[2,-1,-1].map(v=>3+eta*v),z=[.7,-1.1,.4],data=a.map((v,i)=>v+sigma*z[i]);return {a,b,data,r:corr(a,b),snr:2*eta*eta/(sigma*sigma)};}
 const models=[{name:'A',x:.92,y:.60},{name:'B',x:.78,y:.88},{name:'C',x:.70,y:.55},{name:'D',x:.85,y:.72}];
 function pareto(w){return models.map(m=>({...m,score:w*m.x+(1-w)*m.y,dominated:models.some(n=>n.x>=m.x&&n.y>=m.y&&(n.x>m.x||n.y>m.y))}));}
 const api={h,q,evidence,search,offset,corr,rdm,pareto};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Lesson=api;
})(typeof window!=='undefined'?window:globalThis);
