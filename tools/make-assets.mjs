// Generates the social sharing image and favicon set into src/.
// Run after changing the logo or the share image design: npm run build && node tools/make-assets.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'src');
fs.mkdirSync(path.join(SRC, 'assets/icons'), { recursive: true });

// ---- logo mark (seedling + a drifting dandelion seed) ----
const MARK = `
<path d="M4 36 H26" stroke="#2B2620" stroke-opacity=".3" stroke-width="1.6" stroke-linecap="round"/>
<path d="M15 36 C15 30 14.4 25 15.6 18" stroke="#5E8466" stroke-width="2.6" stroke-linecap="round" fill="none"/>
<path d="M15.2 27 C9 28 4.5 24.5 4 18.5 C10 18 14 21.5 15.2 27Z" fill="#7E9C76"/>
<path d="M15.6 21.5 C15.6 14.5 20 9.5 26.5 9.5 C26.8 16 22.5 20.5 15.6 21.5Z" fill="#5E8466"/>
<g transform="rotate(22 32 17)"><path d="M32 21.5 V12.5" stroke="#B9A88F" stroke-width="1" stroke-linecap="round"/><ellipse cx="32" cy="22.6" rx="1.3" ry="2.3" fill="#C8643B"/><g stroke="#E0A43A" fill="#E0A43A" stroke-width="1.05" stroke-linecap="round"><path d="M32 12.5 L26.43 9.78"/><circle cx="26.43" cy="9.78" r=".95" stroke="none"/><path d="M32 12.5 L28.71 7.24"/><circle cx="28.71" cy="7.24" r=".95" stroke="none"/><path d="M32 12.5 L32.00 6.30"/><circle cx="32.00" cy="6.30" r=".95" stroke="none"/><path d="M32 12.5 L35.29 7.24"/><circle cx="35.29" cy="7.24" r=".95" stroke="none"/><path d="M32 12.5 L37.57 9.78"/><circle cx="37.57" cy="9.78" r=".95" stroke="none"/></g></g>`;
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="2 2 36 36">${MARK}</svg>\n`;
fs.writeFileSync(path.join(SRC, 'favicon.svg'), favicon);

// ---- share image: the grown tree with seeds in the air (rendered from the built site) ----
const ogHtml = treePng => `<!doctype html><html><head><meta charset="utf-8">
<style>
@font-face{font-family:Fraunces;src:url(${fontUrl('fraunces-latin')}) format('woff2');font-weight:300 500}
@font-face{font-family:Fraunces;font-style:italic;src:url(${fontUrl('fraunces-italic-latin')}) format('woff2');font-weight:400}
@font-face{font-family:'Hanken Grotesk';src:url(${fontUrl('hanken-grotesk-latin')}) format('woff2');font-weight:400 600}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;background:#F5EFE4;font-family:'Hanken Grotesk';color:#2B2620;overflow:hidden;position:relative}
.copy{position:absolute;left:78px;top:78px;width:600px}
.mark{display:flex;align-items:center;gap:14px}
.mark svg{width:58px;height:58px}
.mark b{font-family:Fraunces;font-weight:400;font-size:30px;font-variation-settings:"SOFT" 100;line-height:1}
.mark small{display:block;font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:#5E554A;margin-top:4px}
h1{font-family:Fraunces;font-weight:400;font-variation-settings:"SOFT" 100;font-size:104px;line-height:.98;letter-spacing:-.02em;margin-top:70px}
h1 em{color:#C8643B}
p{margin-top:28px;font-size:25px;color:#5E554A;line-height:1.4}
.tree{position:absolute;right:40px;bottom:-6px;height:640px}
.band{position:absolute;left:0;right:0;bottom:0;height:18px;background:#2F4A3A}
</style></head><body>
<div class="copy">
  <div class="mark"><svg viewBox="0 0 40 40">${MARK}</svg><div><b>Robin Hobbs</b><small>Occupational Therapy</small></div></div>
  <h1>Grow, then <em>fly.</em></h1>
  <p>Occupational therapy for children &amp; adults<br>across the Waterberg, Limpopo</p>
</div>
<img class="tree" src="data:image/png;base64,${treePng.toString('base64')}">
<div class="band"></div>
</body></html>`;
const fontUrl = n => 'data:font/woff2;base64,' + fs.readFileSync(path.join(SRC, 'assets/fonts', n + '.woff2')).toString('base64');

async function treeShot(browser) {
  const DIST = path.join(root, 'dist');
  if (!fs.existsSync(path.join(DIST, 'index.html'))) throw new Error('Run `npm run build` first');
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2' };
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
    const f = path.join(DIST, p); if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
  }).listen(0);
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1.4, reducedMotion: 'reduce' });
  await page.goto(`http://localhost:${server.address().port}/`, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: '.wa-float,.ribbon{display:none!important}html,body,.hero{background:transparent!important}' });
  await page.waitForTimeout(500);
  const buf = await page.locator('#tree').screenshot({ omitBackground: true });
  await page.close(); server.close();
  return buf;
}

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
await shot(ogHtml(await treeShot(browser)), 1200, 630, path.join(SRC, 'assets/og.png'));

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
