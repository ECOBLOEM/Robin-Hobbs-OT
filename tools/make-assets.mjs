// Generates the social sharing image and favicon set into src/.
// Run after changing the logo or the share image design: node tools/make-assets.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'src');
fs.mkdirSync(path.join(SRC, 'assets/icons'), { recursive: true });

// ---- logo mark (blocks + seedling) ----
const MARK = `
  <rect x="4" y="24" width="12" height="12" rx="2" fill="#C8643B"/>
  <rect x="16" y="14" width="12" height="22" rx="2" fill="#E0A43A"/>
  <path d="M33 36V16" stroke="#7E9C76" stroke-width="2.4" stroke-linecap="round"/>
  <ellipse cx="33" cy="11" rx="5" ry="7" fill="#7E9C76"/>`;
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="2 2 36 36">${MARK}</svg>\n`;
fs.writeFileSync(path.join(SRC, 'favicon.svg'), favicon);

// ---- share image: hero staircase in miniature ----
const shade = (hex, amt) => { const n = parseInt(hex.slice(1), 16); const f = v => Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt).toString(16).padStart(2, '0'); return `#${f(n >> 16)}${f(n >> 8 & 255)}${f(n & 255)}`; };
const COLS = ['#C8643B', '#E0A43A', '#7E9C76', '#6FA3BC', '#8A5A7A', '#2F4A3A'];
const B = 62, X0 = 40, G = 560, DX = 14, DY = 12;
let blocks = '';
COLS.forEach((c, i) => {
  for (let j = 0; j <= i; j++) {
    const x = X0 + i * B, y = G - (j + 1) * B, base = j === i ? c : shade(c, .18 + j * .02);
    blocks += `<polygon points="${x + B},${y} ${x + B + DX},${y - DY} ${x + B + DX},${y + B - DY} ${x + B},${y + B}" fill="${shade(base, -.28)}"/>`;
    blocks += `<polygon points="${x},${y} ${x + B},${y} ${x + B + DX},${y - DY} ${x + DX},${y - DY}" fill="${shade(base, .22)}"/>`;
    blocks += `<rect x="${x}" y="${y}" width="${B}" height="${B}" rx="5" fill="${base}"/>`;
    blocks += `<rect x="${x + 7}" y="${y + 7}" width="${B - 14}" height="${B - 14}" rx="6" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="2"/>`;
  }
});
const topX = X0 + 5 * B + B / 2, topY = G - 6 * B;
const kid = `<g transform="translate(${topX - 10} ${topY - 2}) scale(.95)">
  <path d="M3 -30 L4 -18 L5 0 M-3 -30 L-4 -17 L-6 0" stroke="#2F4A3A" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M-14 -36 Q-15 -64 0 -64 Q15 -64 14 -36 Z" fill="#8A5A7A"/><path d="M-14.6 -48 H14.6" stroke="#E0A43A" stroke-width="4"/>
  <path d="M10 -58 L18 -74 L24 -94 M-10 -58 L-18 -74 L-24 -94" stroke="#C68B64" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="0" cy="-80" r="15" fill="#C68B64"/>
  <g fill="#2B2620"><circle cx="-11" cy="-90" r="7"/><circle cx="-2" cy="-95" r="8"/><circle cx="9" cy="-92" r="7"/><circle cx="14" cy="-84" r="5"/><circle cx="-14" cy="-82" r="4.5"/></g>
  <circle cx="-5" cy="-79" r="1.9" fill="#2B2620"/><circle cx="6" cy="-79" r="1.9" fill="#2B2620"/>
  <path d="M-5 -74 Q0 -66 6 -74Z" fill="#2B2620"/></g>
  <g transform="translate(${topX + 30} ${topY - 2}) scale(.85)"><path d="M0 0 C-2 -14 3 -26 0 -40" stroke="#2F4A3A" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M0 -30 C-18 -36 -26 -28 -26 -20 C-14 -18 -4 -22 0 -30Z" fill="#7E9C76"/><path d="M0 -38 C16 -50 28 -44 30 -34 C18 -30 6 -32 0 -38Z" fill="#5E8466"/></g>`;
