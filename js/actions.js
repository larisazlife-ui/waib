/* Действия пользователя и обработчики событий */
/* ================= ДЕЙСТВИЯ ================= */
function openProduct(id){view='main';cur=id;si=firstOpen(products[id]);renderAll()}
function go(i){const p=P();if(!p||i<0||i>=S(p).length)return;si=i;renderRoute();renderStage();window.scrollTo({top:$('#route').getBoundingClientRect().top+scrollY-10,behavior:'smooth'})}
function create(p){products[p.id]=p;addLog(p,'Продукт создан по карте «'+T(p).name+'»');touch(p);openProduct(p.id)}
function demo(tpl){const p=blank(tpl),t=TPL[tpl],done=t.demo(p),now=Date.now();
 done.forEach((id,i)=>{const s=t.stages.find(x=>x.id===id);if(!s||(p.skip||[]).includes(id))return;p.status[id]='approved';p.checks[id]=s.checks.map(()=>true);p.at[id]=now-(done.length-i)*864e5;p.by[id]=uid||''});
 if(tpl==='annuity')p.f.resp_act='Назначенный актуарий';
 p.log=[{t:now,u:uid||'',x:'Пример: согласованы этапы до финансового обоснования включительно'}];products[p.id]=p;touch(p);openProduct(p.id)}

function decide(kind){const p=P(),L=S(p),s=L[si],cm=($('#cmt')?.value||'').trim(),m=$('#miss');
 if(kind==='rework'){if(!cm){m.textContent='Укажите в комментарии, что нужно доработать.';$('#cmt').focus();return}
  p.status[s.id]='rework';p.comment[s.id]=cm;addLog(p,'«'+s.name+'» возвращён на доработку: '+cm)}
 if(kind==='approve'){if(missing(p,si).length)return;
  if(s.gates&&gates(p).some(g=>g.ok===false)&&!cm){m.textContent='Сверка выявила отклонения: опишите в комментарии, почему риск принимается.';$('#cmt').focus();return}
  p.status[s.id]='approved';p.comment[s.id]=cm;p.at[s.id]=Date.now();p.by[s.id]=uid||'';addLog(p,'«'+s.name+'» согласован'+(cm?': '+cm:''))}
 if(kind==='revoke'){revokeFrom(p,si);addLog(p,'Отозвано согласование «'+s.name+'», последующие этапы возвращены в работу')}
 touch(p);if(kind==='approve'&&si<L.length-1)si++;renderMain();renderSel()}

async function runAI(){const p=P(),s=S(p)[si],out=$('#aiout'),b=$('#aibtn');if(!sample)return;
 b.disabled=true;out.textContent='Claude изучает материалы…';
 const prompt=`Ты — ${s.ai}. Контекст: ${T(p).ctx}. Новый продукт проходит маршрут согласования подразделений. Проверь этап «${s.name}» (${s.dept}) с позиции своего подразделения, учитывая данные предыдущих этапов и согласованность всей цепочки.

Данные проекта:
${passportText(p)}

Ответь по-русски простым текстом без markdown, не более 250 слов, тремя разделами: «Оценка», «Риски и пробелы», «Что сделать до согласования». У тебя нет доступа к интернету и актуальным данным: где говоришь о рыночных условиях, нормах права, требованиях регулятора или ставках, помечай это как оценку, требующую проверки специалистом.`;
 try{const r=await sample(prompt,{onText:({text})=>{out.textContent=text},modelTier:'default'});
  p.ai[s.id]={x:r.text,t:Date.now()};addLog(p,'Claude проверил этап «'+s.name+'»');touch(p);renderStage();renderSide()}
 catch(e){out.textContent=e&&e.code==='rate_limited'?'Слишком много запросов — попробуйте через минуту.':e&&e.code==='not_granted'?'Проверка Claude недоступна в этом просмотре.':'Не удалось получить ответ. Попробуйте ещё раз.';if(e&&e.code==='not_granted')sample=null;b.disabled=!sample}}

async function copyPass(){const t=passportText(P()),w=$('#copyw');try{await navigator.clipboard.writeText(t);w.innerHTML='<p class="small">Паспорт скопирован в буфер обмена.</p>'}
 catch(e){w.innerHTML='<textarea id="copyfall" class="i" readonly></textarea>';const ta=$('#copyfall');ta.value=t;ta.select()}}

/* Переход к незаполненному полю из списка недостающего */
function jump(ref){const el=document.getElementById(ref);if(!el)return;
 el.scrollIntoView({block:'center',behavior:'smooth'});
 const f=el.matches('input,select,textarea,button')?el:el.querySelector('input,select,textarea,button');if(f)f.focus({preventScroll:true})}

/* Резервная копия всех продуктов в JSON-файл и загрузка обратно (пока общее хранилище не подключено) */
/* Выгрузка открывает панель с JSON: его можно скопировать (работает везде, в том числе в опубликованном артефакте)
   или скачать файлом (работает при локальном запуске; в артефакте браузер скачивание блокирует). */
const exportText=()=>JSON.stringify({app:'product-route',v:1,at:new Date().toISOString(),products},null,2);
function exportJson(){const ids=Object.keys(products);if(!ids.length){setSync('Нет продуктов для выгрузки');return}
 const box=$('#exportbox'),ta=$('#exporttext');ta.value=exportText();box.hidden=false;$('#exportmsg').textContent='Продуктов в копии: '+ids.length+'. Сохраните текст в файл .json или передайте коллеге.';ta.focus();ta.select()}
async function exportCopy(){const ta=$('#exporttext'),m=$('#exportmsg');
 try{await navigator.clipboard.writeText(ta.value);m.textContent='Скопировано в буфер обмена.'}catch(e){ta.focus();ta.select();m.textContent='Буфер обмена недоступен: текст выделен, скопируйте его сочетанием Ctrl+C.'}}
