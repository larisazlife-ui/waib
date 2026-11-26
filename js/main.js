/* Запуск приложения и подключение общего хранилища */
/* ================= ЗАПУСК ================= */
/* В опубликованном артефакте браузер не даёт скачивать файлы: оставляем только копирование JSON */
if(window.claude){const b=document.querySelector("[data-act=exportfile]");if(b)b.hidden=true}
lsLoad();cur=firstId();if(cur)si=firstOpen(products[cur]);renderAll();
(async()=>{const C=window.claude;if(!C||!C.use)return;
 [db,user,sample]=await Promise.all([C.use('db').catch(()=>null),C.use('user').catch(()=>null),C.use('sample').catch(()=>null)]);
 if(user){try{uid=await user.id()}catch(e){}}
 if(sample&&P()&&view==='main')renderStage();
 if(!db)return;
 setSync('Подключение…');const to=setTimeout(()=>setSync('Общее хранилище недоступно — данные могут быть неактуальны'),10000);
 let first=true;
 db.collection('products').onSnapshot(snap=>{if(!snap.metadata.fromCache){clearTimeout(to);setSync('Общий доступ · синхронизировано')}
  const next={};let full=first;
  for(const d of snap.docs){const v=JSON.parse(JSON.stringify(d.data()||{}));const loc=products[d.id];
   if(loc&&!first&&(timers[d.id]||busy[d.id])){next[d.id]=loc;continue}
   if(!v.f||!v.status)continue;v.id=d.id;next[d.id]=v;
   if(d.id===cur&&(!loc||(v._c!==CID&&v._t!==loc._t)))full=true}
  const hadCur=cur&&next[cur];products=next;
  if(first||!hadCur){cur=hadCur?cur:firstId();if(cur)si=firstOpen(products[cur]);first=false;renderAll();return}
  renderSel();if(view!=='main')return;
  if(full){const ae=document.activeElement,aid=ae&&ae.id;renderMain();if(aid){const n=document.getElementById(aid);if(n)n.focus()}}else{renderRoute();renderSide();updateLive()}
 },()=>{clearTimeout(to);setSync('Общее хранилище недоступно')});
})();
