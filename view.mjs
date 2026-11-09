import {colors,positions,labs,onPad,closest} from './core.mjs';

const T=globalThis.THREE;
const material=(color,roughness=.55)=>new T.MeshStandardMaterial({color,roughness,metalness:.03});
const basic=(color,opacity=1)=>new T.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:opacity===1});
const sphere=new T.SphereGeometry(1,16,11);
const cube=new T.BoxGeometry(1,1,1);
const cylinder=new T.CylinderGeometry(1,1,1,20);
const oct=new T.CylinderGeometry(1,1,1,8);
const edge=new T.CylinderGeometry(.91,1,1,8);
const dark=material('#132a53');
const milk=material('#fffcdb');
const white=material('#ffffff',.32);
const rubber=material('#264477');
const outline=basic('#152c54');
const cream=basic('#fff8e3');

function add(parent,geo,mat,x,y,z,sx=1,sy=sx,sz=sx) {
  const mesh=new T.Mesh(geo,mat);
  mesh.position.set(x,y,z);
  mesh.scale.set(sx,sy,sz);
  parent.add(mesh);
  return mesh;
}

function octagon(parent,mat,x,y,z,scale,height,bevel=false) {
  const mesh=add(parent,bevel?edge:oct,mat,x,y,z,scale,height,scale);
  mesh.rotation.y=Math.PI/8;
  return mesh;
}

function line(parent,points,mat,radius) {
  const curve=new T.CatmullRomCurve3(points.map(([x,y,z])=>new T.Vector3(x,y,z)));
  const geometry=new T.TubeGeometry(curve,Math.max(8,points.length*3),radius,7,false);
  return add(parent,geometry,mat,0,0,0);
}

function badgeGeometry(index) {
  const shape=new T.Shape();
  const count=[4,32,3,8][index];
  for(let i=0;i<count;i++){
    const theta=i*2*Math.PI/count+Math.PI/2;
    const r=index===3&&i%2===1?.42:1;
    const x=Math.cos(theta)*r,y=Math.sin(theta)*r;
    if(i===0)shape.moveTo(x,y); else shape.lineTo(x,y);
  }
  shape.closePath();
  return new T.ShapeGeometry(shape);
}
const glyphs=colors.map((_,i)=>badgeGeometry(i));

function floorBadge(parent,geometry,mat,x,y,z,size) {
  const mesh=add(parent,geometry,mat,x,y,z,size);
  mesh.rotation.x=-Math.PI/2;
  return mesh;
}

function contactTexture() {
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=64;
  const ctx=canvas.getContext('2d');
  const gradient=ctx.createRadialGradient(32,32,0,32,32,31);
  gradient.addColorStop(0,'rgba(12,25,72,.75)');
  gradient.addColorStop(.43,'rgba(12,25,72,.37)');
  gradient.addColorStop(1,'rgba(12,25,72,0)');
  ctx.fillStyle=gradient;
  ctx.fillRect(0,0,64,64);
  return new T.CanvasTexture(canvas);
}

