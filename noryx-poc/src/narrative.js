// The argument, in the order an investor needs it.
//
// Rule for this file: every number is either measured from a real capture in
// this repo, or cited from published industry data. Nothing here is invented.
// Company figures — price, volume, margin, pipeline — are deliberately absent;
// they belong to NORYX and are collected in the closing beat.

export const BEATS = [
  {
    key: 'claim',
    index: '00',
    eyebrow: 'What we do',
    claim: 'Every site has a second site under it.',
    body: 'NORYX captures a site with four instruments, registers them into a single model, and hands the engineer a BIM file that already contains what is buried — before anyone digs.',
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
    claim: 'The drawings are wrong.',
    body: 'As-built records are incomplete, out of date, or were never made at all. Crews discover where the pipe runs by hitting it. Unforeseen ground conditions are the leading cause of claims and disputes on US construction projects.',
    stats: [
      ['$227M', 'every day'],
      ['220,000+', 'reported strikes a year in North America'],
    ],
    source: 'Common Ground Alliance DIRT 2025',
  },
  {
    key: 'why',
    index: '02',
    eyebrow: 'Why it is still open',
    claim: 'Four instruments. Four different truths.',
    body: 'Drone, laser, thermal and radar each see a fragment of the same site — each in its own frame of reference, at its own scale, on its own day. Nobody reconciles them. The survey lands as a PDF the engineer cannot build from.',
    stats: [
      ['4', 'instruments on a typical site'],
      ['0', 'shared coordinate frames between them'],
    ],
  },
  {
    key: 'register',
    index: '03',
    eyebrow: 'What NORYX does',
    claim: 'We register them into one model.',
    body: 'One capture pass. Four instruments resolved into a single coordinate frame to twenty-one millimetres, so a reading from one can be tested against the others instead of filed beside them.',
    stats: [
      ['0.021 m', 'registration RMS across all four instruments'],
      ['30.1M', 'points captured in one pass'],
    ],
  },
  {
    key: 'reveal',
    index: '04',
    eyebrow: 'The result',
    claim: 'Then we take the floor away.',
    body: 'Buried services appear inside the same model as the standing structure, at measured depth. The radar record that produced each one stays attached to it, so the finding can be argued with rather than believed.',
    stats: [
      ['3.2 m', 'depth of investigation'],
      ['250 mm', 'smallest service resolved at 1.4 m'],
    ],
  },
  {
    key: 'deliver',
    index: '05',
    eyebrow: 'The deliverable',
    claim: 'Ranked, and accountable.',
    body: 'Every candidate carries a confidence score and names the instrument that earned it. The engineer exports it straight into Revit or Civil 3D — the file they already work in, now containing what is underneath.',
    stats: [['IFC 4.3', 'native export, no reformatting']],
  },
]
