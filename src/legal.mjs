/* The three legal documents, each in both languages.
   build.mjs renders every entry into a page at /<slug>/ and /he/<slug>/.

   Block types: h (heading), p (paragraph), ul (list), note (callout).
   Every block carries both languages so the two builds cannot drift apart.

   WHAT IS DELIBERATELY NOT HERE
   The registered company name and company number, and a street address. They
   were not available when this was written and inventing them would be worse
   than leaving them out: a privacy policy that names the wrong legal entity
   protects nobody. Search for REGISTRATION_GAP below.  */

const CONTACT = {
  mail: 'office@noryx.io',
  tel: '054-393-6936',
  telHref: '+972543936936',
  person: { en: 'Zak Lumbroso', he: 'זק לומברוזו' }
};

export const UPDATED = { en: '24 September 2026', he: '24 בספטמבר 2026' };

/* ------------------------------------------------------------------ */
/*  PRIVACY                                                            */
/* ------------------------------------------------------------------ */

const privacy = {
  slug: 'privacy',
  title: { en: 'Privacy Policy', he: 'מדיניות פרטיות' },
  lede: {
    en: 'This policy explains what Noryx collects when you use noryx.io, who processes it on our behalf, and what you can ask us to do with it.',
    he: 'המדיניות הזו מסבירה איזה מידע נוריקס אוספת כשאתם משתמשים ב-noryx.io, מי מעבד אותו עבורנו, ומה אתם יכולים לדרוש שנעשה איתו.'
  },
  blocks: [
    { h: { en: '1. Who this policy covers', he: '1. על מי המדיניות חלה' } },
    { p: {
      en: 'Noryx Technologies ("Noryx", "we") operates the website noryx.io. This policy covers the website only. Data you give us inside a signed engineering project is governed by that project\'s contract, not by this page.',
      he: 'נוריקס טכנולוגיות ("נוריקס", "אנחנו") מפעילה את האתר noryx.io. המדיניות הזו חלה על האתר בלבד. מידע שתמסרו לנו במסגרת פרויקט הנדסי חתום כפוף לחוזה של אותו פרויקט, לא לעמוד הזה.'
    } },

    { h: { en: '2. What we collect', he: '2. איזה מידע נאסף' } },
    { p: {
      en: 'When you send the contact form, we receive exactly the fields you filled in:',
      he: 'כששולחים את טופס יצירת הקשר, מגיעים אלינו בדיוק השדות שמילאתם:'
    } },
    { ul: {
      en: ['Name', 'Company (optional)', 'Email address', 'Site location (optional)', 'Your message'],
      he: ['שם', 'חברה (רשות)', 'כתובת אימייל', 'מיקום האתר (רשות)', 'תוכן הפנייה']
    } },
    { p: {
      en: 'We do not ask for a phone number on the form. If you contact us by WhatsApp or by phone instead, we see the number you are calling from.',
      he: 'אנחנו לא מבקשים מספר טלפון בטופס. אם תפנו אלינו בוואטסאפ או בטלפון, נראה את המספר שממנו פניתם.'
    } },
    { p: {
      en: 'If — and only if — you accept measurement cookies, Google Analytics and an OpenAI measurement pixel record standard technical data: approximate location derived from IP address, browser and device type, the pages you viewed and how you arrived. Choose "Essential only" and neither script is downloaded at all.',
      he: 'אם — ורק אם — תאשרו עוגיות מדידה, גוגל אנליטיקס ופיקסל מדידה של OpenAI יתעדו נתונים טכניים סטנדרטיים: מיקום משוער לפי כתובת IP, סוג הדפדפן והמכשיר, אילו עמודים נצפו ודרך מי הגעתם. אם תבחרו "חיוניות בלבד", אף אחד מהסקריפטים האלה לא יורד למכשיר שלכם בכלל.'
    } },

    { h: { en: '3. What stays on your own device', he: '3. מה נשאר על המכשיר שלכם' } },
    { p: {
      en: 'Two items are written to your browser\'s local storage and are never transmitted to us on their own:',
      he: 'שני פריטים נכתבים לאחסון המקומי של הדפדפן שלכם, ולא נשלחים אלינו מעצמם:'
    } },
    { ul: {
      en: [
        'noryx_cookie_consent — the cookie choice you made, so you are not asked again on every visit.',
        'noryx_pending_lead — if a form submission fails (no signal, for example), what you typed is kept on your device so it is not lost, and is cleared the moment the message goes through.'
      ],
      he: [
        'noryx_cookie_consent — הבחירה שעשיתם לגבי עוגיות, כדי שלא נשאל אתכם שוב בכל ביקור.',
        'noryx_pending_lead — אם שליחת טופס נכשלת (למשל בגלל חוסר קליטה), מה שהקלדתם נשמר על המכשיר שלכם כדי שלא ילך לאיבוד, ונמחק ברגע שההודעה נשלחת בהצלחה.'
      ]
    } },
    { p: {
      en: 'You can delete both at any time by clearing site data in your browser.',
      he: 'אפשר למחוק את שניהם בכל רגע, דרך ניקוי נתוני האתר בדפדפן.'
    } },

    { h: { en: '4. Why we hold it', he: '4. למה אנחנו מחזיקים את זה' } },
    { p: {
      en: 'To answer your enquiry, prepare a quote, and keep a record of what was discussed if the enquiry becomes a project. We do not use contact form details for marketing lists, and we do not send newsletters.',
      he: 'כדי לענות לפנייה, להכין הצעת מחיר, ולשמור תיעוד של מה שנאמר אם הפנייה הופכת לפרויקט. אנחנו לא משתמשים בפרטים מטופס יצירת הקשר לרשימות תפוצה, ולא שולחים ניוזלטר.'
    } },

    { h: { en: '5. Who else processes it', he: '5. מי עוד מעבד את המידע' } },
    { p: {
      en: 'We do not sell personal data and we do not trade it. These are the service providers that necessarily handle it, and what each one does:',
      he: 'אנחנו לא מוכרים מידע אישי ולא סוחרים בו. אלה ספקי השירות שנחשפים אליו מעצם התפעול, ומה כל אחד מהם עושה:'
    } },
    { ul: {
      en: [
        'Formspree, Inc. (United States) — receives the contact form and forwards it to our inbox.',
        'Vercel Inc. (United States) — hosts this website and serves it over a global content delivery network.',
        'Google Ireland Ltd. / Google LLC — Google Analytics, and Google Workspace which carries our email.',
        'OpenAI — a measurement pixel that records whether a visit resulted in an enquiry.',
        'WhatsApp Ireland Ltd. (Meta) — only if you choose to open a WhatsApp conversation with us.'
      ],
      he: [
        'Formspree, Inc. (ארצות הברית) — מקבלת את טופס יצירת הקשר ומעבירה אותו לתיבה שלנו.',
        'Vercel Inc. (ארצות הברית) — מאחסנת את האתר ומגישה אותו דרך רשת הפצה גלובלית.',
        'Google Ireland Ltd. / Google LLC — גוגל אנליטיקס, וכן Google Workspace שדרכו עובר הדואר שלנו.',
        'OpenAI — פיקסל מדידה שמתעד אם ביקור הסתיים בפנייה.',
        'WhatsApp Ireland Ltd. (מטא) — רק אם תבחרו לפתוח איתנו שיחת וואטסאפ.'
      ]
    } },
    { p: {
      en: 'Some of these providers store data on servers outside Israel, including in the United States and the European Union. By sending us a message you accept that the message is handled on those servers.',
      he: 'חלק מהספקים האלה שומרים מידע על שרתים מחוץ לישראל, בכלל זה בארצות הברית ובאיחוד האירופי. בשליחת הודעה אליכם ידוע שהיא מטופלת על שרתים אלה.'
    } },

    { h: { en: '6. Cookies and your choice', he: '6. עוגיות והבחירה שלכם' } },
    { p: {
      en: 'On your first visit a banner asks how you want to be measured. Nothing beyond what the page needs to function loads before you answer. "Essential only" means no analytics or measurement script is fetched — not that it is fetched and ignored. To change your mind later, clear site data for noryx.io in your browser and the banner will appear again.',
      he: 'בביקור הראשון מופיע באנר ששואל איך אתם מוכנים שנמדוד. עד שתענו, לא נטען שום דבר מעבר למה שהעמוד צריך כדי לעבוד. "חיוניות בלבד" אומר ששום סקריפט מדידה לא יורד — לא שהוא יורד ומתעלמים ממנו. כדי לשנות את הבחירה בהמשך, נקו את נתוני האתר של noryx.io בדפדפן והבאנר יופיע שוב.'
    } },

    { h: { en: '7. How long we keep it', he: '7. כמה זמן המידע נשמר' } },
    { p: {
      en: 'Enquiries that do not become projects are kept for up to 24 months and then deleted. Enquiries that become projects are kept for as long as the engagement and the record-keeping periods that follow it require. Analytics data is retained according to the provider\'s own default period.',
      he: 'פניות שלא הופכות לפרויקט נשמרות עד 24 חודשים ואז נמחקות. פניות שהופכות לפרויקט נשמרות כל עוד ההתקשרות ותקופות שמירת הרשומות שאחריה מחייבות. נתוני אנליטיקס נשמרים לפי תקופת ברירת המחדל של הספק.'
    } },

    { h: { en: '8. Your rights', he: '8. הזכויות שלכם' } },
    { p: {
      en: 'Under the Protection of Privacy Law, 5741-1981, you may ask to see the information we hold about you, ask us to correct it if it is wrong or incomplete, and ask us to delete it. Write to ' + CONTACT.mail + ' and we will respond within 30 days. If you are not satisfied with our answer, you may complain to the Israeli Privacy Protection Authority.',
      he: 'לפי חוק הגנת הפרטיות, התשמ"א-1981, אתם רשאים לבקש לעיין במידע שאנחנו מחזיקים עליכם, לבקש לתקן אותו אם הוא שגוי או חסר, ולבקש למחוק אותו. כתבו ל-' + CONTACT.mail + ' ונענה בתוך 30 יום. אם התשובה שלנו לא מספקת אתכם, אתם רשאים להגיש תלונה לרשות להגנת הפרטיות.'
    } },

    { h: { en: '9. Security', he: '9. אבטחה' } },
    { p: {
      en: 'The site is served over HTTPS only. Form submissions travel encrypted. Access to the enquiry inbox is limited to Noryx staff who need it. No system is perfectly secure, and we do not claim otherwise.',
      he: 'האתר מוגש ב-HTTPS בלבד. שליחות הטופס עוברות מוצפנות. הגישה לתיבת הפניות מוגבלת לעובדי נוריקס שזקוקים לה. אף מערכת אינה חסינה לחלוטין, ואנחנו לא טוענים אחרת.'
    } },

    { h: { en: '10. Children', he: '10. קטינים' } },
    { p: {
      en: 'This is a business-to-business site. It is not directed at children, and we do not knowingly collect information from anyone under 16.',
      he: 'זהו אתר עסקי המיועד לארגונים. הוא אינו מכוון לילדים, ואנחנו לא אוספים ביודעין מידע ממי שטרם מלאו לו 16.'
    } },

    { h: { en: '11. Changes', he: '11. שינויים' } },
    { p: {
      en: 'If this policy changes materially, the date at the top of the page changes with it. Continued use of the site after that date means the updated policy applies.',
      he: 'אם המדיניות תשתנה באופן מהותי, התאריך בראש העמוד ישתנה בהתאם. שימוש באתר אחרי אותו תאריך משמעו שהמדיניות המעודכנת חלה.'
    } }
  ]
};

