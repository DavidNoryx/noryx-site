// The argument, in the order an investor needs it.
//
// Two rules hold this file together.
//
// 1. Every number is either measured from a real capture in this repo, or cited
//    from published industry data. Nothing is invented.
// 2. `status` on each claim says whether it is shipped, proven on a real site,
//    or on the roadmap. An investor who cannot tell those apart discounts all
//    three to zero.

export const STATUS = {
  live: { label: 'Working today', color: '#8be0a0' },
  proven: { label: 'Proven on a real capture', color: '#35c8dc' },
  planned: { label: 'On the roadmap', color: '#ffb164' },
}

export const BEATS = [
  {
    key: 'claim',
    index: '00',
    eyebrow: 'What we do',
    claim: 'Every site has a second site under it.',
    body: 'NORYX takes whatever instruments a site needs, aligns their readings to one coordinate frame, and produces a single model an engineer can build from — including what is buried. Which instruments are used depends on the ground, not on our product sheet.',
    stats: [
      ['$83.2B', 'US cost of underground utility damage, per year'],
      ['668,999', 'modelled damage incidents in 2025'],
      ['2.73 : 1', 'average return on subsurface investigation'],
    ],
    source: 'Common Ground Alliance DIRT 2025 · Louisiana TRC SUE ROI study',
    hero: true,
  },
  {
    key: 'problem',
    index: '01',
    eyebrow: 'The problem',
    claim: 'The engineer cannot decide.',
    body: 'The information exists, but it is scattered across surveys taken at different times, in different formats, that do not agree with each other. No single source is trusted enough to act on, so the decision gets made on site, with a digger.',
    stats: [
      ['$227M', 'destroyed every day in the US alone'],
      ['Leading cause', 'unforeseen ground conditions, in US construction claims and disputes'],
    ],
    source: 'Common Ground Alliance DIRT 2025 · CMAA subsurface risk guidance',
  },
  {
    key: 'fusion',
    index: '02',
    eyebrow: 'Fusing the data',
    claim: 'Each instrument answers a different question.',
    body: 'They do not produce comparable outputs, and that is the whole difficulty. NORYX bridges them into one model while keeping every reading traceable back to the instrument that made it.',
    instruments: [
      ['GPR', 'Radar reflections — returns a travel-time section, not a position', '#f2a33c'],
      ['LiDAR', 'Millions of ranged points — geometry with no meaning attached', '#35c8dc'],
      ['Photogrammetry', 'Colour and texture — appearance, no dimension of its own', '#a79dff'],
      ['Thermal', 'Surface temperature — anomalies, with no depth', '#ffb164'],
    ],
    note: 'The set changes per site. Adding an instrument is a configuration, not a rebuild.',
    status: 'live',
  },
  {
    key: 'register',
    index: '03',
    eyebrow: 'What NORYX does',
    claim: 'Receive, align, merge, translate.',
    body: 'Readings come in. They are aligned to a common position, merged into one model, and translated into something an engineer can open and act on. The engineer stops reconciling four documents and starts reading one.',
    stats: [
      ['0.021 m', 'alignment error between instruments, measured on Site A'],
      ['One model', 'replaces the set of surveys that disagreed'],
    ],
    status: 'proven',
  },
  {
    key: 'result',
    index: '04',
    eyebrow: 'The result',
    claim: 'Three things the engineer could not do before.',
    body: 'The depth figure is a detail. What matters is what becomes possible once every reading sits in one frame.',
    features: [
      [
        'See it, rather than interpret it',
        'Buried services render in place, under the structure, instead of as a radar trace only a specialist can read.',
        'live',
      ],
      [
        'Decide where to dig, and where not to',
        'Each candidate carries a confidence score and the instrument that earned it, so the call can be defended.',
        'live',
      ],
      [
        'Re-survey and update the live model',
        'A new pass re-registers against the existing model rather than starting a new document.',
        'planned',
      ],
    ],
  },
  {
    key: 'deliver',
    index: '05',
    eyebrow: 'The deliverable',
    claim: 'It lands inside the tools they already use.',
    body: 'The engineer receives a model that opens in Revit or Civil 3D with the subsurface already in it — services positioned, each one carrying its depth, its confidence and the record behind it. No reformatting, no separate PDF to cross-reference.',
    integrations: [
      ['File export · IFC 4.3', 'Opens in Revit, Civil 3D and anything else that reads IFC', 'live'],
      ['Findings with provenance', 'Every object carries its score and its source instrument', 'live'],
      ['Live two-way plug-in', 'Edit in the model, push back to the survey', 'planned'],
    ],
  },
  {
    key: 'business',
    index: '06',
    eyebrow: 'The business',
    claim: 'Authorities buy it. Engineers use it.',
    body: 'The engineer is the user, at design and pre-construction, when the dig is still on paper and changing it is cheap. The buyer is the body that carries the liability: municipalities, national infrastructure, transport and water authorities. They own the assets, they hold the records that are wrong, and they pay for the strike either way.',
    stats: [
      ['Per project', 'pricing, scoped to site'],
      ['≥ 50%', 'target gross margin'],
      ['15', 'capture projects delivered to paying clients'],
    ],
    honesty:
      'Those fifteen are surface capture. Subsurface is the next product on the same delivery capability, and the first subsurface engagement is what this raise funds.',
  },
  {
    key: 'vision',
    index: '07',
    eyebrow: 'Where this goes',
    claim: 'The site gets a shared memory.',
    body: 'Fusing sensors is the first step, not the destination. A construction site already has engineers, machines and increasingly autonomous equipment all acting on the same ground with no shared picture of it. NORYX becomes the layer they all read from and write back to.',
    horizon: [
      ['Today', 'Instruments fused into one model a person can read', 'live'],
      ['Next', 'The model updates as the site changes, instead of ageing', 'planned'],
      ['Then', 'Machines and autonomous equipment read the same model, and report back into it', 'planned'],
    ],
  },
]
