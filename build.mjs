/* Builds the two indexable pages from one source.
   src/index.html is authored in English and carries the Hebrew dictionary.
   English ships at the root as the primary language; Hebrew ships at /he/.
   The previous layout had these the other way round, so /en/ is redirected to
   the root rather than dropped, and the old /he redirect had to go: that path
   is now a real page, not something to bounce away.
   Run: node build.mjs */
import fs from 'node:fs';
import path from 'node:path';
import { DOCS, UPDATED, CONTACT_DETAILS, ENTITY } from './src/legal.mjs';

const ROOT = 'C:/Users/david/Desktop/Noryx site 1';
const OUT  = path.join(ROOT, 'noryx');
const SITE = 'https://noryx.io';
const src  = fs.readFileSync(path.join(ROOT, 'src/index.html'), 'utf8');

/* ---- the Hebrew dictionary, read straight out of the source ---- */
const a = src.indexOf('he:{'), b = src.indexOf('}};', a);
if (a < 0 || b < 0) throw new Error('dictionary not found');
const dict = {};
for (const m of src.slice(a + 4, b).matchAll(/'([a-zA-Z0-9._]+)'\s*:\s*'((?:[^'\\]|\\.)*)'/g)) {
  dict[m[1]] = m[2].replace(/\\'/g, "'");
}
console.log('dictionary entries:', Object.keys(dict).length);

/* ---- head and body split on the one boundary the source has ---- */
/* The sheet is the last thing in the head, so its closing tag is the
   boundary. Anchoring on whatever markup happened to follow it was brittle:
   adding the accessibility restore script moved that anchor and broke the
   build. There is exactly one stylesheet, so this cannot go wrong quietly. */
const SPLIT = '</style>';
const si = src.indexOf(SPLIT);
if (si < 0) throw new Error('head/body boundary not found');
if (src.indexOf(SPLIT, si + 1) >= 0) throw new Error('more than one </style>; the split is ambiguous');
const HEAD = src.slice(0, si + '</style>'.length);
const BODY = src.slice(si + '</style>'.length);

/* MEASUREMENT, BEHIND CONSENT
   Neither Google Analytics nor the OpenAI pixel is in the page until the
   visitor has agreed. The loader is exposed so the banner can call it the
   moment somebody accepts, and it calls itself on a later visit when the
   choice is already stored. "Essential only" therefore means no third party
   script is fetched at all, which is the only version of that button that is
   actually true. */
const TRACKERS = [
  '',
  '<!-- Measurement, loaded only after consent -->',
  '<script>',
  '(function(){',
  "  var KEY = 'noryx_cookie_consent', done = false;",
  '  window.__noryxLoadTrackers = function(){',
  '    if (done) return; done = true;',
  '    var g = document.createElement("script"); g.async = 1;',
  '    g.src = "https://www.googletagmanager.com/gtag/js?id=G-PBG4D6XEKX";',
  '    document.head.appendChild(g);',
  '    window.dataLayer = window.dataLayer || [];',
  '    window.gtag = function(){ window.dataLayer.push(arguments); };',
  '    window.gtag("js", new Date());',
  '    window.gtag("config", "G-PBG4D6XEKX");',
  '    (function(w,d,s,u){',
  '      if (w.oaiq) return;',
  '      var q = function(){ q.q.push(arguments); }; q.q = []; w.oaiq = q;',
  '      var j = d.createElement(s); j.async = 1; j.src = u;',
  '      var f = d.getElementsByTagName(s)[0]; f.parentNode.insertBefore(j, f);',
  '    })(window, document, "script", "https://bzrcdn.openai.com/sdk/oaiq.min.js");',
  /* debug was on while the pixel was being wired up; it logs every call to the
     visitor's console, which does not belong on a live site. Turn it back on
     here if conversions ever stop arriving and need tracing. */
  '    window.oaiq("init", { pixelId: "YQqCtYoui9TaA8JqTLo5Yy" });',
  '  };',
  '  var choice = null;',
  '  try { choice = localStorage.getItem(KEY); } catch (e) {}',
  "  if (choice === 'all') window.__noryxLoadTrackers();",
  '})();',
  '<' + '/script>'
].join('\n');

