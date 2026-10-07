// Build a contact sheet of PNGs by rendering an HTML grid in Chromium
import { chromium } from 'playwright'; import fs from 'node:fs'; import path from 'node:path';
const [dir, pattern, out, cols = 4, scale = .45] = process.argv.slice(2);
const files = fs.readdirSync(dir).filter(f => f.startsWith(pattern) && f.endsWith('.png')).sort();
const imgs = files.map(f => `<img src="data:image/png;base64,${fs.readFileSync(path.join(dir, f)).toString('base64')}">`).join('');
const b = await chromium.launch(); const p = await b.newPage();
await p.setContent(`<style>body{margin:0;display:grid;grid-template-columns:repeat(${cols},auto);gap:6px;background:#888;width:max-content}img{zoom:${scale}}</style>${imgs}`);
await p.screenshot({ path: out, fullPage: true }); await b.close();
