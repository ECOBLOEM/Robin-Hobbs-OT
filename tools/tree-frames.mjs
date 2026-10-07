// Capture frames through the "Growth you can see" tree: node tools/tree-frames.mjs [width] [height] [outDir] [reduced]
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const [w = 1366, h = 768, outRel = 'screenshots/tree', reduced] = process.argv.slice(2);
const out = path.resolve(root, '..', outRel); fs.mkdirSync(out, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p); if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
}).listen(0);
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: +w, height: +h }, hasTouch: +w < 800, isMobile: +w < 800, reducedMotion: reduced ? 'reduce' : 'no-preference' });
page.on('pageerror', e => console.warn('JS ERROR', e.message));
await page.goto(`http://localhost:${server.address().port}/`, { waitUntil: 'networkidle' });
const span = await page.evaluate(() => { const c = document.querySelector('.grow'); return [c.offsetTop, c.offsetHeight - innerHeight]; });
for (const [i, p] of [0.02, .12, .25, .42, .58, .75, .88, .99].entries()) {
  await page.evaluate(y => scrollTo(0, y), Math.round(span[0] + span[1] * p));
  await page.waitForTimeout(+process.env.WAIT || 1800);
  await page.screenshot({ path: path.join(out, `tree-${w}-${i}.png`) });
}
await b.close(); server.close(); console.log('frames →', outRel);
