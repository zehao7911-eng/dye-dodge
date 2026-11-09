export const title='Dye Dodge';
export const key='dye-dodge-v1';
export const colors=[
  {name:'Lemon',hex:'#ffdb16',light:'#fff894',dark:'#bd6c05',shape:'◆'},
  {name:'Aqua',hex:'#00e5e9',light:'#9dffff',dark:'#007397',shape:'●'},
  {name:'Punch',hex:'#ff438f',light:'#ffc2d7',dark:'#b50c69',shape:'▲'},
  {name:'Grape',hex:'#a678ff',light:'#e2cdff',dark:'#5124be',shape:'✦'}
];
export const labs=[
  {name:'Sunbeam Lab',scans:5,pace:3.2,palette:3,sky:'#83eafa',rail:'#045ee7',island:'#319cf5'},
  {name:'Bubbleworks',scans:6,pace:2.75,palette:3,sky:'#9bf7d4',rail:'#009d89',island:'#63d8b6'},
  {name:'Candy Reactor',scans:7,pace:2.36,palette:4,sky:'#ffacd9',rail:'#b436e2',island:'#e063bd'},
  {name:'Hyperdeck',scans:8,pace:2.02,palette:4,sky:'#aab9ff',rail:'#4724d5',island:'#6f65ff'}
];
export const spacing=2.35;
export const startIndex=4;
export const positions=Array.from({length:9},(_,i)=>({x:(i%3-1)*spacing,z:(Math.floor(i/3)-1)*spacing}));
const intro=[2,1,0,1,2,1,0,2,1];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const whole=(n,a,b)=>Number.isInteger(n)?clamp(n,a,b):a;
const RNG=seed=>{
  let state=seed>>>0;
  return ()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296);
};

export function boardFor(lab,scan,seed) {
  const rules=labs[lab];
  const first=lab===0&&scan===0;
  const rand=RNG(seed^Math.imul(scan+1,0x9e3779b1)^Math.imul(lab+1,0xc2b2ae35));
  const tiles=first?[...intro]:Array.from({length:9},(_,i)=>i%rules.palette);
  if (!first) for(let i=tiles.length-1;i>0;i--){
    const j=Math.floor(rand()*(i+1));
    [tiles[i],tiles[j]]=[tiles[j],tiles[i]];
  }
  const target=lab===0?scan%rules.palette:(seed+scan+lab)%rules.palette;
  const duration=first?4.05:Math.max(1.62,rules.pace-scan*.054);
  return {tiles,target,duration,axis:lab%2?'x':'z',reverse:scan%2===1};
}

export function checkpoint(lab,seed) {
  return {lab,seed:seed>>>0,scan:0,lives:3,score:0,chain:0,bestChain:0,home:startIndex};
}

export function profile(raw) {
  const p=raw && typeof raw==='object'?raw:{};
  const medals=labs.map((_,i)=>whole(p.medals?.[i],0,3));
  const records=labs.map((_,i)=>whole(p.records?.[i],0,99999));
  const open=Math.max(0,...medals.map((value,i)=>value?Math.min(labs.length-1,i+1):0));
  const at=whole(p.at,0,open);
  let run=null;
  const r=p.run;
  if(r&&Number.isInteger(r.lab)&&r.lab>=0&&r.lab<=open&&Number.isInteger(r.seed)){
    run={
      lab:r.lab,seed:r.seed>>>0,scan:whole(r.scan,0,labs[r.lab].scans-1),
      lives:whole(r.lives,1,3),score:whole(r.score,0,99999),
      chain:whole(r.chain,0,labs[r.lab].scans),bestChain:whole(r.bestChain,0,labs[r.lab].scans),
      home:whole(r.home,0,8)
    };
  }
  return {medals,records,open,at,run,mute:p.mute===true,rewards:{like:p.rewards?.like===true,comment:p.rewards?.comment===true}};
}

export function merge(local,raw,allowRun) {
  const remote=profile(raw);
  return profile({
    ...local,
    medals:local.medals.map((value,i)=>Math.max(value,remote.medals[i])),
    records:local.records.map((value,i)=>Math.max(value,remote.records[i])),
    at:allowRun?Math.max(local.at,remote.at):local.at,
    run:local.run || (allowRun?remote.run:null),
    rewards:{like:local.rewards.like||remote.rewards.like,comment:local.rewards.comment||remote.rewards.comment}
  });
}

export function makeRun(data) {
  const board=boardFor(data.lab,data.scan,data.seed);
  const home=positions[data.home];
  return {data,board,x:home.x,z:home.z,goal:data.home,t:0,phase:'aim',event:null};
}

export function closest(x,z) {
  const col=clamp(Math.round(x/spacing)+1,0,2);
  const row=clamp(Math.round(z/spacing)+1,0,2);
  return row*3+col;
}

export function onPad(run,index=closest(run.x,run.z)) {
  const p=positions[index];
  return Math.abs(run.x-p.x)<.96&&Math.abs(run.z-p.z)<.96;
}

export function choose(run,index) {
  if (run.phase==='aim'&&Number.isInteger(index)&&index>=0&&index<9) run.goal=index;
}

export function advance(run,delta) {
  if (run.phase!=='aim'||!Number.isFinite(delta)||delta<=0) return null;
  const dt=Math.min(delta,run.board.duration-run.t);
  const goal=positions[run.goal];
  const dx=goal.x-run.x,dz=goal.z-run.z,d=Math.hypot(dx,dz);
  const ease=Math.min(d,17.5*dt);
  if(d>0){run.x+=dx/d*ease;run.z+=dz/d*ease;}
  run.t+=dt;
  if(run.t+1e-8<run.board.duration) return null;
  const landed=closest(run.x,run.z);
  const safe=onPad(run,landed)&&run.board.tiles[landed]===run.board.target;
  const chain=safe?run.data.chain+1:0;
  const bonus=safe?100+Math.min(6,chain-1)*35:0;
  const next={...run.data,lives:run.data.lives-(safe?0:1),score:run.data.score+bonus,
    chain,bestChain:Math.max(run.data.bestChain,chain),home:landed,scan:run.data.scan+1};
  const lost=next.lives===0;
  const won=!lost&&next.scan===labs[next.lab].scans;
  run.phase='feedback';
  run.event={safe,bonus,lost,won,next};
  return run.event;
}
