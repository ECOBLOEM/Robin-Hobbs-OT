/* Home page scroll scenes:
   1. "The Climb" hero: 3D blocks drop in on scroll, a child climbs and plants a seedling.
      Mouse tilt on desktop, gentle sway on touch, tap/Enter a block for a tooltip.
   2. "Growth you can see": the tree grows branch by branch through the six steps. */
(() => {
/* ===== HERO ===== */
const NS='http://www.w3.org/2000/svg';
const mk=(t,a={},p)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e;};
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const bounce=t=>{const n=7.5625,d=2.75;if(t<1/d)return n*t*t;if(t<2/d)return n*(t-=1.5/d)*t+.75;if(t<2.5/d)return n*(t-=2.25/d)*t+.9375;return n*(t-=2.625/d)*t+.984375;};
const shade=(hex,amt)=>{const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;const f=v=>Math.round(amt<0?v*(1+amt):v+(255-v)*amt).toString(16).padStart(2,'0');return`#${f(r)}${f(g)}${f(b)}`;};
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

const B=84, X0=148, GROUND=640;
const COLS=[
  {w:'Grip',c:'#C8643B',tip:'Fine motor: grasp, release and strong little hands.',cap:'Strong little hands are where it starts: holding, squeezing, letting go.',icon:'hand'},
  {w:'Balance',c:'#E0A43A',tip:'Gross motor: core strength, posture and coordination.',cap:'Steady bodies make steady learners. Core strength and coordination come next.',icon:'balance'},
  {w:'Focus',c:'#7E9C76',tip:'Attention and self-regulation.',cap:'Sitting still, listening, managing big feelings: skills that can be taught.',icon:'eye'},
  {w:'Write',c:'#6FA3BC',tip:'Pencil grip, letter formation and school readiness.',cap:'Pencil grip, letter formation, copying from the board. School gets easier.',icon:'pencil'},
  {w:'Play',c:'#8A5A7A',tip:'Social play: sharing, turn-taking and imagination.',cap:'Play is a child’s real work: sharing, turn-taking, imagination.',icon:'ball'},
  {w:'Thrive',c:'#2F4A3A',tip:'Confidence and independence at home and school.',cap:'Confident, capable, independent. Now watch it grow.',icon:'star'}
];
const SHAPES=['M0 -11 A11 11 0 1 1 0 11 A11 11 0 1 1 0 -11Z','M0 -12 L12 9 H-12Z','M-10 -10 H10 V10 H-10Z','M0 -12 L3.5 -4 L12 -3.5 L5.5 2.5 L7.5 11 L0 6.5 L-7.5 11 L-5.5 2.5 L-12 -3.5 L-3.5 -4Z','M0 10 C-14 0 -12 -12 -5 -11 C-2 -11 0 -8 0 -6 C0 -8 2 -11 5 -11 C12 -12 14 0 0 10Z'];
const ICONS={
  hand:'M-8 10 V-2 M-8 -2 V-12 M-3 -2 V-15 M2 -2 V-13 M7 -1 V-9 M-13 2 L-8 -2 M-8 10 Q0 16 7 6 V-1',
  balance:'M-14 8 H14 M0 8 L0 -2 M-14 -2 H14 M-14 -2 L-14 -6 M14 -2 L14 -6 M0 -8 A4 4 0 1 1 0.1 -8',
  eye:'M-14 0 Q0 -13 14 0 Q0 13 -14 0Z M0 -4 A4 4 0 1 1 -0.1 -4',
  pencil:'M-10 10 L-12 12 L-6 11 L11 -6 L6 -11 L-11 6Z M3 -8 L8 -3',
  ball:'M0 -12 A12 12 0 1 1 -0.1 -12 M-12 0 Q0 -6 12 0 M0 -12 Q-6 0 0 12',
  star:'M0 -13 L4 -4 L13 -4 L6 2 L8 12 L0 6 L-8 12 L-6 2 L-13 -4 L-4 -4Z'
};

const colsG=document.getElementById('cols'), shadowsG=document.getElementById('shadows'), fx=document.getElementById('fx');
const cols=COLS.map((c,i)=>{
  const outer=mk('g',{},colsG);
  const g=mk('g',{class:'col',tabindex:-1,role:'button','aria-label':`${c.w}: ${c.tip}`},outer);
  const x=X0+i*B, cubes=[];
  for(let j=0;j<=i;j++){
    const y=GROUND-(j+1)*B, top=j===i;
    const base=top?c.c:shade(c.c,.18+j*.02);
    const side=mk('polygon',{fill:shade(base,-.28),stroke:shade(base,-.28),'stroke-width':2,'stroke-linejoin':'round'},g);
    const tp=mk('polygon',{fill:shade(base,.22),stroke:shade(base,.22),'stroke-width':2,'stroke-linejoin':'round'},g);
    mk('rect',{x,y,width:B,height:B,rx:6,fill:base},g);
    mk('rect',{x,y,width:B,height:B,rx:6,fill:'url(#shine)'},g);
    mk('rect',{x:x+9,y:y+9,width:B-18,height:B-18,rx:8,fill:'none',stroke:'#fff','stroke-opacity':.28,'stroke-width':2},g);
    if(top){
      mk('path',{d:ICONS[c.icon],transform:`translate(${x+B/2} ${y+33})`,fill:c.icon==='star'?'#E0A43A':'none',stroke:'#fff','stroke-width':2.6,'stroke-linecap':'round','stroke-linejoin':'round'},g);
      const t=mk('text',{x:x+B/2,y:y+B-15,'text-anchor':'middle','font-family':'Fraunces, serif','font-size':c.w.length>5?15:17,fill:'#fff'},g);t.textContent=c.w;
    }else{
      mk('path',{d:SHAPES[(i+j)%5],transform:`translate(${x+B/2} ${y+B/2})`,fill:'#fff','fill-opacity':.5},g);
    }
    cubes.push({x,y,side,tp});
  }
  const sh=mk('ellipse',{cx:x+B/2+8,cy:GROUND+3,rx:B/2+6,ry:7,fill:'#2B2620',opacity:0},shadowsG);
  return {outer,g,cubes,sh,landed:false,i};
});

const meter=document.getElementById('meter');COLS.forEach(()=>meter.appendChild(document.createElement('span')));

const $=id=>document.getElementById(id);
const kid=$('kid'),legF=$('legF'),legB=$('legB'),armF=$('armF'),armB=$('armB'),shoeF=$('shoeF'),shoeB=$('shoeB'),mouth=$('mouth'),head=$('head');
const sun=$('sun'),c1=$('c1'),c2=$('c2'),hills=$('hills'),hills2=$('hills2');
const seed=$('seed'),stem=$('stem'),leafL=$('leafL'),leafR=$('leafR');
const capStep=$('capStep'),capText=$('capText'),tip=$('tip'),wrap=$('sceneWrap'),climbEl=document.querySelector('.climb'),scene=$('scene');
const stemLen=stem.getTotalLength();stem.style.strokeDasharray=stemLen;
// Mobile camera: start close on the first block, pull back as the stack grows
// (so there's no empty sky on load), end on the full scene with the sun.
const narrow=matchMedia('(max-width: 860px)');
let aspect=1;
const fadeRect=document.getElementById('fadeRect'),topFadeGrad=document.getElementById('topFadeGrad'),topFadeSolid=document.getElementById('topFadeSolid');
const measure=()=>{aspect=scene.clientWidth/Math.max(1,scene.clientHeight)||1;if(!narrow.matches){scene.setAttribute('viewBox','0 0 800 700');fadeRect.setAttribute('x',0);fadeRect.setAttribute('width',800);topFadeGrad.setAttribute('y',0);topFadeGrad.setAttribute('height',110);topFadeSolid.setAttribute('y',110);}};
measure();addEventListener('resize',measure);narrow.addEventListener('change',measure);
function camera(s){
  const level=clamp((s+.25)/.9,1,6), fin=clamp((s-5.6)/.8);
  let w=Math.max(430,X0+level*B+70-60), h=Math.max(level*B+175,w/aspect);
  w=h*aspect;
  let x=60,y=668-h;
  const H=Math.max(600,580/aspect), W=H*aspect; // final view: whole stack + sun
  x=lerp(x,130-(W-580)/2,fin);y=lerp(y,668-H,fin);w=lerp(w,W,fin);h=lerp(h,H,fin);
  scene.setAttribute('viewBox',`${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`);
  fadeRect.setAttribute('x',x.toFixed(1));fadeRect.setAttribute('width',w.toFixed(1)); // soft edges follow the camera
  const g=h*.14;topFadeGrad.setAttribute('y',y.toFixed(1));topFadeGrad.setAttribute('height',g.toFixed(1));topFadeSolid.setAttribute('y',(y+g).toFixed(1));
}

let lastDx=NaN,lastDy=NaN,mx=0,my=0,tmx=0,tmy=0,pS=0,manualCap=-1,lastCap=-9,confettiDone=false;
const fine=matchMedia('(pointer:fine)').matches;
addEventListener('pointermove',e=>{if(!fine)return;tmx=e.clientX/innerWidth*2-1;tmy=e.clientY/innerHeight*2-1;});

function setCaption(i){
  capStep.textContent=i<0?'Start here':`Step ${i+1} · ${COLS[i].w}`;
  capText.textContent=i<0?'Every big skill is built from small ones. Scroll to watch them stack up.':COLS[i].cap;
}

/* interactions */
cols.forEach(col=>{
  const show=()=>{const r=col.g.getBoundingClientRect(),w=wrap.getBoundingClientRect();tip.innerHTML=`<b>${COLS[col.i].w}</b>${COLS[col.i].tip}`;const half=Math.min(110,tip.offsetWidth/2||110)+4;tip.style.left=clamp(r.left+r.width/2-w.left,half,w.width-half)+'px';tip.style.top=(r.top-w.top)+'px';tip.classList.add('on');};
  const hide=()=>tip.classList.remove('on');
  col.g.addEventListener('pointerenter',show);col.g.addEventListener('pointerleave',hide);
  col.g.addEventListener('focus',show);col.g.addEventListener('blur',hide);
  const act=()=>{col.g.classList.remove('wiggle');void col.g.getBoundingClientRect();col.g.classList.add('wiggle');setCaption(col.i);manualCap=col.i;dust(X0+col.i*B+B/2,GROUND-(col.i+1)*B,8,COLS[col.i].c);show();clearTimeout(col.t);col.t=setTimeout(hide,2200);};
  col.g.addEventListener('click',act);
  col.g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();act();}});
});