const HE = {
  title: 'נוריקס | איתור ומיפוי תשתיות תת־קרקעיות, סריקות תלת־ממד ו-Scan-to-BIM',
  desc: 'נוריקס ממפה ומתעדת את האתר שלכם מעל הקרקע ומתחתיה: איתור תשתיות תת־קרקעיות עם GPR, איתור אלקטרומגנטי ו-ERT, סריקות לייזר תלת־ממד, פוטוגרמטריה מרחפן, מדידות RTK-GNSS, Scan-to-BIM ותיעוד As-Built. פועלים בכל רחבי ישראל.',
  keywords: 'תשתיות תת קרקעיות, מיפוי ואיתור תשתיות, מיפוי תשתיות תת קרקעיות, איתור תשתיות תת קרקעיות, איתור קווי תשתית, רדאר חודר קרקע, GPR, איתור אלקטרומגנטי, ERT, סריקת לייזר תלת ממד, LiDAR, סריקה תלת ממדית, Scan to BIM, ענן נקודות, תיעוד As Built, מדידות רחפן, פוטוגרמטריה, אורתופוטו, RTK GNSS, מדידות הנדסיות, מודל תלת ממד לאתר, DWG, RVT, BIM, נוריקס',
  ogTitle: 'נוריקס | לראות מבעד לקרקע',
  ogDesc: 'איתור ומיפוי תשתיות תת־קרקעיות, סריקות תלת־ממד ומיפוי אווירי, מאוחדים לתמונת מצב אחת של האתר שנפתחת בכל מכשיר.'
};
const EN_TITLE = 'Noryx | Underground Utility Mapping, 3D Laser Scanning and Scan-to-BIM';

function build(langCode) {
  const isHe = langCode === 'he';
  const dir  = isHe ? 'rtl' : 'ltr';
  const here = isHe ? SITE + '/he/' : SITE + '/';
  let head = HEAD, body = BODY;

  if (isHe) {
    const missed = [];
    let hits = 0;
    body = body.replace(/(data-i18n="([^"]+)"[^>]*>)([^<]*)(<)/g, (all, open, key, txt, close) => {
      if (dict[key] == null) { missed.push(key); return all; }
      hits++;
      return open + dict[key] + close;
    });
    console.log('  substituted:', hits);
    if (missed.length) console.log('  MISSED:', [...new Set(missed)].join(', '));

    head = head.replace(EN_TITLE, HE.title);
    head = head.replace(/<meta name="description" content="[^"]*">/,
      '<meta name="description" content="' + HE.desc + '">');
    head = head.replace(/<meta name="keywords" content="[^"]*">/,
      '<meta name="keywords" content="' + HE.keywords + '">');
    head = head.replace(/<meta property="og:title" content="[^"]*">/,
      '<meta property="og:title" content="' + HE.ogTitle + '">');
    head = head.replace(/<meta property="og:description" content="[^"]*">/,
      '<meta property="og:description" content="' + HE.ogDesc + '">');
    head = head.replace(/<meta name="twitter:title" content="[^"]*">/,
      '<meta name="twitter:title" content="' + HE.ogTitle + '">');
    head = head.replace(/<meta name="twitter:description" content="[^"]*">/,
      '<meta name="twitter:description" content="' + HE.ogDesc + '">');
    head = head.replace('<meta property="og:locale" content="en_US">',
      '<meta property="og:locale" content="he_IL">');
    head = head.replace('<meta property="og:locale:alternate" content="he_IL">',
      '<meta property="og:locale:alternate" content="en_US">');
  }

  /* every absolute address moves to the live domain, then per page */
  head = head.split('https://noryx-technologies.netlify.app').join(SITE);
  body = body.split('https://noryx-technologies.netlify.app').join(SITE);
  head = head.replace(/<link rel="canonical" href="[^"]*">/,
    '<link rel="canonical" href="' + here + '">');
  head = head.replace(/<link rel="alternate" hreflang="en"[^>]*>/,
    '<link rel="alternate" hreflang="en" href="' + SITE + '/">');
  head = head.replace(/<link rel="alternate" hreflang="he"[^>]*>/,
    '<link rel="alternate" hreflang="he" href="' + SITE + '/he/">');
  head = head.replace(/<link rel="alternate" hreflang="x-default"[^>]*>/,
    '<link rel="alternate" hreflang="x-default" href="' + SITE + '/">');
  head = head.replace(/<meta property="og:url" content="[^"]*">/,
    '<meta property="og:url" content="' + here + '">');

  /* the toggle is two real links between two real pages */
  const toggle = isHe
    ? '<span class="lang" role="group" aria-label="שפה"><a class="langlink" href="../" hreflang="en">EN</a><b aria-current="page">עב</b></span>'
    : '<span class="lang" role="group" aria-label="Language"><b aria-current="page">EN</b><a class="langlink" href="he/" hreflang="he">עב</a></span>';
  body = body.replace(/<span class="lang"[\s\S]*?<\/span>/, toggle);

  /* ship the right language from the first byte */
  body = body.replace("var lang = 'en';", "var lang = '" + langCode + "';");
  body = body.replace("applyLang('en');", "applyLang('" + langCode + "');");

  /* Assets sit at the deploy root, so the nested page reaches up one level.
     That is now the Hebrew one. This has to run over the head as well: the
     stylesheet lives there, and the screen background is declared in CSS,
     not in markup. */
  if (isHe) {
    const up = t => t
      .split('src="assets/').join('src="../assets/')
      .split("'assets/").join("'../assets/")
      .split('href="assets/').join('href="../assets/')
      .split('poster="assets/').join('poster="../assets/')
      .split('url(assets/').join('url(../assets/');
    head = up(head);
    body = up(body);
  }

  return '<!DOCTYPE html>\n<html lang="' + langCode + '" dir="' + dir + '">\n<head>\n'
    + head + '\n' + TRACKERS + '\n</head>\n<body>\n' + body + '\n</body>\n</html>\n';
}

