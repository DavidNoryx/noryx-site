# NORYX TECHNOLOGIES - DESIGN PACKAGE

**Revision 3, the current build.** Tier 1, single journey, drone descent over a real site.
CTA: Talk to an engineer. Bilingual EN / HE with full RTL.

## 0. WHAT CHANGED IN REVISION 3

- **Theme inverted to light.** The dark canvas read too close to a competitor. The site now
  sits on a light slate canvas with `#12618C` as the working accent. Because the hero
  footage is bright daylight aerial, the whole hero legibility system inverted with it:
  dark ink type over a LIGHT veil scrim, and the worst-frame audit now hunts the DARKEST
  pixel under the type rather than the lightest.
- **Hero replaced.** Concept B "The Stack" retired. The hero is now a drone descent over a
  real construction site with the buried service runs traced over the ground.
- **Devices are hand-built, not generated.** Generated phone and tablet screens produce
  broken hardware and gibberish interface text, which the no-text guard forbids. The two
  screens are drawn in vector and carry the real hero ending frame with an animated
  utility overlay, so the visitor sees the actual captured footage on both screens.
- **Section 02 reworked** to "Surface and subsurface, detection hidden and visible", and a
  five-part technology strip added under How it works.
- **All leads route to info@noryx.io**, by Formspree when the endpoint is set, and by the
  visitor's own mail client until then. Neither path can silently swallow a lead.

## 0b. PALETTE, REVISION 3 (light)

```css
--canvas:#EDF2F7;  --canvas-2:#E2EAF3;  --panel:#F8FBFD;  --panel-2:#FFFFFF;
--line:#CFDCE8;    --line-strong:#A6BED2;
--accent:#12618C;  --accent-hover:#0D4A6C;  --accent-tint:#DDEBF4;
--cyan:#1FA2B7;    --cyan-bright:#35C8DC;   --deep:#0E2A3D;
--ink:#0C2131;     --ink-2:#4B6478;
```

Type adds **Heebo** for Hebrew, swapped in on `html[lang="he"]` for both display and body.

## 0c. BAND MAP, REVISION 3

Hero 680vh. Bands OVERLAP by one ramp width (0.02): ranges that merely touch do not
crossfade, they blink empty for one frame at the handover.

| Band | Range | Copy | Entrance |
|---|---|---|---|
| 1 | 0.00-0.17 | "We map what is above it." | grid snap-align |
| 2 | 0.15-0.45 | "We scan what is standing on it." | scatter |
| 3 | 0.43-0.61 | "Every site has a second site under it." | blur-to-sharp |
| 4 | 0.59-0.86 | "And we find what is buried under it." | word-punch |
| 5 | 0.84-1.00 | settle | word-by-word rise |

Video time is eased against linear scroll (`1 - (1-p)^1.45`) because the drone never
decelerates: the raw clip arrives at its last frame still moving. Measured worst-pixel
contrast, dark ink on the light veil: 6.19 / 4.88 / 5.89 / 5.76 / 3.69, all above the
3.5:1 floor.

---

*Revisions 1 and 2 below, kept for the reasoning.*

Tier 1, single journey. Concept A "The Descent". CTA: Talk to an engineer.

## 1. THE BRAND PREMISE

One idea: **THE LAYER**.

A site is not a surface. It is a stack of layers. The Noryx mark is already three stacked
layers, bright at the top and darker going down. The three services ARE those layers:
aerial mapping above, LiDAR and BIM at the surface, utility detection below. The platform
is what hands a developer all three at once. Every section teaches this one idea, and the
scroll performs it by travelling down through them.

## 2. PALETTE (sampled from the logo file; finalized against the footage after the gate)

```css
:root{
  --canvas:        #070D15;  /* page background, navy-tinted, never pure black */
  --canvas-deep:   #04080E;  /* the deepest layer */
  --panel:         #0D1826;  /* cards and raised surfaces */
  --panel-2:       #132434;  /* raised panel */
  --line:          #1B2E40;  /* hairline dividers */
  --accent:        #35C8DC;  /* CTA and rare emphasis, logo surface cyan */
  --accent-hover:  #5BD8E9;
  --accent-muted:  #1FA2B7;  /* whisper level: borders, glows, particles */
  --mid:           #197BA2;  /* middle layer blue */
  --deep:          #12618C;  /* bottom layer blue */
  --text-primary:  #E6F1F6;
  --text-secondary:#8AA4B5;
}
```

Logo-sampled truth: `#5BC6D4` / `#1FA2B7` / `#197BA2` / `#12618C`, wordmark navy `#1C384E`.

## 3. THE TYPE TRIO

- **Display:** Archivo 600/700, tight tracking. Industrial grotesk with real character.
- **Body:** IBM Plex Sans 400/500. Engineering heritage, quiet.
- **Mono:** IBM Plex Mono 400/500. Depth readouts, QL tags, section numbers, coordinates.