/* particles */
const parts=[];
function dust(x,y,n,color){for(let k=0;k<n;k++){const el=mk('circle',{r:2+Math.random()*3,fill:color||'#B9A98F'},fx);parts.push({el,x,y,vx:(Math.random()-.5)*3.2,vy:-Math.random()*2.2,g:.08,life:1,decay:.025+Math.random()*.02});}}
function confetti(x,y){const C=['#C8643B','#E0A43A','#7E9C76','#6FA3BC','#8A5A7A'];for(let k=0;k<46;k++){const el=mk('rect',{width:6,height:10,rx:1.5,fill:C[k%5]},fx);parts.push({el,x,y,vx:(Math.random()-.5)*7,vy:-3-Math.random()*5,g:.14,life:1,decay:.008+Math.random()*.008,rot:Math.random()*360,vr:(Math.random()-.5)*14});}}
function stepParts(){for(let k=parts.length-1;k>=0;k--){const p=parts[k];p.vy+=p.g;p.x+=p.vx;p.y+=p.vy;p.life-=p.decay;if(p.rot!==undefined){p.rot+=p.vr;p.el.setAttribute('transform',`translate(${p.x} ${p.y}) rotate(${p.rot})`);}else{p.el.setAttribute('cx',p.x);p.el.setAttribute('cy',p.y);}p.el.setAttribute('opacity',clamp(p.life));if(p.life<=0||p.y>GROUND+20&&p.rot===undefined){p.el.remove();parts.splice(k,1);}}}