function createHero(parent) {
  const rig=new T.Group();
  parent.add(rig);
  const skin=material('#ffdb16',.37);
  const sides=material('#fca921',.48);
  const flesh=material('#fffbc0',.62);
  const eyes=material('#163054',.34);
  const belly=add(rig,sphere,flesh,0,.43,.00,.45,.29,.62);
  const body=add(rig,sphere,skin,0,.63,-.02,.52,.42,.68);
  const head=new T.Group();
  head.position.set(0,.73,.52);
  rig.add(head);
  add(head,sphere,skin,0,.04,.09,.51,.41,.47);
  add(head,sphere,sides,0,-.12,.27,.42,.23,.36);
  add(head,sphere,flesh,0,-.21,.24,.36,.13,.31);
  line(head,[[-.27,-.1,.47],[-.13,-.14,.556],[.02,-.15,.583],[.17,-.12,.549],[.28,-.075,.477]],dark,.022);
  const lids=[];
  for(const side of [-1,1]){
    const eye=new T.Group();
    eye.position.set(side*.33,.20,.21);
    head.add(eye);
    add(eye,sphere,sides,0,0,0,.29,.275,.26);
    const globe=add(eye,sphere,white,side*.08,.01,.118,.233,.224,.196);
    const pupil=add(eye,sphere,eyes,side*.128,.013,.276,.122,.154,.061);
    const glint=add(eye,sphere,white,side*.10,.067,.327,.046,.05,.02);
    add(eye,sphere,white,side*.17,-.031,.326,.017);
    lids.push([globe,pupil,glint]);
    add(head,sphere,sides,side*.303,-.085,.45,.09,.048,.039);
    add(head,sphere,dark,side*.105,-.013,.536,.027,.019,.01);
  }
  const dorsal=new T.ConeGeometry(1,1,5);
  for(let i=0;i<5;i++){
    const height=.17+(1-i/5)*.12;
    const spine=add(rig,dorsal,sides,0,.98-i*.018,.33-i*.18,.115,height,.155);
    spine.rotation.x=-.27;
  }
  const tail=new T.Group();
  tail.position.set(0,.44,-.49);
  rig.add(tail);
  const tailSegments=13;
  for(let i=0;i<tailSegments;i++){
    const f=i/(tailSegments-1);
    const a=f*Math.PI*1.83;
    const r=.53-.34*f;
    const thickness=.26-.157*f;
    add(tail,sphere,i%3===1?sides:skin,
      Math.sin(a)*r*.53,.22+Math.sin(a-Math.PI/2)*r*.63,-.43+Math.cos(a)*r*.85,
      thickness,thickness*.94,thickness*1.04);
  }
  const feet=[];
  for(const side of [-1,1])for(const end of [-1,1]){
    const foot=new T.Group();
    foot.position.set(side*.38,.32,end*.39);
    rig.add(foot);
    const elbow=add(foot,sphere,skin,side*.09,-.035,.05,.143,.19,.13);
    elbow.rotation.z=side*.36;
    const leg=add(foot,sphere,sides,side*.16,-.138,.095,.112,.16,.115);
    leg.rotation.z=side*.65;
    add(foot,sphere,skin,side*.21,-.238,.16,.184,.074,.171);
    for(let i=-1;i<=1;i++)add(foot,sphere,flesh,side*.22+i*.09,-.25,.261,.047,.046,.081);
    feet.push(foot);
  }
  for(let i=0;i<3;i++)for(const sign of [-1,1]){
    const stripe=add(rig,sphere,sides,sign*(.483-i*.016),.70,.24-i*.2,.027,.108,.045);
    stripe.rotation.x=.30;
  }
  return {rig,skin,sides,flesh,tail,body,belly,head,feet,lids};
}

function createDrone(parent) {
  const g=new T.Group();
  parent.add(g);
  const shell=material('#f9f7ff',.31);
  const purple=material('#683bfa',.42);
  const visor=material('#11193f',.22);
  const light=basic('#ff48a0');
  add(g,sphere,purple,0,0,0,.55,.26,.47);
  add(g,sphere,shell,0,.13,0,.56,.27,.46);
  add(g,sphere,visor,0,.065,.32,.39,.172,.19);
  add(g,sphere,light,0,.071,.49,.15,.055,.022);
  add(g,sphere,cream,0,.083,.514,.051,.019,.007);
  add(g,cylinder,purple,0,.36,-.17,.044,.21,.044);
  add(g,sphere,light,0,.495,-.17,.081);
  const rings=[];
  for(const side of [-1,1]){
    add(g,cube,purple,side*.48,.04,0,.39,.12,.19);
    add(g,cylinder,visor,side*.75,.04,0,.23,.125,.23);
    add(g,cylinder,shell,side*.75,.14,0,.27,.08,.27);
    add(g,cylinder,basic('#72ffef'),side*.75,.18,0,.21,.021,.21);
    const rotor=add(g,cube,purple,side*.75,.21,0,.39,.025,.08);
    rings.push(rotor);
  }
  return {group:g,rings,light};
}

