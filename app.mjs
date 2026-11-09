import {colors,labs,key,checkpoint,profile,merge,makeRun,choose,advance,closest} from './core.mjs';
import {makeView} from './view.mjs';
import {makeAudio} from './audio.mjs';
import {bridge} from './sdk.mjs';

const $=id=>document.getElementById(id);
const shell=$('game');
const view=makeView($('scene'));
const audio=makeAudio();
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
let data=read();
let run=makeRun(data.run||fresh(data.at));
let mode='ready',outcome=null,feedbackAge=0,clock=0,last=0,lastDraw=0,held=null,interacted=false,scanCue=false;
let sdk,support={like:false,comment:false};
const skipMotion=()=>reducedMotion&&mode!=='active';

function fresh(lab) {
  const seed=new Uint32Array(1);
  if(globalThis.crypto?.getRandomValues)crypto.getRandomValues(seed);
  else seed[0]=Math.floor(Math.random()*4294967296);
  return checkpoint(lab,seed[0]);
}

function read() {
  try{return profile(JSON.parse(localStorage.getItem(key)));}
  catch{return profile();}
}

function save(cloud=true) {
  try{localStorage.setItem(key,JSON.stringify(data));}
  catch{ /* The current session still plays. */ }
  if(cloud)sdk?.save();
}

function applyViewport() {
  const width=sdk?.viewport()?.width;
  if(width>=280) shell.style.setProperty('--host-width',`${Math.min(width,innerWidth)}px`);
  else shell.style.removeProperty('--host-width');
  view.resize();
}

function setupSDK() {
  sdk=bridge({
    read:()=>profile(data),
    write(raw,remote){
      const untouched=!interacted&&!data.run&&mode==='ready';
      data=remote?merge(data,raw,untouched):profile(raw);
      if(untouched&&remote)run=makeRun(data.run||fresh(data.at));
      save(false);
      renderUI();
    },
    changed(event){
      if(event.type==='support')support={like:event.like,comment:event.comment};
      if(event.type==='connected'){
        support={like:false,comment:false};
        requestAnimationFrame(applyViewport);
      }
      if(event.type==='reward')audio.cue('safe');
      renderRewards();
    }
  });
}

function setSound() {
  $('sound').setAttribute('aria-label',data.mute?'Unmute sound':'Mute sound');
  $('sound').setAttribute('aria-pressed',String(data.mute));
  const detail=data.mute?'<path d="m16 9 5 6m0-6-5 6"/>':'<path d="M16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>';
  $('sound').innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9v6h4l5 4V5L7 9z"/>${detail}</svg>`;
}

function renderRewards() {
  const panel=$('rewards');
  const lines=[];
  if(data.rewards.like)lines.push('Gold sparks unlocked');
  else if(support.like)lines.push('Like in GameWave for gold sparks');
  if(data.rewards.comment)lines.push('Star burst unlocked');
  else if(support.comment)lines.push('Comment in GameWave for a star burst');
  panel.hidden=mode!=='result'||lines.length===0;
  panel.textContent=lines.join(' · ');
}

