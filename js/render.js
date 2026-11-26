/* Отрисовка интерфейса */
/* ================= ОТРИСОВКА ================= */
function renderAll(){renderSel();if(view==='new'){renderNew();return}if(!cur||!P()){renderEmpty();return}renderMain()}
function renderSel(){const ids=Object.keys(products).filter(id=>known(products[id])).sort((a,b)=>(products[b].created||0)-(products[a].created||0));
 $('#psel').innerHTML=ids.length?ids.map(id=>`<option value="${esc(id)}"${id===cur?' selected':''}>${esc(products[id].f?.name||'Без названия')}</option>`).join(''):'<option>Нет продуктов</option>';$('#psel').disabled=!ids.length}
function renderEmpty(){$('#app').innerHTML=`<div class="wrap empty"><h1>Проведите новый продукт через все подразделения</h1>
 <p>Выберите технологическую карту компании по страхованию жизни — пенсионный аннуитет, накопительное страхование жизни или ОСНС — и отметьте подразделения, которые участвуют в маршруте. Этап нельзя согласовать, пока не заполнены обязательные данные и не закрыт чек-лист; следующий открывается только после согласования предыдущего. В конце система сверяет продукт с рынком и выпускает паспорт.</p>
 <div class="dec"><button class="btn pri" data-act="new">Создать продукт</button>${Object.values(TPL).map(t=>`<button class="btn" data-act="demo" data-tpl="${t.id}">Пример: ${esc(({annuity:'пенсионный аннуитет',endow:'накопительное страхование',osns:'ОСНС'})[t.id]||t.name)}</button>`).join('')}<button class="btn" data-act="fixtures">Тестовые данные: ${FIXTURES.length} продуктов</button></div>
 ${hiddenCount()?`<p class="small" style="margin-top:16px">Скрыто продуктов по удалённой карте «Производство»: ${hiddenCount()}. Они остаются в выгрузке JSON.</p>`:''}</div>`}

function renderNew(){const t=TPL[draft.tpl];
 $('#app').innerHTML=`<div class="wrap empty" style="max-width:900px"><h1>Новый продукт</h1>
 <h3 class="lbl">1. Технологическая карта</h3><div class="tpls">${Object.values(TPL).map(x=>`<label class="tpl${x.id===draft.tpl?' on':''}"><input type="radio" name="tpl" value="${x.id}"${x.id===draft.tpl?' checked':''}><b>${esc(x.name)}</b><span>${esc(x.sub)}</span><span class="small">${x.stages.length} этапов</span></label>`).join('')}</div>
 <h3 class="lbl">2. Подразделения в маршруте</h3><p class="small" style="margin:0 0 8px">Обязательные подразделения входят всегда. Необязательные можно исключить — маршрут сомкнётся без них.</p>
 <ol class="deps">${t.stages.map(s=>`<li><label><input type="checkbox" data-dep="${s.id}"${s.opt?'':' disabled'}${(draft.skip||[]).includes(s.id)?'':' checked'}><span><b>${esc(s.dept)}</b> — ${esc(s.name)}</span><span class="small">${s.opt?'по выбору':'обязательно'}</span></label></li>`).join('')}</ol>
 <h3 class="lbl">3. Название</h3><input class="i" id="nname" value="${esc(draft.name||'')}" placeholder="Например: Пенсионный аннуитет «Надёжный»" style="max-width:560px">
 <div class="dec"><button class="btn pri" data-act="create">Создать маршрут</button><button class="btn" data-act="cancel">Отмена</button></div></div>`}

const stampSvg='<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function overall(p){const L=S(p);if(p.status.final==='approved')return['Готов к запуску','c-ok'];
 const rw=L.find(s=>p.status[s.id]==='rework');if(rw)return['На доработке: '+rw.name,'c-rw'];
 const i=firstOpen(p);return['Этап '+(i+1)+' из '+L.length+': '+L[i].name,'c-op']}

function renderMain(){const p=P(),L=S(p),c=calc(p),o=overall(p),done=L.filter(s=>p.status[s.id]==='approved').length;
 $('#app').innerHTML=`<section class="hero"><div class="wrap">
  <div><div class="eyebrow">${esc(T(p).name)}</div><h1 id="hname">${esc(p.f.name||'Без названия')}</h1>
   <div class="status"><span class="chip ${o[1]}">${esc(o[0])}</span> &nbsp;Согласовано <b>${done} из ${L.length}</b> этапов</div>
   <div class="prog"><i style="width:${done/L.length*100}%"></i></div></div>
  <div class="score"><div class="n" id="hscore">${fmt(c.score)}</div><div class="l">балл соответствия рынку из 100</div></div>
 </div></section>
 <nav class="wrap"><div class="route" id="route"></div></nav>
 <div class="wrap main"><section id="stage"></section><aside id="side"></aside></div>`;
 renderRoute();renderStage();renderSide()}

