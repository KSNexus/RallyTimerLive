import {db,doc,setDoc,deleteDoc,onSnapshot,collection,serverTimestamp,autoFormatMmSs,setupUI,setThemeFromSwitch,ADMIN_PIN,RALLY_BASE_SECONDS,parseMmSsToSeconds,makeId,colorForId,countdownText,getRallyCountdownSeconds,getEnemyMarchCountdownSeconds,getPhaseFromRally,isExpiredRally,esc} from './shared.js';

window.setThemeFromSwitch=setThemeFromSwitch;
setupUI();

let profiles={};
let activeRallies={};
let players={};
let sentRallies={};
let autoDeleteBusy=false;

autoFormatMmSs(document.getElementById('profileMarchTime'));

window.unlockAdmin=()=>{
  const pin=(document.getElementById('adminPin').value||'').trim().toUpperCase();
  if(pin!==ADMIN_PIN){alert('Incorrect PIN.');return;}
  sessionStorage.setItem('adminUnlocked','yes');
  document.getElementById('lockScreen').classList.add('hidden');
  document.getElementById('adminApp').classList.remove('hidden');
  renderAll();
};

window.lockAdmin=()=>{
  sessionStorage.removeItem('adminUnlocked');
  location.reload();
};

window.saveProfile=async()=>{
  const name=document.getElementById('profileName').value.trim();
  const enemyMarchTime=document.getElementById('profileMarchTime').value.trim();
  const enemyMarchSeconds=parseMmSsToSeconds(enemyMarchTime);
  if(!name){alert('Enter rally name.');return;}
  if(enemyMarchSeconds===null){alert('Enter enemy march time as MM:SS.');return;}

  const id=name.toUpperCase().replace(/[^A-Z0-9_-]/g,'_')||makeId('PROFILE');
  const existing=profiles[id]||{};
  const color=existing.color||colorForId(id);

  await setDoc(doc(db,'rallyProfiles',id),{
    id,name,enemyMarchTime,enemyMarchSeconds,color,updatedAt:serverTimestamp()
  },{merge:true});

  document.getElementById('profileName').value='';
  document.getElementById('profileMarchTime').value='';
};

window.deleteProfile=async(id)=>{
  if(!confirm('Delete this rally profile?'))return;
  await deleteDoc(doc(db,'rallyProfiles',id));
};

window.createActiveRally=async(id)=>{
  const p=profiles[id];
  if(!p)return;

  const rallyId=makeId('ACTIVE');
  const now=Date.now();
  const color=p.color||colorForId(id);
  const rallyEndMs=now+(RALLY_BASE_SECONDS*1000);
  const enemyHitEndMs=rallyEndMs+(Number(p.enemyMarchSeconds||0)*1000);

  await setDoc(doc(db,'activeRallies',rallyId),{
    id:rallyId,
    profileId:id,
    name:p.name,
    enemyMarchTime:p.enemyMarchTime,
    enemyMarchSeconds:Number(p.enemyMarchSeconds||0),
    color,
    rallyEndMs,
    enemyHitEndMs,
    createdMs:now,
    sent:false,
    createdAt:serverTimestamp()
  });
};

window.adjustActiveRally=async(id,delta)=>{
  const r=activeRallies[id];
  if(!r)return;
  const now=Date.now();
  if(getPhaseFromRally(r,now)==='march')return;

  const newRallyEndMs=Number(r.rallyEndMs||Date.now())+(Number(delta)*1000);
  const enemyHitEndMs=newRallyEndMs+(Number(r.enemyMarchSeconds||0)*1000);

  await setDoc(doc(db,'activeRallies',id),{rallyEndMs:newRallyEndMs,enemyHitEndMs,updatedAt:serverTimestamp()},{merge:true});
  if(sentRallies[id])await setDoc(doc(db,'sentRallies',id),{rallyEndMs:newRallyEndMs,enemyHitEndMs,updatedAt:serverTimestamp()},{merge:true});
};

window.sendToPlayers=async(id)=>{
  const r=activeRallies[id];
  if(!r)return;

  const now=Date.now();
  const rallyCountdownSeconds=Math.max(0,getRallyCountdownSeconds(r,now));
  const enemyMarchSeconds=Number(r.enemyMarchSeconds||0);
  const enemyHitEndMs=Number(r.rallyEndMs)+(enemyMarchSeconds*1000);

  await setDoc(doc(db,'sentRallies',id),{
    sourceRallyId:id,
    profileId:r.profileId||'',
    name:r.name,
    color:r.color||colorForId(r.profileId||id),
    rallyEndMs:Number(r.rallyEndMs),
    rallyCountdownSecondsAtSend:rallyCountdownSeconds,
    enemyMarchSeconds,
    enemyHitEndMs,
    sentAtMs:now,
    createdAt:serverTimestamp()
  },{merge:true});

  await setDoc(doc(db,'activeRallies',id),{sent:true,sentAtMs:now,updatedAt:serverTimestamp()},{merge:true});
};

window.deleteActiveRally=async(id)=>{
  if(!confirm('Delete this active rally?'))return;
  await deleteDoc(doc(db,'activeRallies',id));
  await deleteDoc(doc(db,'sentRallies',id));
};

window.deletePlayer=async(id)=>{
  if(!confirm('Delete this player?'))return;
  await deleteDoc(doc(db,'players',id));
};


let holdAdjustTimer=null;
let holdAdjustDelay=null;

function clearHoldAdjust(){
  if(holdAdjustDelay){clearTimeout(holdAdjustDelay);holdAdjustDelay=null;}
  if(holdAdjustTimer){clearInterval(holdAdjustTimer);holdAdjustTimer=null;}
}

