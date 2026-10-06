import { SITE as SITE_A, FINDINGS as FINDINGS_A } from './site'

/**
 * The street frame, measured rather than assumed.
 *
 * A cross-section taken every 1.5 m along the run (scratchpad `profile.mjs`)
 * reads like this, as mean height above the carriageway datum:
 *
 *     across  -26   -13   -10 … +2    +4.5        +6 … +32
 *     height  3 m   2 m    0 m        8 m         13–16 m
 *
 * So: 12 m of flat open corridor from across -10.0 to +2.0, a continuous
 * nineteen-metre block whose facade stands at about +4.5, and lower structures
 * from -13 outward. Everything buried has to live inside that corridor, and
 * everything on the surface has to land on it. Positions below are given as
 * (along, across) in metres because that is how a street section is read.
 */
const FRAME = {
  mid: [-4.0, -18.0],
  along: [-0.8183, -0.5748],
  across: [0.5748, -0.8183],
}

/** A point on the street, from distance along the run and offset across it. */
function at(along, across) {
  return [
    FRAME.mid[0] + FRAME.along[0] * along + FRAME.across[0] * across,
    FRAME.mid[1] + FRAME.along[1] * along + FRAME.across[1] * across,
  ]
}

/** A run parallel to the street at a fixed offset, from one chainage to another. */
function parallel(across, from, to) {
  return [at(from, across), at((from + to) / 2, across), at(to, across)]
}

// Offsets across the street, measured from the carriageway centreline. The
// stack is the one a European street section stacks: gravity sewer deepest and
// under the carriageway, water beside it, power and comms shallow under the
// footway on the side where the buildings that consume them stand.
const OFF = {
  sewer: -6.0,
  water: -8.8,
  power: 2.2,
  comms: 3.5,
  // Laterals stop just clear of the wall rather than at it, which is where a
  // meter or a service head actually sits.
  building: 3.8,
}