/* kid poses */
function pose(lift,cheer,reach){
  const kF=[4+lift*10,-18-lift*8],fF=[5+lift*12,-lift*16];
  const kB=[-4-lift*2,-17],fB=[-6-lift*3,0];
  legF.setAttribute('d',`M3 -30 L${kF} L${fF}`);legB.setAttribute('d',`M-3 -30 L${kB} L${fB}`);
  shoeF.setAttribute('cx',fF[0]+3);shoeF.setAttribute('cy',fF[1]);shoeB.setAttribute('cx',fB[0]+2);shoeB.setAttribute('cy',fB[1]);
  if(cheer>0){
    const a=cheer;armF.setAttribute('d',`M10 -58 L${lerp(18,18,a)} ${lerp(-46,-74,a)} L${lerp(22,24,a)} ${lerp(-36,-94,a)}`);
    armB.setAttribute('d',`M-10 -58 L${lerp(-16,-18,a)} ${lerp(-46,-74,a)} L${lerp(-20,-24,a)} ${lerp(-36,-94,a)}`);
  }else{
    const r=reach;armF.setAttribute('d',`M10 -58 L${16+r*6} ${-46-r*12} L${18+r*12} ${-36-r*24}`);
    armB.setAttribute('d',`M-10 -58 L${-15+r*8} ${-46-r*8} L${-17+r*14} ${-36-r*16}`);
  }
}