function renderUI() {
  const lab=labs[run.data.lab],event=run.event;
  const shown=event?.next||run.data;
  const target=colors[run.board.target];
  const scan=Math.min(lab.scans,run.data.scan+1);
  $('lab-num').textContent=`LAB ${run.data.lab+1}`;
  $('lab-name').textContent=lab.name;
  $('scan-num').textContent=`${scan} / ${lab.scans}`;
  $('score').textContent=shown.score.toLocaleString('en-US');
  $('hearts').setAttribute('aria-label',`${shown.lives} lives`);
  $('hearts').innerHTML=Array.from({length:3},(_,i)=>`<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 17.2 2.7 10.3C-1 6.5 4.8 1.4 8 4.5L10 6l2-1.5c3.2-3.1 9 2 5.3 5.8z" fill="${i<shown.lives?'#ff4487':'#d7e2ee'}" stroke="#16294e" stroke-width="1.5"/></svg>`).join('');
  shell.style.setProperty('--target',target.hex);
  $('swatch').textContent=target.shape;
  $('goal').textContent=mode==='ready'&&!data.run?'MATCH YOUR COLOR':`FIND ${target.name.toUpperCase()}`;
  $('tip').textContent=mode==='result'?'THE PAINTWORKS':'DRAG TO A MATCHING TILE';
  $('streak').hidden=shown.chain<2||mode!=='active';
  $('streak').textContent=`×${shown.chain} STREAK`;
  $('overlay').hidden=mode==='active';
  if(mode==='ready'){
    $('kicker').textContent=data.run?'CHECKPOINT SAVED':'THE PAINTWORKS';
    $('heading').innerHTML='Dye<span> Dodge</span>';
    $('subheading').textContent=data.run?'Your next scan is ready.':'Slide onto your color before the drone scans.';
    $('play').textContent=data.run?'Resume':'Play';
  }
  if(mode==='pause'){
    $('kicker').textContent='TAKE A BREATHER';
    $('heading').textContent='Paused';
    $('subheading').textContent='Your scan is on hold.';
    $('play').textContent='Continue';
  }
  if(mode==='result'){
    const final=outcome.won&&run.data.lab===labs.length-1;
    $('kicker').textContent=outcome.won?`${'★'.repeat(outcome.next.lives)}  LAB COMPLETE`:'DRONE ALERT';
    $('heading').textContent=final?'Paint master!':outcome.won?'Lab clear!':'Busted!';
    $('subheading').textContent=`${outcome.next.score.toLocaleString('en-US')} points · Best streak ×${outcome.next.bestChain}`;
    $('play').textContent=final?'Play again':outcome.won?'Next lab':'Retry';
  }
  setSound();
  renderRewards();
}

function start() {
  interacted=true;
  mode='active';
  data.run=run.data;
  sdk?.start();
  save();
  audio.start(run.data.lab);
  renderUI();
}

function release() { held=null; }

function pause() {
  release();
  if(mode!=='active')return;
  mode='pause';
  audio.pause();
  renderUI();
}

function resume() {
  mode='active';
  last=0;
  audio.start(run.data.lab);
  renderUI();
}

function nextLab() {
  const lab=outcome.won?(run.data.lab+1)%labs.length:run.data.lab;
  sdk?.prepare();
  data.at=lab;
  run=makeRun(fresh(lab));
  outcome=null;
  feedbackAge=0;
  scanCue=false;
  $('callout').hidden=true;
  start();
}

function route() {
  if(mode==='ready')start();
  else if(mode==='pause')resume();
  else if(mode==='result')nextLab();
}

function direct(index) {
  if(index<0||index===run.goal||run.phase!=='aim')return;
  choose(run,index);
  audio.cue('slide');
}

function result(event) {
  feedbackAge=0;
  const result=$('callout');
  result.classList.toggle('hit',!event.safe);
  result.textContent=event.safe?`CAMOUFLAGE! +${event.bonus}`:'SPOTTED!  −1';
  result.hidden=false;
  audio.cue(event.safe?(event.won?'win':'safe'):'hit',event.next.chain);
  if(event.lost||event.won){
    outcome=event;
    data.run=null;
    data.records[event.next.lab]=Math.max(data.records[event.next.lab],event.next.score);
    if(event.won){
      data.medals[event.next.lab]=Math.max(data.medals[event.next.lab],event.next.lives);
      data.at=Math.min(labs.length-1,event.next.lab+1);
    }
    data=profile(data);
    sdk?.end();
  }else data.run=event.next;
  save();
  renderUI();
}

function finishFeedback() {
  $('callout').hidden=true;
  feedbackAge=0;
  if(outcome){
    mode='result';
    audio.pause();
  }else{
    run=makeRun(run.event.next);
    scanCue=false;
    if(held)direct(held.index);
  }
  renderUI();
}