/* ------------------------------------------------------------------ */
/*  TERMS                                                              */
/* ------------------------------------------------------------------ */

const terms = {
  slug: 'terms',
  title: { en: 'Terms of Use', he: 'תנאי שימוש' },
  lede: {
    en: 'These terms govern your use of noryx.io. The section on engineering reliance is the one that matters most — please read it before acting on anything you see here.',
    he: 'התנאים האלה חלים על השימוש שלכם ב-noryx.io. הסעיף על הסתמכות הנדסית הוא החשוב מכולם — קראו אותו לפני שאתם פועלים על סמך משהו שראיתם כאן.'
  },
  blocks: [
    { h: { en: '1. Accepting these terms', he: '1. הסכמה לתנאים' } },
    { p: {
      en: 'Using this website means you accept these terms. If you do not accept them, please do not use the site.',
      he: 'שימוש באתר הזה מהווה הסכמה לתנאים. מי שלא מסכים להם מתבקש לא להשתמש באתר.'
    } },

    { h: { en: '2. Intellectual property', he: '2. קניין רוחני' } },
    { p: {
      en: 'Everything on this site belongs to Noryx or is used by Noryx under licence. That includes, without limiting the general rule:',
      he: 'כל מה שנמצא באתר הזה שייך לנוריקס או שנוריקס עושה בו שימוש ברישיון. זה כולל, בלי לגרוע מהכלל:'
    } },
    { ul: {
      en: [
        'Three-dimensional models, point clouds, scans and any derived geometry.',
        'The source code of this site and of the viewing platform it demonstrates.',
        'All text, headings and descriptive copy, in both languages.',
        'The Noryx name, logo, colour system and visual identity.',
        'Photography, video, diagrams and illustrations.'
      ],
      he: [
        'מודלים תלת-ממדיים, עננֵי נקודות, סריקות וכל גיאומטריה נגזרת.',
        'קוד המקור של האתר ושל פלטפורמת הצפייה שהוא מדגים.',
        'כל הטקסטים, הכותרות והתוכן התיאורי, בשתי השפות.',
        'השם נוריקס, הלוגו, מערכת הצבעים והזהות החזותית.',
        'צילומים, וידאו, תרשימים ואיורים.'
      ]
    } },
    { p: {
      en: 'You may not copy, reproduce, publish, distribute, modify, reverse engineer, scrape or otherwise extract any of it, nor use it to train a machine learning model, without our prior written permission. Quoting a short passage with a link back to the source is fine.',
      he: 'אסור להעתיק, לשכפל, לפרסם, להפיץ, לשנות, לבצע הנדסה לאחור, לגרד או לחלץ בכל דרך אחרת כל חלק מזה, וגם לא להשתמש בזה לאימון מודל למידת מכונה, בלי אישור שלנו מראש ובכתב. ציטוט קטע קצר עם קישור למקור הוא בסדר.'
    } },

    { h: { en: '3. What the site is not: engineering reliance', he: '3. מה האתר אינו: הסתמכות הנדסית' }, flag: true },
    { p: {
      en: 'The models, scans, depths, coordinates, colour-coded utility runs and every other visual on this site are illustrative. They are published to show what our work looks like. They are general information and nothing more.',
      he: 'המודלים, הסריקות, העומקים, הקואורדינטות, קווי התשתית הצבועים וכל שאר החזותיים באתר הזה הם להמחשה. הם מתפרסמים כדי להראות איך העבודה שלנו נראית. הם מידע כללי ותו לא.'
    } },
    { p: {
      en: 'They are not a survey. They are not an engineering opinion. They are not a stamped or signed as-built record, and they are not a basis on which to plan or carry out excavation, drilling or any other ground work. No duty of care arises from anything published on this site.',
      he: 'הם אינם מדידה. הם אינם חוות דעת הנדסית. הם אינם תיעוד As-Built חתום או מוחתם, והם אינם בסיס לתכנון או לביצוע חפירה, קידוח או כל עבודת קרקע אחרת. שום חובת זהירות לא נוצרת מדבר שמתפרסם באתר הזה.'
    } },
    { p: {
      en: 'Noryx deliverables you may rely on are the ones issued to you under a signed project contract, identified as such, and bearing the signature of the qualified professional responsible for them. If it did not arrive that way, it is not a deliverable.',
      he: 'התוצרים של נוריקס שמותר להסתמך עליהם הם אלה שנמסרים לכם במסגרת חוזה פרויקט חתום, מסומנים ככאלה, ונושאים את חתימת בעל המקצוע המוסמך האחראי עליהם. מה שלא הגיע ככה — אינו תוצר.'
    } },
    { p: {
      en: 'Locating underground utilities is subject to site conditions, soil, depth, material and the limits of the physics involved. Accuracy is described against the quality levels of ASCE 38-22 and is always stated per deliverable. No survey method, ours included, identifies every buried element with certainty, and statutory excavation procedures apply regardless of what any survey shows.',
      he: 'איתור תשתיות תת-קרקעיות מושפע מתנאי השטח, מסוג הקרקע, מהעומק, מהחומר ומגבולות הפיזיקה עצמה. הדיוק מתואר מול רמות האיכות של תקן ASCE 38-22 ותמיד מצוין לכל תוצר בנפרד. שום שיטת מדידה, שלנו כולל, לא מזהה בוודאות כל אלמנט קבור, והנהלים הסטטוטוריים לחפירה חלים בלי קשר למה שמדידה כלשהי מראה.'
    } },

    { h: { en: '4. Commercial terms', he: '4. תנאים מסחריים' } },
    { p: {
      en: 'Nothing on this site is an offer. Scope, price, schedule, deliverable formats, accuracy levels, cancellation and every other commercial term are set exclusively in the individual proposal or contract signed between Noryx and the client. Where this site and a signed contract disagree, the contract governs.',
      he: 'שום דבר באתר הזה אינו הצעה מחייבת. היקף, מחיר, לוח זמנים, פורמטים של תוצרים, רמות דיוק, ביטול וכל תנאי מסחרי אחר נקבעים אך ורק בהצעה או בחוזה הפרטני שנחתם בין נוריקס ללקוח. במקרה של סתירה בין האתר לחוזה חתום — החוזה גובר.'
    } },

    { h: { en: '5. The site is provided as is', he: '5. האתר ניתן כמות שהוא' } },
    { p: {
      en: 'We work to keep the site accurate and available, but we do not warrant that it will be uninterrupted, error free, or free of anything harmful. We may change or withdraw any part of it at any time.',
      he: 'אנחנו משתדלים לשמור על האתר מדויק וזמין, אבל לא מתחייבים שהוא יפעל ברציפות, בלי תקלות או בלי גורם מזיק כלשהו. אנחנו רשאים לשנות או להסיר כל חלק ממנו בכל עת.'
    } },

    { h: { en: '6. Limitation of liability', he: '6. הגבלת אחריות' } },
    { p: {
      en: 'To the fullest extent permitted by law, Noryx is not liable for any indirect, consequential or incidental loss arising from use of this site or reliance on its content, including lost profit, delay, or damage caused during excavation or ground work. Nothing here limits liability that cannot lawfully be limited.',
      he: 'במידה המרבית שהדין מתיר, נוריקס לא תישא באחריות לנזק עקיף, תוצאתי או נלווה שנגרם משימוש באתר הזה או מהסתמכות על תוכנו, לרבות אובדן רווח, עיכוב, או נזק שנגרם במהלך חפירה או עבודות קרקע. אין בכתוב כדי להגביל אחריות שהדין אינו מתיר להגביל.'
    } },

    { h: { en: '7. Links to other sites', he: '7. קישורים לאתרים אחרים' } },
    { p: {
      en: 'Where we link somewhere else, we do not control what is there and are not responsible for it.',
      he: 'במקומות שבהם אנחנו מקשרים החוצה, אין לנו שליטה על מה שנמצא שם ואנחנו לא אחראים לזה.'
    } },

    { h: { en: '8. Governing law', he: '8. הדין החל' } },
    { p: {
      en: 'These terms are governed by the laws of the State of Israel. The competent courts of Tel Aviv-Jaffa have exclusive jurisdiction.',
      he: 'על התנאים האלה חלים דיני מדינת ישראל. סמכות השיפוט הייחודית נתונה לבתי המשפט המוסמכים בתל אביב-יפו.'
    } },

    { h: { en: '9. Changes to these terms', he: '9. שינוי התנאים' } },
    { p: {
      en: 'We may update these terms. The date at the top of the page shows when they last changed.',
      he: 'אנחנו רשאים לעדכן את התנאים. התאריך בראש העמוד מציין מתי שונו לאחרונה.'
    } }
  ]
};

