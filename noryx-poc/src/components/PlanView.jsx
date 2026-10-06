import { activeSite } from '../sites'

const SITE = activeSite()
import { MAINS, LATERALS, RUNS, UTILITY, findCrossings, manholesFor, planBounds, CLEARANCE_MIN } from '../utilities'
import { SURFACE } from '../surface'

/**
 * The kerbs and the building line, taken from the measured cross-section.
 *
 * A services plan with no street on it is unreadable: every dimension an
 * engineer wants is an offset from a kerb or a facade, not from an arbitrary
 * origin. These three lines are the measured edges of the corridor, so the
 * offsets read off the drawing are the real ones.
 */
function streetLines() {
  const { frame, corridor } = SITE
  if (!frame || !corridor) return []
  const half = 46
  const line = (across) => [
    [
      frame.mid[0] + frame.along[0] * -half + frame.across[0] * across,
      frame.mid[1] + frame.along[1] * -half + frame.across[1] * across,
    ],
    [
      frame.mid[0] + frame.along[0] * half + frame.across[0] * across,
      frame.mid[1] + frame.along[1] * half + frame.across[1] * across,
    ],
  ]
  return [
    { kind: 'kerb', label: 'Kerb', pts: line(corridor.kerb[0]) },
    { kind: 'kerb', label: 'Kerb', pts: line(corridor.kerb[1]) },
    { kind: 'facade', label: 'Building line', pts: line(corridor.facade) },
  ]
}

/**
 * Where to hang a run's call-out.
 *
 * Mains get a different chainage each so the labels march down the street
 * instead of piling up across it. A connection is labelled near the building
 * it serves, which is both out of the way and where you look for it.
 */
function labelPoint(run, order) {
  const f = run.lateral ? 0.78 : 0.18 + (order % 4) * 0.2
  const steps = run.path.length - 1
  const t = f * steps
  const k = Math.min(steps - 1, Math.floor(t))
  const r = t - k
  return [
    run.path[k][0] + (run.path[k + 1][0] - run.path[k][0]) * r,
    run.path[k][1] + (run.path[k + 1][1] - run.path[k][1]) * r,
  ]
}

// The services drawing. Same coordinates as the 3D model — not a redrawing of
// it, a projection of it, which is the only reason the two can be trusted
// together. An engineer works from this; the model is where it came from.

const PAD = 28

