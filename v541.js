(()=>{'use strict';
const tg=window.Telegram?.WebApp||null;
const $=id=>document.getElementById(id);
const USER_ID=String(tg?.initDataUnsafe?.user?.id||'guest');
const KEY=`lw_v5_4_1_local_${USER_ID}`;
const LEGACY_KEYS=['lw_v5_4_local','lw_v5_3_local','lw_v5_1_local','lw_v4_local'];
const MAP={love:'aura',ocean:'ice',sunset:'gold',midnight:'noir',berry:'ruby',rose:'ruby'};
const THEMES={
  aura:['Aura','#ff4f9a','#8b5cf6'],noir:['Noir','#d7c4ff','#5f3fc4'],ice:['Ice','#52e7ff','#526dff'],
  ruby:['Ruby','#ff3b6b','#9c1fff'],gold:['Gold','#ffc67a','#d855ff'],emerald:['Emerald','#54ffc2','#0d8d8a']
};
let timer;

function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function toast(text){clearTimeout(timer);$('toast').textContent=text;$('toast').classList.add('show');timer=setTimeout(()=>$('toast').classList.remove('show'),1900);}
function isHex(v){return /^#[0-9a-f]{6}$/i.test(String(v||''));}
function dateParts(v){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v||''));if(!m)return null;const y=+m[1],mo=+m[2],d=+m[3],x=new Date(y,mo-1,d,12);return x.getFullYear()===y&&x.getMonth()===mo-1&&x.getDate()===d?{y,m:mo-1,d}:null;}
function localISO(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function localDate(v){const p=dateParts(v);return p?new Date(p.y,p.m,p.d,12):null;}
function clampDate(y,m,d){return new Date(y,m,Math.min(d,new Date(y,m+1,0,12).getDate()),12);}
function dateToISO(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function fmt(v){const d=localDate(v);return d?d.toLocaleDateString('ru-RU',{day:'2-digit',month:'long',year:'numeric'}):'Дата не настроена';}
function days(v){const a=localDate(v);if(!a)return 0;const b=new Date();b.setHours(12,0,0,0);if(b<a)return 0;return Math.round((b-a)/86400000)+1;}
function breakdown(v){
  const s=localDate(v);if(!s)return[0,0,0];const end=new Date();end.setHours(12,0,0,0);if(end<s)return[0,0,0];
  let years=end.getFullYear()-s.getFullYear();let cursor=clampDate(s.getFullYear()+years,s.getMonth(),s.getDate());
  if(cursor>end){years--;cursor=clampDate(s.getFullYear()+years,s.getMonth(),s.getDate());}
  let months=0;
  while(months<11){const y=cursor.getFullYear()+(cursor.getMonth()===11?1:0),m=cursor.getMonth()===11?0:cursor.getMonth()+1,candidate=clampDate(y,m,s.getDate());if(candidate>end)break;cursor=candidate;months++;}
  return[Math.max(0,years),months,Math.max(0,Math.round((end-cursor)/86400000))];
}
function milestone(v){
  const start=localDate(v);if(!start)return null;const today=new Date();today.setHours(12,0,0,0);const elapsed=days(v);
  const next100=(Math.floor(elapsed/100)+1)*100,hundred=new Date(start);hundred.setDate(hundred.getDate()+next100-1);
  let ann=clampDate(today.getFullYear(),start.getMonth(),start.getDate());if(ann<=today)ann=clampDate(today.getFullYear()+1,start.getMonth(),start.getDate());
  const target=hundred<ann?hundred:ann,label=hundred<ann?`${next100} дней`:'годовщина';
  return{label,date:target,left:Math.max(0,Math.round((target-today)/86400000))};
}
function sanitize(raw){
  const x=raw&&typeof raw==='object'?raw:{};let themeId=MAP[x.themeId]||x.themeId||'aura';if(!THEMES[themeId])themeId='aura';
  const out={themeId,events:[]};
  if(typeof x.n1==='string')out.n1=x.n1.trim().slice(0,24);if(typeof x.n2==='string')out.n2=x.n2.trim().slice(0,24);
  if(dateParts(x.rel)&&String(x.rel)<=localISO())out.rel=String(x.rel);
  if(isHex(x.accent))out.accent=String(x.accent);
  for(const key of ['av1','av2'])if(typeof x[key]==='string'&&x[key].startsWith('data:image/')&&x[key].length<2_000_000)out[key]=x[key];
  if(Array.isArray(x.events))out.events=x.events.slice(0,80).map(e=>({title:String(e?.title||'').trim().slice(0,40),event_date:String(e?.event_date||'')})).filter(e=>e.title&&dateParts(e.event_date));
  return out;
}
function readJSON(key){try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}}
function writeStorage(value,quiet=false){try{localStorage.setItem(KEY,JSON.stringify(value));return true;}catch(e){console.warn('LW storage',e);if(!quiet)toast('Не хватает памяти Mini App. Уменьши фото или сделай экспорт.');return false;}}
function load(){
  const own=readJSON(KEY);if(own)return sanitize(own);
  for(const key of LEGACY_KEYS){const old=readJSON(key);if(!old)continue;const migrated=sanitize(old);if(writeStorage(migrated,true)&&USER_ID!=='guest'){try{localStorage.removeItem(key);}catch{}}return migrated;}
  return{themeId:'aura',events:[]};
}
let L=load();
function save(){return writeStorage(L);}
function theme(st={}){let id=MAP[st.themeId]||st.themeId||MAP[L.themeId]||L.themeId||'aura';if(!THEMES[id])id='aura';const t=THEMES[id],a=isHex(st.accent)?st.accent:(isHex(L.accent)?L.accent:t[1]),b=t[2];document.documentElement.style.setProperty('--a',a);document.documentElement.style.setProperty('--b',b);L.themeId=id;L.accent=a;$('accent').value=a;document.querySelectorAll('.theme').forEach(x=>x.classList.toggle('on',x.dataset.id===id));}
function avatar(el,data){el.style.backgroundImage=data?`url(${data})`:'';el.textContent=data?'':'♡';}
function renderEvents(){const list=L.events||[];$('empty').style.display=list.length?'none':'block';$('events').innerHTML=list.map((e,i)=>`<div class="event"><div class="eventIcon">✦</div><div><b>${esc(e.title)}</b><small>${esc(fmt(e.event_date))}</small></div><button class="del" data-i="${i}">×</button></div>`).join('');document.querySelectorAll('.del').forEach(x=>x.onclick=()=>{L.events.splice(Number(x.dataset.i),1);save();renderEvents();toast('Событие удалено');});}
function render(){const me=tg?.initDataUnsafe?.user?.first_name||'Ты',n1=L.n1||me,n2=L.n2||'Половинка',rel=L.rel||'';$('p1').textContent=n1;$('p2').textContent=n2;$('names').textContent=n1+' × '+n2;$('date').textContent=fmt(rel);$('n1').value=n1;$('n2').value=n2;$('rel').value=rel;$('days').textContent=days(rel);const b=breakdown(rel);$('years').textContent=b[0];$('months').textContent=b[1];$('remain').textContent=b[2];const ms=milestone(rel);if(ms){$('mt').textContent=ms.label;$('mb').textContent=ms.left+' дн.';$('md').textContent=fmt(dateToISO(ms.date));$('prog').style.width=Math.max(5,100-Math.min(100,ms.left/3.65))+'%';}else{$('mt').textContent='Добавьте дату';$('mb').textContent='—';$('md').textContent='LW покажет ближайшую красивую отметку.';$('prog').style.width='0%';}avatar($('av1'),L.av1);avatar($('av2'),L.av2);theme();renderEvents();}
function open(tab='profile'){$('sheet').classList.add('open');switchTab(tab);}
function switchTab(tab){document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('on',x.dataset.tab===tab));document.querySelectorAll('.pane').forEach(x=>x.classList.toggle('on',x.id===(tab==='events'?'eventsPane':tab)));}
function imageData(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=reject;reader.onload=()=>{const img=new Image();img.onerror=reject;img.onload=()=>{const scale=Math.min(1,900/Math.max(img.width,img.height)),w=Math.max(1,Math.round(img.width*scale)),h=Math.max(1,Math.round(img.height*scale)),canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,w,h);let data=canvas.toDataURL('image/webp',.82);if(data.length>1_500_000)data=canvas.toDataURL('image/jpeg',.68);resolve(data);};img.src=String(reader.result);};reader.readAsDataURL(file);});}
async function pick(file,key){if(!file)return;if(!file.type.startsWith('image/'))return toast('Выбери изображение');if(file.size>8*1024*1024)return toast('Исходное фото должно быть до 8 МБ');try{const data=await imageData(file);if(data.length>1_900_000)return toast('Фото слишком большое даже после сжатия');const prev=L[key];L[key]=data;if(!save()){L[key]=prev;return;}render();toast('Фото сохранено');}catch{toast('Не удалось обработать фото');}}
function buildThemes(){$('themes').innerHTML=Object.entries(THEMES).map(([id,t])=>`<button class="theme" data-id="${id}" style="background:linear-gradient(135deg,${t[1]},${t[2]})">${t[0]}</button>`).join('');document.querySelectorAll('.theme').forEach(x=>x.onclick=()=>{L.themeId=x.dataset.id;theme({themeId:L.themeId});save();});}
function bind(){
  document.querySelectorAll('.tab').forEach(x=>x.onclick=()=>switchTab(x.dataset.tab));
  document.querySelectorAll('[data-nav]').forEach(x=>x.onclick=()=>{document.querySelectorAll('[data-nav]').forEach(y=>y.classList.toggle('on',y===x));if(x.dataset.nav==='home')scrollTo({top:0,behavior:'smooth'});else open(x.dataset.nav);});
  $('close').onclick=()=>$('sheet').classList.remove('open');$('sheet').onclick=e=>{if(e.target===$('sheet'))$('sheet').classList.remove('open');};$('quick').onclick=()=>open('events');
  $('av1').onclick=()=>$('av1f').click();$('av2').onclick=()=>$('av2f').click();$('av1f').onchange=e=>pick(e.target.files[0],'av1');$('av2f').onchange=e=>pick(e.target.files[0],'av2');
  $('saveP').onclick=()=>{const rel=$('rel').value;if(rel&&(!dateParts(rel)||rel>localISO()))return toast('Проверь дату начала');const prev={...L};L.n1=$('n1').value.trim().slice(0,24);L.n2=$('n2').value.trim().slice(0,24);if(rel)L.rel=rel;else delete L.rel;if(!save()){L=prev;return;}render();toast('Сохранено на устройстве');};
  $('addE').onclick=()=>{const title=$('et').value.trim().slice(0,40),event_date=$('ed').value;if(!title||!dateParts(event_date))return toast('Заполни название и дату');if((L.events||[]).length>=80)return toast('Лимит 80 событий');L.events=L.events||[];L.events.push({title,event_date});if(!save()){L.events.pop();return;}$('et').value='';renderEvents();toast('Событие добавлено');};
  $('accent').oninput=()=>theme({themeId:L.themeId,accent:$('accent').value});$('saveS').onclick=()=>{L.accent=$('accent').value;if(save()){theme();toast('Стиль сохранён');}};
  $('reset').onclick=()=>{L={themeId:'aura',events:[]};writeStorage(L);render();toast('Локальные данные сброшены');};
  $('export').onclick=()=>{const blob=new Blob([JSON.stringify({version:'5.4.1',user_id:USER_ID,local:L},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='lw-local-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),800);};
  $('import').onclick=()=>$('imp').click();$('imp').onchange=async e=>{try{const f=e.target.files[0];if(!f||f.size>8*1024*1024)throw 0;const d=JSON.parse(await f.text()),src=sanitize(d.local||d),prev=L;L=src;if(!save()){L=prev;return;}render();toast('Импортировано');}catch{toast('Некорректный JSON');}finally{e.target.value='';}};
  $('share').onclick=()=>{const d=days(L.rel||''),url=location.origin+location.pathname,text=L.rel?`💗 Сейчас идёт ${d}-й день нашей истории — LW`:'💗 LW — Love Widget';try{if(tg?.openTelegramLink)return tg.openTelegramLink('https://t.me/share/url?url='+encodeURIComponent(url)+'&text='+encodeURIComponent(text));}catch{}if(navigator.share)navigator.share({title:'LW — Love Widget',text,url}).catch(()=>{});};
}
function init(){try{tg?.ready();tg?.expand();tg?.disableVerticalSwipes?.();tg?.setHeaderColor?.('#07060d');tg?.setBackgroundColor?.('#07060d');}catch{}$('rel').max=localISO();buildThemes();bind();render();}
init();
})();