function renderRoute(){const p=P();$('#route').innerHTML=S(p).map((s,i)=>{const k=st(p,i);
 return `<button class="st ${k}${i===si?' cur':''}" data-go="${i}" aria-current="${i===si?'step':'false'}" title="${esc(s.dept)}"><span class="seal">${k==='ok'?stampSvg:i+1}</span><span class="nm">${esc(s.name)}</span><span class="dp">${esc(s.dept)}</span></button>`}).join('');
 const el=$('#route .cur');if(el)el.scrollIntoView({block:'nearest',inline:'nearest'})}

function fieldHtml(p,x,ro){const v=p.f[x.k]??'',id='f_'+x.k,lab=`${esc(x.l)}${x.r?' <span class="req">*</span>':''}`,dis=ro?' disabled':'';
 let inp;if(x.t==='area')inp=`<textarea class="i" id="${id}" data-k="${x.k}"${dis}>${esc(v)}</textarea>`;
 else if(x.t==='sel')inp=`<select class="i" id="${id}" data-k="${x.k}"${dis}>${x.o.map(o=>`<option value="${esc(o)}"${o===v?' selected':''}>${o?esc(o):'— выберите —'}</option>`).join('')}</select>`;
 else inp=`<input class="i" id="${id}" data-k="${x.k}" value="${esc(v)}" ${x.t==='num'?'inputmode="decimal"':x.t==='date'?'type="date"':''}${dis}>`;
 return `<label class="f${x.full?' full':''}" for="${id}"><span>${lab}</span>${inp}</label>`}

function renderStage(){const p=P(),L=S(p),s=L[si],k=st(p,si),ro=k==='ok'||k==='lock',ch=p.checks[s.id]||[],ai=p.ai[s.id];
 const chip={ok:['Согласовано','c-ok'],rw:['На доработке','c-rw'],op:['В работе','c-op'],lock:['Ожидает предыдущий этап','c-lk']}[k];
 let h=`<div class="shead"><div><div class="eyebrow">Этап ${si+1} из ${L.length} · ${esc(s.dept)}</div><h2>${esc(s.name)}</h2></div><span class="chip ${chip[1]}">${chip[0]}</span></div>`;
 if(k==='lock')h+=`<p class="note">Этап откроется после согласования этапа «${esc(L[si-1].name)}». Технологическая цепочка соблюдается строго по порядку.</p>`;
 if(k==='ok')h+=`<p class="note">Этап закрыт согласованием. Чтобы изменить данные, отзовите согласование — все последующие этапы вернутся в работу.</p>`;
 if(k==='rw'&&p.comment[s.id])h+=`<p class="note r">Возвращено на доработку: ${esc(p.comment[s.id])}</p>`;
 h+=`<div class="grid">${fieldHtml(p,{k:'resp_'+s.id,l:'Ответственный от подразделения'},ro)}<span></span>${s.fields.map(x=>fieldHtml(p,x,ro)).join('')}</div>`;
 if(s.comps)h+=compsHtml(p,ro);
 if(s.econ)h+=`<div class="blk"><h3>Расчёт экономики</h3><div class="figs" id="econ"></div></div>`;
 if(s.gates)h+=`<div class="blk"><h3>Сверка с рынком и технологической цепочкой</h3><ul class="gates" id="gates"></ul></div>`;
 h+=`<div class="blk"><h3>Чек-лист подразделения</h3><ul class="checks">${s.checks.map((c,j)=>`<li><label><input type="checkbox" id="chk_${j}" data-chk="${j}"${ch[j]?' checked':''}${ro?' disabled':''}>${esc(c)}</label></li>`).join('')}</ul></div>`;
 h+=`<div class="blk ai"><div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between"><div><b>Экспертная проверка Claude</b><div class="meta">Взгляд: ${esc(s.ai)}. Без доступа к интернету — оценки рынка и права нужно перепроверить.</div></div>
  <button class="btn" data-act="ai" id="aibtn"${sample?'':' disabled'}>${ai?'Проверить заново':'Проверить этап'}</button></div>
  <div class="out" id="aiout">${ai?esc(ai.x):'<span class="meta">'+(sample?'Claude проверит данные этапа с учётом предыдущих этапов и укажет риски.':'Станет доступно после подключения проверки Claude к странице.')+'</span>'}</div>${ai?`<div class="meta" style="margin-top:8px">Проверка от ${dt(ai.t)}</div>`:''}</div>`;
 h+=`<div class="blk"><h3>Решение</h3>`;
 if(k==='ok'){h+=`<div class="who">Согласовано ${dt(p.at[s.id])}${p.by[s.id]?` · <span data-uid="${esc(p.by[s.id])}">сотрудник</span>`:''}${p.comment[s.id]?' · '+esc(p.comment[s.id]):''}</div>
  <div class="dec"><button class="btn warn" data-act="revoke">Отозвать согласование</button></div>`}
 else if(k!=='lock'){h+=`<label class="f" for="cmt">Комментарий${s.gates?' (обязателен, если сверка выявила отклонения)':' (обязателен при возврате)'}<textarea class="i" id="cmt" data-cmt="1">${esc(k==='rw'?'':p.comment[s.id]||'')}</textarea></label>
  <div class="dec"><button class="btn pri" data-act="approve" id="apr">Согласовать этап</button><button class="btn warn" data-act="rework">Вернуть на доработку</button></div><div class="miss" id="miss"></div>`}
 h+=`</div>`;
 if(s.gates)h+=passHtml(p);
 h+=`<div class="nav"><button class="btn" data-go="${si-1}"${si===0?' disabled':''}>← Предыдущий</button><button class="btn" data-act="del">Удалить продукт</button><button class="btn" data-go="${si+1}"${si===L.length-1?' disabled':''}>Следующий →</button></div>`;
 $('#stage').innerHTML=h;updateLive();fillNames()}

