import {db,doc,setDoc,onSnapshot,collection,serverTimestamp,autoFormatMmSs,setupUI,setThemeFromSwitch,parseMmSsToSeconds,secondsToMmSs,colorForId,countdownClass,countdownText,esc,PLAYER_LAND_OFFSET_SECONDS} from './shared.js';

window.setThemeFromSwitch=setThemeFromSwitch;
setupUI();

let playerUnsub=null;
let sentRallies={};
let currentMarchTime=localStorage.getItem('marchTime')||'';

autoFormatMmSs(document.getElementById('loginMarchTime'));
autoFormatMmSs(document.getElementById('marchAdjustInput'));

const linkedName=()=>localStorage.getItem('playerName')||'';

function showLogin(){document.getElementById('loginView').classList.remove('hidden');document.getElementById('playerView').classList.add('hidden');}
function showPlayer(){
  document.getElementById('loginView').classList.add('hidden');
  document.getElementById('playerView').classList.remove('hidden');
  document.getElementById('welcomeName').textContent=linkedName()||'Player';
  document.getElementById('marchAdjustInput').value=currentMarchTime||'00:00';
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
      document.getElementById('marchAdjustInput').value=currentMarchTime;
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
window.adjustMarch=(delta)=>{
  let s=parseMmSsToSeconds(document.getElementById('marchAdjustInput').value);
  if(s===null)s=0;
  s=Math.max(0,s+Number(delta));
  document.getElementById('marchAdjustInput').value=secondsToMmSs(s);
  document.getElementById('marchStatus').textContent='Not saved';
  renderRallies();
};
window.updateMarch=async()=>{
  const name=linkedName();
  const value=document.getElementById('marchAdjustInput').value.trim();
  if(parseMmSsToSeconds(value)===null){alert('Enter march time as MM:SS.');return;}
  currentMarchTime=value;
  localStorage.setItem('marchTime',value);
  await setDoc(doc(db,'players',name),{name,marchTime:value,updatedAt:serverTimestamp()},{merge:true});
  document.getElementById('marchStatus').textContent='Saved';
  renderRallies();
};
function getPlayerTiming(rally,now){
  const marchSeconds=parseMmSsToSeconds(document.getElementById('marchAdjustInput')?.value||currentMarchTime);
  if(marchSeconds===null)return null;
  const enemyHitEndMs=Number(rally.enemyHitEndMs||0);
  if(!enemyHitEndMs)return null;
  const playerSendEndMs=enemyHitEndMs-((marchSeconds+PLAYER_LAND_OFFSET_SECONDS)*1000);
  const playerMarchEndMs=playerSendEndMs+(marchSeconds*1000);
  return {
    sendSeconds:Math.ceil((playerSendEndMs-now)/1000),
    marchSeconds:Math.ceil((playerMarchEndMs-now)/1000),
    playerMarchEndMs
  };
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
      const marchActive=r.timing.sendSeconds<=0;
      const marchText=marchActive?countdownText(r.timing.marchSeconds):'--:--';
      const marchCls=marchActive?countdownClass(r.timing.marchSeconds):'';
      const marchColor=marchCls?'':`style="color:${color}"`;
      return `<div class="rally-row player-phase-row" style="color:${color}">
        <div class="rally-name">${esc(r.name)}</div>
        <div class="player-timer-pair">
          <div class="player-timer-block"><div class="player-timer-label">Send</div><div class="rally-countdown ${sendCls}" ${sendColor}>${countdownText(r.timing.sendSeconds)}</div></div>
          <div class="player-timer-block"><div class="player-timer-label">March</div><div class="rally-countdown ${marchCls}" ${marchColor}>${marchText}</div></div>
        </div>
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
  if(n&&m)showPlayer();else showLogin();
});
onSnapshot(collection(db,'sentRallies'),snap=>{sentRallies={};snap.forEach(d=>sentRallies[d.id]=d.data());renderRallies();});
setInterval(renderRallies,1000);