const grain = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.06'/%3E%3C/svg%3E")`;
const og = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,300..800,50..100;1,9..144,300..800,50..100&family=Hanken+Grotesk:wght@400;500;600&display=swap" rel="stylesheet">
<style>
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;background:#F5EFE4 ${grain};font-family:'Hanken Grotesk';color:#2B2620;display:grid;grid-template-columns:590px 1fr;overflow:hidden;position:relative}
.copy{padding:78px 0 0 78px}
.mark{display:flex;align-items:center;gap:14px}
.mark svg{width:54px;height:54px}
.mark b{font-family:Fraunces;font-weight:400;font-size:30px;font-variation-settings:"SOFT" 100;line-height:1}
.mark small{display:block;font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:#5E554A;margin-top:4px}
h1{font-family:Fraunces;font-weight:400;font-variation-settings:"SOFT" 100;font-size:96px;line-height:.98;letter-spacing:-.02em;margin-top:62px}
h1 em{color:#C8643B}
p{margin-top:30px;font-size:24px;color:#5E554A;line-height:1.4}
.band{position:absolute;left:0;right:0;bottom:0;height:22px;background:#2F4A3A}
.land{position:absolute;inset:0;width:1200px;height:630px;z-index:0}.copy,.art{position:relative;z-index:1}
.art svg{position:absolute;right:30px;bottom:22px;width:560px;height:600px}
</style></head><body>
<div class="copy">
  <div class="mark"><svg viewBox="0 0 40 40">${MARK}</svg><div><b>Robin Hobbs</b><small>Occupational Therapy</small></div></div>
  <h1>One block<br>at a <em>time.</em></h1>
  <p>Occupational therapy for children &amp; adults<br>across the Waterberg, Limpopo</p>
</div>
<div class="art"><svg viewBox="0 0 520 600">
  <circle cx="150" cy="120" r="70" fill="#F6C86A" opacity=".25"/><circle cx="150" cy="120" r="40" fill="#E0A43A"/>
  ${blocks}${kid}
</svg></div>
<svg class="land" viewBox="0 0 1200 630" preserveAspectRatio="none"><path d="M0 560 C180 520 330 548 520 530 C700 512 820 470 960 470 C1060 470 1140 500 1200 488 V608 H0Z" fill="#7E9C76" opacity=".2"/><path d="M0 569 H1200" stroke="#2B2620" stroke-width="2" opacity=".6"/><rect x="0" y="570" width="1200" height="40" fill="#EDE4D3"/></svg>
<div class="band"></div>
</body></html>`;

// ---- render ----
const browser = await chromium.launch();
const shot = async (html, w, h, file) => {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const buf = await page.screenshot({ path: file, omitBackground: html.includes('data-transparent') });
  await page.close();
  return buf;
};
await shot(og, 1200, 630, path.join(SRC, 'assets/og.png'));

const icon = (size, bg, pad) => `<html data-transparent><body style="margin:0;width:${size}px;height:${size}px;${bg ? `background:${bg}` : 'background:transparent'}">
<svg viewBox="2 2 36 36" style="display:block;width:${size - 2 * pad}px;height:${size - 2 * pad}px;margin:${pad}px">${MARK}</svg></body></html>`;
await shot(icon(180, '#F5EFE4', 22), 180, 180, path.join(SRC, 'apple-touch-icon.png'));
await shot(icon(192, '#F5EFE4', 24), 192, 192, path.join(SRC, 'assets/icons/icon-192.png'));
await shot(icon(512, '#F5EFE4', 64), 512, 512, path.join(SRC, 'assets/icons/icon-512.png'));
const png32 = await shot(icon(32, null, 1), 32, 32, path.join(root, 'screenshots', '_fav32.png'));
const png16 = await shot(icon(16, null, 0), 16, 16, path.join(root, 'screenshots', '_fav16.png'));
await browser.close();

// favicon.ico with two embedded PNGs (16 + 32)
const imgs = [[16, png16], [32, png32]];
const head = Buffer.alloc(6 + 16 * imgs.length);
head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(imgs.length, 4);
let offset = head.length;
imgs.forEach(([s, buf], i) => {
  const o = 6 + i * 16;
  head.writeUInt8(s, o); head.writeUInt8(s, o + 1); head.writeUInt8(0, o + 2); head.writeUInt8(0, o + 3);
  head.writeUInt16LE(1, o + 4); head.writeUInt16LE(32, o + 6);
  head.writeUInt32LE(buf.length, o + 8); head.writeUInt32LE(offset, o + 12);
  offset += buf.length;
});
fs.writeFileSync(path.join(SRC, 'favicon.ico'), Buffer.concat([head, ...imgs.map(([, b]) => b)]));
console.log('Wrote src/assets/og.png, favicon.svg, favicon.ico, apple-touch-icon.png, assets/icons/*');