Never Inter, never Roboto.

## 4. THE BAND MAP (hero 880vh; RE-CUT to the delivered footage, flick-test validated)

The concept pivoted to Concept B, The Stack: one 8 second descent through three
layers. The original band map was written before the footage existed and did not
survive contact with it. Measured layer timings in the delivered clip:

- aerial mesh      0.0 to 1.0s   -> progress 0.00 to 0.125
- LiDAR point cloud 1.0 to 3.8s  -> progress 0.125 to 0.475
- the ground crossing 3.8 to 4.5s -> progress 0.475 to 0.5625
- buried services  4.5 to 8.0s   -> progress 0.5625 to 1.00

Bands are contiguous. The first cut left 220 to 280px gaps between them, which
read as dead hero on a normal scroll flick.

| Band | Range | Footage moment | Copy (verbatim) | Entrance (echoes the moment) |
|---|---|---|---|---|
| 1 | 0.00-0.13 | the triangulated aerial mesh | "We map what is above it." | grid snap-align, the mesh is a grid |
| 2 | 0.13-0.45 | inside the LiDAR point cloud | "We scan what is standing on it." | scatter, points assembling |
| 3 | 0.45-0.60 | punching through the ground, grit on the lens | "Every site has a second site under it." | blur-to-sharp, focus arriving |
| 4 | 0.60-0.85 | the buried network with junction markers | "And we find what is buried under it." | word-punch, the find landing |
| 5 | 0.85-1.00 | rest, all three layers stacked in one frame | SETTLE, see below | word-by-word rise, staged |

The hook now lands exactly as the lens breaks through the soil, which is the most
dramatic moment in the film. That is better than the plan, not a compromise.

Per-band scrim alphas, tuned against each band's own worst frame, never an average:
band 1 `--sa:.93` (it sits over the mesh convergence, the brightest footage there is),
band 2 `--sa:.80`, the rest on the .70 default. Measured worst-pixel contrast:
6.63 / 4.55 / 4.80 / 4.18 / 4.42, all clear of the 3.5:1 floor.

**Settle band 5:**

- headline: "See through the ground."
- subline: "Noryx maps what is under your site, scans what is on it, and puts both on one screen."
- cta: "Talk to an engineer"

## 5. STATIC-HERO COPY BLOCK (phones, reduced motion)

- headline: "See through the ground."
- subline: "Noryx maps what is under your site, scans what is on it, and puts both on one screen. Before anyone breaks ground."
- cta: "Talk to an engineer"

## 6. BELOW-FOLD OUTLINE (every section funnels to #contact)

### 01 THE STAKES (stat grid, researched numbers)

- "$83.2 billion" / a year, US economy, underground utility damage
- "668,999" / damage incidents recorded in 2025
- "64%" / of strikes, the line sat more than 2 feet outside the mark
- "$227 million" / every day

lede: "The ground is the last part of a project nobody can see. It is also the part that
stops the job."

### 02 THE THREE LAYERS (three EQUAL cards, each with a hand-drawn SVG diagram)

- **01 ABOVE / Aerial mapping.** "Drone photogrammetry and orthomosaics. Survey grade site models, captured in a morning."
- **02 SURFACE / 3D LiDAR scanning.** "Point cloud to BIM. As-built models of what is actually standing, not what the drawings claim."
- **03 BELOW / Utility detection.** "Non-destructive. Radar and electromagnetic locating, positioned to ASCE 38-22 quality levels. Nothing dug."

### 03 THE CUTAWAY (the one interactive moment, the signature element)

Hand-drawn isometric SVG: a block of a real site, buildings and road on top. Press and hold
and the ground goes transparent while the buried network lights up beneath. Release early
and it eases back. Complete it and the layer legend lights in sequence. Reduced motion gets
the finished transparent state instantly.

label: "Hold to see through the ground."

### 04 HOW IT WORKS (mono numbered progression)

- 0.1 "We survey the site" / "No digging, no lane closures, no core drilling. One crew."
- 0.2 "We capture every layer" / "Drone, LiDAR and subsurface detection in one mobilisation."
- 0.3 "We build the model" / "Point cloud to BIM, utilities positioned to a stated quality level."
- 0.4 "We hand it over" / "Your whole site on a screen. Walk it from anywhere."

### 05 THE PLATFORM (answers the objection head on)

- kicker: "The objection we hear first"
- head: "You already run six platforms."
- body: "The average contractor runs 6.3 of them, and 81% say the stack itself is the
  problem. So the tour is not another login for the field. It is a link. It opens in a
  browser, on a phone, in a trailer, and the person opening it needs no account and no
  training session. Your data stays yours and exports to the formats your team already uses."

### 06 FAQ (the real objections found in research)

