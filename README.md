# Robin Hobbs Occupational Therapy — website

Static site for a new OT practice in the Waterberg (Modimolle, Bela-Bela, Mookgophong, Mokopane), hosted on Netlify.

## The launch switch

Everything lives in **`site.config.js`**:

```js
LAUNCHED: false,   // ← flip to true when the practice opens
```

| `LAUNCHED` | What the site shows |
|---|---|
| `false` | "Opening early 2027 in the Waterberg" ribbon, **Join the list** buttons, waiting-list form, "When do you open?" FAQ |
| `true`  | No ribbon, **Book a session** buttons, booking form, "within one working day" copy |

Practice details (phone, hours, areas, HPCSA number, practice number, rooms address, email, site URL) also live in `site.config.js`. Leave a value as `''` to hide it — e.g. set `practiceNo` once the BHF number arrives, `rooms` once there's an address, `email` once there is one.

Save, commit, push → Netlify rebuilds automatically.

## How it's built

No frameworks, no dependencies at build time. `tools/build.mjs` (plain Node) turns `src/` into `dist/`:

- `{{> header}}` inserts a shared snippet from `src/_partials/`
- `{{phone}}` inserts a value from `site.config.js`
- `{{#LAUNCHED}}…{{/LAUNCHED}}` / `{{^LAUNCHED}}…{{/LAUNCHED}}` show content only when launched / not launched
- Front matter at the top of each page sets its `title` and `description`
- Every asset URL (CSS, JS, fonts, images, icons, manifest) gets `?v=<content hash>`, so a deploy is picked up straight away even though `/assets/*` is cached for a week. The build fails if a referenced asset doesn't exist.

```
site.config.js        settings + the LAUNCHED switch
src/
  index.html          home: tree hero → what is OT → chapters → about → where → FAQ → form
  services/ about/ faq/ privacy/
  404.html thanks.html
  _partials/          head, header, footer, next-step block, icons
  assets/css/         base.css (shared + spacing scale) · home.css · pages.css
  assets/js/          site.js (menu, reveals) · home.js (scroll scenes)
tools/
  build.mjs           src → dist
  shoot.mjs           screenshots at 1366 / 390 / 320px + overflow & JS-error check
  hero-frames.mjs     12 frames through the hero (tree → seeds → next section) at a given size
  make-assets.mjs     regenerates the share image (og.png, uses the built tree) + favicons from the logo
  sheet.mjs           contact sheet of screenshots
netlify.toml          build command + publish dir + security headers
```

### Local commands

```bash
npm install                     # once (installs Playwright for screenshots)
npx playwright install chromium # once
npm run build                   # → dist/
npm run shots                   # build + screenshots of the home page → screenshots/
node tools/shoot.mjs /,/services/,/faq/ screenshots/check   # specific pages
node tools/hero-frames.mjs 390 844 screenshots/hero        # hero frames (add 'reduced' for reduced motion)
```

## Home hero: "Grow, then fly"

The growing tree is the hero (`src/index.html` + `src/assets/js/home.js`):
- It opens on a seedling breaking through a hand-drawn soil line with grass (the ground fades out at the edges of whatever the camera shows, via the `fadeX` mask). Scroll grows it roots first (Listen & assess), then the trunk takes over from the seedling, then branches and foliage. The foliage is generated in `home.js`: each cluster is a soft outer edge, a shadow side, a mid tone, a light side and a few single leaves (no SVG filters, so it stays light on phones). A "camera" starts close on the roots and pulls back as the tree grows, so a phone screen is never mostly empty. On phones the lede sits in the early sky and fades as the trunk rises.
- The six therapy steps are captions: a list beside the tree on desktop (the current step sits on a soft card), and on phones a paper caption card under the tree with the step number, title, description and a 6-step progress bar, kept clear of the WhatsApp button.
- At "Independence" a robin lands, the tree blossoms and dandelion seeds lift off on the wind. They're drawn on one canvas layer from pre-rendered sprites, capped at 14 on mobile and 28 on desktop. Six seeds carry handwritten wins (each word only fades in once it's in open sky: off the canopy, the headline and the caption card, and fully on screen, on a paper-coloured halo) ("write my name", "back to work"…; four on mobile). The wind follows the mouse on desktop and the swipe/scroll speed on phones. At the very end the robin flies off with the seeds.
- Three seeds float down into later sections (beside each chapter and in the contact section) and sprout, using CSS transform/opacity only.
- Reduced motion: the grown tree with a few seeds already in the air and the robin perched; nothing moves.
- Leaves only rustle once they exist and while the tree is on screen.

## Spacing

One scale, defined in `base.css` (`:root`) and used everywhere. Use these values rather than one-off margins:
- `--section`: space between major sections (64px on phones up to 112px on desktop)
- `--section-s`: page-hero bottoms and the footer top
- `--card-pad`: padding inside the coloured cards
- `--sp-1` … `--sp-6` (.5 / .75 / 1.25 / 2 / 3 / 4rem): eyebrow → heading is `--sp-2`, heading → text is `--sp-3`, text → buttons is `--sp-4`

## SEO & performance

- Every page has its own title and description (front matter), canonical URL, Open Graph / social tags and the share image `src/assets/og.png` (1200×630).
- The build writes `sitemap.xml`, `robots.txt` and `site.webmanifest` from `siteUrl`, and adds structured data: `MedicalBusiness` on the home page (phone, hours, areas, languages, address once `rooms` is set) and `FAQPage` on /faq/ (built from the questions on that page).
- Fonts are self-hosted, trimmed to the weights and characters used, and preloaded. All CSS is inlined at build time. There are no third-party requests.
- Lighthouse (mobile, local): Performance 97–99, Accessibility 100, Best Practices 100, SEO 100 on every page. Run it again on the live Netlify URL after deploying.

## Forms

Netlify Forms, form name `contact`, honeypot `bot-field`, success page `/thanks.html`. A hidden `list` field records `waitlist` or `booking` depending on `LAUNCHED`. Submissions appear in Netlify → Forms. **Set up an email notification** there (Forms → Form notifications) so Robin hears about new sign-ups.

## Compliance notes (HPCSA / POPIA)

- No testimonials, reviews, "best/leading" claims, guaranteed outcomes or before/after claims — keep it that way.
- Sensory Integration is described as **training Robin begins in 2027**, never as a qualification. Update the wording only once she's certified.
- The privacy notice (`src/privacy/`) is a sensible draft. Have it checked before launch, especially the retention periods.

## Still to fill in

- [ ] BHF practice number → `practiceNo`
- [ ] Rooms address in Modimolle → `rooms`
- [ ] Practice email (optional) → `email`
- [ ] Domain → `siteUrl` + Netlify domain settings
- [ ] Robin's portrait + room photos (`src/assets/img/`, see comments in `src/index.html` and `src/about/index.html`)
- [ ] Robin to review the About page story in her own words
- [ ] Confirm the cancellation policy (`src/faq/`, marked TODO)
- [ ] Exact opening date (optional countdown on the ribbon)