for (const [code, dest] of [['en', 'index.html'], ['he', 'he/index.html']]) {
  console.log('building', code, '->', dest);
  const out = build(code);
  const p = path.join(OUT, dest);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, out, 'utf8');
  console.log('  wrote', fs.statSync(p).size, 'bytes');
}

/* ==================================================================
   THE LEGAL PAGES
   Three documents, two languages, six files at /<slug>/ and /he/<slug>/.
   The accessibility menu is lifted out of src/index.html rather than
   written again here, so the menu on a legal page can never drift away
   from the menu on the front page.
   ================================================================== */

const cut = (from, to, label) => {
  const i = src.indexOf(from), j = to ? src.indexOf(to, i) : src.length;
  if (i < 0 || j < 0) throw new Error('could not lift ' + label);
  return src.slice(i, j);
};

const A11Y_CSS  = cut('/* ============================================================\n   ACCESSIBILITY MENU', '</style>', 'a11y css');
const A11Y_HTML = cut('<!-- ACCESSIBILITY MENU', '<div class="cc" id="cookiebar"', 'a11y markup');
const A11Y_JS   = cut('/* ===== ACCESSIBILITY MENU =====', null, 'a11y js').replace(/<\/script>[\s\S]*$/, '');
const TOKENS    = cut(':root{', '}', 'tokens') + '}';
const FONTS     = (src.match(/<link[^>]+fonts\.(googleapis|gstatic)\.com[^>]*>/g) || []).join('\n');

/* One stylesheet for all six pages. It redeclares nothing: the tokens are the
   same object literal the main sheet uses, lifted from it. */
