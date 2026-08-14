(()=>{'use strict';
const tg=window.Telegram?.WebApp||null;
const uid=String(tg?.initDataUnsafe?.user?.id||'guest');
const expected=`lw_v5_4_1_local_${uid}`;
const deviceKey='lw_v5_4_3_user_data';
const safeLocal=uid!=='guest'?`lw_v5_4_3_local_${uid}`:'';
const ds=tg?.DeviceStorage||null;
const nativeSet=Storage.prototype.setItem;
const nativeGet=Storage.prototype.getItem;
const nativeRemove=Storage.prototype.removeItem;
let ready=false;

function valid(v){if(!v)return false;try{const x=JSON.parse(v);return !!x&&typeof x==='object'}catch{return false}}
function dsGet(){return new Promise(resolve=>{if(!ds?.getItem)return resolve(null);try{ds.getItem(deviceKey,(err,val)=>resolve(err?null:(val||null)))}catch{resolve(null)}})}
function dsSet(v){if(!ds?.setItem)return;try{ds.setItem(deviceKey,v,()=>{})}catch{}}
function dsRemove(){if(!ds?.removeItem)return;try{ds.removeItem(deviceKey,()=>{})}catch{}}

// Remove keys from the broken V5.4.2 bridge. Never reuse them: they may contain another account's data.
try{nativeRemove.call(localStorage,'lw_v5_4_2_shared');nativeRemove.call(localStorage,'lw_v5_4_1_local_guest')}catch{}

window.LW_STORAGE_READY=(async()=>{
  let value=await dsGet();
  if(!valid(value)&&!ds&&safeLocal){try{const v=nativeGet.call(localStorage,safeLocal);if(valid(v))value=v}catch{}}
  try{nativeRemove.call(localStorage,expected)}catch{}
  if(valid(value)){try{nativeSet.call(localStorage,expected,value)}catch{}}
  ready=true;
  return true;
})();

Storage.prototype.setItem=function(key,value){
  if(this!==localStorage||key!==expected)return nativeSet.call(this,key,value);
  const v=String(value);
  if(!ready)return nativeSet.call(this,key,v);
  if(ds){nativeSet.call(localStorage,expected,v);dsSet(v);return;}
  if(safeLocal){nativeSet.call(localStorage,expected,v);nativeSet.call(localStorage,safeLocal,v);return;}
  // KeyboardButton may not provide user id on old clients. Do not persist shared localStorage in that case.
  try{sessionStorage.setItem('lw_v5_4_3_guest_session',v)}catch{}
};

Storage.prototype.removeItem=function(key){
  if(this!==localStorage||key!==expected)return nativeRemove.call(this,key);
  try{nativeRemove.call(localStorage,expected)}catch{}
  if(ds)dsRemove();
  if(safeLocal)try{nativeRemove.call(localStorage,safeLocal)}catch{}
  try{sessionStorage.removeItem('lw_v5_4_3_guest_session')}catch{}
};
})();
