export function makeAudio() {
  let context=null,master=null,musicBus=null,sfxBus=null,noise=null,interval=0;
  let enabled=true,playing=false,step=0,next=0,tempo=164;
  const voices=new Set();

  function initialize() {
    if(context)return true;
    try{
      const Audio=window.AudioContext||window.webkitAudioContext;
      if(!Audio)return false;
      context=new Audio();
      master=context.createGain();
      musicBus=context.createGain();
      sfxBus=context.createGain();
      const compressor=context.createDynamicsCompressor();
      compressor.threshold.value=-16;
      compressor.ratio.value=4;
      master.gain.value=.72;
      musicBus.gain.value=.64;
      sfxBus.gain.value=.72;
      musicBus.connect(master);
      sfxBus.connect(master);
      master.connect(compressor).connect(context.destination);
      noise=context.createBuffer(1,Math.floor(context.sampleRate*.28),context.sampleRate);
      const samples=noise.getChannelData(0);
      for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
      return true;
    }catch{return false;}
  }

  function play(source,out,t,length,amp,filter=null) {
    if(voices.size>=40)return;
    const gain=context.createGain();
    gain.gain.setValueAtTime(.0001,t);
    gain.gain.exponentialRampToValueAtTime(amp,t+.008);
    gain.gain.exponentialRampToValueAtTime(.0001,t+length);
    if(filter)source.connect(filter).connect(gain);
    else source.connect(gain);
    gain.connect(out);
    voices.add(source);
    source.onended=()=>{
      voices.delete(source);
      source.disconnect();
      filter?.disconnect();
      gain.disconnect();
    };
    source.start(t);
    source.stop(t+length+.012);
  }

  function tone(out,t,length,hz,amp,type='sine',end=hz,lowpass=0) {
    const osc=context.createOscillator();
    osc.type=type;
    osc.frequency.setValueAtTime(hz,t);
    osc.frequency.exponentialRampToValueAtTime(end,t+length);
    let filter=null;
    if(lowpass){
      filter=context.createBiquadFilter();
      filter.type='lowpass';
      filter.frequency.value=lowpass;
      filter.Q.value=1.3;
    }
    play(osc,out,t,length,amp,filter);
  }

  function percussion(t,length,freq,amp,type='highpass') {
    const source=context.createBufferSource();
    source.buffer=noise;
    const filter=context.createBiquadFilter();
    filter.type=type;
    filter.frequency.value=freq;
    filter.Q.value=.8;
    play(source,musicBus,t,length,amp,filter);
  }

  function beat(t,n) {
    const phase=n%16;
    const bar=Math.floor(n/16)%8;
    const kick=[0,6,10,14].includes(phase)||(bar%2===1&&phase===8);
    if(kick)tone(musicBus,t,.19,128,.48,'sine',43);
    if(phase===4||phase===12){
      percussion(t,.16,1650,.27,'bandpass');
      tone(musicBus,t,.095,177,.15,'triangle',94);
    }
    if(phase%2===0||bar>=4)percussion(t,.046+(phase===2?.032:0),6100,phase%4===2?.14:.07);
    const bass=[49,49,58.27,43.65,49,49,65.41,43.65][bar];
    if([0,2,5,7,8,10,13,15].includes(phase)){
      const hz=bass*([7,15].includes(phase)?2:1);
      tone(musicBus,t,.139,hz,kick?.13:.23,'sawtooth',hz*.99,340+(bar%4)*103);
      tone(musicBus,t,.126,hz/2,.13,'sine');
    }
    if([1,3,9,11,14].includes(phase)){
      const intervals=[4,7,10,12,14,17];
      const index=(Math.floor(phase/2)+bar)%intervals.length;
      tone(musicBus,t,.102,bass*8*2**(intervals[index]/12),bar>=4?.087:.052,'square',bass*8*2**(intervals[index]/12),2100);
    }
  }

  function schedule() {
    if(!enabled||!playing||!context||context.state!=='running')return;
    if(next<context.currentTime-.10)next=context.currentTime+.03;
    while(next<context.currentTime+.11){
      beat(next,step++);
      next+=60/tempo/4;
    }
  }

  function stopVoices() {
    for(const voice of voices)try{voice.stop();}catch{ /* It already ended. */ }
    voices.clear();
  }

  function start(lab) {
    if(!enabled||!initialize())return;
    tempo=164+lab*4;
    if(playing)return;
    playing=true;
    context.resume().then(schedule).catch(()=>{});
    next=context.currentTime+.04;
    interval=setInterval(schedule,40);
  }

  function pause() {
    playing=false;
    clearInterval(interval);
    interval=0;
    stopVoices();
  }

  function cue(type,chain=1) {
    if(!enabled||!context||context.state!=='running')return;
    const t=context.currentTime+.012;
    if(type==='slide')tone(sfxBus,t,.082,380,.052,'triangle',560);
    if(type==='scan')tone(sfxBus,t,.22,670,.093,'sawtooth',108,1250);
    if(type==='hit'){
      tone(sfxBus,t,.29,186,.32,'square',66,480);
      tone(sfxBus,t,.24,65,.29,'sine',31);
    }
    if(type==='safe'||type==='win'){
      const base=466*2**(Math.min(5,chain-1)/12);
      const notes=type==='win'?[0,4,7,12,16]:[0,7,12];
      notes.forEach((n,i)=>tone(sfxBus,t+i*.052,.24,base*2**(n/12),.18,'triangle'));
    }
  }

  return {start,pause,cue,mute(value){enabled=!value;if(value)pause();}};
}
