'use strict';
(function(){
 const menu=document.getElementById('menu'),contents=document.getElementById('contents');
 const links=[...contents.querySelectorAll('.toc-link')],groups=[...contents.querySelectorAll('.toc-group')];
 const chapters=[...document.querySelectorAll('.chapter')],topics=[...document.querySelectorAll('.topic')];
 let previousChapter=null,queued=false;
 function mobile(){return window.innerWidth<=960;}
 function syncMenu(){const visible=mobile()?document.body.classList.contains('showmenu'):!document.body.classList.contains('hide-sidebar');menu.setAttribute('aria-expanded',String(visible));menu.textContent=visible?'收起目录':'展开目录';}
 function closeMobile(){if(mobile())document.body.classList.remove('showmenu');syncMenu();}
 menu.addEventListener('click',()=>{document.body.classList.toggle(mobile()?'showmenu':'hide-sidebar');syncMenu();});
 document.getElementById('printArticle').addEventListener('click',()=>window.print());
 contents.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMobile));
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMobile();});
 function highlight(){
  queued=false;let chapter=null,topic=null;
  for(const el of chapters){if(el.getBoundingClientRect().top<=155)chapter=el.id;else break;}
  for(const el of topics){if(el.getBoundingClientRect().top<=155)topic=el;else break;}
  const active=topic&&topic.closest('.chapter').id===chapter?topic.id:chapter;
  groups.forEach(g=>{const yes=g.dataset.chapter===chapter;g.classList.toggle('current-chapter',yes);if(yes&&chapter!==previousChapter)g.open=true;});
  links.forEach(link=>{const yes=link.getAttribute('href')==='#'+active;link.classList.toggle('active',yes);if(yes)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
  previousChapter=chapter;
 }
 window.addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(highlight);}},{passive:true});
 window.addEventListener('resize',()=>{syncMenu();highlight();});
 window.addEventListener('hashchange',()=>requestAnimationFrame(highlight));
 syncMenu();highlight();
})();

// Populate each figure once; subsequent parameter changes remain explicit comparisons.
(function(){
 const jobs=[['simPlot','simulate'],['fitPlot','fit'],['recPlot','recover'],['mrResult','modelRecovery'],['valPlot','validate']];
 function next(){
   const job=jobs.shift();
   if(!job)return;
   if(!document.getElementById(job[0]).innerHTML.trim())actions[job[1]]();
   if(jobs.length)window.setTimeout(next,30);
 }
 window.setTimeout(next,0);
})();
