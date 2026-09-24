// Client identities are deliberately absent. Sites carry letters, not names.
export const SITE = {
  id: 'site-a',
  label: 'Site A',
  kind: 'Heritage structure',
  region: 'Negev, Israel',
  captured: '2026-06',
  // Matterport tour of the same space the mesh came from.
  tourId: 'RSCFsJXjDSd',
  // The MatterPak is Z-up: axis 2 is height, not axis 1. Treating it as Y-up
  // is what left the structure lying on its side and floating.
  capture: {
    upAxis: 2,
    // Floor is the densest 10 cm band, not the bounding-box minimum — the
    // minimum is four metres of terrain and noise below the building.
    floor: 3.1,
    // Centre of the floor-level footprint, in capture x / y.
    centre: [-1.477, 8.98],
    // Principal axis of the footprint, degrees in the capture plane.
    axisDeg: -49.1,
    extent: { along: [-15.1, 12.6], across: [-8.5, 13.8] },
  },
  mesh: '/site-a/site-a.glb',
  cloudPos: '/site-a/cloud-pos.bin',
  cloudCol: '/site-a/cloud-col.bin',
  cloudCount: 399941,
}

// The four modalities. `offset` is where each one lands before registration —
// the misalignment is real in the field, so the demo starts there too.
export const SENSORS = [
  {
    key: 'lidar',
    label: 'LiDAR',
    reads: 'Surface geometry',
    color: '#35c8dc',
    detail: '30.1 M returns · decimated to 400 K',
    offset: { x: -1.9, z: 1.3, ry: -0.065 },
  },
  {
    key: 'rgb',
    label: 'RGB',
    reads: 'Appearance projection',
    color: '#a79dff',
    detail: '124 textures · 1024 px',
    offset: { x: 1.7, z: -1.1, ry: 0.045 },
  },
  {
    key: 'thermal',
    label: 'Thermal',
    reads: 'Temperature anomaly',
    color: '#ffb164',
    detail: 'Radiometric · 0.08 K NETD',
    offset: { x: -1.1, z: -1.7, ry: -0.04 },
  },
  {
    key: 'gpr',
    label: 'GPR',
    reads: 'Subsurface response',
    color: '#f2a33c',
    detail: '400 MHz · 0 – 3.2 m',
    offset: { x: 2.2, z: 1.6, ry: 0.065 },
  },
]

export const SENSOR_INDEX = Object.fromEntries(SENSORS.map((s, i) => [s.key, i]))

// Findings carry a per-sensor response strength and a per-sensor weight, so the
// score says not just how sure we are but which instrument earned the certainty.
// Order of both vectors matches SENSORS.
export const FINDINGS = [
  {
    id: 'F01',
    name: 'Buried service run',
    kind: 'subsurface',
    strength: [0.21, 0.18, 0.34, 0.93],
    weights: [0.06, 0.04, 0.12, 0.78],
    depth: 1.4,
    diameter: '250 mm',
    // The trunk follows the building's own long axis. Services run with the
    // structure they serve; a pipe cutting diagonally across a plan is a
    // tell-tale that the geometry was invented rather than surveyed.
    path: [
      [-7.76, -10.48],
      [-1.86, -3.68],
      [3.38, 2.37],
      [7.96, 7.66],
    ],
    text: 'A continuous hyperbolic response tracks across fourteen passes at a steady two-way travel time. Thermal shows a weak coincident gradient.',
    next: 'Confirm with a single verification core before any excavation.',
    // Evidence is the operator-captured radargram, not a render.
    evidence: '/evidence/site-b-radargram-01.png',
    evidenceNote: 'Operator capture, Site B field trial',
  },
  {
    id: 'F02',
    name: 'Second run, shallower',
    kind: 'subsurface',
    strength: [0.18, 0.12, 0.22, 0.86],
    weights: [0.05, 0.03, 0.1, 0.82],
    depth: 0.9,
    diameter: '400 mm',
    // The lateral crosses the trunk square, the way a branch actually would.
    path: [
      [6.5, -1.66],
      [0.45, 3.58],
      [-5.6, 8.82],
    ],
    text: 'A second reflector sits half a metre above the first and crosses it without joining. Two separate services, not one branch.',
    next: 'Separate the two in the model before issuing the dig permit.',
    evidence: '/evidence/site-b-radargram-02.png',
    evidenceNote: 'Operator capture, Site B field trial',
  },
  {
    id: 'F03',
    name: 'Wall cavity',
    kind: 'structure',
    strength: [0.88, 0.41, 0.79, 0.24],
    weights: [0.52, 0.08, 0.36, 0.04],
    depth: -1.6,
    text: 'Point density drops sharply behind a facade that photogrammetry renders as solid. Thermal agrees: the same patch runs cooler than the wall around it.',
    next: 'Void behind the facade. Survey before load is applied.',
    at: [1.66, 2.6, 6.5],
  },
]

// The demo's honesty line. It appears wherever synthetic data does.
export const SYNTHETIC_NOTE =
  'Modelled response. Physics is real, this particular target is not.'
