import { activeSite, activeFindings } from './sites'
import { UTILITY } from './utilities'

/**
 * Surface features: the part of a buried network you can actually see.
 *
 * This matters more than it looks. Everything below ground in this scene is
 * inferred — a radar response, a record drawing, a confidence number. A
 * chamber lid is not inferred: it is a thing at a surveyed coordinate, and the
 * run it sits on is pinned to it in all three dimensions. ASCE 38-22 gives
 * surface features their own quality level for exactly that reason, and a
 * survey that ignores them is throwing away the only free truth on site.
 *
 * So each feature carries a cover at ground level, an optional above-ground
 * body, and a riser down to the run it belongs to. The riser is the bit that
 * reads: it is the visible answer to "how does that get out of the ground".
 */
/**
 * `body` picks the geometry: `cover` is flush, `cabinet` is a street cabinet
 * on a plinth, `post` is a flush box with a marker post beside it, `meter` is
 * an upright metering assembly.
 *
 * Sizes are real. Street furniture is the one thing in a utility model a
 * viewer can check against their own memory of a street, so a cabinet that is
 * the wrong height reads as fake even when nobody can say why.
 */
export const SURFACE_KIND = {
  manhole: {
    glyph: '◉',
    label: 'Manhole',
    form: 'round',
    body: 'cover',
    // Cover opening and the chamber below it. A 400 mm sewer at 2.4 m needs a
    // 1200 mm chamber, reached through a 600 mm lid.
    cover: 0.6,
    shaft: 1.0,
    above: 0,
    detail: 'Cast iron cover over a 1200 mm access chamber',
  },
  chamber: {
    glyph: '▭',
    label: 'Chamber',
    form: 'rect',
    body: 'cover',
    cover: [1.2, 0.6],
    shaft: [1.2, 0.6],
    above: 0,
    detail: 'Jointing and draw pit',
  },
  valve: {
    glyph: '◇',
    label: 'Valve cover',
    form: 'round',
    body: 'cover',
    cover: 0.3,
    shaft: 0.16,
    above: 0,
    detail: 'Surface box over a spindle',
  },
  pillar: {
    glyph: '▮',
    label: 'Distribution cabinet',
    form: 'rect',
    body: 'cabinet',
    // Helen Sähköverkko's street cabinets are hot-dip galvanised steel at
    // about 1200 x 600 x 220 mm, standing on a concrete plinth. Galvanised
    // steel is grey; the service colour belongs on an identification band,
    // not on the whole cabinet.
    cover: [0.6, 0.26],
    shaft: [0.3, 0.2],
    above: 1.36,
    detail: 'Galvanised steel cabinet, 1200 x 600 mm, on a concrete plinth',
  },
  hydrant: {
    glyph: '⌶',
    label: 'Hydrant',
    form: 'round',
    body: 'post',
    // Finland buries its hydrants. Frost would burst an above-ground pillar,
    // so the valve sits in an insulated box under a cover and a marker post
    // with a blue plate tells the brigade where it is.
    cover: 0.42,
    shaft: 0.18,
    above: 1.1,
    detail: 'Underground hydrant and marker post — the Finnish pattern',
  },
  meter: {
    glyph: '▯',
    label: 'Meter assembly',
    form: 'rect',
    body: 'meter',
    // Not used on this street: a Finnish water meter lives inside the
    // building. Kept because sites elsewhere put it on the boundary, and the
    // library is the thing that has to survive the next project.
    cover: [0.5, 0.3],
    shaft: [0.22, 0.22],
    above: 1.15,
    detail: 'Metering and isolation at the building line',
  },
}

const SITE = activeSite()
const FINDINGS = activeFindings()

/**
 * Resolve the site's surface list into something drawable.
 *
 * Depth and colour come from the run the feature sits on rather than being
 * repeated here, so a feature can never disagree with its own service.
 */
function resolve(items) {
  return items.flatMap((item) => {
    const kind = SURFACE_KIND[item.type]
    const run = FINDINGS.find((f) => f.id === item.on)
    if (!kind || !run) return []
    return [{
      ...item,
      kind,
      run,
      utility: run.utility,
      color: UTILITY[run.utility]?.color ?? '#7f9bb1',
      // How far the riser has to reach. An above-ground body starts at the
      // cover and goes up; the riser starts at the cover and goes down.
      depth: run.depth,
      label: `${UTILITY[run.utility]?.label ?? 'Service'} ${kind.label.toLowerCase()}`,
    }]
  })
}

export const SURFACE = resolve(SITE.surface ?? [])

/** One line per feature, for the panel that lists what was found at the surface. */
export function surfaceSummary() {
  const byType = new Map()
  for (const item of SURFACE) {
    const seen = byType.get(item.type) ?? { type: item.type, kind: item.kind, count: 0 }
    seen.count += 1
    byType.set(item.type, seen)
  }
  return [...byType.values()]
}

/**
 * Surface features sitting over a given run.
 *
 * Used both to draw the risers and to make the point in the panel: a run with
 * three surveyed covers on it is a different proposition from a run with none.
 */
export function surfaceOn(runId) {
  return SURFACE.filter((item) => item.on === runId)
}