window.startHoldAdjust=(id,delta)=>{
  clearHoldAdjust();
  adjustActiveRally(id,delta);
  holdAdjustDelay=setTimeout(()=>{
    holdAdjustTimer=setInterval(()=>adjustActiveRally(id,delta),100);
  },500);
};

window.stopHoldAdjust=clearHoldAdjust;

function renderProfiles(){
  const el=document.getElementById('profileList');
  if(!el)return;
  const rows=Object.entries(profiles).sort((a,b)=>(a[1].name||'').localeCompare(b[1].name||'')).map(([id,p])=>{
    const color=p.color||colorForId(id);
    return `<div class="profile-row" style="color:${color}">
      <div>
        <div class="rally-name">${esc(p.name)}</div>
        <div class="profile-meta">Enemy March: ${esc(p.enemyMarchTime||'--:--')}</div>
      </div>
      <button class="good small" onclick="createActiveRally('${id}')">GO</button>
      <button class="danger small" onclick="deleteProfile('${id}')">Delete</button>
    </div>`;
  });
  el.innerHTML=rows.join('')||`<div class="empty-state">No rally profiles.</div>`;
}

function renderActiveRallies(){
  const el=document.getElementById('activeRallyList');
  if(!el)return;
  const now=Date.now();

  const rows=Object.entries(activeRallies).map(([id,r])=>({id,...r})).filter(r=>!isExpiredRally(r,now)).sort((a,b)=>Number(a.enemyHitEndMs)-Number(b.enemyHitEndMs)).map(r=>{
    const color=r.color||colorForId(r.profileId||r.id);
    const rallySec=Math.max(0,getRallyCountdownSeconds(r,now));
    const marchSec=Math.max(0,getEnemyMarchCountdownSeconds(r,now));
    const locked=getPhaseFromRally(r,now)==='march';
    const disabled=locked?'disabled':'';
    const disabledClass=locked?' disabled-btn':'';

    return `<div class="active-instance" style="color:${color}">
      <div class="instance-head admin-phase-head">
        <div>
          <div class="instance-name">${esc(r.name)}</div>
          ${r.sent?'<span class="badge">Sent to players</span>':''}
        </div>
        <div class="admin-timer-pair">
          <div class="admin-timer-box">
            <div class="timer-label">Rally</div>
            <div class="instance-timer" style="color:${color}">${countdownText(rallySec)}</div>
          </div>
          <div class="admin-timer-box">
            <div class="timer-label">March</div>
            <div class="instance-timer" style="color:${color}">${countdownText(marchSec)}</div>
          </div>
        </div>
      </div>
      <div class="instance-controls">
        <button class="secondary${disabledClass}" ${disabled} onpointerdown="startHoldAdjust('${r.id}',-1)" onpointerup="stopHoldAdjust()" onpointercancel="stopHoldAdjust()" onpointerleave="stopHoldAdjust()">-1</button>
        <button class="secondary${disabledClass}" ${disabled} onpointerdown="startHoldAdjust('${r.id}',1)" onpointerup="stopHoldAdjust()" onpointercancel="stopHoldAdjust()" onpointerleave="stopHoldAdjust()">+1</button>
        <button class="good" onclick="sendToPlayers('${r.id}')">Send</button>
        <button class="danger" onclick="deleteActiveRally('${r.id}')">Delete</button>
      </div>
    </div>`;
  });
  el.innerHTML=rows.join('')||`<div class="empty-state">No active rallies.</div>`;
}

function renderPlayers(){
  const el=document.getElementById('playerList');
  if(!el)return;
  const rows=Object.entries(players).sort((a,b)=>(a[1].name||'').localeCompare(b[1].name||'')).map(([id,p])=>`<div class="player-row">
    <div class="rally-name">${esc(p.name||id)}</div>
    <button class="danger small" onclick="deletePlayer('${id}')">Delete</button>
  </div>`);
  el.innerHTML=rows.join('')||`<div class="empty-state">No active players.</div>`;
}

function renderAll(){renderProfiles();renderActiveRallies();renderPlayers();}

async function autoDeleteExpired(){
  if(autoDeleteBusy)return;
  autoDeleteBusy=true;
  try{
    const now=Date.now();
    const deletes=[];
    Object.entries(activeRallies).forEach(([id,r])=>{if(isExpiredRally(r,now))deletes.push(deleteDoc(doc(db,'activeRallies',id)));});
    Object.entries(sentRallies).forEach(([id,r])=>{if(Number(r.enemyHitEndMs)&&now>=Number(r.enemyHitEndMs)+2000)deletes.push(deleteDoc(doc(db,'sentRallies',id)));});
    await Promise.all(deletes);
  }finally{autoDeleteBusy=false;}
}

onSnapshot(collection(db,'rallyProfiles'),snap=>{profiles={};snap.forEach(d=>profiles[d.id]=d.data());renderProfiles();});
onSnapshot(collection(db,'activeRallies'),snap=>{activeRallies={};snap.forEach(d=>activeRallies[d.id]=d.data());renderActiveRallies();});
onSnapshot(collection(db,'players'),snap=>{players={};snap.forEach(d=>players[d.id]=d.data());renderPlayers();});
onSnapshot(collection(db,'sentRallies'),snap=>{sentRallies={};snap.forEach(d=>sentRallies[d.id]=d.data());});

setInterval(()=>{renderActiveRallies();autoDeleteExpired();},1000);

window.addEventListener('load',()=>{
  const pin=document.getElementById('adminPin');
  pin.addEventListener('keydown',e=>{if(e.key==='Enter')unlockAdmin();});
  if(sessionStorage.getItem('adminUnlocked')==='yes'){
    document.getElementById('lockScreen').classList.add('hidden');
    document.getElementById('adminApp').classList.remove('hidden');
    renderAll();
  }
});
