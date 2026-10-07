/* Home page scroll scenes: "The Climb" (hero) and "Growth you can see" (tree) */
(() => {
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v,a=0,b=1) => Math.min(b, Math.max(a, v));
const ease = t => 1 - Math.pow(1 - t, 3);
const progressOf = el => { const r = el.getBoundingClientRect(); return clamp(-r.top / (r.height - innerHeight)); };
const NS = 'http://www.w3.org/2000/svg';
const mk = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };

/* ===== HERO: blocks + climbing kid ===== */
const COLS = [
  {w:'Grip',    c:'#C8643B', cap:'Strong little hands are where it starts — holding, squeezing, letting go.'},
  {w:'Balance', c:'#E0A43A', cap:'Steady bodies make steady learners. Core strength and coordination come next.'},
  {w:'Focus',   c:'#7E9C76', cap:'Sitting still, listening, regulating big feelings — skills that can be taught.'},
  {w:'Write',   c:'#9CC3D5', cap:'Pencil grip, letter formation, copying from the board. School gets easier.'},
  {w:'Play',    c:'#8A5A7A', cap:'Play is a child’s real work: sharing, turn-taking, imagination.'},
  {w:'Thrive',  c:'#2F4A3A', cap:'Confident, capable, independent. That’s the top of the climb.'}
];
const BW = 96, BH = 88, GROUND = 681, X0 = 112, GAP = 108;
const colX = i => X0 + i * GAP;
const blocksG = document.getElementById('blocks');
const colGroups = COLS.map((col, i) => {
  const g = mk('g', {});
  for (let j = 0; j <= i; j++) {
    const y = GROUND - (j + 1) * BH;
    const top = j === i;
    g.appendChild(mk('rect', {x: colX(i), y: y + 2, width: BW, height: BH - 4, rx: 10, fill: col.c, opacity: top ? 1 : .55 + j * .05}));
    g.appendChild(mk('rect', {x: colX(i) + 8, y: y + 9, width: BW - 16, height: 6, rx: 3, fill: '#fff', opacity: .25}));
    if (top) {
      const t = mk('text', {x: colX(i) + BW / 2, y: y + BH / 2 + 8, 'text-anchor': 'middle', 'font-family': 'Fraunces, serif', 'font-size': 21, fill: '#fff'});
      t.textContent = col.w; g.appendChild(t);
    }
  }
  blocksG.appendChild(g); return g;
});
const rays = document.getElementById('rays');
for (let k = 0; k < 12; k++) {
  const a = k * Math.PI / 6;
  rays.appendChild(mk('line', {x1: 520 + Math.cos(a) * 56, y1: 130 + Math.sin(a) * 56, x2: 520 + Math.cos(a) * 74, y2: 130 + Math.sin(a) * 74}));
}
const meter = document.getElementById('meter');
COLS.forEach(() => meter.appendChild(document.createElement('span')));

// kid positions: 0 = ground, k = top of column k-1
const pos = k => k === 0 ? {x: 52, y: GROUND} : {x: colX(k - 1) + BW / 2, y: GROUND - k * BH};
const kid = document.getElementById('kid'), sun = document.getElementById('sun');
const legL = document.getElementById('legL'), legR = document.getElementById('legR');
const armL = document.getElementById('armL'), armR = document.getElementById('armR');
const capStep = document.getElementById('capStep'), capText = document.getElementById('capText');
const climb = document.querySelector('.climb');
let lastCap = -2;

function drawClimb(p) {
  const s = p * 7.4;
  colGroups.forEach((g, i) => {
    const e = ease(clamp((s - i) / .55));
    g.setAttribute('transform', `translate(0 ${-(1 - e) * 520})`);
    g.setAttribute('opacity', e);
  });
  const t = clamp(s - 1, 0, 6), a = Math.floor(t), f = t - a;
  const h = a >= 6 ? 0 : clamp((f - .55) / .45), he = h * h * (3 - 2 * h);
  const A = pos(a), B = pos(Math.min(6, a + 1));
  const x = A.x + (B.x - A.x) * he;
  const y = A.y + (B.y - A.y) * he - Math.sin(he * Math.PI) * 60;
  kid.setAttribute('transform', `translate(${x} ${y})`);
  const swing = Math.sin(he * Math.PI) * 14, cheer = t >= 6;
  legL.setAttribute('x2', -8 - swing); legR.setAttribute('x2', 8 + swing);
  armL.setAttribute('x2', cheer ? -22 : -24); armL.setAttribute('y2', cheer ? -88 : -38 - swing);
  armR.setAttribute('x2', cheer ? 22 : 24);   armR.setAttribute('y2', cheer ? -88 : -38 - swing);
  const sp = clamp((s - 6.6) / .6);
  sun.setAttribute('opacity', sp);
  rays.setAttribute('transform', `rotate(${p * 90} 520 130)`);
  const ci = Math.min(5, Math.floor(clamp(s - .3, -1, 5.99)));
  [...meter.children].forEach((m, i) => m.classList.toggle('on', i <= ci));
  if (ci !== lastCap) {
    lastCap = ci;
    capStep.textContent = ci < 0 ? 'Start here' : `Step ${ci + 1} · ${COLS[ci].w}`;
    capText.textContent = ci < 0 ? 'Every big skill is built from small ones. Scroll to watch them stack up.' : COLS[ci].cap;
  }
}

/* ===== TREE ===== */
const branches = [...document.querySelectorAll('#tree .br')];
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
  for (let k = 0; k < 5; k++) {
    const r = 18 + rnd() * 22;
    const el = mk('circle', {cx: x + (rnd() - .5) * 60, cy: y + (rnd() - .5) * 50, r, fill: LEAF_COLS[Math.floor(rnd() * 4)], opacity: .9, class: 'leaf'});
    el.style.transitionDelay = (rnd() * .35) + 's';
    el.dataset.s = c.s; leavesG.appendChild(el); leafEls.push(el);
  }
}));
[[370, 215], [240, 230], [430, 300], [175, 290], [310, 150], [270, 260]].forEach(([x, y]) => {
  const f = mk('circle', {cx: x, cy: y, r: 9, fill: '#C8643B', class: 'fruit'}); f.dataset.s = 5; leavesG.appendChild(f); leafEls.push(f);
});
const steps = [...document.querySelectorAll('#steps li')];
const grow = document.querySelector('.grow');
function drawTree(p) {
  const s = p * 6.6;
  branches.forEach(b => {
    const k = clamp(s - +b.dataset.s);
    b.style.strokeDashoffset = b.dataset.l * (1 - ease(k));
  });
  leafEls.forEach(l => l.classList.toggle('on', s >= +l.dataset.s + .5));
  const cur = Math.min(5, Math.floor(s));
  steps.forEach((li, i) => { li.classList.toggle('on', i <= cur); li.classList.toggle('cur', i === cur); });
}

/* ===== loop ===== */
let ticking = false;
function frame() { ticking = false; drawClimb(reduce ? 1 : progressOf(climb)); drawTree(reduce ? 1 : progressOf(grow)); }
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, {passive: true});
addEventListener('resize', frame); frame();
})();