const LEGAL_CSS = TOKENS + `
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--canvas);color:var(--ink);font-family:var(--body);
  font-size:16.5px;line-height:1.72;-webkit-font-smoothing:antialiased}
.vhide{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;
  clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}
.skip{position:absolute;inset-inline-start:-9999px;top:0;z-index:100;padding:12px 18px;
  background:var(--accent);color:#fff;border-radius:0 0 8px 0}
.skip:focus{inset-inline-start:0}
a{color:var(--accent)}
.lnav{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;
  padding:18px var(--shell);border-bottom:1px solid var(--line);background:var(--panel)}
.lnav .brand{display:inline-flex;align-items:center;gap:10px;text-decoration:none;
  font-family:var(--display);font-weight:700;letter-spacing:.04em;color:var(--ink)}
.lnav .brand svg{width:27px;height:27px}
.lnav .lang{display:inline-flex;gap:4px;align-items:center;font-family:var(--mono);font-size:12.5px}
.lnav .lang b,.lnav .lang a{padding:4px 8px;border-radius:6px;text-decoration:none}
.lnav .lang b{background:var(--accent);color:#fff}
.lnav .lang a{color:var(--ink-2);border:1px solid var(--line)}
main.legal{max-width:760px;margin:0 auto;padding:56px var(--shell) 72px}
main.legal h1{font-family:var(--display);font-size:clamp(28px,5vw,42px);line-height:1.15;
  margin:0 0 10px;color:var(--ink)}
.updated{font-family:var(--mono);font-size:12.5px;color:var(--ink-2);margin:0 0 26px}
.lede{font-size:18px;line-height:1.66;color:var(--ink-2);margin:0 0 34px;
  padding-bottom:26px;border-bottom:1px solid var(--line)}
main.legal h2{font-family:var(--display);font-size:20px;line-height:1.3;
  margin:38px 0 12px;color:var(--ink)}
main.legal p{margin:0 0 15px}
main.legal ul{margin:0 0 17px;padding-inline-start:22px}
main.legal li{margin-bottom:8px}
/* The clauses a reader must not skim. */
.flagged{border-inline-start:3px solid var(--u-elec);padding-inline-start:16px;
  margin-inline-start:0}
.lcontact{margin:22px 0 0;padding:18px 20px;border:1px solid var(--line-strong);
  border-radius:12px;background:var(--panel-2)}
.lcontact dt{font-family:var(--mono);font-size:11.5px;letter-spacing:.06em;
  text-transform:uppercase;color:var(--ink-2);margin-top:11px}
.lcontact dt:first-child{margin-top:0}
.lcontact dd{margin:3px 0 0;font-size:16px}
.lcontact dd a{text-decoration:none}
.ltr{direction:ltr;unicode-bidi:isolate}
footer{border-top:1px solid var(--line);background:var(--canvas-2);
  padding:34px var(--shell) 40px;font-size:13.5px;color:var(--ink-2)}
.foot-legal{display:flex;gap:22px;flex-wrap:wrap;margin-bottom:16px}
.foot-legal a{color:var(--ink-2)}
.foot-legal a[aria-current]{color:var(--accent);font-weight:600}
@media (prefers-reduced-motion:reduce){*{animation:none !important;transition:none !important}}
` + A11Y_CSS;

const L = {
  updated:  { en: 'Last updated', he: 'עודכן לאחרונה' },
  home:     { en: 'Back to noryx.io', he: 'חזרה ל-noryx.io' },
  skip:     { en: 'Skip to content', he: 'דילוג לתוכן' },
  privacy:  { en: 'Privacy Policy', he: 'מדיניות פרטיות' },
  terms:    { en: 'Terms of Use', he: 'תנאי שימוש' },
  a11y:     { en: 'Accessibility Statement', he: 'הצהרת נגישות' },
  contact:  { en: 'Accessibility contact', he: 'איש הקשר לנגישות' },
  cName:    { en: 'Name', he: 'שם' },
  cMail:    { en: 'Email', he: 'אימייל' },
  cTel:     { en: 'Phone', he: 'טלפון' },
  cReply:   { en: 'Response time', he: 'זמן תגובה' },
  cReplyV:  { en: 'Within 5 business days', he: 'עד 5 ימי עסקים' },
  rights:   { en: 'Noryx Technologies', he: 'נוריקס טכנולוגיות' }
};

const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function renderBlocks(doc, lg) {
  return doc.blocks.map(b => {
    if (b.h)  return '  <h2' + (b.flag ? ' class="flagged"' : '') + '>' + esc(b.h[lg]) + '</h2>';
    if (b.p)  return '  <p' + (b.flag ? ' class="flagged"' : '') + '>' + esc(b.p[lg]) + '</p>';
    if (b.ul) return '  <ul>\n' + b.ul[lg].map(i => '    <li>' + esc(i) + '</li>').join('\n') + '\n  </ul>';
    if (b.entity) return [
      '  <dl class="lcontact">',
      '    <dt>' + (lg === 'he' ? 'שם' : 'Name') + '</dt><dd>' + esc(ENTITY.name[lg]) + '</dd>',
      '    <dt>' + ENTITY.formLbl[lg] + '</dt><dd>' + esc(ENTITY.form[lg]) + '</dd>',
      /* The number is a Latin-digit run inside a right-to-left page. Isolating
         it on an inline span keeps the digits in their own order while the
         line itself stays aligned with the rest of the card; putting the
         direction on the dd instead pushes the whole row to the far side. */
      '    <dt>' + ENTITY.regLbl[lg] + '</dt><dd><span class="ltr">' + ENTITY.reg + '</span></dd>',
      '    <dt>' + ENTITY.addrLbl[lg] + '</dt><dd>' + esc(ENTITY.street[lg]) + ', ' + esc(ENTITY.city[lg]) + ', ' + esc(ENTITY.country[lg]) + '</dd>',
      '    <dt>' + (lg === 'he' ? 'אימייל' : 'Email') + '</dt><dd><a href="mailto:' + CONTACT_DETAILS.mail + '" class="ltr">' + CONTACT_DETAILS.mail + '</a></dd>',
      '    <dt>' + (lg === 'he' ? 'טלפון' : 'Phone') + '</dt><dd><a href="tel:' + CONTACT_DETAILS.telHref + '" class="ltr">' + CONTACT_DETAILS.tel + '</a></dd>',
      '  </dl>'
    ].join('\n');
    if (b.contact) return [
      '  <dl class="lcontact">',
      '    <dt>' + L.cName[lg] + '</dt><dd>' + esc(CONTACT_DETAILS.person[lg]) + '</dd>',
      '    <dt>' + L.cMail[lg] + '</dt><dd><a href="mailto:' + CONTACT_DETAILS.mail + '" class="ltr">' + CONTACT_DETAILS.mail + '</a></dd>',
      '    <dt>' + L.cTel[lg]  + '</dt><dd><a href="tel:' + CONTACT_DETAILS.telHref + '" class="ltr">' + CONTACT_DETAILS.tel + '</a></dd>',
      '    <dt>' + L.cReply[lg] + '</dt><dd>' + L.cReplyV[lg] + '</dd>',
      '  </dl>'
    ].join('\n');
    return '';
  }).join('\n');
}