function topOf(k,dx,dy){return k===0?{x:X0-62,y:GROUND}:{x:X0+(k-1)*B+B/2+dx*.5-4,y:GROUND-k*B-dy*.5};}

function frame(t){
  requestAnimationFrame(frame);
  const r=climbEl.getBoundingClientRect();
  if(r.bottom<0||r.top>innerHeight){stepParts();return;}
  const p=reduce?1:clamp(-r.top/(r.height-innerHeight));
  pS+= (p-pS)*(reduce?1:.12);
  if(!fine){tmx=Math.sin(t/1700)*.5;tmy=Math.cos(t/2300)*.3;}
  mx+=(tmx-mx)*.06;my+=(tmy-my)*.06;
  if(reduce){mx=0;my=0;}
  const dx=17+mx*11, dy=15-my*6;
  const s=.62+pS*7.38; // first block already landed on load
  if(narrow.matches)camera(s);

  // background parallax
  if(reduce)t=0;
  hills.setAttribute('transform',`translate(${-mx*10} 0)`);
  hills2.setAttribute('transform',`translate(${-mx*18} 0)`);
  c1.setAttribute('transform',`translate(${(120+t*.012)%960-80-mx*14} 95)`);
  c2.setAttribute('transform',`translate(${(560+t*.008)%960-80-mx*8} 150)`);

  // columns
  const tilt=Math.abs(dx-lastDx)>.02||Math.abs(dy-lastDy)>.02;if(tilt){lastDx=dx;lastDy=dy;}
  cols.forEach((col,i)=>{
    const e=clamp((s-i*.9)/.65), fall=1-bounce(e);
    col.outer.setAttribute('transform',`translate(0 ${-fall*640})`);
    col.outer.setAttribute('opacity',e>0?1:0);
    col.sh.setAttribute('opacity',e*.16);col.sh.setAttribute('rx',(B/2+6)*(.4+.6*e));
    if(tilt)col.cubes.forEach(c=>{
      c.tp.setAttribute('points',`${c.x},${c.y} ${c.x+B},${c.y} ${c.x+B+dx},${c.y-dy} ${c.x+dx},${c.y-dy}`);
      c.side.setAttribute('points',`${c.x+B},${c.y} ${c.x+B+dx},${c.y-dy} ${c.x+B+dx},${c.y+B-dy} ${c.x+B},${c.y+B}`);
    });
    const on=e>.5;if(on!==col.on){col.on=on;col.g.setAttribute('tabindex',on?0:-1);col.g.style.pointerEvents=on?'':'none';}
    if(e>=.36&&!col.landed&&!reduce){col.landed=true;dust(X0+i*B+B/2,GROUND,14);}
    if(e<.2)col.landed=false;
  });

  // kid
  const T=clamp((s-.55)/.9,0,5.6);
  let k=0,he=0;
  for(let q=0;q<6;q++){const a=q*.9+.5,b=a+.38;if(s>=b)k=q+1;else if(s>a){k=q;he=(s-a)/.38;break;}}
  he=he*he*(3-2*he);
  const A=topOf(k,dx,dy),Bp=topOf(Math.min(6,k+1),dx,dy);
  const fin=clamp((s-5.7)/.5);
  let x=lerp(A.x,Bp.x,he)-fin*14, y=lerp(A.y,Bp.y,he)-Math.sin(he*Math.PI)*(56);
  const cheer=clamp((s-6.4)/.4);
  const jump=reduce?0:cheer>0&&cheer<1?0:cheer>=1?Math.abs(Math.sin(t/260))*6:0;
  kid.setAttribute('transform',`translate(${x} ${y-jump})`);
  $('kidShadow').setAttribute('opacity',he>0?.05:.15);
  pose(Math.sin(he*Math.PI),cheer,Math.sin(he*Math.PI));
  head.setAttribute('transform',`rotate(${mx*6} 0 -80)`);
  mouth.setAttribute('d',cheer>0?'M-5 -74 Q0 -66 6 -74Z':'M-4 -73 Q1 -69 5 -73');
  mouth.setAttribute('fill',cheer>0?'#2B2620':'none');

  // seedling on top of column 6
  const top6=topOf(6,dx,dy), sg=clamp((s-5.9)/.6);
  seed.setAttribute('opacity',sg>0?1:0);
  seed.setAttribute('transform',`translate(${top6.x+26} ${top6.y+2})`);
  stem.style.strokeDashoffset=stemLen*(1-sg);
  leafL.setAttribute('transform',`translate(0 -30) scale(${clamp((sg-.5)*2)}) translate(0 30)`);
  leafR.setAttribute('transform',`translate(0 -38) scale(${clamp((sg-.7)*3.3)}) translate(0 38)`);

  // sun
  const sp=clamp((s-6)/.8);
  sun.setAttribute('opacity',sp);sun.setAttribute('transform',`translate(${-mx*6} ${(1-sp)*140})`);

  if(cheer>=1&&!confettiDone&&!reduce){confettiDone=true;confetti(top6.x,top6.y-60);}
  if(s<6)confettiDone=false;

  // caption + meter
  const ci=pS<.015?-1:cols.filter((c,i)=>clamp((s-i*.9)/.65)>.5).length-1;
  if(ci!==lastCap){lastCap=ci;manualCap=-1;setCaption(ci);}
  [...meter.children].forEach((m,i)=>m.classList.toggle('on',i<=ci));
  stepParts();
}
requestAnimationFrame(frame);

})();

