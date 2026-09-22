/* Builds the two indexable pages from one source.
   src/index.html is authored in English and carries the Hebrew dictionary.
   English ships at the root as the primary language; Hebrew ships at /he/.
   The previous layout had these the other way round, so /en/ is redirected to
   the root rather than dropped, and the old /he redirect had to go: that path
   is now a real page, not something to bounce away.
   Run: node build.mjs */
import fs from 'node:fs';
import path from 'node:path';

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
const SPLIT = '</style>\n\n<a class="skip"';
const si = src.indexOf(SPLIT);
if (si < 0) throw new Error('head/body boundary not found');
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
  '    window.oaiq("init", { pixelId: "YQqCtYoui9TaA8JqTLo5Yy", debug: true });',
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

/* the two crawl files follow the same two addresses */
const url = (loc, pri) =>
  '  <url>\n    <loc>' + loc + '</loc>\n    <lastmod>2026-09-14</lastmod>\n'
  + '    <changefreq>monthly</changefreq>\n    <priority>' + pri + '</priority>\n'
  + '    <xhtml:link rel="alternate" hreflang="he" href="' + SITE + '/he/"/>\n'
  + '    <xhtml:link rel="alternate" hreflang="en" href="' + SITE + '/"/>\n'
  + '    <xhtml:link rel="alternate" hreflang="x-default" href="' + SITE + '/"/>\n  </url>\n';

fs.writeFileSync(path.join(OUT, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n'
  + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
  + '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
  + url(SITE + '/', '1.0') + url(SITE + '/he/', '0.9')
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
