import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, doc, setDoc, deleteDoc, onSnapshot, collection, getDocs, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

export const app=initializeApp(firebaseConfig);
export const db=getFirestore(app);
export {doc,setDoc,deleteDoc,onSnapshot,collection,getDocs,serverTimestamp};

export const ADMIN_PIN="NEX26";
export const RALLY_BASE_SECONDS=300;
export const PLAYER_LAND_OFFSET_SECONDS=1;
export const RALLY_EXPIRE_BUFFER_MS=2000;
export const RALLY_COLORS=["#b875ff","#42d9ff","#2ecc71","#f0c76a","#ff6ec7","#59f0c5","#ff8a4c","#7aa7ff"];

export function applyTheme(){document.body.classList.toggle('light-mode',(localStorage.getItem('theme')||'dark')==='light')}
export function syncThemeSwitch(){const sw=document.getElementById('themeSwitch');if(sw)sw.checked=(localStorage.getItem('theme')||'dark')==='light'}
export function setThemeFromSwitch(isLight){localStorage.setItem('theme',isLight?'light':'dark');applyTheme();syncThemeSwitch()}
export function setupUI(){applyTheme();syncThemeSwitch()}

export const pad=n=>String(n).padStart(2,'0');
export function parseMmSsToSeconds(value){if(!value)return null;const p=String(value).trim().split(':').map(Number);if(p.length!==2||p.some(Number.isNaN))return null;const[m,s]=p;if(m<0||m>99||s<0||s>59)return null;return m*60+s}
export function secondsToMmSs(seconds){seconds=Math.max(0,Math.floor(Number(seconds)||0));return `${pad(Math.floor(seconds/60))}:${pad(seconds%60)}`}
export function autoFormatMmSs(input){if(!input)return;input.addEventListener('input',()=>{let v=input.value.replace(/\D/g,'').slice(0,4),o='';for(let i=0;i<v.length;i++){if(i===2)o+=':';o+=v[i]}input.value=o})}
export function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
export function makeId(prefix='ID'){return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`}
export function colorForId(id){let h=0;String(id||'').split('').forEach(ch=>h=(h*31+ch.charCodeAt(0))|0);return RALLY_COLORS[Math.abs(h)%RALLY_COLORS.length]}
export function countdownClass(s){if(s<=0)return'count-send';if(s<=3)return'count-critical';if(s<=10)return'count-red';if(s<=30)return'count-orange';return''}
export function countdownText(s){return s<=0?'SEND':secondsToMmSs(s)}
export function getRallyCountdownSeconds(r,now=Date.now()){const end=Number(r.rallyEndMs||0);return end?Math.ceil((end-now)/1000):0}
export function isExpiredRally(r,now=Date.now()){const end=Number(r.enemyHitEndMs||r.rallyEndMs||0);return !!end&&now>=end+RALLY_EXPIRE_BUFFER_MS}

export function getEnemyMarchCountdownSeconds(r,now=Date.now()){
  const rallyEnd=Number(r.rallyEndMs||0);
  const enemyMarch=Number(r.enemyMarchSeconds||0);
  if(!rallyEnd)return 0;
  if(now<rallyEnd)return enemyMarch;
  const end=rallyEnd+(enemyMarch*1000);
  return Math.ceil((end-now)/1000);
}
export function getPhaseFromRally(r,now=Date.now()){
  return now>=Number(r.rallyEndMs||0)?'march':'rally';
}

export function getUtcOffsetMs(){return Number(localStorage.getItem('visualUtcOffsetMs')||0);}
export function setUtcOffsetMs(ms){localStorage.setItem('visualUtcOffsetMs',String(Number(ms)||0));localStorage.setItem('visualUtcSet','yes');}
export function isUtcSet(){return localStorage.getItem('visualUtcSet')==='yes';}
export function formatUtcClock(ms=Date.now()){const d=new Date(ms+getUtcOffsetMs());return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;}
export function formatSignedOffset(ms=getUtcOffsetMs()){const sign=Number(ms)>=0?'+':'-';const abs=Math.abs(Number(ms)||0);return `${sign}${(abs/1000).toFixed(1)}s`;}