function exportFile(){const blob=new Blob([$('#exporttext').value],{type:'application/json'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='marshrut-produktov-'+new Date().toISOString().slice(0,10)+'.json';
 document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
 $('#exportmsg').textContent='Если файл не скачался, скопируйте текст кнопкой «Скопировать».'}
function importJson(text){let data;try{data=JSON.parse(text)}catch(e){setSync('Файл не похож на выгрузку приложения');return}
 const src=data&&data.products&&typeof data.products==='object'?data.products:data;let n=0;
 for(const [id,v] of Object.entries(src||{})){if(!v||typeof v!=='object'||!v.f||!v.status||!TPL[v.tpl])continue;
  v.id=id;for(const k of ['skip','comps','log'])if(!Array.isArray(v[k]))v[k]=[];
  for(const k of ['checks','by','at','comment','ai'])if(!v[k]||typeof v[k]!=='object')v[k]={};
  products[id]=v;addLog(v,'Продукт загружен из файла');touch(v);n++}
 if(!n){setSync('В файле не найдено продуктов');return}
 setSync('Загружено продуктов: '+n);if(!cur||!P())cur=firstId();openProduct(cur)}

/* Тестовые данные из js/fixtures.js: повторная загрузка заменяет их свежей копией, устаревшие тестовые продукты удаляются */
function loadFixtures(){const fx=buildFixtures(Date.now()),ids=Object.keys(fx);
 for(const id of Object.keys(products))if(id.startsWith("test-")&&!fx[id]){delete products[id];clearTimeout(timers[id]);if(db)db.doc("products/"+id).delete().catch(()=>{})}
 if(!db)lsSave();
 for(const id of ids){products[id]=fx[id];touch(fx[id])}
 setSync("Загружено тестовых продуктов: "+ids.length);openProduct(ids[0])}

document.addEventListener('click',e=>{const g=e.target.closest('[data-go]');if(g&&!g.disabled){go(+g.dataset.go);return}
 const jm=e.target.closest('[data-jump]');if(jm){jump(jm.dataset.jump);return}
 const a=e.target.closest('[data-act]');if(!a||a.disabled)return;const act=a.dataset.act,p=P();
 if(act==='export'){exportJson();return}
 if(act==='exportcopy'){exportCopy();return}
 if(act==='exportfile'){exportFile();return}
 if(act==='exportclose'){$('#exportbox').hidden=true;return}
 if(act==='importtext'){importJson($('#exporttext').value);$('#exportbox').hidden=true;return}
 if(act==='import'){$('#importfile').click();return}
 if(act==='fixtures'){loadFixtures();return}
 if(act==='new'){view='new';draft={tpl:'annuity',skip:[],name:''};renderAll()}
 else if(act==='cancel'){view='main';renderAll()}
 else if(act==='create'){const nm=($('#nname').value||'').trim();create(blank(draft.tpl,draft.skip,nm||'Новый продукт'))}
 else if(act==='demo')demo(a.dataset.tpl);
 else if(act==='approve'||act==='rework'||act==='revoke')decide(act);
 else if(act==='ai')runAI();else if(act==='copy')copyPass();
 else if(act==='pastecomp'){const b=$('#pastebox');b.hidden=!b.hidden;if(!b.hidden)$('#pastein').focus()}
 else if(act==='importcomp'){const rows=parseComps($('#pastein').value);
  if(!rows.length){$('#pastein').focus();return}p.comps=$('#pastereplace').checked?rows:(p.comps||[]).concat(rows);addLog(p,'Загружено строк рыночных данных: '+rows.length);touch(p);renderStage();renderSide()}
 else if(act==='addcomp'){p.comps=p.comps||[];p.comps.push({n:'',p:''});touch(p);renderStage()}
 else if(act==='delcomp'){p.comps.splice(+a.dataset.i,1);touch(p);renderStage();renderSide()}
 else if(act==='del'){if(a.dataset.sure){const id=p.id;delete products[id];clearTimeout(timers[id]);if(db)db.doc('products/'+id).delete().catch(()=>{});else lsSave();cur=firstId();if(cur)openProduct(cur);else renderAll()}
  else{a.dataset.sure=1;a.textContent='Точно удалить?';a.classList.add('warn');setTimeout(()=>{if(a.isConnected){delete a.dataset.sure;a.textContent='Удалить продукт';a.classList.remove('warn')}},4000)}}});

document.addEventListener('change',e=>{const t=e.target;
 if(t.id==='importfile'){const file=t.files&&t.files[0];if(file)file.text().then(importJson);t.value='';return}
 if(view==='new'&&t.name==='tpl'){draft.tpl=t.value;draft.skip=[];draft.name=$('#nname').value;renderNew();return}
 if(view==='new'&&t.dataset.dep){const id=t.dataset.dep;draft.skip=draft.skip.filter(x=>x!==id);if(!t.checked)draft.skip.push(id);return}});
document.addEventListener('input',e=>{const t=e.target,p=P();if(view!=='main'||!p)return;
 if(t.dataset.k){p.f[t.dataset.k]=t.value}
 else if(t.dataset.chk){const id=S(p)[si].id;p.checks[id]=p.checks[id]||[];p.checks[id][+t.dataset.chk]=t.checked}
 else if(t.dataset.comp){const[i,f]=t.dataset.comp.split(':');p.comps[+i][f]=t.value}
 else if(t.dataset.cmt){updateLive();return}else return;
 touch(p);updateLive();renderSide();if(t.dataset.k==='name')renderSel()});
$('#psel').addEventListener('change',e=>openProduct(e.target.value));

