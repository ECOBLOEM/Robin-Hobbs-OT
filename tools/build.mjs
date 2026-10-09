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
import crypto from 'node:crypto';
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

// ---- structured data (JSON-LD) ----
const strip = h => h.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
function schemaFor(page, html) {
  if (page.schema === 'business') {
    const c = config;
    return {
      '@context': 'https://schema.org', '@type': 'MedicalBusiness', '@id': `${c.siteUrl}/#practice`,
      name: c.name, url: `${c.siteUrl}/`, description: page.description,
      telephone: c.phoneIntl, ...(c.email && { email: c.email }),
      image: `${c.siteUrl}/assets/og.png`, logo: `${c.siteUrl}/assets/icons/icon-512.png`,
      address: { '@type': 'PostalAddress', ...(c.rooms && { streetAddress: c.rooms }), addressLocality: c.locality, addressRegion: c.region, addressCountry: 'ZA' },
      areaServed: c.areas.map(name => ({ '@type': 'City', name })),
      openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: c.openingHours.days, opens: c.openingHours.opens, closes: c.openingHours.closes }],
      knowsLanguage: c.languageCodes,
      employee: { '@type': 'Person', name: c.therapist, jobTitle: 'Occupational Therapist', url: `${c.siteUrl}/about/` },
    };
  }
  if (page.schema === 'faq') {
    const qs = [...html.matchAll(/<details><summary>([\s\S]*?)<\/summary><div>([\s\S]*?)<\/div><\/details>/g)];
    return { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: qs.map(([, q, a]) => ({ '@type': 'Question', name: strip(q), acceptedAnswer: { '@type': 'Answer', text: strip(a) } })) };
  }
}

const pages = [], htmlFiles = [];
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
    // inline the (small) stylesheets: no render-blocking CSS requests
    html = html.replace(/<link rel="stylesheet" href="\/assets\/css\/([\w-]+)\.css">/g, (_, n) =>
      `<style>${fs.readFileSync(path.join(SRC, 'assets/css', n + '.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s*\n\s*/g, '\n').trim()}</style>`);
    const ld = schemaFor(page, html);
    if (ld) html = html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(ld)}</script>\n</head>`);
    fs.writeFileSync(dest, html);
    pages.push(page); htmlFiles.push(dest);
  }
})(SRC);

// ---- sitemap, robots, manifest ----
const today = new Date().toISOString().slice(0, 10);
const indexable = pages.filter(p => !p.noindex).sort((a, b) => a.path.localeCompare(b.path));
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexable.map(p => `  <url><loc>${p.url}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`);
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${config.siteUrl}/sitemap.xml\n`);
fs.writeFileSync(path.join(OUT, 'site.webmanifest'), JSON.stringify({
  name: config.name, short_name: 'Robin Hobbs OT', start_url: '/', display: 'browser',
  background_color: '#F5EFE4', theme_color: '#F5EFE4',
  icons: [192, 512].map(s => ({ src: `/assets/icons/icon-${s}.png`, sizes: `${s}x${s}`, type: 'image/png' })),
}, null, 2));

// ---- cache busting: every asset URL gets ?v=<content hash>, so each deploy is picked up immediately
// (assets are cached for a week; a changed file gets a new URL, an unchanged one keeps its cache)
const hashes = new Map();
const version = url => {
  const file = path.join(OUT, url);
  if (!fs.existsSync(file)) return null;
  if (!hashes.has(url)) hashes.set(url, crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 10));
  return hashes.get(url);
};
const ASSET = /(\/(?:assets\/[\w\-/.]+|favicon\.(?:ico|svg)|apple-touch-icon\.png|site\.webmanifest))(?![\w\-/.?])/g;
const unversioned = [];
for (const file of [path.join(OUT, 'site.webmanifest'), ...htmlFiles]) { // manifest first: pages link to it by its final hash
  const src = fs.readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, m => m.replace(/\//g, '\u0000')); // leave commented-out URLs alone
  const out = src.replace(ASSET, (m, url) => { const v = version(url); if (!v) { unversioned.push(`${path.relative(OUT, file)}: ${url}`); return m; } return `${url}?v=${v}`; });
  fs.writeFileSync(file, out.replace(/\u0000/g, '/'));
}
if (unversioned.length) throw new Error('Asset URLs with no matching file (fix the path):\n  ' + unversioned.join('\n  '));

console.log(`Built ${pages.length} pages → dist/ (LAUNCHED: ${config.LAUNCHED})`);