**Q: Does ground penetrating radar actually work in clay or wet ground?**
A: "Honestly, not everywhere. Radar reaches roughly 18 metres in clean dry sand and about
6 metres in dense wet clay, and a saturated layer near the surface can block most of the
signal. That is why we never run radar alone. We pair it with electromagnetic locating,
calibrate depth on site, and tell you plainly which readings are strong and which are not."

**Q: How accurate is it, really?**
A: "We report to ASCE 38-22 quality levels, which is the industry's own scale, so you know
exactly what you are holding. Geophysical mapping typically finds 10 to 50% more utilities
than record based mapping. Where a line is critical, we verify it."

**Q: How long does it take?**
A: "A scan to BIM job usually runs four to eight weeks in this industry, and the modelling
alone can run longer than that. We compress it because capture and modelling are one
pipeline here instead of two vendors passing files to each other."

**Q: Is this another platform my team has to learn?**
A: "No. The tour is a link. If someone can open a web page, they can walk your site."

**Q: What if you find nothing unexpected?**
A: "Then you hold a documented, dated record that the ground is clear, which is exactly
what you want in your hand if anyone disputes it later."

### 07 CTA / FORM (id="contact")

- head: "Tell us about the site."
- sub: "An engineer answers, not a sales team. Send the location and what you are planning
  and we will tell you what we would capture and what it would take."
- fields: Name / Company / Email / Site location / What are you planning?
- button: "Talk to an engineer"
- success: "Sent. An engineer will come back to you."
- handling: mailto to the Noryx address, or Formspree. ASK THE USER for the address.

### 08 FOOTER

The layer mark, nav, contact, copyright. Brand is REAL, so no fictional disclosure.
Imagery: user chose "swap in real photos later", so NO AI disclosure line.

## 7. VECTOR LAYER PLAN (all hand-drawn SVG, all honor reduced motion)

- The isometric cutaway (signature, interactive, section 03)
- Three service diagrams of equal weight: aerial mesh / point cloud scan / subsurface radar wave
- Hero depth ladder: mono readout, metres counting down with scroll, three layer names lighting
- Self-drawing section rules that draw on scroll
- Fixed background environment layer: very slow subsurface gradient drift plus fine grain, 90s cycle
- Whisper particles at accent-muted, one living element per section

## 8. THE ENGINEERING LIST (scrub-pipeline.md, all of it)

Blob fetch with loading ring (stream if over 8MB), dt-normalized lerp that rests, gated
seeks with the error-path deadlock escape, delta-gated DOM writes, band pacing plus the
flick test, the four-layer legibility system with the worst-frame audit at 3.5:1, the five
static-hero gates matched EXACTLY in CSS and JS and armed by change listeners,
complete-without-video, reduced motion honored live in both directions, overflow-x clip on
html AND body, and the whole-site-animated standard.

## 9. THE COPY GATE

Every line above ships verbatim. The built page must pass the Phase 9 grep gate: zero em
dashes, zero stock words (leverage, seamless, empower, unlock, robust, actionable,
data-driven, solutions), plus the AI-tell sweep. Protected brand device: "Above. Surface.
Below." is a designed triplet and stays.

---

## REVISION, 14 Sep 2026

Nine changes requested against the published structure, plus the APWA colour call.

1. **CTA wording.** "Talk to an engineer" becomes "Contact us" / "צרו קשר" in the nav and
   on the contact form. One key, `cta.primary`, so both pages moved together.
2. **The hero reveal is now the scroll.** The press-and-hold button and its pointer
   handlers are gone. The hero is a sticky stage inside a 200svh track, the same idiom the
   capture film already used, and `--xr` is read straight off the track's progress. The
   reveal completes at 68% of the track so the finished picture is held on screen instead
   of flashing past at the handover. A rail beside the copy fills as it runs. Reduced
   motion pins the reveal open and drops the track to auto height, so no scroll is needed.
3. **Third statistic.** The Gush Dan metro budget is replaced by the broad national claim.
   It carries no citation, so the counter attribute came off, the source line under it was
   removed, and the closing line now reads "Sources are named beside the figures they
   belong to" rather than claiming every figure is attributed.
4. **The proprietary workflow is out.** "Different layers. One picture.", its lede, and the
   accessible / non-accessible route diagram are deleted, along with their CSS and the tab
   script. The technology block that shared the section was NOT part of the process and is
   promoted to its own section, `#tech`. The step numbers close up, 2 and 3 become 1 and 2,
   and the nav's first link now points at Technology.
