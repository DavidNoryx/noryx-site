# NORYX — קובץ Figma, מסמך טכני

נספח למסמך `NORYX-POC-מסמך-טכני.md`. מתאר את קובץ העיצוב: מה יש בו, איך הוא
מחובר לקוד, ומה המגבלות שנתקלנו בהן ב‑Figma Plugin API.

**הקובץ:** `figma.com/design/lph6wB0qqLKfNZWJAUaCLi`

---

## 1. מה יש בקובץ

```
Page 1
├── Logo                       COMPONENT
├── Status tag                 COMPONENT_SET   3 וריאנטים
├── Quality level              COMPONENT_SET   4 וריאנטים
├── Service row                COMPONENT
├── Finding card               COMPONENT
├── LIVE — screenshots…        FRAME           3068 × 834
└── 00…07                      8 × FRAME       1440 × 900 כל אחד
```

בנוסף, לא נראה בקנבס אבל קיים בקובץ:
- **קולקשן משתנים `NORYX`** — 16 משתני צבע
- **7 סגנונות טקסט**

---

## 2. מערכת הטוקנים

```
surface/void     #060d13     רקע עמוד
surface/deep     #0b1622     פאנל
surface/panel    #0f1e2c     מוגבה
surface/active   #16293a     נבחר
line/hairline    #16293a     קו שיער
line/strong      #24415a     קו מודגש
accent/base      #12618c     פעולה
accent/bright    #2a8fc4     hover
accent/cyan      #35c8dc     חי, מדוד, בטוח
text/primary     #e6f0f7
text/muted       #7f9bb1
text/faint       #4a6b85
sensor/lidar     #35c8dc
sensor/rgb       #a79dff
sensor/thermal   #ffb164
sensor/gpr       #f2a33c
```

**ה‑`scopes` מוגדרים במפורש** לכל משתנה (`FRAME_FILL`, `TEXT_FILL`, `STROKE_COLOR`),
ולא `ALL_SCOPES` — אחרת כל בוחר צבע ב‑Figma מתמלא ב‑16 אפשרויות לא רלוונטיות.

**סגנונות טקסט:**

| סגנון | גופן | שימוש |
|---|---|---|
| `display/beat` | Inter Bold 34 | כותרת שקף |
| `body/lead` | Inter Medium 15 | פסקה ראשית |
| `body/base` | Inter Medium 13 | גוף |
| `body/small` | Inter Medium 11 | תוויות |
| `mono/label` | JetBrains Mono 9 | תוויות מכשיר |
| `mono/value` | JetBrains Mono Medium 13 | ערכים נמדדים |
| `mono/readout` | JetBrains Mono 10 | קריאות |

**הכלל:** כל דבר **נמדד** הוא מונוספייס. כל דבר **נכתב** הוא Inter. זה הקו שמפריד
בין מכשיר לאתר שיווקי, והוא זהה בקוד ובעיצוב.

---

## 3. הקומפוננטות, ומה כל אחת מייצגת בקוד

| Figma | קוד | הערה |
|---|---|---|
| `Logo` | `src/components/Logo.jsx` | הסימן הוא ה‑PNG המקורי עם אלפא |
| `Status tag` | `STATUS` ב‑`src/narrative.js` | live / proven / planned |
| `Quality level` | `QL` ב‑`src/sue.js` | ASCE 38-22 |
| `Service row` | רצועת השירותים ב‑`Toolbar.jsx` | צבע = מחלקת תשתית |
| `Finding card` | `src/components/Findings.jsx` | פס הייחוס לחיישן |

### Logo
הסימן חולץ מ‑`LOGO/לוגו אופציה.png` בסקריפט שמפריד אותו מהוורדמרק **לפי בהירות**
(הסימן ציאני בהיר, הוורדמרק נייבי כהה) ובונה ערוץ אלפא מהמרחק לרקע הלבן.
**הוורדמרק לא נלקח מהרסטר** — הוא נייבי על לבן ונעלם על רקע כהה, אז הוא מוגדר
ב‑Inter Bold עם letter-spacing תואם.

### Status tag
שלושה וריאנטים. **זה לא קישוט.** משקיע שלא יכול להבחין בין "קיים" ל"מתוכנן"
מנכה את שניהם לאפס. כל טענה במצגת נושאת תג.

### Quality level
ארבעה וריאנטים לפי ASCE 38-22. QL-B הוא מה ש‑NORYX מוסר; הפער ל‑QL-A הוא
**מדרגת מחיר**, לא רק תיאור.

---

## 4. שתי מגבלות ב‑Figma Plugin API שעלו בדרך

### 4.1 אי אפשר לדרוס `x` על ילד של instance