function compsHtml(p,ro){const cf=T(p).comp,rows=(p.comps||[]).map((c,i)=>`<tr><td><input class="i" aria-label="Название" data-comp="${i}:n" value="${esc(c.n)}"${ro?' disabled':''}></td><td class="num"><input class="i" style="text-align:right" inputmode="decimal" aria-label="${esc(cf.col)}" data-comp="${i}:p" value="${esc(c.p)}"${ro?' disabled':''}></td><td>${ro?'':`<button class="btn" data-act="delcomp" data-i="${i}" aria-label="Удалить">×</button>`}</td></tr>`).join('');
 return `<div class="blk" id="comps" tabindex="-1"><h3>${esc(cf.title)}</h3><table class="stack"><thead><tr><th>Компания / аналог</th><th class="num">${esc(cf.col)}</th><th></th></tr></thead><tbody>${rows||`<tr><td colspan="3" class="small">${esc(cf.hint)}</td></tr>`}</tbody></table>${ro?'':`<div class="dec"><button class="btn" data-act="addcomp">Добавить</button><button class="btn" data-act="pastecomp">Вставить таблицу из Excel</button></div>
 <div id="pastebox" hidden><label class="f" for="pastein" style="margin-top:12px">Скопируйте из Excel или с сайта два столбца — название и значение (${esc(cf.col)}). Строки без числа пропускаются.<textarea class="i" id="pastein" placeholder="КСЖ А&#9;6700&#10;КСЖ Б&#9;7200"></textarea></label>
 <div class="dec"><button class="btn pri" data-act="importcomp">Загрузить строки</button><label class="small" style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="pastereplace" checked style="width:20px;height:20px;accent-color:var(--teal)">Заменить текущий список</label></div></div>`}
 <label class="f" for="f_compSrc" style="margin-top:14px">Источник данных и дата<input class="i" id="f_compSrc" data-k="compSrc" value="${esc(p.f.compSrc||'')}" placeholder="Например: тарифы с сайтов компаний, статистика регулятора на 01.11.2026"${ro?' disabled':''}></label></div>`}

function updateLive(){const p=P(),c=calc(p);
 const e=$('#econ');if(e)e.innerHTML=T(p).figs(c).map(x=>`<div><b>${esc(x[1])}</b><span>${esc(x[0])}</span></div>`).join('');
 const g=$('#gates');if(g)g.innerHTML=gates(p).map(x=>`<li><span class="dot ${x.ok===null?'u':x.ok?'y':'n'}">${x.ok===null?'':x.ok?'✓':'!'}</span><span>${esc(x.t)}</span><span class="v">${esc(x.v)}</span></li>`).join('');
 const m=$('#miss'),a=$('#apr');
 document.querySelectorAll('#stage .need').forEach(x=>x.classList.remove('need'));
 if(m&&a){const ms=missing(p,si);a.disabled=ms.length>0;
  m.innerHTML=ms.length?'Для согласования не хватает:<ul class="misslist">'+ms.map(x=>`<li><button type="button" class="lnk" ${x.go!=null?`data-go="${x.go}"`:`data-jump="${esc(x.ref)}"`}>${esc(x.t)}</button></li>`).join('')+'</ul>':'';
  for(const x of ms){const el=x.ref&&document.getElementById(x.ref);if(el)(el.closest('label.f,.checks li')||el).classList.add('need')}}
 $('#hscore').textContent=fmt(c.score);$('#hname').textContent=p.f.name||'Без названия'}