export default function PlanView({ isolated, onIsolate, showBase = true }) {
  const fp = SITE.floorplan
  const b = fp
    ? { minX: fp.world.x0, maxX: fp.world.x1, minZ: fp.world.z0, maxZ: fp.world.z1 }
    : planBounds()
  const w = b.maxX - b.minX
  const h = b.maxZ - b.minZ
  const scale = 420 / Math.max(w, h)
  const W = w * scale + PAD * 2
  const H = h * scale + PAD * 2

  const px = (x) => (x - b.minX) * scale + PAD
  const py = (z) => (z - b.minZ) * scale + PAD

  const crossings = findCrossings()
  const visible = RUNS.filter((r) => !isolated || r.id === isolated)
  const runOrder = new Map(RUNS.map((r, i) => [r.id, i]))

  // Building footprint, from the measured principal axis and extent.
  const { centre, axisDeg, extent } = SITE.capture
  const th = (axisDeg * Math.PI) / 180
  const u = [Math.cos(th), -Math.sin(th)]
  const v = [-Math.sin(th), -Math.cos(th)]
  const corners = [
    [extent.along[0], extent.across[0]],
    [extent.along[1], extent.across[0]],
    [extent.along[1], extent.across[1]],
    [extent.along[0], extent.across[1]],
  ].map(([a, c]) => [u[0] * a + v[0] * c, u[1] * a + v[1] * c])

  // A grid line every 5 m, so distance is readable without measuring.
  const gridLines = []
  for (let x = Math.ceil(b.minX / 5) * 5; x <= b.maxX; x += 5) gridLines.push(['v', x])
  for (let z = Math.ceil(b.minZ / 5) * 5; z <= b.maxZ; z += 5) gridLines.push(['h', z])

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#7f9bb1]">
          Services plan · 1:200
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#4a6b85]">
          ITM / EPSG:2039
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-auto border border-[#1e3448] bg-[#071119]">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
          {/* The surveyed floor plan underneath, in the same coordinates */}
          {showBase && SITE.floorplan && (
            <image
              href={SITE.floorplan.src}
              x={px(SITE.floorplan.world.x0)}
              y={py(SITE.floorplan.world.z0)}
              width={(SITE.floorplan.world.x1 - SITE.floorplan.world.x0) * scale}
              height={(SITE.floorplan.world.z1 - SITE.floorplan.world.z0) * scale}
              opacity="0.75"
              style={{ filter: 'invert(1) brightness(0.9) contrast(1.15)' }}
              preserveAspectRatio="none"
            />
          )}
          <g stroke="#13293b" strokeWidth="0.5">
            {gridLines.map(([dir, v2]) =>
              dir === 'v' ? (
                <line key={`v${v2}`} x1={px(v2)} y1={PAD} x2={px(v2)} y2={H - PAD} />
              ) : (
                <line key={`h${v2}`} x1={PAD} y1={py(v2)} x2={W - PAD} y2={py(v2)} />
              ),
            )}
          </g>

          {/* Derived outline, only when there is no surveyed sheet to show.
              With the real plan underneath, a PCA rectangle on top of it is
              both redundant and less accurate than what it covers. */}
          {!showBase && (
            <polygon
              points={corners.map(([x, z]) => `${px(x)},${py(z)}`).join(' ')}
              fill="#0d1f2d"
              stroke="#24415a"
              strokeWidth="1.2"
            />
          )}

          {/* The street itself: kerbs and the building line, measured */}
          {streetLines().map((l, i) => (
            <g key={`sl${i}`}>
              <line
                x1={px(l.pts[0][0])}
                y1={py(l.pts[0][1])}
                x2={px(l.pts[1][0])}
                y2={py(l.pts[1][1])}
                stroke={l.kind === 'facade' ? '#2f4f6b' : '#24415a'}
                strokeWidth={l.kind === 'facade' ? 2 : 1.2}
                strokeDasharray={l.kind === 'facade' ? '' : '7 5'}
              />
            </g>
          ))}

          {/* Runs */}
          {visible.map((run) => {
            const colour = UTILITY[run.utility]?.color ?? '#f2a33c'
            const d = run.path.map(([x, z], i) => `${i ? 'L' : 'M'}${px(x)},${py(z)}`).join(' ')
            return (
              <g key={run.id}>
                <path
                  d={d}
                  stroke={colour}
                  strokeWidth={run.lateral ? 1.8 : 3}
                  fill="none"
                  strokeLinecap="round"
                  // A connection is drawn as a branch, not as a main. Same
                  // convention as a records drawing, and it keeps the four
                  // street mains legible once the laterals are on top.
                  strokeDasharray={run.lateral ? '5 3' : ''}
                />
                <path
                  d={d}
                  stroke={colour}
                  strokeWidth={run.lateral ? 5 : 9}
                  fill="none"
                  opacity="0.12"
                  strokeLinecap="round"
                />
                {/* Depth call-out. Staggered along each run rather than placed
                    at its midpoint: four parallel mains have their midpoints on
                    one line across the street, so midpoint labels land on top
                    of each other and the drawing becomes unreadable. */}
                {(() => {
                  const at = labelPoint(run, runOrder.get(run.id) ?? 0)
                  return (
                    <text
                      x={px(at[0]) + 6}
                      y={py(at[1]) - 6}
                      fill={colour}
                      fontSize={run.lateral ? 7.5 : 9}
                      fontFamily="monospace"
                      opacity={run.lateral ? 0.85 : 1}
                    >
                      {run.id} · {run.diameter} · {run.depth.toFixed(2)}m
                    </text>
                  )
                })()}
                {manholesFor(run).map((mh) => (
                  <g key={mh.id}>
                    <circle
                      cx={px(mh.at[0])}
                      cy={py(mh.at[2])}
                      r="5"
                      fill="#071119"
                      stroke={colour}
                      strokeWidth="1.6"
                    />
                    <text
                      x={px(mh.at[0]) + 8}
                      y={py(mh.at[2]) + 10}
                      fill="#7f9bb1"
                      fontSize="7.5"
                      fontFamily="monospace"
                    >
                      {mh.id}
                    </text>
                  </g>
                ))}
              </g>
            )
          })}

          {/* Surface features. Drawn over the runs because that is where they
              are: a lid is the one thing on this drawing you can stand on. */}
          {SURFACE.filter((s) => !isolated || s.on === isolated).map((s) => {
            const cx = px(s.at[0])
            const cy = py(s.at[1])
            const round = s.kind.form === 'round'
            const size = round ? s.kind.cover : Math.max(...s.kind.cover)
            // Symbols on a drawing are drawn to a legible size, not to scale —
            // a 300 mm valve box at 1:200 is a pixel and a half.
            const r = Math.max(3.4, (size * scale) / 2)
            return (
              <g key={s.id}>
                {round ? (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="#071119"
                    stroke={s.color}
                    strokeWidth="1.6"
                  />
                ) : (
                  <rect
                    x={cx - r}
                    y={cy - r * 0.62}
                    width={r * 2}
                    height={r * 1.24}
                    fill="#071119"
                    stroke={s.color}
                    strokeWidth="1.6"
                  />
                )}
                {/* An above-ground feature gets a filled centre: it is a thing
                    you can see and put a prism on, not a lid in the ground. */}
                {s.kind.above > 0 && (
                  <circle cx={cx} cy={cy} r={r * 0.4} fill={s.color} />
                )}
                <text
                  x={cx + r + 3}
                  y={cy + 3}
                  fill="#7f9bb1"
                  fontSize="7"
                  fontFamily="monospace"
                >
                  {s.id}
                </text>
              </g>
            )
          })}

          {/* Crossings — the thing that actually stops a dig */}
          {!isolated &&
            crossings.map((c, i) => (
              <g key={i}>
                <circle
                  cx={px(c.at[0])}
                  cy={py(c.at[2])}
                  r="9"
                  fill="none"
                  stroke={c.tight ? '#e24b4a' : '#ffb164'}
                  strokeWidth="1.6"
                />
                {/* A lateral crossing four mains puts four call-outs within a
                    few metres, so they are fanned out and leadered back to the
                    ring rather than written on top of one another. */}
                <line
                  x1={px(c.at[0]) + 7}
                  y1={py(c.at[2]) - 3}
                  x2={px(c.at[0]) + 16}
                  y2={py(c.at[2]) - 7 - (i % 3) * 11}
                  stroke={c.tight ? '#e24b4a' : '#ffb164'}
                  strokeWidth="0.7"
                  opacity="0.6"
                />
                <text
                  x={px(c.at[0]) + 18}
                  y={py(c.at[2]) - 4 - (i % 3) * 11}
                  fill={c.tight ? '#e24b4a' : '#ffb164'}
                  fontSize="8.5"
                  fontFamily="monospace"
                >
                  {c.a}/{c.b} {(c.clearance * 1000).toFixed(0)} mm
                </text>
              </g>
            ))}

          {/* Scale bar */}
          <g transform={`translate(${PAD},${H - 10})`}>
            <line x1="0" y1="0" x2={10 * scale} y2="0" stroke="#4a6b85" strokeWidth="1.5" />
            <line x1="0" y1="-3" x2="0" y2="3" stroke="#4a6b85" strokeWidth="1.5" />
            <line
              x1={10 * scale}
              y1="-3"
              x2={10 * scale}
              y2="3"
              stroke="#4a6b85"
              strokeWidth="1.5"
            />
            <text x={10 * scale + 6} y="3" fill="#4a6b85" fontSize="8" fontFamily="monospace">
              10 m
            </text>
          </g>
        </svg>
      </div>

      {/* Legend doubles as the isolation control */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {MAINS.map((run) => {
          const colour = UTILITY[run.utility]?.color ?? '#f2a33c'
          const on = isolated === run.id
          return (
            <button
              key={run.id}
              type="button"
              onClick={() => onIsolate(on ? null : run.id)}
              className={`flex items-center gap-1.5 border px-2 py-1 transition-colors ${
                on ? 'border-[#24415a] bg-[#16293a]' : 'border-[#16293a] hover:border-[#24415a]'
              }`}
            >
              <span className="h-0.5 w-3.5" style={{ backgroundColor: colour }} />
              <span className="text-[10px] text-[#e6f0f7]">{run.name}</span>
            </button>
          )
        })}
      </div>

      {LATERALS.length > 0 && (
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#4a6b85]">
            Connections
          </span>
          {LATERALS.map((run) => {
            const colour = UTILITY[run.utility]?.color ?? '#f2a33c'
            const on = isolated === run.id
            return (
              <button
                key={run.id}
                type="button"
                onClick={() => onIsolate(on ? null : run.id)}
                className={`flex items-center gap-1.5 border px-1.5 py-0.5 transition-colors ${
                  on ? 'border-[#24415a] bg-[#16293a]' : 'border-[#16293a] hover:border-[#24415a]'
                }`}
              >
                <svg width="14" height="3" aria-hidden>
                  <line
                    x1="0"
                    y1="1.5"
                    x2="14"
                    y2="1.5"
                    stroke={colour}
                    strokeWidth="1.6"
                    strokeDasharray="4 2.5"
                  />
                </svg>
                <span className="text-[9px] text-[#b6cada]">{run.name}</span>
              </button>
            )
          })}
        </div>
      )}

      {crossings.some((c) => c.tight) && (
        <p className="mt-2 border-l-2 border-[#e24b4a] pl-2 text-[11px] leading-snug text-[#e24b4a]">
          Crossing below the {CLEARANCE_MIN * 1000} mm separation minimum. Resolve before a
          dig permit is issued.
        </p>
      )}
    </div>
  )
}
