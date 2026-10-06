import { useEffect, useRef, useState } from 'react'

/**
 * The ERT inversion sections, drawn from the surveyor's own grids.
 *
 * This is the second instrument in the app whose output is real rather than
 * illustrated, and it is here for a reason that is worth stating plainly: the
 * trial it comes from is a *negative* result. Iron pipes were buried in one
 * trench on purpose, a second trench was left empty as a control, and ERT
 * recovered the trenches, the fill layers and the boundaries beautifully while
 * failing to resolve the pipes themselves.
 *
 * That is the strongest argument in this whole demo for why fusion is the
 * product. One instrument describes the ground, another finds the object, and
 * the survey report's own recommendation was to run them together.
 */

// A resistivity scale the way a geophysicist expects to read one: conductive
// blues through to resistive reds, interpolated on log10 because resistivity
// spans decades.
const SCALE = [
  [0.0, [26, 62, 122]],
  [0.18, [34, 122, 170]],
  [0.36, [60, 170, 150]],
  [0.52, [128, 196, 100]],
  [0.68, [226, 206, 84]],
  [0.84, [224, 136, 56]],
  [1.0, [196, 54, 48]],
]

function ramp(t) {
  const u = Math.max(0, Math.min(1, t))
  for (let i = 0; i < SCALE.length - 1; i += 1) {
    const [a, ca] = SCALE[i]
    const [b, cb] = SCALE[i + 1]
    if (u <= b) {
      const f = (u - a) / (b - a || 1)
      return [
        Math.round(ca[0] + (cb[0] - ca[0]) * f),
        Math.round(ca[1] + (cb[1] - ca[1]) * f),
        Math.round(ca[2] + (cb[2] - ca[2]) * f),
      ]
    }
  }
  return SCALE[SCALE.length - 1][1]
}

/** Bilinear sample of the grid, so the section reads as a field not as tiles. */
function sampleAt(line, fx, fd) {
  const nx = line.x.length
  const nd = line.depth.length
  const gx = Math.max(0, Math.min(nx - 1, fx * (nx - 1)))
  const gd = Math.max(0, Math.min(nd - 1, fd * (nd - 1)))
  const x0 = Math.floor(gx)
  const d0 = Math.floor(gd)
  const x1 = Math.min(nx - 1, x0 + 1)
  const d1 = Math.min(nd - 1, d0 + 1)
  const tx = gx - x0
  const td = gd - d0
  const at = (xi, di) => line.res[di * nx + xi]
  const v00 = at(x0, d0)
  const v10 = at(x1, d0)
  const v01 = at(x0, d1)
  const v11 = at(x1, d1)
  if (v00 == null || v10 == null || v01 == null || v11 == null) return null
  return (
    v00 * (1 - tx) * (1 - td) +
    v10 * tx * (1 - td) +
    v01 * (1 - tx) * td +
    v11 * tx * td
  )
}

