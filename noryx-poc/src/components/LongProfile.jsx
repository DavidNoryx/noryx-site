import { useEffect, useMemo, useState } from 'react'
import {
  MAINS,
  LATERALS,
  UTILITY,
  runLength,
  depthAt,
  invertRange,
  chainageOf,
  findCrossings,
  CLEARANCE_MIN,
} from '../utilities'
import { SURFACE } from '../surface'

/**
 * The long section — a run drawn along its own length rather than across it.
 *
 * A plan tells you where a pipe is. A long section tells you whether it works.
 * For a gravity run it is the only drawing that matters: it carries the fall,
 * the invert levels at each chamber, and the cover depth, and cover is the
 * thing that changes under your feet as the ground rises while the pipe does
 * not. None of that is visible in plan, and none of it is visible in a 3D view
 * at any angle a person actually looks from.
 */

const PAD = { l: 46, r: 14, t: 16, b: 30 }
const W = 420
const H = 210

export default function LongProfile({ terrainApi, isolated, onIsolate }) {
  const runs = useMemo(() => [...MAINS, ...LATERALS], [])
  const [id, setId] = useState(() => {
    // Start on a gravity run if there is one — it is the one with something
    // to prove.
    const gravity = runs.find((r) => r.fall)
    return (gravity ?? runs[0])?.id
  })
  const [ground, setGround] = useState(null)
  const [busy, setBusy] = useState(false)

  const run = runs.find((r) => r.id === id) ?? runs[0]

  // Follow the isolation control, so picking a service in the toolbar brings
  // its section up rather than leaving the viewer to find it twice.
  useEffect(() => {
    if (isolated && runs.some((r) => r.id === isolated)) setId(isolated)
  }, [isolated, runs])

  useEffect(() => {
    let dead = false
    setGround(null)
    if (!run || !terrainApi?.current?.groundAlong) return undefined
    setBusy(true)
    // Yield first: sampling the capture raycasts and will hold the frame.
    const t = setTimeout(() => {
      try {
        const g = terrainApi.current.groundAlong(run.path, 90)
        if (!dead) setGround(g)
      } finally {
        if (!dead) setBusy(false)
      }
    }, 20)
    return () => {
      dead = true
      clearTimeout(t)
    }
  }, [run, terrainApi])

  if (!run) return null

  const colour = UTILITY[run.utility]?.color ?? '#f2a33c'
  const { start, end, drop, length } = invertRange(run)
  const radius = 0.12

  // Vertical extent: everything from the highest ground to below the deepest
  // point of the pipe, with a little air.
  const groundYs = (ground?.points ?? []).map((p) => p.y).filter((v) => v != null)
  const topGround = groundYs.length ? Math.max(...groundYs) : 0.5
  const botPipe = -Math.max(start, end) - radius
  const top = topGround + 0.6
  const bottom = botPipe - 0.6
  const span = Math.max(1.5, top - bottom)

  const px = (f) => PAD.l + f * (W - PAD.l - PAD.r)
  const py = (level) => PAD.t + ((top - level) / span) * (H - PAD.t - PAD.b)

  // Cover: ground level above the crown of the pipe. The number a dig permit
  // is written against, and the number nobody can read off a plan.
  const covers = (ground?.points ?? [])
    .filter((p) => p.y != null)
    .map((p) => ({ f: p.f, c: p.y + depthAt(run, p.f) - radius }))
  const minCover = covers.length ? Math.min(...covers.map((c) => c.c)) : null
  const maxCover = covers.length ? Math.max(...covers.map((c) => c.c)) : null

  const groundPath = (ground?.points ?? [])
    .filter((p) => p.y != null)
    .map((p, i) => `${i ? 'L' : 'M'}${px(p.f).toFixed(1)},${py(p.y).toFixed(1)}`)
    .join(' ')

  // The pipe as a band of its own diameter, not a hairline.
  const crown = []
  const invert = []
  for (let i = 0; i <= 40; i += 1) {
    const f = i / 40
    const d = depthAt(run, f)
    crown.push(`${px(f).toFixed(1)},${py(-d + radius).toFixed(1)}`)
    invert.unshift(`${px(f).toFixed(1)},${py(-d - radius).toFixed(1)}`)
  }

  const onThisRun = SURFACE.filter((s) => s.on === run.id).map((s) => ({
    ...s,
    f: chainageOf(run, s.at),
  }))

  const crossings = findCrossings()
    .filter((c) => c.a === run.id || c.b === run.id)
    .map((c) => ({ ...c, f: chainageOf(run, [c.at[0], c.at[2]]) }))

  const gradient = run.fall ? `1 in ${Math.round(1 / run.fall)}` : 'level'

  return (
    <div className="flex flex-col">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#7f9bb1]">
          Long section · 1:200 / 1:50
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#4a6b85]">
          {length.toFixed(0)} m
        </span>
      </div>

      <div className="mb-2 flex flex-wrap gap-1">
        {runs.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => {
              setId(r.id)
              onIsolate?.(r.id)
            }}
            className={`flex items-center gap-1 border px-1.5 py-0.5 font-mono text-[9px] transition-colors ${
              r.id === id
                ? 'border-[#35c8dc] bg-[#16293a] text-[#e6f0f7]'
                : 'border-[#16293a] text-[#7f9bb1] hover:border-[#24415a]'
            }`}
          >
            <span
              className="h-0.5 w-2"
              style={{ backgroundColor: UTILITY[r.utility]?.color }}
            />
            {r.id}
            {r.fall ? <span className="text-[#8be0a0]">↘</span> : null}
          </button>
        ))}
      </div>

      <div className="border border-[#1e3448] bg-[#071119]">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
          {/* Level grid, every half metre */}
          {Array.from({ length: Math.ceil(span / 0.5) + 1 }, (_, i) => {
            const level = Math.floor(bottom * 2) / 2 + i * 0.5
            if (level > top) return null
            return (
              <g key={level}>
                <line
                  x1={PAD.l}
                  y1={py(level)}
                  x2={W - PAD.r}
                  y2={py(level)}
                  stroke="#13293b"
                  strokeWidth="0.5"
                />
                <text
                  x={PAD.l - 5}
                  y={py(level) + 3}
                  fill="#4a6b85"
                  fontSize="7"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {level.toFixed(1)}
                </text>
              </g>
            )
          })}

          {/* Chainage ticks every 10 m */}
          {Array.from({ length: Math.floor(length / 10) + 1 }, (_, i) => {
            const f = (i * 10) / length
            if (f > 1) return null
            return (
              <g key={i}>
                <line
                  x1={px(f)}
                  y1={H - PAD.b}
                  x2={px(f)}
                  y2={H - PAD.b + 4}
                  stroke="#24415a"
                  strokeWidth="1"
                />
                <text
                  x={px(f)}
                  y={H - PAD.b + 14}
                  fill="#4a6b85"
                  fontSize="7"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {i * 10}
                </text>
              </g>
            )
          })}

          {/* Ground. Hatched below, the way a section is drawn. */}
          {groundPath && (
            <>
              <path
                d={`${groundPath} L${px(1).toFixed(1)},${H - PAD.b} L${px(0).toFixed(1)},${H - PAD.b} Z`}
                fill="#0d1f2d"
                opacity="0.65"
              />
              <path d={groundPath} stroke="#7f9bb1" strokeWidth="1.4" fill="none" />
            </>
          )}

          {/* Surface features, drawn down to the run they sit on */}
          {onThisRun.map((s) => (
            <g key={s.id}>
              <line
                x1={px(s.f)}
                y1={py(0.15)}
                x2={px(s.f)}
                y2={py(-depthAt(run, s.f))}
                stroke={s.color}
                strokeWidth="4"
                opacity="0.3"
              />
              <rect
                x={px(s.f) - 5}
                y={py(0.15) - 3}
                width="10"
                height="4"
                fill={s.color}
              />
              <text
                x={px(s.f)}
                y={py(0.15) - 6}
                fill="#7f9bb1"
                fontSize="6.5"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {s.id}
              </text>
            </g>
          ))}

          {/* The run itself, as a band of its true diameter */}
          <polygon
            points={`${crown.join(' ')} ${invert.join(' ')}`}
            fill={colour}
            opacity="0.85"
          />

          {/* Invert levels at each end — what a chamber is built to */}
          <text
            x={px(0) + 3}
            y={py(-start) + 14}
            fill={colour}
            fontSize="7.5"
            fontFamily="monospace"
          >
            {(-start).toFixed(2)}
          </text>
          <text
            x={px(1) - 3}
            y={py(-end) + 14}
            fill={colour}
            fontSize="7.5"
            fontFamily="monospace"
            textAnchor="end"
          >
            {(-end).toFixed(2)}
          </text>

          {/* Crossings. On a long section a clash is a point, not a guess. */}
          {crossings.map((c, i) => (
            <g key={i}>
              <line
                x1={px(c.f)}
                y1={PAD.t}
                x2={px(c.f)}
                y2={H - PAD.b}
                stroke={c.tight ? '#e24b4a' : '#ffb164'}
                strokeWidth="0.8"
                strokeDasharray="3 3"
                opacity="0.8"
              />
              <circle
                cx={px(c.f)}
                cy={py(-depthAt(run, c.f))}
                r="4"
                fill="none"
                stroke={c.tight ? '#e24b4a' : '#ffb164'}
                strokeWidth="1.4"
              />
              <text
                x={px(c.f)}
                y={PAD.t + 8 + (i % 2) * 9}
                fill={c.tight ? '#e24b4a' : '#ffb164'}
                fontSize="6.5"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {(c.clearance * 1000).toFixed(0)}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {busy && (
        <p className="mt-1.5 font-mono text-[9px] text-[#35c8dc]">Sampling ground…</p>
      )}

      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[10px]">
        <span className="text-[#4a6b85]">Gradient</span>
        <span className={run.fall ? 'text-[#8be0a0]' : 'text-[#7f9bb1]'}>
          {gradient}
          {run.fall ? ` · ${(run.fall * 100).toFixed(2)}%` : ''}
        </span>
        <span className="text-[#4a6b85]">Invert</span>
        <span className="text-[#e6f0f7]">
          {(-start).toFixed(2)} → {(-end).toFixed(2)} m
        </span>
        <span className="text-[#4a6b85]">Drop</span>
        <span className="text-[#e6f0f7]">{(drop * 1000).toFixed(0)} mm over {length.toFixed(0)} m</span>
        {minCover != null && (
          <>
            <span className="text-[#4a6b85]">Cover</span>
            <span className={minCover < 0.6 ? 'text-[#e24b4a]' : 'text-[#e6f0f7]'}>
              {minCover.toFixed(2)} … {maxCover.toFixed(2)} m
            </span>
          </>
        )}
      </div>

      {ground && (
        <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[#4a6b85]">
          Ground from: {ground.source}
        </p>
      )}
      {!ground && !busy && (
        <p className="mt-1.5 text-[10px] leading-snug text-[#ffb164]">
          No ground to section against. Open Terrain and derive a surface, and
          this drawing gains its cover depths.
        </p>
      )}

      {minCover != null && minCover < 0.6 && (
        <p className="mt-2 border-l-2 border-[#e24b4a] pl-2 text-[10px] leading-snug text-[#e24b4a]">
          Cover falls to {minCover.toFixed(2)} m. Below 600 mm a run under a
          carriageway needs protection, and this is where the ground rises over
          a pipe that does not.
        </p>
      )}

      {crossings.some((c) => c.tight) && (
        <p className="mt-2 border-l-2 border-[#e24b4a] pl-2 text-[10px] leading-snug text-[#e24b4a]">
          A crossing on this run is inside the {CLEARANCE_MIN * 1000} mm
          separation minimum.
        </p>
      )}
    </div>
  )
}
