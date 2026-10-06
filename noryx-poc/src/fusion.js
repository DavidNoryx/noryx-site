import { SENSORS } from './site'

/**
 * Confidence in a finding, given which sensors are switched on.
 *
 * Each finding carries a response strength per sensor and a weight per sensor.
 * The weight is what makes the number explainable: a buried run scores high
 * because the radar earned it, not because four instruments all voted once.
 */
export function score(finding, enabled) {
  let total = 0
  for (let i = 0; i < SENSORS.length; i += 1) {
    if (!enabled[SENSORS[i].key]) continue
    // A finding that carries no entry for a sensor was not measured by it, and
    // contributes nothing. This is what lets an instrument be added to the
    // catalogue without claiming it was deployed on every site that came
    // before it — which is the honest default and also the safe one.
    total += (finding.strength[i] ?? 0) * (finding.weights[i] ?? 0)
  }
  return total
}

/** Sensors that both are on and actually responded to this finding. */
export function supporting(finding, enabled, floor = 0.6) {
  return SENSORS.filter((s, i) => enabled[s.key] && (finding.strength[i] ?? 0) > floor)
}

/** The sensor carrying the most weight in the current score. */
export function principal(finding, enabled) {
  let best = null
  let bestShare = 0
  SENSORS.forEach((s, i) => {
    if (!enabled[s.key]) return
    const share = (finding.strength[i] ?? 0) * (finding.weights[i] ?? 0)
    if (share > bestShare) {
      bestShare = share
      best = s
    }
  })
  return best
}

export function rank(findings, enabled, threshold = 0) {
  return findings
    .map((f) => ({ finding: f, value: score(f, enabled) }))
    .filter((r) => r.value >= threshold)
    .sort((a, b) => b.value - a.value)
}
