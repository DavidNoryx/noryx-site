import { RUNS, runLength, depthAt } from './utilities'
import { QL } from './sue'

/**
 * Turning a position into a risk.
 *
 * Everything else in this model draws a service as a line, which quietly
 * claims a precision nobody has. ASCE 38-22 does not grade a survey by where
 * the pipe is; it grades it by how well you know where the pipe is. So the
 * honest object is not a line, it is a volume — and the volume is what decides
 * how wide a trench has to be and how much of it has to be dug by hand.
 *
 * That is also the commercial argument. An authority is not buying a drawing.
 * It is buying the difference between a 2.6 m hand-dig corridor and a 0.9 m
 * machine-dig one, down the length of a street.
 */

/**
 * Positional tolerance by quality level.
 *
 * QL-B is the one with a rule rather than a convention behind it: ASCE 38-22
 * expects horizontal accuracy good enough that the service is found within the
 * designated area, and practice puts that at about half the depth. QL-C and
 * QL-D are records and surface interpretation, and the spreads below are the
 * ones used to size a safe dig, not a claim of measurement.
 */
export const TOLERANCE = {
  A: { plan: 0.05, depth: 0.05, note: 'Exposed and surveyed' },
  B: { plan: null, depth: 0.15, note: 'Geophysics · plan tolerance scales with depth' },
  C: { plan: 0.5, depth: 0.5, note: 'Surveyed surface features correlated to records' },
  D: { plan: 1.0, depth: 1.0, note: 'Records only · position not verified' },
}

/** Half-width and half-height of the uncertainty volume around a run. */
export function envelope(run, f = 0.5) {
  const t = TOLERANCE[run.ql] ?? TOLERANCE.D
  const depth = depthAt(run, f)
  // QL-B is the geophysical case, where plan error grows with depth because
  // the response is a cone, not a point.
  const plan = t.plan ?? Math.max(0.1, depth * 0.15)
  return { plan, depth: t.depth, note: t.note, level: run.ql }
}

/** Outside diameter in metres, read off the diameter string where it has one. */
export function outsideDiameter(run) {
  const mm = /(\d+)\s*mm/.exec(run.diameter ?? '')
  if (mm) return Number(mm[1]) / 1000
  // A duct bank or a cable group: size it by how many ways it carries.
  const ways = /(\d+)\s*x\s*(\d+)/.exec(run.diameter ?? '')
  if (ways) return (Number(ways[1]) * Number(ways[2])) / 1000
  return 0.2
}

export const SAFE_DIG_MARGIN = 0.3

/**
 * The excavation corridor: how wide the trench has to be opened.
 *
 * Pipe, plus the positional uncertainty either side, plus a working margin.
 * This is the number that turns a survey into money, because the regulations
 * that matter are written about it — anything inside the corridor of a live
 * service is hand dig, and hand dig is roughly an order more expensive per
 * metre than a machine.
 */
export function corridor(run, f = 0.5) {
  const env = envelope(run, f)
  const od = outsideDiameter(run)
  const width = od + 2 * env.plan + 2 * SAFE_DIG_MARGIN
  return {
    width,
    od,
    tolerance: env.plan,
    margin: SAFE_DIG_MARGIN,
    // What the same trench would be if the run were proven to QL-A.
    ifProven: od + 2 * TOLERANCE.A.plan + 2 * SAFE_DIG_MARGIN,
    level: run.ql,
    note: env.note,
  }
}

/** Every run's corridor, widest first — the order a dig is priced in. */
export function corridors() {
  return RUNS.map((run) => {
    const c = corridor(run)
    return {
      run,
      ...c,
      length: runLength(run),
      // Hand-dig area saved by proving this one run to QL-A.
      saving: (c.width - c.ifProven) * runLength(run),
    }
  }).sort((a, b) => b.width - a.width)
}

/**
 * What proving the street would be worth.
 *
 * Deliberately expressed as area rather than currency. A rate per square metre
 * is a local number that changes by country, by year and by contract, and
 * quoting one as though it were a property of the product would be the kind of
 * invention this model is built to avoid. The area is ours; the rate is theirs.
 */
export function upgradeCase() {
  const rows = corridors()
  const total = rows.reduce((sum, r) => sum + r.saving, 0)
  const worst = rows.filter((r) => r.level === 'D' || r.level === 'C')
  return {
    rows,
    handDigArea: rows.reduce((sum, r) => sum + r.width * r.length, 0),
    provenArea: rows.reduce((sum, r) => sum + r.ifProven * r.length, 0),
    saving: total,
    unproven: worst.length,
    unprovenLength: worst.reduce((sum, r) => sum + r.length, 0),
  }
}

/**
 * Records against measurement.
 *
 * The strongest thing a survey can hand an authority is not a position. It is
 * the distance between where the records said a service was and where it turned
 * out to be — because that distance is the one number that tells them what the
 * rest of their records are worth.
 *
 * Offsets below are per run and are declared on the site, not generated here:
 * a fabricated discrepancy would be worse than none.
 */
export function discrepancies(findings) {
  return findings
    .filter((f) => f.record)
    .map((f) => {
      const dx = f.record.offset[0]
      const dz = f.record.offset[1]
      const plan = Math.hypot(dx, dz)
      const depth = (f.record.depth ?? f.depth) - f.depth
      return {
        run: f,
        plan,
        depth,
        total: Math.hypot(plan, depth),
        source: f.record.source,
        offset: f.record.offset,
        recordDepth: f.record.depth ?? f.depth,
      }
    })
    .sort((a, b) => b.plan - a.plan)
}

/** Headline numbers for the records-versus-measured panel. */
export function recordSummary(findings) {
  const rows = discrepancies(findings)
  if (!rows.length) return null
  const plans = rows.map((r) => r.plan)
  const sorted = plans.slice().sort((a, b) => a - b)
  return {
    rows,
    count: rows.length,
    worst: rows[0],
    median: sorted[Math.floor(sorted.length / 2)],
    mean: plans.reduce((a, b) => a + b, 0) / plans.length,
    // How many sat outside the tolerance their own quality level claims.
    outside: rows.filter((r) => r.plan > (TOLERANCE[r.run.ql]?.plan ?? 1.0)).length,
  }
}
