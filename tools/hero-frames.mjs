// Capture frames through the hero (tree → seeds): node tools/hero-frames.mjs [width] [height] [outDir] [reduced]
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const [w = 390, h = 844, outRel = 'screenshots/hero', reduced] = process.argv.slice(2);
const out = path.resolve(root, '..', outRel); fs.mkdirSync(out, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p); if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
}).listen(0);
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: +w, height: +h }, hasTouch: +w < 800, isMobile: +w < 800, reducedMotion: reduced ? 'reduce' : 'no-preference' });
page.on('pageerror', e => console.warn('JS ERROR', e.message));
await page.goto(`http://localhost:${server.address().port}/`, { waitUntil: 'networkidle' });
const span = await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; const c = document.querySelector('.hero'); return [c.offsetTop, c.offsetHeight - innerHeight]; });
for (const [i, p] of [0, .1, .25, .4, .55, .7, .8, .86, .93, 1, 1.12, 1.3].entries()) {
  await page.evaluate(y => scrollTo(0, y), Math.round(span[0] + span[1] * p));
  await page.waitForTimeout(+process.env.WAIT || 1500);
  await page.screenshot({ path: path.join(out, `hero-${w}-${i}.png`) });
}
await b.close(); server.close(); console.log('frames →', outRel);
