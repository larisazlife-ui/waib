/* Состояние, правила маршрута и хранение */
/* ================= СОСТОЯНИЕ ================= */
const CID=Math.random().toString(36).slice(2,10),LS='product-route-v1';
let db=null,user=null,sample=null,uid=null;
let products={},cur=null,si=0,timers={},busy={},again={},view='main',draft=null;
const P=()=>products[cur];
const T=p=>TPL[p&&p.tpl]||ANNUITY;
/* Продукты по удалённым картам (например, «Производство») остаются в хранилище, но не показываются */
const known=p=>!!(p&&TPL[p.tpl]);
const hiddenCount=()=>Object.values(products).filter(p=>!known(p)).length;
function firstId(){return Object.keys(products).filter(id=>known(products[id])).sort((a,b)=>(products[b].created||0)-(products[a].created||0))[0]||null}
const S=p=>T(p).stages.filter(s=>!(p.skip||[]).includes(s.id));
function blank(tpl,skip,name){const t=TPL[tpl],id='p'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
 return {id,tpl,skip:skip||[],created:Date.now(),f:Object.assign({name:name||'Новый продукт'},t.defaults),checks:{},status:{},by:{},at:{},comment:{},comps:[],ai:{},log:[]}}
function st(p,i){const L=S(p),s=p.status[L[i].id];if(s==='approved')return'ok';if(i>0&&p.status[L[i-1].id]!=='approved')return'lock';return s==='rework'?'rw':'op'}
function firstOpen(p){const L=S(p);for(let i=0;i<L.length;i++)if(p.status[L[i].id]!=='approved')return i;return L.length-1}
const calc=p=>T(p).calc(p);
const gates=p=>T(p).gates(p,calc(p));
/* Чего не хватает для согласования этапа i.
   Каждый пункт: { t: текст, ref: id элемента на странице } или { t, go: номер этапа }. */
function missing(p,i){const L=S(p),s=L[i],m=[];for(const x of s.fields)if(x.r&&!filled(p.f[x.k]))m.push({t:x.l,ref:'f_'+x.k});
 const ch=p.checks[s.id]||[];s.checks.forEach((c,j)=>{if(!ch[j])m.push({t:'☐ '+c,ref:'chk_'+j})});
 if(s.comps&&(p.comps||[]).filter(c=>filled(c.n)&&num(c.p)>0).length<3)m.push({t:'Не менее 3 конкурентов с данными',ref:'comps'});
 if(s.gates)L.slice(0,-1).forEach((x,j)=>{if(p.status[x.id]!=='approved')m.push({t:'Не согласован этап «'+x.name+'»',go:j})});
 return m}

/* Отзыв согласования этапа i: этап и все последующие возвращаются в работу. */
function revokeFrom(p,i){const L=S(p);p.status[L[i].id]='draft';
 for(let j=i+1;j<L.length;j++){const id=L[j].id;if(p.status[id]==='approved')p.status[id]='draft'}}

/* ================= ХРАНЕНИЕ ================= */
function lsSave(){try{localStorage.setItem(LS,JSON.stringify(products))}catch(e){}}
function lsLoad(){try{const v=JSON.parse(localStorage.getItem(LS)||'{}');if(v&&typeof v==='object')products=v}catch(e){}}
function setSync(t){$('#sync').textContent=t}
function touch(p){p._c=CID;p._t=Date.now();clearTimeout(timers[p.id]);timers[p.id]=setTimeout(()=>{timers[p.id]=null;persist(p.id)},600)}
async function persist(id){if(!db){lsSave();return}
 if(busy[id]){again[id]=1;return}busy[id]=1;setSync('Сохранение…');
 try{const p=products[id];if(p)await db.doc('products/'+id).set(JSON.parse(JSON.stringify(p)));setSync('Сохранено · общий доступ')}
 catch(e){setSync(e&&e.code==='invalid_argument'?'Только просмотр: нет прав на изменение':'Ошибка сохранения')}
 busy[id]=0;if(again[id]){again[id]=0;persist(id)}}
function addLog(p,x){p.log=p.log||[];p.log.unshift({t:Date.now(),u:uid||'',x});if(p.log.length>150)p.log.length=150}
async function fillNames(){if(!user)return;const els=[...document.querySelectorAll('[data-uid]')];const ids=[...new Set(els.map(e=>e.dataset.uid).filter(Boolean))];if(!ids.length)return;
 try{const ps=await user.profiles(ids);for(const e of els){const n=ps?.[e.dataset.uid]?.name;if(n)e.textContent=n}}catch(e){}}