```
Error: in set_x: This property cannot be overridden in an instance:
relative-transform
```

זה הרג את המימוש הראשון של **פס הייחוס** בכרטיס הממצא, שהיה auto-layout עם
שלושה סגמנטים זה לצד זה.

**הפתרון:** שלוש שכבות מצטברות, **כולן ב‑`x = 0`**, מצוירות מאחור לפנים:

```
שכבה אחורית   רוחב 268   צבע החיישן השלישי
שכבה אמצעית   רוחב 248   צבע החיישן השני
שכבה קדמית    רוחב 214   צבע החיישן הראשון
```

רוחב **כן** ניתן לדריסה. התוצאה נראית זהה לפס מוערם, ו‑instance יכול לשנות אותה.

### 4.2 משתנים מקושרים נשמטים בדריסת instance

ה‑API מדווח `boundVariables.color` קיים ו‑`bound: true`, והרנדר יוצא **שחור**.

**הפתרון:** ברירות המחדל של הקומפוננטה קשורות לטוקנים; **הדריסות ב‑instances
משתמשות בצבעים ליטרליים.** המשמעות המעשית: שינוי טוקן יעדכן את הקומפוננטה,
לא את ה‑instances שנדרסו ידנית.

---

## 5. יחס Figma ↔ קוד

**זה לא design system שהקוד מיישם. זה קוד שהעיצוב מתעד.**

הכיוון הוא code → design, לא ההפך. האפליקציה היא מקור האמת; הקובץ ב‑Figma מסונכרן
ממנה נקודתית.

**המשמעות המעשית ל‑CTO:**
- שינוי ב‑`narrative.js` לא מתעדכן אוטומטית ב‑Figma
- שינוי ב‑Figma לא מגיע לקוד
- **הסנכרון ידני, ולכן צריך להיות נדיר** — לעשות אותו כשמשהו מתייצב, לא בכל שינוי

הניסיון שלנו: ניסיון לסנכרן בכל שינוי בזמן שהמוצר זז כל שעה הוא בזבוז.

---

## 6. רצועת הצילומים

הפריים `LIVE — screenshots of the running build` מכיל ארבעה צילומים מהבילד,
לא מוקאפים:

| | מה מראה |
|---|---|
| Street block, Kalasatama | כביש אמיתי, מכוניות חונות, מעבר חצייה |
| Services under the street | חמישה שירותים על קו המרכז שחולץ מהמש |
| Fusing the data | מה כל מכשיר מחזיר |
| Walk the site | גוף ראשון, גובה עין 1.70 מ' |

**למה זה שם:** פריים עיצוב עם מלבן אפור במקום ה‑viewport לא אומר למשקיע כלום,
ולא אומר ל‑CTO אם זה אמיתי. הצילום אומר.

---

## 7. איך מסנכרנים שוב

דרך Figma MCP (`use_figma`, `upload_assets`):

1. **צילומים** — `upload_assets` עם `count`, POST של הבייטים ל‑`submitUrl` שחוזר.
   כל URL חד‑פעמי, תוקף 10 דקות. התגובה מחזירה `placedOnNodeId`.
2. **נקה** — למחוק את הפריימים הישנים ולהשאיר את קולקשן המשתנים וסגנונות הטקסט.
   אלה יציבים; הפריימים לא.
3. **קומפוננטות** — ליצור מחדש, לקרוא `combineAsVariants` לסטים.
4. **פריימים** — מערך נתונים אחד ולולאה. הנוסח מועתק מ‑`src/narrative.js`.

**דגשים מהניסיון:**
- `figma.notify()` זורק "not implemented" — לא להשתמש
- מעבר עמוד רק דרך `await figma.setCurrentPageAsync(page)`
- צבעים בטווח 0–1, לא 0–255
- `fills` הוא מערך לקריאה בלבד — לשכפל, לשנות, להציב מחדש
- `HUG` / `FILL` רק אחרי `appendChild`

---

## 8. מה חסר בקובץ

- **אין מצב בהיר.** המצגת כהה בלבד.
- **אין responsive.** פריימים ב‑1440 × 900 בלבד.
- **ה‑viewport הוא צילום, לא מערכת.** אין קומפוננטה שמייצגת את הסצנה התלת‑ממדית,
  כי אי אפשר.
- **אין Code Connect.** אפשר למפות קומפוננטות Figma לקומפוננטות React דרך
  `add_code_connect_map` — לא נעשה. שווה אם הצוות יגדל.
- **השרטוט הדו‑ממדי לא בקובץ.** הוא SVG שנוצר בזמן ריצה מאותן קואורדינטות של
  המודל; לשכפל אותו ידנית ב‑Figma יהיה ציור שמשקר.