function makeScenery(scene) {
  const stage=new T.Group();
  scene.add(stage);
  const rail=material('#045ee7',.38);
  const island=material('#319cf5');
  const trim=material('#1a3574');
  const runway=material('#dff4ff',.83);
  const body=octagon(stage,trim,0,-1.35,0,5.06,.40);
  body.scale.z*=.95;
  const bevel=octagon(stage,rail,0,-.98,0,5.05,.39,true);
  bevel.scale.z*=.95;
  const top=octagon(stage,runway,0,-.72,0,4.73,.16);
  top.scale.z*=.95;
  const floor=new T.Group();
  scene.add(floor);
  add(floor,cylinder,island,0,-3.65,0,6.54,.26,6.54);
  add(floor,cylinder,material('#e4ffff'),0,-3.81,0,6.72,.08,6.72);
  for(const [x,z] of [[-3.75,-3.32],[3.75,-3.32],[-3.75,3.32],[3.75,3.32]]){
    add(stage,cylinder,trim,x,-1.96,z,.33,1.4,.33);
    add(stage,cylinder,rail,x,-1.92,z,.41,.17,.41);
    add(stage,cylinder,milk,x,-2.57,z,.48,.18,.48);
  }
  for(const [x,z] of [[-3.58,-3.56],[3.58,-3.56],[-3.58,3.56],[3.58,3.56]]){
    add(stage,cylinder,rail,x,-.43,z,.15,.48,.15);
    add(stage,sphere,cream,x,-.16,z,.14);
  }
  const signs=material('#ffcf20');
  for(const side of [-1,1]) for(let i=0;i<5;i++){
    const dash=add(stage,cube,i%2?milk:signs,side*(.35+i*.45),-.615,3.87,.32,.016,.19);
    dash.rotation.y=-.35*side;
  }
  for(const side of [-1,1]){
    const pipeX=side*5.07;
    line(scene,[[pipeX,-3.6,-2.7],[pipeX,-1.16,-2.7],[pipeX,-.92,-2.44],[pipeX,-.92,-1.9]],rail,.25);
    add(scene,cylinder,trim,pipeX,-2.23,-2.7,.322,.18,.322);
    add(scene,cylinder,milk,pipeX,-3.03,-2.7,.31,.17,.31);
    add(scene,sphere,signs,pipeX,-.94,-1.83,.30);
  }
  const cloud=material('#edfcff',.95);
  const puffs=new T.Group();
  scene.add(puffs);
  for(const [x,y,z,s] of [[-6,0,-6,1.1],[6,1.1,-7,1.2],[-8,-2,3,1.3],[7,-2,3,.9],[-2,.1,-8,1]]){
    add(puffs,sphere,cloud,x,y,z,s,.31*s,.50*s);
    add(puffs,sphere,cloud,x+.21*s,y+.19*s,z,s*.61,s*.46,s*.44);
    add(puffs,sphere,cloud,x-.59*s,y+.10*s,z,s*.48,s*.32,s*.40);
  }
  return {rail,island,puffs};
}

function makePad(scene,p,index) {
  const group=new T.Group();
  scene.add(group);
  group.position.set(p.x,-.25,p.z);
  const paint=material('#ffdb16',.36);
  const border=material('#ffd1ac',.44);
  const colorEdge=material('#d17409');
  octagon(group,rubber,0,-.31,0,1.18,.19);
  octagon(group,colorEdge,0,-.15,0,1.155,.24);
  octagon(group,border,0,.025,0,1.16,.115,true);
  octagon(group,paint,0,.101,0,1.092,.075,true);
  const stamps=glyphs.map(geometry=>[
    floorBadge(group,geometry,outline,0,.142,0,.43),
    floorBadge(group,geometry,cream,0,.146,0,.33)
  ]);
  for(const z of [-.73,.73])for(const x of [-.69,.69]){
    add(group,sphere,milk,x,.138,z,.039,.021,.039);
  }
  return {index,group,paint,border,colorEdge,stamps};
}

