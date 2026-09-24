import { useEffect, useRef } from 'react'
import { drawRadargram } from '../radargram'
import { SYNTHETIC_NOTE } from '../site'

const SPAN = 12
const MAX_DEPTH = 3.2

function Axis({ maxDepth }) {
  const ticks = [0, 1, 2, 3]
  return (
    <div className="pointer-events-none absolute inset-y-0 left-0 w-8">
      {ticks.map((d) => (
        <span
          key={d}
          className="absolute right-1 font-mono text-[9px] text-[#4a6b85]"
          style={{ top: `${(d / maxDepth) * 100}%`, transform: 'translateY(-50%)' }}
        >
          {d} m
        </span>
      ))}
    </div>
  )
}

/**
 * The reveal beat's left-hand panel: what the instrument returns.
 * `mode` picks the modelled scan or the operator capture.
 */
export default function Radargram({ mode = 'modelled', reveal = 1, evidence, note }) {
  const ref = useRef(null)

  useEffect(() => {
    if (mode !== 'modelled') return
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    drawRadargram(ctx, {
      width: canvas.width,
      height: canvas.height,
      span: SPAN,
      maxDepth: MAX_DEPTH,
      epsR: 9,
      fc: 400,
      reveal,
      targets: [
        { x0: 4.1, depth: 1.4, amp: 1 },
        { x0: 8.6, depth: 0.9, amp: 0.82 },
      ],
    })
  }, [mode, reveal])

  return (
    <figure className="m-0 flex h-full flex-col">
      <figcaption className="mb-2 flex items-baseline justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#7f9bb1]">
          What the sensor returns
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#4a6b85]">
          {mode === 'modelled' ? '400 MHz · B-scan' : 'Operator capture'}
        </span>
      </figcaption>

      <div className="relative min-h-0 flex-1 border border-[#1e3448] bg-black pl-8">
        {mode === 'modelled' ? (
          <>
            <Axis maxDepth={MAX_DEPTH} />
            <canvas ref={ref} width={520} height={280} className="h-full w-full" />
          </>
        ) : (
          <img
            src={evidence}
            alt="Ground penetrating radar B-scan recorded on site"
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.1em] text-[#4a6b85]">
        {note ?? (mode === 'modelled' ? SYNTHETIC_NOTE : 'Unprocessed. No interpretation applied.')}
      </p>
    </figure>
  )
}
