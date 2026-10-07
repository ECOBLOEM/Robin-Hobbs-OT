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

```
site.config.js        settings + the LAUNCHED switch
src/
  index.html          home (hero climb, tree, chapters, waitlist form)
  services/ about/ faq/ privacy/
  404.html thanks.html
  _partials/          head, header, footer, next-step block, icons
  assets/css/         base.css (shared) · home.css · pages.css
  assets/js/          site.js (menu, reveals) · home.js (scroll scenes)
tools/
  build.mjs           src → dist
  shoot.mjs           screenshots at 1366 / 390 / 320px + overflow & JS-error check
netlify.toml          build command + publish dir + security headers
```

### Local commands

```bash
npm install                     # once (installs Playwright for screenshots)
npx playwright install chromium # once
npm run build                   # → dist/
npm run shots                   # build + screenshots of the home page → screenshots/
node tools/shoot.mjs /,/services/,/faq/ screenshots/check   # specific pages
```

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
