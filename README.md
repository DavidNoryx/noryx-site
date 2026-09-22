# Noryx Technologies — noryx.io

The marketing site. Two static pages built from one source file.

## How it is put together

    src/index.html      the single authoring source: English copy, plus a Hebrew
                        dictionary keyed by the data-i18n attributes in the markup
    build.mjs           reads src/index.html and writes both language builds
    noryx/              the build output that gets deployed (do not edit by hand)
      index.html        English, served at noryx.io
      he/index.html     Hebrew, served at noryx.io/he/
      assets/           images and video used by the pages

Everything in `noryx/*.html` is generated. Edit `src/index.html`, never the output.

## Build

    node build.mjs

That regenerates `noryx/index.html`, `noryx/he/index.html`, the sitemap, the
robots file and the redirect rules. It takes under a second and needs no
dependencies — plain Node, no npm install.

## Deploy

The site is hosted on Vercel and the `noryx` project is linked to this folder.

    npx vercel --prod

DNS lives at Namecheap. The A and CNAME records point at Vercel; the MX and
DKIM records point at Google Workspace and must not be touched — they carry the
@noryx.io mail. `dns-cutover.txt` holds the full record sheet.

## Services the site talks to

    Formspree   form submissions, form id xppwzrnk, delivered to zak@noryx.io
    GA4         page views and the generate_lead / click_whatsapp events
    OpenAI      conversion pixel, id YQqCtYoui9TaA8JqTLo5Yy

None of the three loads until the visitor answers the cookie banner. The banner
calls window.__noryxLoadTrackers, which is the only place the scripts are
injected; choosing "Essential only" loads nothing at all.

## What is deliberately not in this repository

The raw RTK drone photography (about 1.8 GB) and the field-workflow diagrams.
The frames the site actually uses are already processed into `noryx/assets`.
Keep the originals backed up somewhere else — see `.gitignore`.