(() => {
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v,a=0,b=1) => Math.min(b, Math.max(a, v));
const ease = t => 1 - Math.pow(1 - t, 3);
const progressOf = el => { const r = el.getBoundingClientRect(); return clamp(-r.top / (r.height - innerHeight)); };
const NS = 'http://www.w3.org/2000/svg';
const mk = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };

/* ===== TREE ===== */
// Roots grow first (assessment), then the trunk, branches, leaves and fruit.
// Leaves rustle gently while in view; a robin lands on a bare twig at "Independence".
const treeSvg = document.getElementById('tree');
const branches = [...treeSvg.querySelectorAll('.br')];
branches.forEach(b => { const L = b.getTotalLength(); b.style.strokeDasharray = L; b.style.strokeDashoffset = L; b.dataset.l = L; });
const LEAF_COLS = ['#7E9C76', '#5E8466', '#A3B98A', '#2F4A3A'];
const clusters = [
  {s: 1, pts: [[410, 380], [195, 355], [425, 360], [180, 340]]},
  {s: 2, pts: [[440, 250], [165, 235], [455, 230], [150, 215], [420, 270]]},
  {s: 3, pts: [[360, 150], [235, 150], [300, 120], [330, 170], [265, 175]]},
  {s: 4, pts: [[300, 200], [380, 210], [220, 210], [470, 300], [130, 290], [300, 90]]}
];
const leavesG = document.getElementById('leaves');
const leafEls = [];
let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
clusters.forEach(c => c.pts.forEach(([x, y]) => {
  // each tuft of leaves sways around its own base (timings use Math.random so the leaf layout stays identical)
  const tuft = mk('g', {class: 'tuft'});
  tuft.style.transformOrigin = `${x}px ${y + 34}px`;
  tuft.style.animationDuration = (3.4 + Math.random() * 1.8).toFixed(2) + 's';
  tuft.style.animationDelay = (-Math.random() * 5).toFixed(2) + 's';
  leavesG.appendChild(tuft);
  for (let k = 0; k < 5; k++) {
    const r = 18 + rnd() * 22;
    const el = mk('circle', {cx: x + (rnd() - .5) * 60, cy: y + (rnd() - .5) * 50, r, fill: LEAF_COLS[Math.floor(rnd() * 4)], opacity: .9, class: 'leaf'});
    el.style.transitionDelay = (rnd() * .35) + 's';
    el.dataset.s = c.s; tuft.appendChild(el); leafEls.push(el);
  }
}));
[[370, 215], [240, 230], [430, 300], [175, 290], [310, 150], [270, 260]].forEach(([x, y]) => {
  const f = mk('circle', {cx: x, cy: y, r: 9, fill: '#C8643B', class: 'fruit'}); f.dataset.s = 5; leavesG.appendChild(f); leafEls.push(f);
});
const steps = [...document.querySelectorAll('#steps li')];
const grow = document.querySelector('.grow');

// only rustle / idle while the tree is on screen
new IntersectionObserver(([e]) => grow.classList.toggle('live', e.isIntersecting)).observe(grow);