export function makeView(initialCanvas) {
  let canvas=initialCanvas;
  let renderer=null;
  let ctx=null;
  const scene=new T.Scene();
  const camera=new T.OrthographicCamera(-6,6,6,-6,.1,100);
  const sky=new T.Color();
  scene.background=sky;
  scene.add(new T.HemisphereLight('#f0ffff','#6b70ae',.73));
  const key=new T.DirectionalLight('#fff6d2',.91);
  key.position.set(-4,10,7);
  scene.add(key);
  const rim=new T.DirectionalLight('#acf8ff',.36);
  rim.position.set(5,6,-8);
  scene.add(rim);
  const scenery=makeScenery(scene);
  const pads=positions.map((p,i)=>makePad(scene,p,i));
  const hero=createHero(scene);
  const drone=createDrone(scene);
  const shadowMat=new T.MeshBasicMaterial({map:contactTexture(),transparent:true,opacity:.74,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
  const shadow=add(scene,new T.PlaneGeometry(1,1),shadowMat,0,-.096,0,1.93,1.46,1);
  shadow.rotation.x=-Math.PI/2;
  const sweepMat=basic('#ff298e',.26);
  const scanner=add(scene,cube,sweepMat,0,.04,0,7.64,.025,.78);
  const laser=add(scanner,cube,basic('#fff6f9'),0,.52,.33,1,.56,.1);
  const haloMaterial=basic('#e8ff7a',.92);
  const halo=add(scene,new T.RingGeometry(.85,1.02,32),haloMaterial,0,.155,0);
  halo.rotation.x=-Math.PI/2;
  const marks=new T.Group();
  scene.add(marks);
  const arrow=new T.Shape();
  arrow.moveTo(-.20,.34);
  arrow.lineTo(.20,.34);
  arrow.lineTo(.20,.01);
  arrow.lineTo(.39,.01);
  arrow.lineTo(0,-.42);
  arrow.lineTo(-.39,.01);
  arrow.lineTo(-.20,.01);
  arrow.closePath();
  const arrowGeo=new T.ShapeGeometry(arrow);
  add(marks,arrowGeo,outline,0,0,0,1.24);
  add(marks,arrowGeo,cream,0,0,.018,1.07);
  add(marks,arrowGeo,basic('#ffde29'),0,0,.035,.88);
  const particleGeo=new T.OctahedronGeometry(1,0);
  const burstMaterials=['#fff084','#ffffff','#ff42a1','#00f5d8','#9948ff'].map(c=>basic(c));
  const particles=Array.from({length:26},(_,i)=>add(scene,particleGeo,burstMaterials[i%5],0,-10,0,.08));
  const point=new T.Vector3();
  const ray=new T.Raycaster();
  const cursor=new T.Vector2();
  const plane=new T.Plane(new T.Vector3(0,1,0),.105);
  const hit=new T.Vector3();
  let width=1,height=1,dpr=1,boardTag='',activeLab=-1,pose=0,modelTime=0,facing=0,lastX=0,lastZ=0;

  function resize() {
    width=canvas.clientWidth||320;
    height=canvas.clientHeight||568;
    dpr=Math.min(devicePixelRatio||1,1.35);
    const aspect=width/height;
    const wide=width>height;
    const span=wide?10.8:Math.max(10.7,10.5/aspect);
    camera.left=-span*aspect/2;
    camera.right=span*aspect/2;
    camera.top=span/2;
    camera.bottom=-span/2;
    camera.position.set(4.7,12.8,15.4);
    camera.lookAt(0,-.26,0);
    camera.setViewOffset(width,height,wide?width*.164:0,wide?-height*.035:height*.025,width,height);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    if(renderer){
      renderer.setPixelRatio(dpr);
      renderer.setSize(width,height,false);
    } else {
      canvas.width=Math.round(width*dpr);
      canvas.height=Math.round(height*dpr);
    }
  }

  function fallback() {
    if(ctx) return;
    if(renderer){
      const next=canvas.cloneNode(false);
      renderer.dispose();
      canvas.replaceWith(next);
      canvas=next;
    }
    renderer=null;
    ctx=canvas.getContext('2d');
    canvas.dataset.renderer='canvas';
    resize();
  }

  try {
    renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'low-power'});
    renderer.outputEncoding=T.sRGBEncoding;
    renderer.toneMapping=T.NoToneMapping;
    canvas.dataset.renderer='webgl';
    canvas.addEventListener('webglcontextlost',event=>{
      event.preventDefault();
      fallback();
    },{once:true});
  } catch {
    const replacement=canvas.cloneNode(false);
    canvas.replaceWith(replacement);
    canvas=replacement;
    fallback();
  }
  resize();

  function screen(x,y,z) {
    point.set(x,y,z).project(camera);
    return [(point.x*.5+.5)*width,(.5-point.y*.5)*height];
  }

  function select(clientX,clientY) {
    const box=canvas.getBoundingClientRect();
    cursor.set(((clientX-box.left)/box.width)*2-1,1-((clientY-box.top)/box.height)*2);
    ray.setFromCamera(cursor,camera);
    if(!ray.ray.intersectPlane(plane,hit)) return -1;
    if(Math.abs(hit.x)>4.08||Math.abs(hit.z)>4.08) return -1;
    return closest(hit.x,hit.z);
  }

  function setBoard(run) {
    const lab=run.data.lab;
    const board=run.board;
    const tag=lab+'/'+board.tiles.join('')+'/'+board.target;
    if(tag===boardTag)return;
    boardTag=tag;
    if(activeLab!==lab){
      sky.set(labs[lab].sky);
      scenery.rail.color.set(labs[lab].rail);
      scenery.island.color.set(labs[lab].island);
      activeLab=lab;
    }
    for(let i=0;i<pads.length;i++){
      const pad=pads[i];
      const p=colors[board.tiles[i]];
      pad.paint.color.set(p.hex);
      pad.border.color.set(p.light);
      pad.colorEdge.color.set(p.dark);
      for(let j=0;j<pad.stamps.length;j++)for(const m of pad.stamps[j])m.visible=j===board.tiles[i];
    }
    const hue=colors[board.target];
    hero.skin.color.set(hue.hex);
    hero.sides.color.set(hue.dark).lerp(new T.Color(hue.hex),.41);
    hero.flesh.color.set(hue.light);
  }

  function render(run,dt,clock,mode,feedbackAge,rewards) {
    setBoard(run);
    modelTime+=dt;
    const board=run.board;
    const aim=mode==='active'&&run.phase==='aim';
    const ratio=Math.min(1,run.t/board.duration);
    const dx=run.x-lastX,dz=run.z-lastZ;
    const moving=Math.hypot(dx,dz)>.005&&aim;
    if(moving){
      const wanted=Math.atan2(dx,dz);
      facing+=Math.atan2(Math.sin(wanted-facing),Math.cos(wanted-facing))*Math.min(1,dt*22);
      pose+=dt*23;
    } else {
      facing+=Math.atan2(Math.sin(.3-facing),Math.cos(.3-facing))*Math.min(1,dt*5);
    }
    lastX=run.x;
    lastZ=run.z;
    const event=run.event;
    const hitFlash=event&&!event.safe&&feedbackAge<.24;
    const jump=event?.safe?Math.sin(Math.min(1,feedbackAge/.64)*Math.PI)*.43:0;
    const scale=1.12*(event?.safe?1+Math.sin(Math.min(1,feedbackAge/.5)*Math.PI)*.13:1);
    const stride=moving?Math.sin(pose):0;
    hero.rig.position.set(run.x,Math.abs(stride)*.105+jump,run.z);
    hero.rig.rotation.y=facing;
    hero.rig.rotation.z=hitFlash?Math.sin(feedbackAge*77)*.25:stride*.075;
    hero.rig.scale.set(scale,scale*(moving?1-Math.abs(stride)*.095:1),scale);
    hero.tail.rotation.y=Math.sin(modelTime*7)*.24;
    hero.head.rotation.x=-.07+stride*.11;
    hero.feet.forEach((f,i)=>f.rotation.x=Math.sin(pose+i*1.72)*(moving?.61:0));
    const blink=modelTime%4.7>4.59;
    for(const group of hero.lids){
      group[0].scale.y=blink?.047:.224;
      group[1].visible=!blink;
      group[2].visible=!blink;
    }
    shadow.position.x=run.x;
    shadow.position.z=run.z;
    shadowMat.opacity=.72-jump*.53;
    const danger=Math.max(0,(ratio-.71)/.29);
    const lane=(board.reverse?1:-1)*(4.1-danger*8.2);
    scanner.visible=aim&&danger>0;
    scanner.rotation.y=board.axis==='x'?Math.PI/2:0;
    scanner.position.set(board.axis==='x'?lane:0,.17,board.axis==='z'?lane:0);
    sweepMat.opacity=.17+danger*.25;
    laser.visible=scanner.visible;
    const spin=modelTime*1.3;
    drone.group.position.set(aim&&danger>0&&board.axis==='x'?lane:2.9+Math.cos(spin)*.37,
      1.55+Math.sin(spin*2.3)*.14,
      aim&&danger>0&&board.axis==='z'?lane:-3.45+Math.sin(spin)*.31);
    drone.group.rotation.set(Math.sin(spin)*.05,-.13+Math.sin(spin)*.2,0);
    drone.rings.forEach((r,i)=>r.rotation.y=modelTime*36+i);
    drone.light.color.set(aim&&danger>0?'#ff3168':'#13e6ef');
    const padIndex=board.tiles.findIndex((h,i)=>h===board.target&&i>=6);
    const target=positions[padIndex<0?board.tiles.indexOf(board.target):padIndex];
    marks.visible=run.data.lab===0&&run.data.scan===0&&(mode==='ready'||aim&&!onPad(run,closest(target.x,target.z)));
    marks.position.set(target.x,.94+Math.sin(modelTime*7)*.13,target.z);
    marks.quaternion.copy(camera.quaternion);
    const landed=closest(run.x,run.z);
    halo.visible=aim&&onPad(run,landed)&&board.tiles[landed]===board.target;
    halo.position.set(positions[landed].x,-.092,positions[landed].z);
    haloMaterial.opacity=.70+Math.sin(modelTime*9)*.23;
    scenery.puffs.position.x=Math.sin(clock*.22)*.6;
    for(let i=0;i<particles.length;i++){
      const p=particles[i];
      const age=feedbackAge;
      p.visible=!!event&&age<.72&&(event.safe?i<(rewards.comment?26:19):i<9);
      if(!p.visible)continue;
      const theta=i*2.39996;
      const speed=1.8+(i%7)*.29;
      p.position.set(run.x+Math.cos(theta)*age*speed,.55+age*(3.5+(i%5)*.23)-age*age*4.1,run.z+Math.sin(theta)*age*speed);
      p.scale.setScalar((1-age/.76)*(.075+(i%4)*.026));
      p.rotation.set(age*8+i,age*5+i*.7,age*4);
      p.material=event.safe?burstMaterials[rewards.like?i%2:i%5]:burstMaterials[2];
    }
    if(renderer)renderer.render(scene,camera);
    else if(ctx)draw2D(run,clock,feedbackAge);
  }

  function draw2D(run,clock,age) {
    const c=ctx;
    c.setTransform(dpr,0,0,dpr,0,0);
    c.fillStyle=labs[run.data.lab].sky;
    c.fillRect(0,0,width,height);
    const poly=(points,fill,stroke='#17396c')=>{
      c.beginPath();
      points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
      c.closePath();c.fillStyle=fill;c.fill();c.lineWidth=1.4;c.strokeStyle=stroke;c.stroke();
    };
    const quad=(x,y,z,s)=>[[-s,-s],[s,-s],[s,s],[-s,s]].map(([dx,dz])=>screen(x+dx,y,z+dz));
    const ellipse=(x,y,rx,ry,fill)=>{
      c.beginPath();c.ellipse(x,y,Math.max(1,rx),Math.max(1,ry),0,0,2*Math.PI);c.fillStyle=fill;c.fill();
    };
    for(let i=0;i<10;i++){
      const x=(i*101+clock*8)%(width+100)-35;
      ellipse(x,30+i*height/11,35,9,'#edfaff88');
    }
    poly(quad(0,-1.15,0,3.81),labs[run.data.lab].rail);
    poly(quad(0,-.53,0,3.78),'#def2ff');
    const order=[0,1,2,3,4,5,6,7,8];
    order.sort((a,b)=>screen(positions[a].x,0,positions[a].z)[1]-screen(positions[b].x,0,positions[b].z)[1]);
    const size=Math.max(15,width>height?height*.1:width*.09);
    for(const i of order){
      const p=positions[i],col=colors[run.board.tiles[i]];
      poly(quad(p.x,-.29,p.z,1.03),col.dark);
      poly(quad(p.x,-.12,p.z,1.04),col.light);
      poly(quad(p.x,-.10,p.z,.93),col.hex);
      const [x,y]=screen(p.x,0,p.z);
      c.fillStyle='#17396c';c.textAlign='center';c.textBaseline='middle';c.font=`bold ${size*.6}px system-ui`;c.fillText(col.shape,x,y);
    }
    if(scanner.visible){
      const axis=run.board.axis;
      const offset=axis==='x'?scanner.position.x:scanner.position.z;
      const corners=[[-3.82,-.28],[3.82,-.28],[3.82,.28],[-3.82,.28]];
      poly(corners.map(([a,b])=>axis==='x'?screen(offset+b,.07,a):screen(a,.07,offset+b)),'#ff328e78','#fff7fc');
    }
    if(halo.visible){
      const [hx,hy]=screen(halo.position.x,.03,halo.position.z);
      ellipse(hx,hy,size*.83,size*.33,'#edff6b8a');
    }
    const [x,y]=screen(run.x,.61,run.z);
    const col=colors[run.board.target];
    ellipse(x,y+size*.49,size*.57,size*.17,'#12305765');
    ellipse(x-size*.21,y+size*.05,size*.47,size*.33,col.dark);
    ellipse(x+size*.06,y,size*.44,size*.38,col.hex);
    ellipse(x+size*.26,y-size*.17,size*.23,size*.24,'#fff');
    ellipse(x+size*.31,y-size*.17,size*.086,size*.109,'#142c51');
    if(run.event&&age<.64)for(let i=0;i<10;i++){
      const r=age*size*3,theta=i*.628;
      ellipse(x+Math.cos(theta)*r,y+Math.sin(theta)*r,3,3,run.event.safe?'#fff280':'#ff4080');
    }
    const d=drone.group.position;
    const [drx,dry]=screen(d.x,d.y,d.z);
    ellipse(drx,dry,size*.39,size*.21,'#6e3bff');
    ellipse(drx,dry-size*.09,size*.36,size*.16,'#fff');
    ellipse(drx,dry+size*.026,size*.18,size*.065,'#ff468d');
  }

  return {resize,render,select,canvas:()=>canvas,screen};
}
