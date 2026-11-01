'use strict';
(function(root){
const sigmoid=x=>x>=0?1/(1+Math.exp(-x)):Math.exp(x)/(1+Math.exp(x));
function rng(seed=12345){let x=seed>>>0;return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function state(){return {q:[0,0],ck:[0,0],last:null,reward:null};}
function prob(m,p,s){
 if(m==='random')return p.b;
 if(m==='wsls'){if(s.last===null)return .5;const target=s.reward===1?s.last:1-s.last;return target===0?1-p.e/2:p.e/2;}
 const v=m==='ck'?0:p.b*(s.q[0]-s.q[1]);
 const c=m==='ck'?p.b*(s.ck[0]-s.ck[1]):m==='mix'?p.bc*(s.ck[0]-s.ck[1]):0;
 return sigmoid(v+c);
}
function update(s,a,r,p){s.q[a]+=p.a*(r-s.q[a]);s.ck=s.ck.map((v,k)=>v+(p.ac??p.a)*((k===a?1:0)-v));s.last=a;s.reward=r;}
function simulate(m,p,n,random,rev=false){const s=state(),d=[];for(let t=0;t<n;t++){const pa=prob(m,p,s),a=random()<pa?0:1;const mu=rev&&t>=n/2?[.8,.2]:[.2,.8];const r=random()<mu[a]?1:0;d.push({t:t+1,a,r,pa,q:[...s.q]});update(s,a,r,p);}return d;}
function nll(m,p,d){const s=state();let v=0;for(const row of d){const pa=prob(m,p,s),chosen=row.a===0?pa:1-pa;if(chosen<=0)return Infinity;v-=Math.log(chosen);update(s,row.a,row.r,p);}return v;}
function fit(m,d,surface=false){let best={nll:Infinity,p:null},cells=[];
 const check=p=>{const v=nll(m,p,d);if(v<best.nll)best={nll:v,p:{...p}};return v;};
 if(m==='random'){const b=d.filter(x=>x.a===0).length/d.length;check({b,a:0});}
 else if(m==='wsls'){for(let e=0;e<=100;e++)check({e:e/100,a:0});}
 else{for(let bi=0;bi<=32;bi++){const row=[];for(let ai=0;ai<=20;ai++)row.push(check({a:ai/20,b:bi/4}));cells.push(row);}}
 best.k=(m==='rw'||m==='ck')?2:1;best.bic=2*best.nll+best.k*Math.log(d.length);if(surface)best.cells=cells;return best;
}
function bins(data,size){const y=[];for(let i=0;i<data.length;i+=size){const part=data.slice(i,i+size);y.push(part.reduce((s,x)=>s+(x.a===1),0)/part.length);}return y;}
const api={sigmoid,rng,state,prob,update,simulate,nll,fit,bins};root.Models=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
