// Crops Robin's portrait (4:5, framed on her face) and writes WebP + JPG sizes into src/assets/img/.
// Re-encoding through a canvas also strips all photo metadata.
// Usage: node tools/make-portrait.mjs   (original: src/assets/img/_originals/robin.jpg — not published)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IMG = path.join(root, 'src/assets/img');
const original = path.join(IMG, '_originals/robin.jpg');
const CROP = { x: 80, y: 60, w: 900, h: 1125 }; // in the 1066×1600 original: cap to diploma, face just above centre
const WIDTHS = [400, 640, 900];
const QUALITY = { webp: .8, jpeg: .82 };

const browser = await chromium.launch();
const page = await browser.newPage();
const files = await page.evaluate(async ({ src, CROP, WIDTHS, QUALITY }) => {
  const img = new Image(); img.src = src; await img.decode();
  const out = {};
  for (const w of WIDTHS) {
    const h = Math.round(w * CROP.h / CROP.w);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
    x.drawImage(img, CROP.x, CROP.y, CROP.w, CROP.h, 0, 0, w, h);
    out[`robin-${w}.webp`] = c.toDataURL('image/webp', QUALITY.webp);
    out[`robin-${w}.jpg`] = c.toDataURL('image/jpeg', QUALITY.jpeg);
  }
  return out;
}, { src: 'data:image/jpeg;base64,' + fs.readFileSync(original).toString('base64'), CROP, WIDTHS, QUALITY });
await browser.close();

for (const [name, url] of Object.entries(files)) {
  const buf = Buffer.from(url.split(',')[1], 'base64');
  fs.writeFileSync(path.join(IMG, name), buf);
  console.log(`${name.padEnd(16)} ${(buf.length / 1024).toFixed(0)} KB`);
}