5. **Air and ground.** Band 03 of the film and its kicker both say air and ground now.
6 & 7. **Real photography replaces both abstract graphics.** One component, `.lstack`,
   built from the client's own RTK drone frames of עמק דותן: three plates cut from a single
   aerial frame, explode-stacked in CSS 3D. Top plate is the photograph, middle is the same
   frame in greyscale for the measured surface, bottom drops back under a navy wash so the
   colour-coded services read first. The explode distance is in `cqw` so it stays
   proportional whether it lands in the narrow fusion column or the wide platform panel;
   px fallbacks are declared first for browsers without container units.
8. **Portfolio hidden.** The section is lifted verbatim to `_hidden_projects_section.html`
   at the project root, outside the deploy folder, so it is neither rendered nor served.
   Paste it back to restore. Its dictionary keys stay in place.
9. **Telecom moves to APWA orange,** `#E2640F`, replacing the green that the standard
   reserves for sewer. Gas keeps its amber, so the two stay separable on a light ground.

Verified on both pages at 1440x950, 1024x768, 768x1024, 414x896, 390x844, 375x667 and
360x640: no horizontal overflow, no console errors, no 4xx, hero copy unclipped at every
size, all six plate images loading.

---

## REVISION 2, 14 Sep 2026

The photographic layer plates were rejected as too crude for an engineering
diagram. Two replacements, both requested directly.

**The exploded layer diagram, drawn not photographed.** `.isostack` is generated
by `iso-gen.mjs` and pasted in as plain SVG. One isometric projection
(`sx = (x - y)·cos30·s`, `sy = ((x + y)/2 - z)·s`) drives every face, so the
building, the soil section and the buried runs share a single coordinate system.
That is what makes the layers register instead of merely stack: the road on the
top slab, the asphalt band on the ground slab and the telecom run underneath are
literally the same y range.

- Layer 1, what stands: a 5 unit slab carrying two glazed masses, a road with
  centre dashes, and marked parking bays.
- Layer 2, the ground in section: three strata bands exposed on the two cut
  cheeks, topsoil over sub-base over bedrock, a dashed foundation datum running
  along both cheeks, survey grid, contours, and the two raft footprints.
- Layer 3, the services: a dark slab with a survey grid, ghosted footprints of
  the masses above, and four colour coded runs with chambers at the junctions.
  Each run is a glow, a core and a highlight offset 1.5 up, so it reads round.

No ids anywhere in the SVG, so the same markup appears in the fusion section and
the platform section without colliding. The slabs float on a 9s cycle and
separate further once the diagram enters the viewport or the pointer is over it;
the float and the separation sit on nested groups so neither cancels the other.
Reduced motion drops both.

Telecom stays APWA orange rather than the green named in the brief, because the
standard reserves green for sewer and that call was already made.

**The real platform in the screens.** The Nira capture is now the content of the
hero tablet (an `<image>` inside the SVG's canvas area, under the grid and the
runs) and of both device screens in the field section, which previously reused
the drone ending frame. Captured headless at deviceScaleFactor 2, cropped to the
model, and the street sign on the building blurred so nothing on it is readable.
No client is named anywhere on the site.

Verified on both pages: no horizontal overflow, no console errors, no 4xx, the
Hebrew build rewrites `href="assets/` and `url(assets/` alongside the two rules
it already had.

---

## GOING LIVE ON noryx.io, 14 Sep 2026

The existing noryx.io is a Netlify site, and its sitemap already declared two
addresses: `/` in Hebrew and `/en/`. The new site had been built the other way
round, English at the root and Hebrew at `/he/`, so the structure was flipped to
match what Google has already indexed rather than move two live URLs.

**Source moved out of the deploy folder.** `noryx/index.html` was both the
authoring source and a published file, which cannot hold once the root is a
generated page. The source is now `src/index.html`, still authored in English
with the Hebrew dictionary inside it, and `build.mjs` emits both pages:

- `noryx/index.html`, Hebrew, `lang="he" dir="rtl"`, assets at `assets/`
- `noryx/en/index.html`, English, `lang="en" dir="ltr"`, assets at `../assets/`

**A real document wrapper.** The source had no doctype, `<html>`, `<head>` or
`<body>`; browsers inferred them and `applyLang` set the language at runtime,
which means a crawler saw no language at all before JS. The build now wraps both
pages properly and stamps `lang` and `dir` statically, so the Hebrew page is
Hebrew from the first byte.

**Addresses.** Every absolute URL moved from the netlify.app preview host to
`https://noryx.io`, per page: canonical, the three hreflang links, `og:url` and
the JSON-LD `@id` and `url`. Hebrew gets its own title, description, keywords
and Open Graph pair. `_redirects` sends `/he` and `/he/*` to the Hebrew root so
nothing that ever pointed at the old path dies.

**Analytics.** The GA4 property already running on noryx.io, G-6M5C6X7NBS, is
carried into both pages at the end of head, at the owner's instruction.

Deploy bundle: `noryx-deploy.zip`, 4.46 MB, entry names written with forward
slashes so the paths survive upload.
