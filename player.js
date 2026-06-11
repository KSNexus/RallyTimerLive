import {db,doc,setDoc,onSnapshot,collection,serverTimestamp,autoFormatMmSs,setupUI,setThemeFromSwitch,parseMmSsToSeconds,secondsToMmSs,colorForId,countdownClass,countdownText,esc,PLAYER_LAND_OFFSET_SECONDS,getPlayerSendOffsetMs,setPlayerSendOffsetMs,formatUtcTimestamp,formatSignedOffset} from './shared.js';

window.setThemeFromSwitch=setThemeFromSwitch;
setupUI();

let playerUnsub=null;
let sentRallies={};
let currentMarchTime=localStorage.getItem('marchTime')||'';

autoFormatMmSs(document.getElementById('loginMarchTime'));


const linkedName=()=>localStorage.getItem('playerName')||'';

function showLogin(){document.getElementById('loginView').classList.remove('hidden');document.getElementById('playerView').classList.add('hidden');}
function showPlayer(){
  document.getElementById('loginView').classList.add('hidden');
  document.getElementById('playerView').classList.remove('hidden');
  document.getElementById('welcomeName').textContent=linkedName()||'Player';
  document.getElementById('sendOffsetInput').value=formatSignedOffset(getPlayerSendOffsetMs());
  listenToMyPlayer();
  renderRallies();
}
function listenToMyPlayer(){
  const name=linkedName();
  if(!name)return;
  if(playerUnsub)playerUnsub();
  playerUnsub=onSnapshot(doc(db,'players',name),snap=>{
    if(!snap.exists()){
      localStorage.removeItem('playerName');localStorage.removeItem('marchTime');currentMarchTime='';showLogin();return;
    }
    const d=snap.data();
    if(d.marchTime&&d.marchTime!==currentMarchTime){
      currentMarchTime=d.marchTime;
      localStorage.setItem('marchTime',currentMarchTime);
      document.getElementById('sendOffsetInput').value=formatSignedOffset(getPlayerSendOffsetMs());
    }
    renderRallies();
  });
}
window.loginPlayer=async()=>{
  const name=document.getElementById('loginName').value.trim();
  const marchTime=document.getElementById('loginMarchTime').value.trim();
  if(!name){alert('Enter player name.');return;}
  if(parseMmSsToSeconds(marchTime)===null){alert('Enter march time as MM:SS.');return;}
  localStorage.setItem('playerName',name);
  localStorage.setItem('marchTime',marchTime);
  currentMarchTime=marchTime;
  await setDoc(doc(db,'players',name),{name,marchTime,updatedAt:serverTimestamp()},{merge:true});
  showPlayer();
};
window.adjustSendOffset=(deltaSeconds)=>{
  const next=getPlayerSendOffsetMs()+(Number(deltaSeconds)*1000);
  setPlayerSendOffsetMs(next);
  document.getElementById('sendOffsetInput').value=formatSignedOffset(next);
  const status=document.getElementById('offsetStatus');
  if(status)status.textContent='Not set';
  renderRallies();
};

window.setSendOffset=()=>{
  const status=document.getElementById('offsetStatus');
  if(status)status.textContent='Set';
  resetSendStampCache();
  document.getElementById('sendOffsetInput').value=formatSignedOffset(getPlayerSendOffsetMs());
  renderRallies();
};

function getPlayerTiming(rally,now){
  const marchSeconds=parseMmSsToSeconds(currentMarchTime);
  if(marchSeconds===null)return null;
  const enemyHitEndMs=Number(rally.enemyHitEndMs||0);
  if(!enemyHitEndMs)return null;
  const basePlayerSendEndMs=enemyHitEndMs-((marchSeconds+PLAYER_LAND_OFFSET_SECONDS)*1000);
  const playerSendEndMs=basePlayerSendEndMs+getPlayerSendOffsetMs();
  const playerMarchEndMs=playerSendEndMs+(marchSeconds*1000);
  return {
    sendSeconds:Math.ceil((playerSendEndMs-now)/1000),
    marchSeconds:Math.ceil((playerMarchEndMs-now)/1000),
    playerSendEndMs,
    playerMarchEndMs
  };
}


function getSendStampKey(rally){
  return `sendStamp_${linkedName()}_${rally.sourceRallyId||rally.id}`;
}

function getCachedSendTimeText(rally,timing){
  const key=getSendStampKey(rally);
  const cached=localStorage.getItem(key);
  if(cached)return cached;
  const stamp=formatUtcTimestamp(timing.playerSendEndMs);
  localStorage.setItem(key,stamp);
  return stamp;
}

function resetSendStampCache(){
  Object.keys(localStorage).forEach(k=>{
    if(k.startsWith(`sendStamp_${linkedName()}_`))localStorage.removeItem(k);
  });
}

function renderRallies(){
  const el=document.getElementById('activeRallies');
  if(!el)return;
  const now=Date.now();
  const rows=Object.entries(sentRallies).map(([id,r])=>({id,...r}))
    .filter(r=>Number(r.enemyHitEndMs))
    .map(r=>({...r,timing:getPlayerTiming(r,now)}))
    .filter(r=>r.timing&&now<Number(r.timing.playerMarchEndMs)+2000)
    .sort((a,b)=>a.timing.sendSeconds-b.timing.sendSeconds)
    .map(r=>{
      const color=r.color||colorForId(r.profileId||r.sourceRallyId||r.id);
      const sendCls=countdownClass(r.timing.sendSeconds);
      const sendColor=sendCls?'':`style="color:${color}"`;
      const marchSeconds=parseMmSsToSeconds(currentMarchTime)||0;
      const marchActive=r.timing.sendSeconds<=0;
      const marchDisplay=marchActive?r.timing.marchSeconds:marchSeconds;
      return `<div class="rally-row player-phase-row" style="color:${color}">
        <div class="rally-name">${esc(r.name)}</div>
        <div class="player-timer-pair">
          <div class="player-timer-block"><div class="player-timer-label">Send</div><div class="rally-countdown ${sendCls}" ${sendColor}>${countdownText(r.timing.sendSeconds)}</div></div>
          <div class="player-timer-block"><div class="player-timer-label">March</div><div class="rally-countdown" style="color:${color}">${countdownText(marchDisplay)}</div></div>
        </div>
        <div class="timestamp-line player-timestamp">Rally Send Time: ${getCachedSendTimeText(r,r.timing)}</div>
      </div>`;
    });
  el.innerHTML=rows.join('')||`<div class="empty-state">No active rallies.</div>`;
}
window.addEventListener('load',()=>{
  const n=localStorage.getItem('playerName');
  const m=localStorage.getItem('marchTime');
  if(n)document.getElementById('loginName').value=n;
  if(m)document.getElementById('loginMarchTime').value=m;
  currentMarchTime=m||'';
  const offsetInput=document.getElementById('sendOffsetInput');if(offsetInput)offsetInput.value=formatSignedOffset(getPlayerSendOffsetMs());if(n&&m)showPlayer();else showLogin();
});
onSnapshot(collection(db,'sentRallies'),snap=>{sentRallies={};snap.forEach(d=>sentRallies[d.id]=d.data());renderRallies();});
setInterval(renderRallies,1000);