/* ------------------------------------------------------------------ */
/*  ACCESSIBILITY                                                      */
/* ------------------------------------------------------------------ */

const accessibility = {
  slug: 'accessibility',
  title: { en: 'Accessibility Statement', he: 'הצהרת נגישות' },
  lede: {
    en: 'Noryx wants this site to be usable by everyone, including people who browse with a screen reader, a keyboard alone, or with the display adjusted to suit them.',
    he: 'נוריקס רוצה שהאתר הזה יהיה שמיש לכל אחד, כולל מי שגולש עם קורא מסך, עם מקלדת בלבד, או עם תצוגה מותאמת לצרכים שלו.'
  },
  blocks: [
    { h: { en: '1. Our commitment', he: '1. המחויבות שלנו' } },
    { p: {
      en: 'We treat accessibility as part of building the site, not as something added afterwards. Where we fall short we want to hear about it, and we fix what we can.',
      he: 'אנחנו מתייחסים לנגישות כחלק מבניית האתר, לא כמשהו שמוסיפים בסוף. איפה שאנחנו לא עומדים בזה, אנחנו רוצים לשמוע, ומתקנים מה שאפשר.'
    } },

    { h: { en: '2. The standard we work to', he: '2. התקן שלפיו אנחנו עובדים' } },
    { p: {
      en: 'This site is built to Israeli Standard IS 5568 at level AA, which is based on the international WCAG guidelines, as required by the Equal Rights for Persons with Disabilities (Service Accessibility Adjustments) Regulations, 5773-2013. Where WCAG 2.1 level AA adds a requirement beyond that baseline, we follow it as well.',
      he: 'האתר בנוי לפי תקן ישראלי ת"י 5568 ברמה AA, שמבוסס על הנחיות WCAG הבינלאומיות, כנדרש בתקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע"ג-2013. במקומות שבהם WCAG 2.1 ברמה AA מוסיף דרישה מעבר לבסיס הזה, אנחנו הולכים גם לפיה.'
    } },

    { h: { en: '3. What is in place', he: '3. מה קיים באתר' } },
    { ul: {
      en: [
        'Every page can be operated with a keyboard alone, and a "skip to content" link is the first thing focus reaches.',
        'Headings, landmarks and lists use real semantic markup, so a screen reader can navigate the structure.',
        'Every form field has a visible, permanently associated label. Errors are announced, not only shown in colour.',
        'Every meaningful image carries alternative text. Purely decorative graphics are hidden from screen readers so they do not create noise.',
        'Both videos on the site are silent and carry no speech, so no captions are needed to understand them.',
        'The site respects the operating system "reduce motion" setting: when it is on, the scroll animations stop.',
        'The layout works from a narrow phone up to a large desktop, and text can be enlarged without content being lost.',
        'Both languages are marked up correctly, including right-to-left direction for Hebrew.'
      ],
      he: [
        'אפשר להפעיל כל עמוד עם מקלדת בלבד, וקישור "דילוג לתוכן" הוא הדבר הראשון שהפוקוס מגיע אליו.',
        'כותרות, אזורי ניווט ורשימות בנויים בתגיות סמנטיות אמיתיות, כך שקורא מסך יכול לנווט לפי המבנה.',
        'לכל שדה בטופס יש תווית גלויה שמקושרת אליו באופן קבוע. שגיאות מוכרזות, לא רק מסומנות בצבע.',
        'לכל תמונה בעלת משמעות יש טקסט חלופי. גרפיקה דקורטיבית בלבד מוסתרת מקוראי מסך כדי שלא תייצר רעש.',
        'שני הסרטונים באתר שקטים ואין בהם דיבור, ולכן אין צורך בכתוביות כדי להבין אותם.',
        'האתר מכבד את הגדרת "הפחתת תנועה" של מערכת ההפעלה: כשהיא דולקת, אנימציות הגלילה נעצרות.',
        'הפריסה עובדת מפלאפון צר ועד מסך שולחני גדול, ואפשר להגדיל טקסט בלי לאבד תוכן.',
        'שתי השפות מסומנות נכון בקוד, כולל כיוון מימין לשמאל לעברית.'
      ]
    } },

    { h: { en: '4. The accessibility menu', he: '4. תפריט הנגישות' } },
    { p: {
      en: 'A button in the bottom corner of every page opens an accessibility menu. It offers larger or smaller text, a high contrast mode, a greyscale mode, highlighted links, and permanently visible keyboard focus outlines. Your choice is remembered on your device for the next visit, and one button resets everything.',
      he: 'כפתור בפינה התחתונה של כל עמוד פותח תפריט נגישות. יש בו הגדלה והקטנה של הטקסט, מצב ניגודיות גבוהה, מצב גווני אפור, הדגשת קישורים, וסימון פוקוס מקלדת שנשאר גלוי תמיד. הבחירה שלכם נשמרת על המכשיר לביקור הבא, וכפתור אחד מאפס הכול.'
    } },
    { p: {
      en: 'The menu is a supplement, not a substitute. The site is built to work with the assistive technology you already use — the menu is there for people who would rather adjust the page itself.',
      he: 'התפריט הוא תוספת, לא תחליף. האתר בנוי לעבוד עם טכנולוגיית הסיוע שכבר יש לכם — התפריט נועד למי שמעדיף להתאים את העמוד עצמו.'
    } },

    { h: { en: '5. Where we are not there yet', he: '5. איפה אנחנו עדיין לא שלמים' }, flag: true },
    { p: {
      en: 'We would rather state this plainly than claim a level we have not reached:',
      he: 'אנחנו מעדיפים לומר את זה בפה מלא מאשר לטעון לרמה שלא הגענו אליה:'
    } },
    { ul: {
      en: [
        'The interactive three-dimensional and scroll-driven visuals are decorative demonstrations. They are hidden from screen readers, and the information they illustrate is written out in text nearby — but the visual experience itself is not available through a screen reader.',
        'Engineering files we deliver in project formats such as DWG, RVT and IFC are not accessible documents by nature, and are supplied under project contracts rather than through this site.',
        'Pages or components we add in future may briefly fall short until they are reviewed.'
      ],
      he: [
        'החזותיים התלת-ממדיים והאינטראקטיביים שמופעלים בגלילה הם הדגמה דקורטיבית. הם מוסתרים מקוראי מסך, והמידע שהם ממחישים כתוב בטקסט בסמוך — אבל החוויה החזותית עצמה לא זמינה דרך קורא מסך.',
        'קבצים הנדסיים שאנחנו מספקים בפורמטים של פרויקט כמו DWG, RVT ו-IFC אינם מסמכים נגישים מעצם טבעם, ונמסרים במסגרת חוזי פרויקט ולא דרך האתר הזה.',
        'עמודים או רכיבים שנוסיף בעתיד עלולים לא לעמוד בתקן לזמן קצר, עד שייבדקו.'
      ]
    } },

    { h: { en: '6. Found a problem? Tell us', he: '6. נתקלתם בבעיה? ספרו לנו' } },
    { p: {
      en: 'If something on this site blocked you, please get in touch and say what you were trying to do and what got in the way. That report is the most useful thing we can receive, and we treat it as a priority.',
      he: 'אם משהו באתר חסם אתכם, פנו אלינו ותארו מה ניסיתם לעשות ומה הפריע. דיווח כזה הוא הדבר הכי שימושי שאנחנו יכולים לקבל, ואנחנו מטפלים בו בעדיפות.'
    } },
    { contact: true },

    { h: { en: '7. Status of this statement', he: '7. מעמד ההצהרה' } },
    { p: {
      en: 'This statement describes the state of the site on the date shown at the top of the page, based on our own review. It is reviewed again whenever the site changes materially.',
      he: 'ההצהרה הזו מתארת את מצב האתר בתאריך המופיע בראש העמוד, על בסיס בדיקה שערכנו בעצמנו. היא נבדקת מחדש בכל שינוי מהותי באתר.'
    } }
  ]
};

export const CONTACT_DETAILS = CONTACT;
export const DOCS = [privacy, terms, accessibility];
