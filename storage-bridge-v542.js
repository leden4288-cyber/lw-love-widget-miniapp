(()=>{'use strict';
const tg=window.Telegram?.WebApp||null;
const uid=String(tg?.initDataUnsafe?.user?.id||'guest');
const CURRENT=`lw_v5_4_1_local_${uid}`;
const SHARED='lw_v5_4_2_shared';
const DEVICE='lw_v5_4_2_device';
const PREFIX='lw_v5_4_1_local_';
const LEGACY=['lw_v5_4_local','lw_v5_3_local','lw_v5_1_local','lw_v4_local'];
const ds=tg?.DeviceStorage||null;
const originalSet=Storage.prototype.setItem;
const originalRemove=Storage.prototype.removeItem;
let syncing=false;

function parse(v){try{const x=JSON.parse(v);return x&&typeof x==='object'?x:null}catch{return null}}
function score(x){if(!x)return-1;let s=0;if(x.n1)s+=10;if(x.n2)s+=10;if(x.rel)s+=20;if(x.accent)s+=2;if(x.themeId&&x.themeId!=='aura')s+=2;if(Array.isArray(x.events))s+=Math.min(50,x.events.length*3);if(x.av1)s+=30;if(x.av2)s+=30;return s}
function dsGet(){return new Promise(resolve=>{if(!ds?.getItem)return resolve(null);try{ds.getItem(DEVICE,(err,val)=>resolve(err?null:(val||null)))}catch{resolve(null)}})}
function dsSet(value){if(!ds?.setItem||!value)return;try{ds.setItem(DEVICE,value,()=>{})}catch{}}
function localCandidates(){const out=[];const seen=new Set();function add(k){if(!k||seen.has(k))return;seen.add(k);try{const v=localStorage.getItem(k);if(v&&parse(v))out.push({k,v,x:parse(v)})}catch{}}
add(SHARED);add(CURRENT);add(PREFIX+'guest');for(let i=0;i<localStorage.length;i++){try{const k=localStorage.key(i);if(k?.startsWith(PREFIX))add(k)}catch{}}
for(const k of LEGACY)add(k);return out}
function mirror(value){if(!value||syncing)return;syncing=true;try{originalSet.call(localStorage,SHARED,value);originalSet.call(localStorage,CURRENT,value);dsSet(value)}catch{}finally{syncing=false}}

Storage.prototype.setItem=function(key,value){originalSet.call(this,key,value);if(this===localStorage&&(key===SHARED||key.startsWith(PREFIX)))mirror(String(value));};
Storage.prototype.removeItem=function(key){originalRemove.call(this,key);if(this===localStorage&&key===CURRENT){try{originalRemove.call(localStorage,SHARED)}catch{};if(ds?.removeItem)try{ds.removeItem(DEVICE,()=>{})}catch{}}};

window.LW_STORAGE_READY=(async()=>{
  const deviceValue=await dsGet();
  let best=deviceValue&&parse(deviceValue)?{v:deviceValue,x:parse(deviceValue),device:true}:null;
  for(const c of localCandidates())if(!best||score(c.x)>score(best.x))best={v:c.v,x:c.x,device:false};
  if(best?.v)mirror(best.v);
  return true;
})();
})();
