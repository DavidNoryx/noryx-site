import { activeFindings, activeSite } from './sites'

const FINDINGS = activeFindings()
const SITE = activeSite()

// Utility classes, coloured the way a services drawing colours them so an
// engineer reads the plan without a key.
export const UTILITY = {
  water: { label: 'Water', color: '#35c8dc' },
  sewer: { label: 'Sewer', color: '#8be0a0' },
  power: { label: 'Power', color: '#f2a33c' },
  comms: { label: 'Comms', color: '#a79dff' },
  gas: { label: 'Gas', color: '#ffb164' },
  structure: { label: 'Structure', color: '#7f9bb1' },
}

export const RUNS = FINDINGS.filter((f) => f.kind === 'subsurface')

// Mains and connections are both runs and both clash-check, but they are not
// the same thing to a reader: four mains describe a street, and the laterals
// describe who is attached to it. Keeping them apart lets the UI lead with the
// mains and let the connections be asked for.
export const MAINS = RUNS.filter((r) => !r.lateral)
export const LATERALS = RUNS.filter((r) => r.lateral)

/** Plan length of a run, which is what a chainage is measured along. */
export function runLength(run) {
  let total = 0
  for (let i = 1; i < run.path.length; i += 1) {
    total += Math.hypot(
      run.path[i][0] - run.path[i - 1][0],
      run.path[i][1] - run.path[i - 1][1],
    )
  }
  return total
}

/**
 * Depth at a fraction along a run.
 *
 * A gravity sewer with a declared fall and a constant drawn depth is a
 * contradiction: the panel says it falls at 1.1 percent and the model draws it
 * dead level. The declared fall is applied about the mid-point, so the stated
 * depth stays the average of the run and the two ends move apart.
 */
export function depthAt(run, f) {
  if (!run.fall) return run.depth
  return run.depth + run.fall * (f - 0.5) * runLength(run)
}

/** Depth at each end, and the drop between them. */
export function invertRange(run) {
  const start = depthAt(run, 0)
  const end = depthAt(run, 1)
  return { start, end, drop: end - start, length: runLength(run) }
}

/** Where a point sits along a run, as a fraction, by nearest approach. */
export function chainageOf(run, at) {
  let best = { f: 0, d: Infinity }
  const steps = 200
  for (let i = 0; i <= steps; i += 1) {
    const f = i / steps
    const t = f * (run.path.length - 1)
    const k = Math.min(run.path.length - 2, Math.floor(t))
    const r = t - k
    const x = run.path[k][0] + (run.path[k + 1][0] - run.path[k][0]) * r
    const z = run.path[k][1] + (run.path[k + 1][1] - run.path[k][1]) * r
    const d = Math.hypot(x - at[0], z - at[1])
    if (d < best.d) best = { f, d }
  }
  return best.f
}

/** Sample a run's polyline densely enough to measure against. */
function sample(run, steps = 160) {
  const pts = run.path
  const out = []
  for (let i = 0; i <= steps; i += 1) {
    const frac = i / steps
    const t = frac * (pts.length - 1)
    const k = Math.min(pts.length - 2, Math.floor(t))
    const f = t - k
    out.push([
      pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f,
      // Depth follows the declared fall, so a clearance measured against a
      // gravity run is measured against where it actually is at that chainage.
      -depthAt(run, frac),
      pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f,
    ])
  }
  return out
}

/**
 * Where two runs cross in plan, and by how much they miss in section.
 *
 * A crossing is not automatically a problem — services cross all the time.
 * What matters is the vertical clearance at the crossing, because that is what
 * decides whether a digger working to one of them hits the other. Anything
 * under 300 mm is called out; that is the common separation minimum.
 */
export const CLEARANCE_MIN = 0.3

/**
 * A lateral meeting its own main is a connection, not a clash.
 *
 * Without this the detector reports every tee as a near miss with a hundred
 * millimetres of clearance, which is true and useless: the two are joined.
 * Anyone who has read an automated clash report knows that the false positives
 * are what makes people stop reading it.
 */
function connected(a, b) {
  // Two runs of the same utility that meet are joined, not in conflict —
  // whether that is a service teeing off its main, or a branch sewer meeting
  // the trunk it drains into at a junction chamber. Reporting either as a
  // hundred-millimetre near miss is how a clash report trains people to ignore
  // clash reports.
  return a.utility === b.utility
}

export function findCrossings() {
  const out = []
  for (let a = 0; a < RUNS.length; a += 1) {
    for (let b = a + 1; b < RUNS.length; b += 1) {
      if (connected(RUNS[a], RUNS[b])) continue
      const A = sample(RUNS[a])
      const B = sample(RUNS[b])
      let best = null
      for (const p of A) {
        for (const q of B) {
          const dx = p[0] - q[0]
          const dz = p[2] - q[2]
          const plan = Math.hypot(dx, dz)
          if (!best || plan < best.plan) {
            best = {
              plan,
              at: [(p[0] + q[0]) / 2, Math.max(p[1], q[1]), (p[2] + q[2]) / 2],
              clearance: Math.abs(p[1] - q[1]),
            }
          }
        }
      }
      // Crossing in plan within a metre is a real crossing, not two runs
      // passing at a distance.
      if (best && best.plan < 1.0) {
        out.push({
          a: RUNS[a].id,
          b: RUNS[b].id,
          at: best.at,
          clearance: best.clearance,
          tight: best.clearance < CLEARANCE_MIN,
        })
      }
    }
  }
  return out
}

/**
 * Manholes on a gravity run. A sewer needs an access chamber wherever it
 * changes direction and at intervals along straight lengths, because that is
 * the only way it can be rodded when it blocks.
 */
export const MANHOLE_SPACING = 40

export function manholesFor(run) {
  // Where a site lists its surface features explicitly, those are the chambers.
  // Inferring a second set from the path vertices would draw two lids on one hole.
  if (SITE.surface?.length) return []
  if (run.utility !== 'sewer') return []
  const out = []
  run.path.forEach(([x, z], i) => {
    const isEnd = i === 0 || i === run.path.length - 1
    out.push({
      at: [x, -run.depth, z],
      reason: isEnd ? 'Terminal chamber' : 'Change of direction',
      id: `MH${String(i + 1).padStart(2, '0')}`,
    })
  })
  return out
}

/** Plan-view bounds across every run, with a margin, for the 2D drawing. */
export function planBounds(margin = 4) {
  let minX = Infinity
  let maxX = -Infinity
  let minZ = Infinity
  let maxZ = -Infinity
  for (const run of RUNS) {
    for (const [x, z] of run.path) {
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minZ = Math.min(minZ, z)
      maxZ = Math.max(maxZ, z)
    }
  }
  return {
    minX: minX - margin,
    maxX: maxX + margin,
    minZ: minZ - margin,
    maxZ: maxZ + margin,
  }
}
