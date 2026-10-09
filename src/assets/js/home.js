/* Home page:
   1. Hero "Grow, then fly": the tree grows as you scroll (roots first), the camera pulls back
      as it grows, the six therapy steps appear as captions, a robin lands at "Independence",
      the tree blossoms and releases dandelion seeds into the wind, then the robin flies off.
   2. Landing seeds: a few seeds float down into later sections and sprout.
   3. Signature: a pencil writes "Robin". */
(() => {
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;
const narrow = matchMedia('(max-width: 860px)');
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => 1 - Math.pow(1 - t, 3);
const NS = 'http://www.w3.org/2000/svg';
const mk = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };

const hero = document.querySelector('.hero');
const treeSvg = document.getElementById('tree');
const progressOf = el => { const r = el.getBoundingClientRect(); return clamp(-r.top / (r.height - innerHeight)); };

/* ===== TREE (same look as before) ===== */
const branches = [...treeSvg.querySelectorAll('.br')];
branches.forEach(b => { const L = b.getTotalLength(); b.style.strokeDasharray = L; b.style.strokeDashoffset = L; b.dataset.l = L; });
let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
const f1 = n => n.toFixed(1);
/* smooth curve through points (Catmull-Rom → cubic Bézier); closed for leaf clusters, open for the ground */
function smooth(pts, closed) {
  const n = pts.length, at = i => pts[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
  let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return closed ? d + 'Z' : d;
}

/* ===== GROUND: a hand-drawn soil line with crumbs and grass, soil that fades out (no hard edges) ===== */
const groundY = x => 606 + 1.5 * Math.sin((x - 300) / 23) + .9 * Math.sin((x - 300) / 8.7);
{
  const line = []; for (let x = 60; x <= 540; x += 12) line.push([x, groundY(x)]);
  const top = smooth(line, false);
  const soil = document.getElementById('soil'), groundTop = document.getElementById('groundTop');
  mk('path', {d: `${top}L540 722L60 722Z`, fill: 'url(#soilFade)'}, soil);
  const CRUMB = ['#8A6A4E', '#B59A78', '#6E5440'];
  for (let i = 0, made = 0; made < 46 && i < 400; i++) {
    const x = 300 + (rnd() - .5) * 400, y = 611 + rnd() * 70;
    if (((x - 300) / 205) ** 2 + ((y - 606) / 76) ** 2 > 1) continue;
    made++;
    if (rnd() < .7) mk('ellipse', {cx: f1(x), cy: f1(y), rx: f1(.8 + rnd() * 2.2), ry: f1(.6 + rnd() * 1.4), fill: CRUMB[made % 3], opacity: f1(.25 + rnd() * .35)}, soil);
    else mk('path', {d: `M${f1(x)} ${f1(y)}h${f1(3 + rnd() * 5)}`, stroke: '#6E5440', 'stroke-width': .9, 'stroke-linecap': 'round', opacity: .3}, soil);
  }
  mk('path', {d: top, fill: 'none', stroke: '#2B2620', 'stroke-opacity': .8, 'stroke-width': 2.2, 'stroke-linecap': 'round'}, groundTop);
  // a second, lighter pencil pass under the line, broken in places
  [[150, 262], [338, 452]].forEach(([a, b]) => { const pts = []; for (let x = a; x <= b; x += 14) pts.push([x, groundY(x) + 3.2]); mk('path', {d: smooth(pts, false), fill: 'none', stroke: '#2B2620', 'stroke-width': 1, 'stroke-linecap': 'round', opacity: .22}, groundTop); });
  const BLADE = ['#7E9C76', '#5E8466', '#A3B98A'];
  [[132, .8], [174, 1.1], [226, .7], [262, .55], [346, .6], [384, 1], [430, .85], [470, .7]].forEach(([bx, size]) => {
    const n = 3 + Math.floor(rnd() * 3);
    for (let k = 0; k < n; k++) {
      const x = bx + (k - n / 2) * 2.4, y = groundY(x) + 1, h = (9 + rnd() * 13) * size, lean = (rnd() - .5) * 12 + (k - n / 2) * 2;
      mk('path', {d: `M${f1(x)} ${f1(y)}Q${f1(x + lean * .25)} ${f1(y - h * .6)} ${f1(x + lean)} ${f1(y - h)}`, fill: 'none', stroke: BLADE[(k + bx) % 3], 'stroke-width': f1(1.4 + rnd() * .8), 'stroke-linecap': 'round'}, groundTop);
    }
  });
}
const sprout = document.getElementById('sprout');

/* ===== FOLIAGE: layered organic clusters — soft outer edge, shadow side, mid tone, light side, single leaves ===== */
const GREEN = {light: '#A9BF8E', mid: '#7E9C76', dark: '#4C6F55'};
const blob = (cx, cy, r, lobes, amp, rot = 0, sq = .9) => { // sq squashes, rot turns the squashed shape
  const ph = rnd() * 6.3, pts = [], cr = Math.cos(rot), sr = Math.sin(rot);
  for (let i = 0; i < 30; i++) {
    const a = i / 30 * Math.PI * 2, rr = r * (1 + amp * Math.abs(Math.sin(a * lobes / 2 + ph)) - amp * .5 + (rnd() - .5) * amp * .5);
    const lx = Math.cos(a) * rr, ly = Math.sin(a) * rr * sq;
    pts.push([cx + lx * cr - ly * sr, cy + lx * sr + ly * cr]);
  }
  return smooth(pts, true);
};
const vary = (a, b) => a + rnd() * (b - a);
const LEAF = 'M0 0C3.8-4.6 4-11.5 0-17C-4-11.5-3.8-4.6 0 0Z';
const clusters = [
  {s: 1, pts: [[410, 380], [195, 355], [425, 360], [180, 340]]},
  {s: 2, pts: [[440, 250], [165, 235], [455, 230], [150, 215], [420, 270]]},
  {s: 3, pts: [[360, 150], [235, 150], [300, 120], [330, 170], [265, 175]]},
  {s: 4, pts: [[300, 200], [380, 210], [220, 210], [470, 300], [130, 290], [300, 90]]}
];
const leavesG = document.getElementById('leaves');
const leafEls = [];
const addLeaf = (el, s, delay) => { el.classList.add('leaf'); el.style.transitionDelay = delay.toFixed(2) + 's'; el.dataset.s = s; leafEls.push(el); };
clusters.forEach(c => c.pts.forEach(([x, y]) => {
  const tuft = mk('g', {class: 'tuft'}, leavesG); // sways around its own base
  tuft.style.transformOrigin = `${x}px ${y + 34}px`;
  tuft.style.animationDuration = (3.4 + Math.random() * 1.8).toFixed(2) + 's';
  tuft.style.animationDelay = (-Math.random() * 5).toFixed(2) + 's';
  // every cluster gets its own size, tilt, squash, leafiness and light patch, so the canopy doesn't look stamped
  const R = vary(38, 58), rot = vary(-.45, .45), sq = vary(.76, .98), lobes = Math.round(vary(8, 13)), amp = vary(.08, .15);
  const la = vary(-2.6, -2), ld = R * vary(.18, .34); // light patch: upper left, at a slightly different spot each time
  [[x, y, R * vary(1.05, 1.12), lobes, amp * .8, GREEN.mid, vary(.22, .34)],                    // soft outer edge
   [x + R * vary(.06, .16), y + R * vary(.1, .2), R, lobes, amp, GREEN.dark, 1],               // shadow side (lower right)
   [x - R * .06, y - R * .04, R * vary(.76, .88), lobes - 1, amp, GREEN.mid, 1],
   [x + Math.cos(la) * ld, y + Math.sin(la) * ld, R * vary(.4, .6), Math.max(6, lobes - 3), amp * 1.2, GREEN.light, .95] // light side
  ].forEach(([bx, by, r, lb, am, fill, op], k) => addLeaf(mk('path', {d: blob(bx, by, r, lb, am, rot + vary(-.15, .15), sq), fill, opacity: op}, tuft), c.s, k * .06 + rnd() * .12));
  for (let k = 0, n = 2 + Math.floor(rnd() * 3); k < n; k++) { // 2–4 single leaves on the outline, mostly the upper and outer side
    const a = -Math.PI / 2 + (rnd() - .5) * Math.PI * 1.6, px = x + Math.cos(a) * R * .98, py = y + Math.sin(a) * R * .86;
    const at = mk('g', {transform: `translate(${f1(px)} ${f1(py)}) rotate(${(a * 57.3 + 90).toFixed(0)}) scale(${(.8 + rnd() * .5).toFixed(2)})`}, tuft);
    addLeaf(mk('path', {d: LEAF, fill: k % 2 ? GREEN.light : GREEN.mid}, at), c.s, .25 + rnd() * .2);
  }
}));

/* blossoms at "Independence" (they become the seeds) */
const BLOOMS = [[370, 215], [240, 230], [430, 300], [175, 290], [310, 150], [270, 260], [340, 105], [205, 175],
  [405, 248], [150, 238], [462, 262], [300, 62], [250, 118], [360, 180], [195, 335], [420, 345]];
const bloomsG = document.getElementById('blooms');
BLOOMS.forEach(([x, y], i) => {
  const at = mk('g', {transform: `translate(${x} ${y})`}, bloomsG);
  const b = mk('g', {class: 'bloom'}, at);
  for (let k = 0; k < 5; k++) mk('circle', {cx: (Math.cos(k * 1.2566) * 4.6).toFixed(1), cy: (Math.sin(k * 1.2566) * 4.6).toFixed(1), r: 4, fill: i % 3 ? '#F7EDE6' : '#E9C9D6'}, b);
  mk('circle', {r: 2.6, fill: '#E0A43A'}, b);
  b.style.transitionDelay = (i % 6) * .07 + 's';
  b.dataset.s = 5; leafEls.push(b);
});

const steps = [...document.querySelectorAll('#steps li')];
const meterDots = [...hero.querySelectorAll('.meter i')], meterNum = hero.querySelector('.meter b');
const lede = hero.querySelector('.lede');
new IntersectionObserver(([e]) => hero.classList.toggle('live', e.isIntersecting)).observe(hero);

/* ===== camera: start close on the roots, pull back as the tree grows ===== */
const TOP = [[0, 430], [1, 300], [1.5, 200], [2.5, 125], [3.5, 70], [4.5, 22], [5, 10]];
const topAt = s => { for (let i = 1; i < TOP.length; i++) if (s <= TOP[i][0]) { const [a, ya] = TOP[i - 1], [b, yb] = TOP[i]; return lerp(ya, yb, (s - a) / (b - a)); } return TOP.at(-1)[1]; };
let aspect = 1;
const fadeX = document.getElementById('fadeX');
const measure = () => { aspect = treeSvg.clientWidth / Math.max(1, treeSvg.clientHeight) || 1; };
function camera(s) {
  const bottom = 714, needW = lerp(250, 460, clamp(s / 4.5));
  let h = bottom - topAt(s);
  h = Math.max(h, needW / aspect);
  const w = h * aspect;
  treeSvg.setAttribute('viewBox', `${(300 - w / 2).toFixed(1)} ${(bottom - h).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`);
  fadeX.setAttribute('x1', Math.max(60, 300 - w / 2).toFixed(1)); fadeX.setAttribute('x2', Math.min(540, 300 + w / 2).toFixed(1));
}

/* ===== robin: lands at "Independence", flies off with the seeds at the end ===== */
const bird = document.getElementById('bird'), birdWing = document.getElementById('birdWing');
const birdWrap = document.getElementById('birdWrap'), perch = document.getElementById('perch');
const FROM = {x: 680, y: 150}, CTRL = {x: 540, y: 470}, PERCH = {x: 486, y: 413};
const CTRL2 = {x: 300, y: 560}, EXIT = {x: -260, y: 330}; // swoop under the canopy and away, with the wind
let bq = 0, bTarget = 0, bLast = 0, bBusy = false;
const inout = q => q < .5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2;
const bez = (A, C, B, e) => { const u = 1 - e; return {x: u * u * A.x + 2 * u * e * C.x + e * e * B.x, y: u * u * A.y + 2 * u * e * C.y + e * e * B.y}; };
function placeBird(q, now) {
  const leg = q <= 1, e = inout(leg ? q : q - 1);
  const p = leg ? bez(FROM, CTRL, PERCH, e) : bez(PERCH, CTRL2, EXIT, e);
  bird.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(1.5)`);
  bird.setAttribute('opacity', q > 0 && q < 2 ? 1 : 0);
  const moving = q > 0 && q !== 1 && q < 2;
  birdWing.setAttribute('transform', `rotate(${moving ? (Math.sin(now / 42) * 38 - 12).toFixed(1) : 0} -1 -15)`);
}
function birdFrame(now) {
  const dt = Math.min(50, now - bLast); bLast = now;
  const dir = Math.sign(bTarget - bq);
  bq = dir > 0 ? Math.min(bTarget, bq + dt / 1500) : Math.max(bTarget, bq - dt / 1100);
  placeBird(bq, now);
  if (bq !== bTarget) return requestAnimationFrame(birdFrame);
  bBusy = false;
  if (bq === 1) {
    birdWrap.classList.add('perched');
    [perch, birdWrap].forEach(g => { g.classList.remove('dip'); void g.getBoundingClientRect(); g.classList.add('dip'); });
  }
}
function setBird(t) {
  if (t === bTarget) return;
  bTarget = t; birdWrap.classList.remove('perched');
  if (reduce) { bq = t; placeBird(bq, 0); if (t === 1) birdWrap.classList.add('perched'); return; }
  if (!bBusy) { bBusy = true; bLast = performance.now(); requestAnimationFrame(birdFrame); }
}
placeBird(0, 0);

/* ===== seeds: dandelion parachutes on one canvas layer ===== */
const WORDS = ['write my name', 'dress myself', 'make friends', 'back to work', 'cook again', 'home on my own'];
const FLUFF = ['#D4A24C', '#9DB08F', '#D98A66', '#B48AA5', '#C9B79C'];
const sky = { canvas: null, ctx: null, dpr: 1, seeds: [], sprites: [], wordSprites: [], ready: false, running: false, last: 0,
  userWind: 0, scrollV: 0, lastY: scrollY, emitted: false, queue: 0, nextAt: 0, wordIdx: 0 };
function drawSeed(ctx, color, scale) {
  ctx.save(); ctx.scale(scale, scale);
  ctx.strokeStyle = '#7A6A58'; ctx.lineWidth = .9; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 14); ctx.lineTo(0, -6); ctx.stroke();
  ctx.fillStyle = '#8A6A4E'; ctx.beginPath(); ctx.ellipse(0, 16, 1.8, 3.8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = .85;
  for (let a = -78; a <= 78; a += 13) {
    const r = a * Math.PI / 180, L = 13 + (Math.abs(a) < 40 ? 1.5 : 0);
    const ex = Math.sin(r) * L, ey = -6 - Math.cos(r) * L;
    ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex + Math.sin(r - .5) * 3, ey - Math.cos(r - .5) * 3); ctx.moveTo(ex, ey); ctx.lineTo(ex + Math.sin(r + .5) * 3, ey - Math.cos(r + .5) * 3); ctx.stroke();
  }
  ctx.restore();
}
function makeSprite(color) {
  const s = sky.dpr, w = 44, h = 50;
  const c = document.createElement('canvas'); c.width = w * s; c.height = h * s;
  const x = c.getContext('2d'); x.scale(s, s); x.translate(w / 2, 24);
  drawSeed(x, color, 1);
  return {c, w, h, ox: w / 2, oy: 24};
}
/* the handwritten word hangs under its seed, on a soft paper-coloured halo so it reads over anything */
function makeWordSprite(word) {
  const s = sky.dpr, w = 150, h = 36;
  const c = document.createElement('canvas'); c.width = w * s; c.height = h * s;
  const x = c.getContext('2d'); x.scale(s, s);
  x.font = '600 17px Caveat, cursive'; x.textAlign = 'center'; x.lineJoin = 'round';
  x.shadowColor = 'rgba(245,239,228,.95)'; x.shadowBlur = 9;
  x.strokeStyle = 'rgba(245,239,228,.92)'; x.lineWidth = 6; x.strokeText(word, w / 2, 24);
  x.shadowBlur = 0; x.fillStyle = 'rgba(166,75,37,.95)'; x.fillText(word, w / 2, 24);
  return {c, w, h, ox: w / 2, oy: 24 - 42, hw: Math.min(w, x.measureText(word).width + 16) / 2}; // baseline 42px under the seed
}
function setupSky() {
  if (reduce || sky.canvas) return;
  const c = document.createElement('canvas'); c.className = 'seed-sky'; c.setAttribute('aria-hidden', 'true');
  document.body.appendChild(c);
  sky.canvas = c; sky.ctx = c.getContext('2d');
  sky.dpr = Math.min(devicePixelRatio || 1, 2);
  const size = () => { c.width = innerWidth * sky.dpr; c.height = innerHeight * sky.dpr; };
  size(); addEventListener('resize', size);
  (document.fonts ? document.fonts.load('600 17px Caveat') : Promise.resolve()).catch(() => {}).then(() => {
    sky.sprites = FLUFF.map(col => makeSprite(col));
    sky.wordSprites = WORDS.map(makeWordSprite);
    sky.ready = true;
  });
  if (fine) addEventListener('pointermove', e => { sky.userWind = clamp(sky.userWind + e.movementX * .012, -1.6, 1.6); }, {passive: true});
}
const MAX = () => narrow.matches ? 14 : 28;
function spawnSeed(now, word) {
  const [bx, by] = BLOOMS[Math.floor(Math.random() * BLOOMS.length)];
  const pt = treeSvg.createSVGPoint(); pt.x = bx; pt.y = by;
  const m = treeSvg.getScreenCTM(); if (!m) return;
  const p = pt.matrixTransform(m);
  const wordSprite = word != null ? sky.wordSprites[word] : null;
  sky.seeds.push({
    x: p.x + (Math.random() - .5) * 16, y: p.y, vx: -.2, vy: -.15, born: now, life: (wordSprite ? 20000 : 15000) + Math.random() * 5000,
    k: wordSprite ? .75 : .8 + Math.random() * .5, phase: Math.random() * 6.28,
    spr: sky.sprites[Math.floor(Math.random() * sky.sprites.length)],
    sc: wordSprite ? 1 : .8 + Math.random() * .45, word: wordSprite, wa: 0,
  });
}
/* words only show in open sky: not over the canopy (an ellipse inside its box), the headline or the caption card */
const caption = hero.querySelector('.caption'), heading = hero.querySelector('h1'), stage = hero.querySelector('.stage');
function obstacles() {
  const l = leavesG.getBoundingClientRect(), st = stage.getBoundingClientRect();
  return {ell: {cx: l.left + l.width / 2, cy: l.top + l.height / 2, rx: l.width / 2, ry: l.height / 2},
    rects: [caption, heading].map(e => e.getBoundingClientRect()).filter(r => r.width),
    area: {left: 4, right: innerWidth - 4, top: Math.max(st.top, 0), bottom: Math.min(st.bottom, innerHeight)}}; // whole word on screen, inside the hero
}
function inOpenSky(d, ob) {
  const hw = d.word.hw * d.sc, cx = d.x, cy = d.y + 36 * d.sc, hh = 12, pad = 8;
  const {ell, area} = ob, rx = ell.rx + hw + pad, ry = ell.ry + hh + pad;
  if (cx - hw < area.left || cx + hw > area.right || cy - hh < area.top || cy + hh > area.bottom) return false;
  if (ell.rx && ((cx - ell.cx) / rx) ** 2 + ((cy - ell.cy) / ry) ** 2 < 1) return false;
  return !ob.rects.some(r => cx + hw + pad > r.left && cx - hw - pad < r.right && cy + hh + pad > r.top && cy - hh - pad < r.bottom);
}
function skyFrame(now) {
  const S = sky, ctx = S.ctx, dt = clamp((now - S.last) / 16.7, 0, 3); S.last = now;
  let ob = null; // measured once per frame, only if a word seed is on screen
  // wind: gentle base breeze to the left + slow gusts + the visitor (mouse on desktop, swipe speed on phones)
  const v = scrollY - S.lastY; S.lastY = scrollY; S.scrollV = lerp(S.scrollV, v, .3);
  if (!fine) S.userWind = clamp(S.userWind - Math.abs(S.scrollV) * .01 * dt, -1.6, 1.6);
  S.userWind *= Math.pow(.965, dt);
  const wind = -.48 + Math.sin(now / 1900) * .22 + Math.sin(now / 730 + 2) * .1 + S.userWind;
  // emission: a burst at "Independence", then a gentle trickle while the hero is on screen
  if (S.queue > 0 && now >= S.nextAt && S.ready) {
    const words = narrow.matches ? 4 : 6, giveWord = S.wordIdx < words && S.queue % 3 === 0;
    spawnSeed(now, giveWord ? S.wordIdx++ : null); S.queue--; S.nextAt = now + 260 + Math.random() * 240;
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, S.canvas.width, S.canvas.height);
  for (let i = S.seeds.length - 1; i >= 0; i--) {
    const d = S.seeds[i], age = now - d.born;
    const lift = age < 1300 ? -.3 : .2 + Math.sin(now / 950 + d.phase) * .14; // lift off, then float down
    d.vx += (wind * d.k - d.vx) * .025 * dt;
    d.vy += (lift - d.vy) * .03 * dt;
    d.x += (d.vx + Math.sin(now / 620 + d.phase) * .18) * dt;
    d.y += d.vy * dt - S.scrollV * .18;
    const a = Math.min(1, age / 500) * Math.min(1, (d.life - age) / 1800);
    if (age >= d.life || d.x < -160 || d.x > innerWidth + 160 || d.y > innerHeight + 120 || d.y < -160) { S.seeds.splice(i, 1); continue; }
    const rot = clamp(Math.sin(now / 1500 + d.phase) * .3 + d.vx * .25, -.6, .6) * (d.word ? .35 : 1);
    ctx.setTransform(S.dpr * d.sc * Math.cos(rot), S.dpr * d.sc * Math.sin(rot), -S.dpr * d.sc * Math.sin(rot), S.dpr * d.sc * Math.cos(rot), d.x * S.dpr, d.y * S.dpr);
    ctx.globalAlpha = a;
    ctx.drawImage(d.spr.c, -d.spr.ox, -d.spr.oy, d.spr.w, d.spr.h);
    if (d.word) {
      d.wa += ((inOpenSky(d, ob ||= obstacles()) ? 1 : 0) - d.wa) * clamp(.1 * dt);
      if (d.wa > .02) { ctx.globalAlpha = a * d.wa; ctx.drawImage(d.word.c, -d.word.ox, -d.word.oy, d.word.w, d.word.h); }
    }
  }
  ctx.globalAlpha = 1;
  if (S.seeds.length || S.queue > 0) requestAnimationFrame(skyFrame); else { S.running = false; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, S.canvas.width, S.canvas.height); }
}
function wakeSky() { if (!sky.running) { sky.running = true; sky.last = performance.now(); requestAnimationFrame(skyFrame); } }
function release(s, now) {
  if (reduce) return;
  setupSky();
  if (s >= 5.5 && !sky.emitted) { sky.emitted = true; sky.queue = narrow.matches ? 10 : 18; sky.wordIdx = 0; sky.nextAt = now; wakeSky(); }
  else if (s >= 5.5 && sky.queue === 0 && now > sky.nextAt + 1500 && sky.seeds.length < MAX() && hero.classList.contains('live')) { sky.queue = 1; wakeSky(); }
  if (s < 4.8) sky.emitted = false;
}

/* reduced motion: a few seeds already in the air, nothing moves */
function stillSeeds() {
  const g = document.getElementById('stillSeeds');
  [[150, 52, -.2, 'write my name'], [455, 66, .15, 'back to work'], [118, 175, .25], [500, 150, -.15], [222, 22, .1]].forEach(([x, y, r, word], i) => {
    const s = mk('g', {transform: `translate(${x} ${y}) rotate(${r * 57})`}, g);
    mk('path', {d: 'M0 14 V-6', stroke: '#7A6A58', 'stroke-width': .9}, s);
    mk('ellipse', {cy: 16, rx: 1.8, ry: 3.8, fill: '#8A6A4E'}, s);
    const f = mk('g', {stroke: FLUFF[i % FLUFF.length], 'stroke-width': .85, 'stroke-linecap': 'round'}, s);
    for (let a = -78; a <= 78; a += 13) { const q = a * Math.PI / 180; mk('path', {d: `M0 -6 L${(Math.sin(q) * 13).toFixed(1)} ${(-6 - Math.cos(q) * 13).toFixed(1)}`}, f); }
    if (word) { const t = mk('text', {y: 44, 'text-anchor': 'middle', 'font-family': 'Caveat, cursive', 'font-weight': 600, 'font-size': 24, fill: '#A64B25', stroke: '#F5EFE4', 'stroke-width': 6, 'stroke-linejoin': 'round', 'paint-order': 'stroke', transform: `rotate(${-r * 57})`}, s); t.textContent = word; }
  });
}

/* ===== scroll loop ===== */
let ticking = false;
function frame() {
  ticking = false;
  const s = reduce ? 6.6 : progressOf(hero) * 6.6, now = performance.now();
  branches.forEach(b => { b.style.strokeDashoffset = b.dataset.l * (1 - ease(clamp((s - +b.dataset.s) / (+b.dataset.d || 1)))); });
  leafEls.forEach(l => l.classList.toggle('on', s >= +l.dataset.s + .5));
  const cur = Math.min(5, Math.floor(s));
  steps.forEach((li, i) => { li.classList.toggle('on', i <= cur); li.classList.toggle('cur', i === cur); i === cur ? li.setAttribute('aria-current', 'step') : li.removeAttribute('aria-current'); });
  meterDots.forEach((d, i) => { d.classList.toggle('on', i < cur); d.classList.toggle('cur', i === cur); });
  if (meterNum.textContent !== String(cur + 1)) meterNum.textContent = cur + 1;
  camera(s);
  hero.classList.toggle('leafy', s >= 1.4);
  hero.classList.toggle('done', cur === 5); // hides "Scroll to grow"
  // the seedling hands over to the trunk: gone completely by the time the trunk starts rising (s .45)
  const sp = 1 - clamp((s - .3) / .15);
  sprout.style.opacity = sp.toFixed(2); sprout.style.visibility = sp > 0 ? '' : 'hidden';
  lede.style.opacity = narrow.matches ? (1 - clamp((s - .15) / .7)).toFixed(2) : '';
  setBird(reduce ? 1 : s >= 6.25 ? 2 : s >= 5.25 ? 1 : s < 5.05 ? 0 : bTarget);
  release(s, now);
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } if (sky.seeds.length) wakeSky(); }, {passive: true});
addEventListener('resize', () => { measure(); frame(); });
measure();
if (reduce) stillSeeds();
frame();

/* ===== landing seeds: float down into later sections and sprout ===== */
const spots = document.querySelectorAll('.landing');
if (!reduce && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('landed'); io.unobserve(e.target); } }), {threshold: 1, rootMargin: '0px 0px -12% 0px'});
  spots.forEach(s => io.observe(s));
}
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