function renderSide(){const p=P(),c=calc(p),sd=T(p).side(c),gs=gates(p),ok=gs.filter(x=>x.ok).length,bad=gs.filter(x=>x.ok===false).length,L=S(p);
 const kv=a=>'<dl class="kv">'+a.map(x=>`<dt>${esc(x[0])}</dt><dd>${esc(x[1])}</dd>`).join('')+'</dl>';
 $('#side').innerHTML=`<div class="box"><h3>Сверка с рынком</h3>${c.parts.map(x=>`<div class="bar"><span>${x[0]}</span><span class="v">${fmt(x[1],1)} / ${x[2]}</span><span class="t"><i style="width:${x[1]/x[2]*100}%"></i></span></div>`).join('')}<div style="margin-top:14px">${kv(sd.m)}</div></div>
 <div class="box"><h3>Ключевые показатели</h3>${kv(sd.e)}</div>
 <div class="box"><h3>Контрольные точки</h3><p class="small" style="margin:0 0 10px">${ok} выполнено, ${bad} с отклонением, ${gs.length-ok-bad} без данных</p>
  <div class="dec" style="margin-top:0"><button class="btn" data-act="copy">Скопировать паспорт</button><button class="btn" data-go="${L.length-1}">Открыть сверку</button></div><div id="copyw"></div></div>
 <div class="box"><h3>Подразделения</h3><ul class="log">${L.map((s,i)=>`<li>${i+1}. ${esc(s.dept)} <span class="small">· ${({ok:'согласовано',rw:'на доработке',op:'в работе',lock:'ожидает'})[st(p,i)]}</span></li>`).join('')}</ul>${(p.skip||[]).length?`<p class="small">Исключены: ${esc(T(p).stages.filter(s=>p.skip.includes(s.id)).map(s=>s.dept).join(', '))}</p>`:''}</div>
 <div class="box"><h3>Журнал</h3><ul class="log">${(p.log||[]).slice(0,12).map(l=>`<li><time>${dt(l.t)}${l.u?` · <span data-uid="${esc(l.u)}">сотрудник</span>`:''}</time>${esc(l.x)}</li>`).join('')||'<li class="small">Пока пусто</li>'}</ul></div>`;fillNames()}

function passportText(p){const c=calc(p),L=S(p),cf=T(p).comp,out=['ПАСПОРТ ПРОДУКТА: '+(p.f.name||''),'Технологическая карта: '+T(p).name,'Статус: '+overall(p)[0],''];
 L.forEach((s,i)=>{out.push('== '+(i+1)+'. '+s.name+' ('+s.dept+') — '+({ok:'согласовано',rw:'на доработке',op:'в работе',lock:'не начат'}[st(p,i)]));
  if(filled(p.f['resp_'+s.id]))out.push('Ответственный: '+p.f['resp_'+s.id]);
  s.fields.forEach(x=>{if(filled(p.f[x.k]))out.push(x.l+': '+p.f[x.k])});
  if(s.comps)(p.comps||[]).forEach(x=>{if(filled(x.n))out.push(x.n+' — '+cf.col+': '+x.p)});
  if(s.econ)out.push('Расчёт: '+T(p).figs(c).map(x=>x[0]+' '+x[1]).join('; '));
  if(p.comment[s.id])out.push('Комментарий: '+p.comment[s.id]);out.push('')});
 out.push('== Сверка с рынком (балл '+fmt(c.score)+' из 100)');gates(p).forEach(g=>out.push((g.ok===null?'[ ] ':g.ok?'[+] ':'[!] ')+g.t+' — '+g.v));return out.join('\n')}

function passHtml(p){const c=calc(p),ready=p.status.final==='approved';
 const sec=S(p).slice(0,-1).map(s=>{const rows=s.fields.filter(x=>filled(p.f[x.k])).slice(0,4).map(x=>`<p><span class="small">${esc(x.l)}:</span> ${esc(p.f[x.k])}</p>`).join('');return `<h4>${esc(s.dept)} · ${esc(s.name)} · ${p.status[s.id]==='approved'?'согласовано':'не согласовано'}</h4>${rows||'<p class="small">Нет данных</p>'}`}).join('');
 return `<div class="pass"><div class="eyebrow">Паспорт продукта · ${esc(T(p).name)}</div><h3>${esc(p.f.name||'')}</h3>
 <p style="margin-top:8px">Балл рынка ${fmt(c.score)} из 100 · ${esc(T(p).head(c))}</p>
 ${ready?`<div class="stamp">Готов к запуску · ${dt(p.at.final)}</div>`:'<p class="small">Паспорт станет итоговым после финального решения.</p>'}${sec}</div>`}

