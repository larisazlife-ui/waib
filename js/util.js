/* Общие помощники: экранирование, числа, форматирование ru-RU */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>{const n=parseFloat(String(v??'').replace(/[\s ]/g,'').replace(',','.'));return isFinite(n)?n:NaN};
const fmt=(n,d=0)=>isFinite(n)?n.toLocaleString('ru-RU',{maximumFractionDigits:d}):'—';
const money=n=>isFinite(n)?fmt(n)+' ₸':'—';
const dt=t=>t?new Date(t).toLocaleString('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'';
const filled=v=>String(v??'').trim()!=='';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const G=(t,ok,v)=>({t,ok:ok===null||ok===undefined?null:!!ok,v});
const has=(...xs)=>xs.every(x=>isFinite(x));
const compAvg=p=>{const a=(p.comps||[]).map(c=>num(c.p)).filter(x=>x>0);return a.length?a.reduce((x,y)=>x+y,0)/a.length:NaN};
const compN=p=>(p.comps||[]).filter(c=>filled(c.n)).length;
const density=n=>n===0?0:n<=2?15:n<=5?10:n<=10?5:2;


/* Разбор таблицы, вставленной из Excel или с сайта: «название | значение».
   Разделители — табуляция, «;» или «|». Берётся последнее число в строке; строки без положительного числа пропускаются. */
function parseComps(text){const rows=[];
 for(const ln of String(text||'').split(/\r?\n/)){const c=ln.split(/\t|;|\|/).map(x=>x.trim()).filter(Boolean);if(c.length<2)continue;
  let v=NaN;for(let i=c.length-1;i>0;i--){v=num(c[i]);if(isFinite(v))break}
  if(isFinite(v)&&v>0)rows.push({n:c[0],p:String(v)})}
 return rows}