/* robin */
const bird = document.getElementById('bird'), birdWing = document.getElementById('birdWing');
const birdWrap = document.getElementById('birdWrap'), perch = document.getElementById('perch');
const FROM = {x: 660, y: 150}, CTRL = {x: 540, y: 470}, PERCH = {x: 486, y: 413};
const BIRD_ON = 5.25, BIRD_OFF = 5.05;
let bp = 0, birdDir = 0, birdLast = 0, birdBusy = false;
function placeBird(q, now) {
  const e = q < .5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2, u = 1 - e; // glide in, settle
  const x = u * u * FROM.x + 2 * u * e * CTRL.x + e * e * PERCH.x;
  const y = u * u * FROM.y + 2 * u * e * CTRL.y + e * e * PERCH.y;
  bird.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(1.5)`);
  bird.setAttribute('opacity', q > 0 ? 1 : 0);
  const flap = q > 0 && q < 1 ? Math.sin(now / 42) * 38 * (1 - e * .7) - 12 : 0;
  birdWing.setAttribute('transform', `rotate(${flap.toFixed(1)} -1 -15)`);
}
function birdFrame(now) {
  const dt = Math.min(50, now - birdLast); birdLast = now;
  bp = clamp(bp + birdDir * dt / (birdDir > 0 ? 1500 : 900));
  placeBird(bp, now);
  if ((birdDir > 0 && bp < 1) || (birdDir < 0 && bp > 0)) return requestAnimationFrame(birdFrame);
  birdBusy = false;
  if (bp >= 1) { // touchdown: the twig dips under the robin
    birdWrap.classList.add('perched');
    [perch, birdWrap].forEach(g => { g.classList.remove('dip'); void g.getBoundingClientRect(); g.classList.add('dip'); });
  }
}
function flyBird(dir) {
  if (dir < 0) birdWrap.classList.remove('perched');
  if (reduce) { bp = dir > 0 ? 1 : 0; placeBird(bp, 0); if (dir > 0) birdWrap.classList.add('perched'); return; }
  birdDir = dir;
  if (!birdBusy) { birdBusy = true; birdLast = performance.now(); requestAnimationFrame(birdFrame); }
}
placeBird(0, 0);

function drawTree(p) {
  const s = p * 6.6;
  branches.forEach(b => {
    const k = clamp((s - +b.dataset.s) / (+b.dataset.d || 1));
    b.style.strokeDashoffset = b.dataset.l * (1 - ease(k));
  });
  leafEls.forEach(l => l.classList.toggle('on', s >= +l.dataset.s + .5));
  const cur = Math.min(5, Math.floor(s));
  steps.forEach((li, i) => { li.classList.toggle('on', i <= cur); li.classList.toggle('cur', i === cur); });
  if (s >= BIRD_ON && (bp < 1 && birdDir <= 0 || !birdBusy && bp < 1)) flyBird(1);
  else if (s < BIRD_OFF && bp > 0 && birdDir >= 0) flyBird(-1);
}

/* ===== loop ===== */
let ticking = false;
function frame() { ticking = false; drawTree(reduce ? 1 : progressOf(grow)); }
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, {passive: true});
addEventListener('resize', frame); frame();
})();

/* ===== SIGNATURE: a pencil writes "Robin" as the About section scrolls in ===== */
(() => {
const sig = document.querySelector('.sig'); if (!sig) return;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ink = sig.querySelector('.sig-ink'), dot = sig.querySelector('.sig-dot'), line = sig.querySelector('.sig-line'), pencil = sig.querySelector('.sig-pencil');
const L = ink.getTotalLength(), LL = line.getTotalLength();
ink.style.strokeDasharray = L; line.style.strokeDasharray = LL;
let ticking = false;
function draw() {
  ticking = false;
  const r = sig.getBoundingClientRect();
  const p = reduce ? 1 : clamp((innerHeight * .9 - r.top) / (innerHeight * .4));
  const a = clamp(p / .74), d = clamp((p - .76) / .06), u = clamp((p - .84) / .16);
  ink.style.strokeDashoffset = L * (1 - a);
  dot.style.opacity = d > 0 ? 1 : 0;
  line.style.strokeDashoffset = LL * (1 - u);
  const pt = u > 0 ? line.getPointAtLength(LL * u) : d > 0 && a >= 1 ? {x: 116, y: 35} : ink.getPointAtLength(L * a);
  pencil.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
  pencil.style.opacity = p > 0 && p < 1 ? 1 : 0;
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(draw); } }, {passive: true});
addEventListener('resize', draw); draw();
})();
