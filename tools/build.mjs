// Tiny zero-dependency static build: src/ → dist/
//
// In any .html file under src/:
//   ---                       optional front matter at the very top
//   title: Page title           (key: value per line, available as {{page.key}})
//   ---
//   {{> header}}              insert src/_partials/header.html (partials may nest)
//   {{key}}                   value from site.config.js (or derived, see `data` below)
//   {{#key}}…{{/key}}         render only if key is truthy   (e.g. {{#LAUNCHED}})
//   {{^key}}…{{/key}}         render only if key is falsy    (e.g. {{^LAUNCHED}})
// Everything else in src/ (except _partials) is copied as-is.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'src'), OUT = path.join(root, 'dist');
const config = (await import(pathToFileURL(path.join(root, 'site.config.js')).href + '?' + Date.now())).default;

const data = {
  ...config,
  year: new Date().getFullYear(),
  whatsapp: `https://wa.me/${config.phoneIntl.replace(/\D/g, '')}?text=${encodeURIComponent(config.whatsappMessage)}`,
  tel: `tel:${config.phoneIntl}`,
  areasList: config.areas.join(' · '),
  areasSentence: config.areas.slice(0, -1).join(', ') + ' and ' + config.areas.at(-1),
  cta: config.LAUNCHED ? 'Book a session' : 'Join the list',
};

const partial = name => fs.readFileSync(path.join(SRC, '_partials', name + '.html'), 'utf8');
const get = (ctx, key) => key.split('.').reduce((o, k) => (o == null ? o : o[k]), ctx);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function render(tpl, ctx) {
  for (let i = 0; i < 10 && /\{\{>\s*[\w-]+\s*\}\}/.test(tpl); i++)
    tpl = tpl.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, n) => partial(n));
  const truthy = v => Array.isArray(v) ? v.length > 0 : !!v;
  let prev;
  do { // sections (repeat so nested ones resolve)
    prev = tpl;
    tpl = tpl.replace(/\{\{([#^])([\w.]+)\}\}([\s\S]*?)\{\{\/\2\}\}/g,
      (_, op, key, body) => (truthy(get(ctx, key)) === (op === '#') ? body : ''));
  } while (tpl !== prev);
  return tpl.replace(/\{\{\{?\s*([\w.]+)\s*\}?\}\}/g, (m, key) => {
    const v = get(ctx, key) ?? (key.startsWith('page.') ? '' : undefined);
    if (v === undefined) throw new Error(`Unknown template key {{${key}}}`);
    return m.startsWith('{{{') ? String(v) : esc(v);
  });
}

function frontMatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return [{}, src];
  const meta = Object.fromEntries(m[1].split('\n').filter(Boolean).map(l => {
    const i = l.indexOf(':'); return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  }));
  return [meta, src.slice(m[0].length)];
}

const pages = [];
fs.rmSync(OUT, { recursive: true, force: true });
(function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, ent.name), rel = path.relative(SRC, abs);
    if (ent.name.startsWith('_') || ent.name === '.DS_Store') continue;
    const dest = path.join(OUT, rel);
    if (ent.isDirectory()) { walk(abs); continue; }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (!ent.name.endsWith('.html')) { fs.copyFileSync(abs, dest); continue; }
    const [meta, body] = frontMatter(fs.readFileSync(abs, 'utf8'));
    const urlPath = '/' + rel.replace(/index\.html$/, '').split(path.sep).join('/');
    const page = { path: urlPath, url: config.siteUrl + urlPath, ...meta };
    let html = render(body, { ...data, page });
    // mark the current page in the nav
    html = html.replace(new RegExp(`(<a href="${urlPath}" data-nav)`, 'g'), '$1 aria-current="page"');
    fs.writeFileSync(dest, html);
    pages.push(page);
  }
})(SRC);

console.log(`Built ${pages.length} pages → dist/ (LAUNCHED: ${config.LAUNCHED})`);