export default function ErtSection({ compact = false }) {
  const [survey, setSurvey] = useState(null)
  const [lines, setLines] = useState([])
  const [active, setActive] = useState(0)
  const [probe, setProbe] = useState(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    let dead = false
    fetch('/ert/lines.json')
      .then((r) => r.json())
      .then((doc) => {
        if (dead) return
        setSurvey(doc.survey)
        setLines(doc.lines)
      })
      .catch(() => {})
    return () => {
      dead = true
    }
  }, [])

  const line = lines[active]

  // One shared colour range across all three lines. Switching line must not
  // silently rescale the colours, or R3 would look like R1 and the whole point
  // — that the clay fill is an order more conductive — would be lost.
  const lo = lines.length ? Math.log10(Math.min(...lines.map((l) => l.range[0]))) : 1
  const hi = lines.length ? Math.log10(Math.max(...lines.map((l) => l.range[1]))) : 2

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !line) return
    const W = canvas.width
    const H = canvas.height
    const ctx = canvas.getContext('2d')
    const img = ctx.createImageData(W, H)
    for (let py = 0; py < H; py += 1) {
      for (let px = 0; px < W; px += 1) {
        const v = sampleAt(line, px / (W - 1), py / (H - 1))
        const o = (py * W + px) * 4
        if (v == null || !Number.isFinite(v)) {
          img.data[o + 3] = 0
          continue
        }
        const [r, g, b] = ramp((Math.log10(v) - lo) / (hi - lo))
        img.data[o] = r
        img.data[o + 1] = g
        img.data[o + 2] = b
        img.data[o + 3] = 255
      }
    }
    ctx.putImageData(img, 0, 0)
  }, [line, lo, hi])

  if (!line) {
    return (
      <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#4a6b85]">
        Loading resistivity sections…
      </div>
    )
  }

  const xMax = line.x[line.x.length - 1]
  const xMin = line.x[0]
  const dMax = line.depth[line.depth.length - 1]

  const onMove = (event) => {
    const r = event.currentTarget.getBoundingClientRect()
    const fx = (event.clientX - r.left) / r.width
    const fd = (event.clientY - r.top) / r.height
    const v = sampleAt(line, fx, fd)
    if (v == null) return setProbe(null)
    setProbe({
      x: xMin + fx * (xMax - xMin),
      d: fd * dMax,
      res: v,
    })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#7f9bb1]">
          ERT inversion · ohm-m
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#4a6b85]">
          {line.crs}
        </span>
      </div>

      {/* Which line. R1 and R2 ran over the trench with pipes in it; R3 was
          the empty control, and it is the comparison that carries the point. */}
      <div className="mb-2 flex flex-wrap gap-1">
        {lines.map((l, i) => (
          <button
            key={l.id}
            type="button"
            onClick={() => setActive(i)}
            title={l.medium}
            className={`border px-2 py-1 font-mono text-[9px] transition-colors ${
              i === active
                ? 'border-[#35c8dc] bg-[#16293a] text-[#35c8dc]'
                : 'border-[#16293a] text-[#7f9bb1] hover:border-[#24415a]'
            }`}
          >
            {l.id}
            <span className="ml-1 text-[#4a6b85]">{l.target ? 'pipes' : 'control'}</span>
          </button>
        ))}
      </div>

      <div className="relative border border-[#1e3448] bg-[#071119]">
        <canvas
          ref={canvasRef}
          width={420}
          height={Math.max(60, Math.round((420 * Math.abs(dMax)) / (xMax - xMin)))}
          className="block h-auto w-full"
          style={{ imageRendering: 'auto' }}
          onMouseMove={onMove}
          onMouseLeave={() => setProbe(null)}
        />
        <div className="pointer-events-none absolute left-1 top-1 font-mono text-[8px] text-[#e6f0f7] mix-blend-difference">
          0 m
        </div>
        <div className="pointer-events-none absolute right-1 top-1 font-mono text-[8px] text-[#e6f0f7] mix-blend-difference">
          {xMax.toFixed(0)} m
        </div>
        <div className="pointer-events-none absolute bottom-1 left-1 font-mono text-[8px] text-[#e6f0f7] mix-blend-difference">
          {dMax.toFixed(1)} m
        </div>
      </div>

      {/* Readout. A section you cannot interrogate is a picture; one you can
          is a measurement. */}
      <div className="mt-1.5 font-mono text-[9px] text-[#7f9bb1]">
        {probe
          ? `${probe.x.toFixed(1)} m along · ${probe.d.toFixed(2)} m deep · ${probe.res.toFixed(0)} ohm-m`
          : 'Hover the section to read resistivity'}
      </div>

      {/* Colour bar */}
      <div className="mt-2 flex items-center gap-2">
        <span className="font-mono text-[8px] text-[#4a6b85]">
          {Math.round(10 ** lo)}
        </span>
        <div
          className="h-1.5 flex-1"
          style={{
            background: `linear-gradient(to right, ${SCALE.map(
              ([t, c]) => `rgb(${c[0]},${c[1]},${c[2]}) ${(t * 100).toFixed(0)}%`,
            ).join(', ')})`,
          }}
        />
        <span className="font-mono text-[8px] text-[#4a6b85]">
          {Math.round(10 ** hi)}
        </span>
      </div>
      <div className="mt-0.5 flex justify-between font-mono text-[8px] uppercase tracking-[0.1em] text-[#4a6b85]">
        <span>conductive · clay, moisture</span>
        <span>resistive · boulders, voids</span>
      </div>

      {!compact && (
        <>
          <p className="mt-3 text-[11px] leading-relaxed text-[#b6cada]">{line.label}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-[#7f9bb1]">{line.medium}</p>

          {/* The finding that matters, and it is a negative one — but only on
              the lines that actually had pipes under them. Repeating the claim
              over the empty control trench would be the kind of mistake that
              costs you the room. */}
          <div
            className={`mt-3 border-l-2 pl-2 ${
              line.target ? 'border-[#ffb164]' : 'border-[#24415a]'
            }`}
          >
            {line.target ? (
              <>
                <p className="text-[11px] leading-snug text-[#ffb164]">
                  Iron pipes were buried in this trench and ERT did not resolve them.
                </p>
                <p className="mt-1 text-[11px] leading-snug text-[#7f9bb1]">
                  Current spreads around a conductor instead of reflecting off it, so
                  a pipe appears as a broad zone rather than a point. The survey
                  recovered the trench, the fill layers and the boundaries — and
                  recommended pairing it with GPR for the objects. That
                  recommendation is the product.
                </p>
              </>
            ) : (
              <>
                <p className="text-[11px] leading-snug text-[#b6cada]">
                  The control. Nothing was buried here.
                </p>
                <p className="mt-1 text-[11px] leading-snug text-[#7f9bb1]">
                  Fine graded clay, and an order of magnitude more conductive than
                  the boulder fill on R1 and R2 — read the two against the same
                  colour bar. Without this line there is no way to tell a response
                  caused by an object from one caused by the ground it sits in.
                </p>
              </>
            )}
          </div>

          {survey && (
            <p className="mt-2 font-mono text-[8px] uppercase leading-relaxed tracking-[0.1em] text-[#4a6b85]">
              {survey.electrodes} electrodes · {survey.spacing} m · {survey.arrays.join(' · ')}
              <br />
              {survey.contractor} · {survey.date}
            </p>
          )}
        </>
      )}
    </div>
  )
}