// A second site, so the pitch can be shown on a street rather than only in a
// building. Everything downstream reads a site descriptor, so adding one is a
// data change rather than a code change.
//
// Helsinki publishes its reality mesh — aerial photogrammetry processed in
// ContextCapture — under CC BY 4.0, commercial use permitted with attribution.
// One 250 m block, at the finest LOD the city ships.
export const SITE_STREET = {
  id: 'street',
  label: 'Street block',
  kind: 'Urban street · reference capture',
  region: 'Kalasatama, Helsinki, Finland',
  captured: '2017',
  attribution: 'Helsinki 3D city model (Kalasatama), City of Helsinki, CC BY 4.0',
  // The 2017 aerial was flown under Nordic overcast. Lifting it is a viewing
  // decision, not a data change — the geometry and positions are untouched.
  exposure: 1.75,
  capture: {
    upAxis: 2,
    // ContextCapture writes Z-up in a local metric frame. Kalasatama block
    // 672497d3: x 7750–8000, y 4500–4750, z 0–51. Dense city centre with a
    // wide boulevard, tram lines and no tree canopy — the block was found by
    // scoring aerial textures for long, continuous, unobstructed asphalt.
    //
    // The carriageway sits at z = 2.23, not zero: that is the median of the
    // lowest return straight down the run, over 36 samples. Taking it as the
    // floor is what makes a pipe labelled 1.4 m deep draw 1.4 m under the
    // road rather than 3.6 m under it.
    floor: 2.23,
    centre: [7875, 4625],
    axisDeg: 0,
    extent: { along: [-125, 125], across: [-125, 125] },
    storeyHeight: 51,
  },
  mesh: '/helsinki/block.glb',
  cloudPos: null,
  cloudCol: null,
  cloudCount: 0,

  frame: FRAME,
  corridor: { kerb: [-10.0, 2.0], facade: 4.5 },

  // The demo focuses one 60 m length of the street that the centreline
  // extraction found. Services sit under the carriageway and the footway at
  // the depths and in the order a real street section stacks them.
  focus: { at: [-5, -17], span: 74, heading: 145 },
  // Show the street and the first row of buildings either side of it, not the
  // whole 250 m block. Clipping is a viewing decision — the geometry is intact.
  clip: { at: [-5, -17], halfWidth: 58 },

  findings: [
    {
      id: 'S01',
      name: 'Water main',
      utility: 'water',
      kind: 'subsurface',
      ql: 'B',
      depth: 1.4,
      diameter: '250 mm DI',
      strength: [0.22, 0.17, 0.31, 0.94],
      weights: [0.05, 0.04, 0.11, 0.8],
      path: parallel(OFF.water, -30, 30),
      text: 'Continuous hyperbolic response under the carriageway edge for the full 60 m of the section. Depth holds within 80 mm end to end.',
      next: 'One verification core before the carriageway is opened.',
      evidence: '/evidence/site-b-radargram-01.png',
    },
    {
      id: 'S02',
      name: 'Sewer line',
      utility: 'sewer',
      kind: 'subsurface',
      ql: 'B',
      depth: 2.4,
      diameter: '400 mm',
      fall: 0.011,
      strength: [0.18, 0.11, 0.2, 0.87],
      weights: [0.04, 0.03, 0.08, 0.85],
      path: parallel(OFF.sewer, -30, 30),
      text: 'Gravity run a metre below the water main and 3 m further in, under the carriageway, falling south at about 1.1 percent. Chambers at both ends of the section and one at mid-length.',
      next: 'Confirm invert levels at the chambers before connecting.',
      evidence: '/evidence/site-b-radargram-02.png',
    },
    {
      id: 'S03',
      name: 'Power',
      utility: 'power',
      kind: 'subsurface',
      ql: 'C',
      depth: 0.8,
      diameter: '3 x 185 mm²',
      strength: [0.14, 0.22, 0.61, 0.72],
      weights: [0.04, 0.06, 0.3, 0.6],
      path: parallel(OFF.power, -30, 30),
      text: 'Shallow duct bank under the footway on the building side. The two surface pillars were surveyed and agree with the radar; depth is estimated, not measured.',
      next: 'Hand dig the first 300 mm. Shallow and live.',
    },
    {
      id: 'S04',
      name: 'Comms',
      utility: 'comms',
      kind: 'subsurface',
      ql: 'C',
      depth: 0.6,
      diameter: '4 x 110 mm duct',
      strength: [0.12, 0.18, 0.24, 0.66],
      weights: [0.04, 0.05, 0.11, 0.8],
      path: parallel(OFF.comms, -30, 30),
      text: 'Duct bank alongside the power route, 1.3 m nearer the buildings and slightly shallower. Not present in the records supplied.',
      next: 'Trace between the two chambers before the footway is reinstated.',
    },

    // Connections. A main nobody is connected to is a drawing, not a street —
    // and the connections are where the strikes happen, because they are the
    // part no owner keeps a decent record of.
    {
      id: 'L01',
      name: 'Water service',
      utility: 'water',
      kind: 'subsurface',
      lateral: true,
      ql: 'D',
      depth: 1.05,
      diameter: '32 mm',
      strength: [0.08, 0.09, 0.14, 0.38],
      weights: [0.04, 0.04, 0.12, 0.8],
      path: [at(-6, OFF.water), at(-6, -1.0), at(-6, OFF.building)],
      text: 'Branch off the main to the meter assembly at the building line, crossing the sewer, the power duct bank and the comms ducts on the way. Position is from the owner record only.',
      next: 'Expose and survey. It passes 250 mm over a live LV cable; that is the classic strike.',
    },
    {
      id: 'L02',
      name: 'Sewer connection',
      utility: 'sewer',
      kind: 'subsurface',
      lateral: true,
      ql: 'D',
      depth: 1.9,
      diameter: '160 mm',
      fall: 0.02,
      strength: [0.09, 0.07, 0.11, 0.41],
      weights: [0.04, 0.03, 0.1, 0.83],
      path: [at(14, OFF.building), at(15, -1.0), at(16, OFF.sewer)],
      text: 'Building drain falling across the footway and the carriageway to the trunk sewer. Connects below the power and comms ducts with better than a metre to spare.',
      next: 'Confirm the connection type at the chamber. A saddle and a drilled tee behave differently when the main is relined.',
    },
    {
      id: 'L03',
      name: 'Power service',
      utility: 'power',
      kind: 'subsurface',
      lateral: true,
      ql: 'C',
      depth: 0.7,
      diameter: '4 x 25 mm²',
      strength: [0.11, 0.19, 0.44, 0.58],
      weights: [0.04, 0.06, 0.26, 0.64],
      path: [at(-22, OFF.power), at(-22, OFF.building)],
      text: 'Service cable from the pillar into the building, 1.6 m of footway. Both ends are visible at the surface, so the line between them is short and well constrained.',
      next: 'No further survey needed. Both terminations are QL-A.',
    },
    {
      id: 'L04',
      name: 'Comms service',
      utility: 'comms',
      kind: 'subsurface',
      lateral: true,
      ql: 'C',
      depth: 0.55,
      diameter: '2 x 50 mm duct',
      strength: [0.1, 0.16, 0.21, 0.52],
      weights: [0.04, 0.05, 0.12, 0.79],
      path: [at(11, OFF.comms), at(11, OFF.building)],
      text: 'Lead-in duct from the draw pit to the building entry, the shallowest thing in the footway.',
      next: 'Rod and rope from the chamber to prove the route before reinstatement.',
    },
  ],

  /**
   * What is visible at street level.
   *
   * Surface features are the only part of a utility network anyone can survey
   * without digging, which is why ASCE 38-22 gives them their own quality
   * level: QL-C is "surveyed surface features, correlated to records". They
   * are also the cheapest independent check on everything below — a chamber
   * lid fixes the run it sits on in all three dimensions.
   *
   * `on` names the run the feature belongs to; the riser is drawn from the
   * cover down to that run's depth.
   */
  surface: [
    { id: 'MH01', type: 'manhole', on: 'S02', at: at(-26, OFF.sewer), ql: 'A', note: 'Terminal chamber. Invert surveyed.' },
    { id: 'MH02', type: 'manhole', on: 'S02', at: at(0, OFF.sewer), ql: 'A', note: 'Rodding access at mid-length, 26 m between chambers.' },
    { id: 'MH03', type: 'manhole', on: 'S02', at: at(26, OFF.sewer), ql: 'A', note: 'Terminal chamber. Invert surveyed.' },

    { id: 'WV01', type: 'valve', on: 'S01', at: at(-28, OFF.water), ql: 'C', note: 'Sluice valve. Cover level surveyed, spindle depth assumed.' },
    { id: 'HY01', type: 'hydrant', on: 'S01', at: at(-12, OFF.water), ql: 'A', note: 'Underground hydrant in an insulated box, with a marker post. Independently fixes the main in plan and depth.' },
    { id: 'WV02', type: 'valve', on: 'S01', at: at(8, OFF.water), ql: 'C', note: 'Sluice valve.' },

    { id: 'PP01', type: 'pillar', on: 'S03', at: at(-22, OFF.power), ql: 'A', note: 'Galvanised LV distribution cabinet on a concrete plinth. Surveyed; feeds the service at this chainage.' },
    { id: 'PP02', type: 'pillar', on: 'S03', at: at(20, OFF.power), ql: 'A', note: 'Galvanised LV distribution cabinet on a concrete plinth. Surveyed.' },

    { id: 'CP01', type: 'pillar', on: 'S04', at: at(11, 4.0), ql: 'A', note: 'Street cabinet against the building line. This is the thing a new occupier is actually connected to.' },
    { id: 'CC01', type: 'chamber', on: 'S04', at: at(-18, OFF.comms), ql: 'A', note: 'Draw pit. Duct count confirmed by lifting the lid.' },
    { id: 'CC02', type: 'chamber', on: 'S04', at: at(11, OFF.comms), ql: 'A', note: 'Draw pit. Lead-in to the building leaves here.' },

    // Not a meter assembly. Finland puts the water meter inside the building,
    // so what stands at the boundary is the property service valve under its
    // own surface box. Modelling the Israeli arrangement on a Helsinki street
    // is the kind of error a Finnish utility would spot on the first slide.
    { id: 'SV01', type: 'valve', on: 'L01', at: at(-6, OFF.building), ql: 'A', note: 'Property service valve at the boundary. Terminates the water service; the meter is inside the building.' },
  ],
}

export const SITES = { 'site-a': SITE_A, street: SITE_STREET }

/** Findings belong to a site, not to the app. */
export function activeFindings() {
  const site = activeSite()
  return site.findings ?? FINDINGS_A
}

/**
 * Which site to show.
 *
 * The street is the default because it is the one that reads as the product:
 * an urban carriageway with services under the footways is what the buyer
 * recognises. The dining hall stays reachable at `?site=site-a` — it is the
 * better interior walkthrough, and it is the site the registration figure was
 * actually measured on.
 */
export function activeSite() {
  if (typeof window === 'undefined') return SITE_STREET
  const key = new URLSearchParams(window.location.search).get('site')
  return SITES[key] ?? SITE_STREET
}