function legalPage(doc, lg) {
  const isHe = lg === 'he';
  const here = SITE + (isHe ? '/he/' : '/') + doc.slug + '/';
  const alt  = isHe ? '../../' + doc.slug + '/' : '../he/' + doc.slug + '/';
  const toggle = isHe
    ? '<span class="lang" role="group" aria-label="שפה"><a href="' + alt + '" hreflang="en">EN</a><b aria-current="page">עב</b></span>'
    : '<span class="lang" role="group" aria-label="Language"><b aria-current="page">EN</b><a href="' + alt + '" hreflang="he">עב</a></span>';

  const footLinks = [['privacy', L.privacy], ['terms', L.terms], ['accessibility', L.a11y]]
    .map(([slug, lbl]) => '    <a href="../' + slug + '/"'
      + (slug === doc.slug ? ' aria-current="page"' : '') + '>' + lbl[lg] + '</a>').join('\n');

  /* The menu's own link to the statement is written for the front page, which
     sits one level higher than these do. */
  const widget = A11Y_HTML
    .replace('href="accessibility/"', 'href="../accessibility/"')
    .replace(/data-i18n="([^"]+)"([^>]*)>([^<]*)</g, (all, key, rest, txt) =>
      isHe && DICT_HE[key] != null ? 'data-i18n="' + key + '"' + rest + '>' + DICT_HE[key] + '<' : all);

  return '<!DOCTYPE html>\n<html lang="' + lg + '" dir="' + (isHe ? 'rtl' : 'ltr') + '">\n<head>\n'
    + '<meta charset="utf-8">\n'
    + '<meta name="viewport" content="width=device-width,initial-scale=1">\n'
    + '<title>' + esc(doc.title[lg]) + ' | ' + L.rights[lg] + '</title>\n'
    + '<meta name="description" content="' + esc(doc.lede[lg]) + '">\n'
    + '<meta name="robots" content="index, follow">\n'
    + '<link rel="canonical" href="' + here + '">\n'
    + '<link rel="alternate" hreflang="en" href="' + SITE + '/' + doc.slug + '/">\n'
    + '<link rel="alternate" hreflang="he" href="' + SITE + '/he/' + doc.slug + '/">\n'
    + '<link rel="alternate" hreflang="x-default" href="' + SITE + '/' + doc.slug + '/">\n'
    + FONTS + '\n<style>\n' + LEGAL_CSS + '\n</style>\n' + TRACKERS + '\n</head>\n<body>\n'
    + '<a class="skip" href="#main">' + L.skip[lg] + '</a>\n'
    + '<nav class="lnav">\n'
    + '  <a class="brand" href="../">\n'
    + '    <svg viewBox="0 0 32 32" aria-hidden="true">\n'
    + '      <path d="M4 9.5 16 3.5 28 9.5 16 15.5Z" fill="none" stroke="#35C8DC" stroke-width="2.4" stroke-linejoin="round"/>\n'
    + '      <path d="M4 15.5 16 21.5 28 15.5" fill="none" stroke="#1FA2B7" stroke-width="2.4" stroke-linejoin="round"/>\n'
    + '      <path d="M4 21.5 16 27.5 28 21.5" fill="none" stroke="#12618C" stroke-width="2.4" stroke-linejoin="round"/>\n'
    + '    </svg>\n    <span>NORYX</span>\n  </a>\n  ' + toggle + '\n</nav>\n\n'
    + '<main id="main" class="legal" tabindex="-1">\n'
    + '  <h1>' + esc(doc.title[lg]) + '</h1>\n'
    + '  <p class="updated">' + L.updated[lg] + ': ' + UPDATED[lg] + '</p>\n'
    + '  <p class="lede">' + esc(doc.lede[lg]) + '</p>\n'
    + renderBlocks(doc, lg) + '\n</main>\n\n'
    + '<footer>\n  <div class="foot-legal">\n' + footLinks + '\n  </div>\n'
    + '  <span>' + L.rights[lg] + ' &middot; noryx.io</span>\n</footer>\n\n'
    + widget + '\n<script>\n' + A11Y_JS + '\n<' + '/script>\n</body>\n</html>\n';
}

