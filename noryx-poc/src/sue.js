// Subsurface Utility Engineering quality levels.
//
// This is the most important file in the product, and it is forty lines of
// definitions.
//
// A confidence percentage is something a startup invented. A Quality Level is
// what an authority already writes into a procurement document, what a designer
// already asks for, and what an insurer already understands. ASCE 38-22 defines
// four of them, PAS 128 subdivides the geophysical one, AS 5488 says the same
// thing again in Australian. Expressing a finding as QL-B is not marketing — it
// is the language the buyer is already thinking in.
//
// It also solves the uncertainty problem honestly. QL-B means "located
// horizontally by geophysics, depth estimated". That sentence states the limit
// of the claim in the same breath as the claim, which is exactly what stops an
// engineer discounting the whole survey.

export const QL = {
  A: {
    id: 'A',
    label: 'QL-A',
    name: 'Exposed and surveyed',
    means: 'The service was physically exposed and its position measured. X, Y and Z are precise.',
    accuracy: '± 15 mm',
    howToGet: 'Vacuum excavation or test pit at the point of interest',
    color: '#8be0a0',
    rank: 4,
  },
  B: {
    id: 'B',
    label: 'QL-B',
    name: 'Detected geophysically',
    means: 'Located horizontally by GPR or electromagnetic survey. X and Y are measured; depth is estimated.',
    accuracy: '± 150 mm in plan · depth estimated',
    howToGet: 'Geophysical survey — this is what NORYX delivers',
    color: '#35c8dc',
    rank: 3,
  },
  C: {
    id: 'C',
    label: 'QL-C',
    name: 'Surface features surveyed',
    means: 'Visible surface features — covers, valves, poles — surveyed and correlated with records.',
    accuracy: 'Indicative alignment, no reliable depth',
    howToGet: 'Topographic survey of visible appurtenances',
    color: '#ffb164',
    rank: 2,
  },
  D: {
    id: 'D',
    label: 'QL-D',
    name: 'Records only',
    means: 'Taken from as-made drawings, historical maps or verbal report. Not verified on site.',
    accuracy: 'Unquantified. Frequently wrong.',
    howToGet: 'Utility owner records',
    color: '#e24b4a',
    rank: 1,
  },
}

export const QL_ORDER = ['D', 'C', 'B', 'A']

// PAS 128 subdivides QL-B by how the detection was made and corroborated.
// Worth carrying because a UK or UK-influenced client will ask for the sub-level.
export const PAS128_B = {
  B1: 'Detected and depth measured by more than one technique',
  B2: 'Detected and depth measured by one technique',
  B3: 'Detected, depth estimated only',
  B4: 'Detected horizontally, no depth',
}

export const STANDARDS = [
  ['ASCE 38-22', 'United States', 'Defines QL-A to QL-D. The reference most of the world cites.'],
  ['811 "Call Before You Dig"', 'United States', 'Federal law: contact the one-call centre before excavating; owners mark within 48–72 hours, in standard colours.'],
  ['PAS 128', 'United Kingdom', 'Subdivides the geophysical level into B1–B4 by technique and corroboration.'],
  ['AS 5488', 'Australia', 'Same classification, and mandates integration of subsurface information into GIS and BIM for national projects.'],
]

/**
 * The quality level a finding currently holds, and what it would take to raise
 * it. "What would it take" is the commercially useful half: it turns a survey
 * report into a priced next step.
 */
export function assess(finding) {
  const level = QL[finding.ql ?? 'B']
  const next = level.rank < 4 ? QL[QL_ORDER[QL_ORDER.indexOf(level.id) + 1]] : null
  return { level, next }
}

/** Colour the one-call standard uses for each service. Contractors know these. */
export const MARKING_COLOURS = {
  power: { hex: '#e24b4a', label: 'Red · electric' },
  gas: { hex: '#ffd24a', label: 'Yellow · gas, oil, steam' },
  comms: { hex: '#f2a33c', label: 'Orange · communications' },
  water: { hex: '#3b82f6', label: 'Blue · potable water' },
  sewer: { hex: '#8be0a0', label: 'Green · sewer, drainage' },
  survey: { hex: '#c77dff', label: 'Purple · reclaimed water' },
}
