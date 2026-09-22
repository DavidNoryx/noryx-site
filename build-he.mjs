// Emits noryx/he/index.html as a real static Hebrew page: text is substituted at
// build time so search engines see Hebrew content, not a JS dictionary.
import fs from 'node:fs';
import path from 'node:path';

const root = 'C:/Users/david/Desktop/Noryx site 1/noryx';
const src = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// pull the Hebrew dictionary out of the source
const dictStart = src.indexOf('he:{');
const dictEnd = src.indexOf('}};', dictStart);
if (dictStart < 0 || dictEnd < 0) throw new Error('dictionary not found');
const body = src.slice(dictStart + 4, dictEnd);

const dict = {};
const entry = /'([a-zA-Z0-9._]+)'\s*:\s*'((?:[^'\\]|\\.)*)'/g;
for (const m of body.matchAll(entry)) {
  dict[m[1]] = m[2].replace(/\\'/g, "'");
}
console.log('dictionary entries:', Object.keys(dict).length);

let out = src;
let replaced = 0;
const missed = [];

out = out.replace(/(data-i18n="([^"]+)"[^>]*>)([^<]*)(<)/g, (all, open, key, txt, close) => {
  if (dict[key] == null) { missed.push(key); return all; }
  replaced++;
  return open + dict[key] + close;
});
console.log('substituted:', replaced);
if (missed.length) console.log('MISSED:', [...new Set(missed)].join(', '));

out = out.replace(
  '<title>Noryx | Underground Utility Mapping, 3D Laser Scanning and Scan-to-BIM</title>',
  '<title>נוריקס | איתור ומיפוי תשתיות תת־קרקעיות, סריקות תלת־ממד ו-Scan-to-BIM</title>');

out = out.replace(/<meta name="description" content="[^"]*">/,
  '<meta name="description" content="נוריקס ממפה ומתעדת את האתר שלכם מעל הקרקע ומתחתיה: איתור תשתיות תת־קרקעיות עם GPR, איתור אלקטרומגנטי ו-ERT, סריקות לייזר תלת־ממד, פוטוגרמטריה מרחפן, מדידות RTK-GNSS, Scan-to-BIM ותיעוד As-Built. פועלים בכל רחבי ישראל.">');

out = out.replace('<link rel="canonical" href="https://noryx-technologies.netlify.app/">',
  '<link rel="canonical" href="https://noryx-technologies.netlify.app/he/">');

// assets live one level up from /he/
out = out.replace(/src="assets\//g, 'src="../assets/');
out = out.replace(/'assets\//g, "'../assets/");

// the toggle becomes real links between two indexable pages
out = out.replace(/<span class="lang"[\s\S]*?<\/span>/,
  '<span class="lang"><a class="langlink" href="../" hreflang="en">EN</a>' +
  '<b aria-current="page">עב</b></span>');

// ship Hebrew from the first byte, no flash of English
out = out.replace("var lang = 'en';", "var lang = 'he';");
out = out.replace("applyLang(saved==='he'?'he':'en');", "applyLang('he');");
out = out.replace('<html', '<html'); // no-op guard

fs.mkdirSync(path.join(root, 'he'), { recursive: true });
fs.writeFileSync(path.join(root, 'he', 'index.html'), out, 'utf8');
console.log('wrote he/index.html', fs.statSync(path.join(root, 'he', 'index.html')).size, 'bytes');