const DICT_HE = dict;
for (const doc of DOCS) {
  for (const lg of ['en', 'he']) {
    const p = path.join(OUT, lg === 'he' ? 'he/' + doc.slug : doc.slug, 'index.html');
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, legalPage(doc, lg), 'utf8');
    console.log('  legal', lg, '->', path.relative(OUT, p), fs.statSync(p).size, 'bytes');
  }
}

/* the two crawl files follow the same two addresses */
const url = (loc, pri) =>
  '  <url>\n    <loc>' + loc + '</loc>\n    <lastmod>2026-09-14</lastmod>\n'
  + '    <changefreq>monthly</changefreq>\n    <priority>' + pri + '</priority>\n'
  + '    <xhtml:link rel="alternate" hreflang="he" href="' + SITE + '/he/"/>\n'
  + '    <xhtml:link rel="alternate" hreflang="en" href="' + SITE + '/"/>\n'
  + '    <xhtml:link rel="alternate" hreflang="x-default" href="' + SITE + '/"/>\n  </url>\n';

/* The legal pages carry their own hreflang pair, which is not the pair the
   two front pages share, so they cannot go through the same helper. */
const legalUrl = slug =>
  ['/' + slug + '/', '/he/' + slug + '/'].map(p =>
    '  <url>\n    <loc>' + SITE + p + '</loc>\n    <lastmod>2026-09-24</lastmod>\n'
    + '    <changefreq>yearly</changefreq>\n    <priority>0.3</priority>\n'
    + '    <xhtml:link rel="alternate" hreflang="en" href="' + SITE + '/' + slug + '/"/>\n'
    + '    <xhtml:link rel="alternate" hreflang="he" href="' + SITE + '/he/' + slug + '/"/>\n'
    + '    <xhtml:link rel="alternate" hreflang="x-default" href="' + SITE + '/' + slug + '/"/>\n  </url>\n'
  ).join('');

fs.writeFileSync(path.join(OUT, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n'
  + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
  + '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
  + url(SITE + '/', '1.0') + url(SITE + '/he/', '0.9')
  + DOCS.map(d => legalUrl(d.slug)).join('')
  + '</urlset>\n', 'utf8');

fs.writeFileSync(path.join(OUT, 'robots.txt'),
  'User-agent: *\nAllow: /\n\nSitemap: ' + SITE + '/sitemap.xml\n', 'utf8');

/* Anything that ever pointed at the old /he/ path lands on the Hebrew root.
   The same rule is written twice because the two hosts read different files:
   Netlify reads _redirects, Vercel reads vercel.json. Keeping both means the
   site can move between them without the redirects quietly disappearing. */
fs.writeFileSync(path.join(OUT, '_redirects'),
  '/en      /    301\n/en/*    /    301\n', 'utf8');

fs.writeFileSync(path.join(OUT, 'vercel.json'), JSON.stringify({
  trailingSlash: true,
  /* All three spellings are listed on purpose. trailingSlash normalises the
     path before the redirect table is consulted, so a bare "/he" source never
     sees the request that arrives as "/he/". */
  redirects: [
    { source: '/en', destination: '/', permanent: true },
    { source: '/en/', destination: '/', permanent: true },
    { source: '/en/:path*', destination: '/', permanent: true }
  ]
}, null, 2) + '\n', 'utf8');

console.log('sitemap, robots, _redirects and vercel.json written');