function frame(now) {
  const elapsed=last?Math.min(.072,Math.max(0,(now-last)/1000)):0;
  last=now;
  const dt=document.hidden||mode==='pause'?0:elapsed;
  clock+=dt;
  if(mode==='active'){
    if(run.phase==='aim'){
      const event=advance(run,dt);
      const remaining=Math.max(0,1-run.t/run.board.duration);
      $('timer').style.transform=`scaleX(${remaining})`;
      $('timer').style.background=remaining<.29?'#ff468e':'var(--target)';
      if(remaining<.29&&!scanCue){
        audio.cue('scan');
        scanCue=true;
      }
      if(event)result(event);
    }else{
      feedbackAge+=dt;
      if(feedbackAge>=.76)finishFeedback();
    }
  }
  if(mode==='ready'){
    $('timer').style.transform='scaleX(1)';
    $('timer').style.background='var(--target)';
  }
  const drawEvery=mode==='active'?29:51;
  if(!document.hidden&&(!lastDraw||now-lastDraw>=drawEvery)){
    const visualDt=lastDraw?Math.min(.08,(now-lastDraw)/1000):0;
    lastDraw=now;
    view.render(run,skipMotion()||mode==='pause'?0:visualDt,clock,mode,feedbackAge,data.rewards);
  }
  requestAnimationFrame(frame);
}

$('play').addEventListener('click',route);
$('sound').addEventListener('click',()=>{
  data.mute=!data.mute;
  audio.mute(data.mute);
  if(!data.mute&&mode==='active')audio.start(run.data.lab);
  save();
  setSound();
});
shell.addEventListener('pointerdown',e=>{
  if(e.target!==view.canvas()||held||e.button!==0)return;
  const index=view.select(e.clientX,e.clientY);
  if(index<0)return;
  if(mode==='ready')start();
  if(mode!=='active')return;
  held={id:e.pointerId,index};
  try{shell.setPointerCapture(e.pointerId);}catch{ /* Move events still work over the arena. */ }
  direct(index);
  e.preventDefault();
});
shell.addEventListener('pointermove',e=>{
  if(held?.id!==e.pointerId)return;
  const index=view.select(e.clientX,e.clientY);
  if(index<0||index===held.index)return;
  held.index=index;
  direct(index);
});
for(const name of ['pointerup','pointercancel','lostpointercapture']){
  shell.addEventListener(name,e=>{if(held?.id===e.pointerId)release();});
}
document.addEventListener('keydown',e=>{
  if(e.altKey||e.ctrlKey||e.metaKey)return;
  if(e.key==='Escape'&&mode==='active'){pause();return;}
  const delta={ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0],ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1]}[e.key];
  if(!delta||!['ready','active'].includes(mode))return;
  e.preventDefault();
  if(mode==='ready')start();
  const index=run.goal;
  const x=Math.min(2,Math.max(0,index%3+delta[0]));
  const y=Math.min(2,Math.max(0,Math.floor(index/3)+delta[1]));
  direct(y*3+x);
});
window.addEventListener('blur',pause);
document.addEventListener('visibilitychange',()=>{
  last=0;
  if(document.hidden)pause();
  else sdk?.connect();
});
window.addEventListener('resize',applyViewport);
shell.addEventListener('webglcontextlost',pause,true);
window.addEventListener('pagehide',()=>{
  pause();
  sdk?.stop();
  sdk=null;
});
window.addEventListener('pageshow',e=>{
  if(!e.persisted)return;
  data=read();
  run=makeRun(data.run||fresh(data.at));
  mode='ready';
  outcome=null;
  feedbackAge=0;
  scanCue=false;
  $('callout').hidden=true;
  setupSDK();
  applyViewport();
  renderUI();
});

audio.mute(data.mute);
setupSDK();
applyViewport();
renderUI();
requestAnimationFrame(frame);
