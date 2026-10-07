// Screenshot the site at desktop (1366) and mobile (390), at several scroll points.
// Usage: node tools/shoot.mjs [path=/] [outDir=screenshots]
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const page_ = process.argv[2] || '/';
const out = path.join(root, process.argv[3] || 'screenshots');
fs.mkdirSync(out, { recursive: true });

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.xml': 'application/xml', '.txt': 'text/plain' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end(fs.existsSync(path.join(root, '404.html')) ? fs.readFileSync(path.join(root, '404.html')) : 'not found'); }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(0);
const base = `http://localhost:${server.address().port}`;

const browser = await chromium.launch();
for (const [name, w, h] of [['desktop', 1366, 768], ['mobile', 390, 844]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.goto(base + page_, { waitUntil: 'networkidle' });
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  if (overflow) console.warn(`[${name}] HORIZONTAL OVERFLOW`);
  const n = Math.min(14, Math.ceil(total / h));
  for (let i = 0; i < n; i++) {
    await page.evaluate(y => scrollTo(0, y), Math.round((total - h) * i / (n - 1)));
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(out, `${name}-${String(i).padStart(2, '0')}.png`) });
  }
  console.log(`${name}: ${n} shots, page height ${total}px`);
}
await browser.close(); server.close();
