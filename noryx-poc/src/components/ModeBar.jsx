import { RUNS, UTILITY } from '../utilities'

function Btn({ on, onClick, children, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border px-3 py-1.5 text-[11px] tracking-[0.04em] transition-colors ${
        on
          ? 'border-[#35c8dc] bg-[#16293a] text-[#35c8dc]'
          : danger
            ? 'border-[#24415a] text-[#e6f0f7] hover:border-[#e24b4a] hover:text-[#e24b4a]'
            : 'border-[#24415a] text-[#7f9bb1] hover:border-[#35c8dc] hover:text-[#e6f0f7]'
      }`}
    >
      {children}
    </button>
  )
}

/**
 * The way out, and the way between modes.
 *
 * The presentation is a guided scroll; explore and walk are not. Without an
 * explicit, always-visible exit the viewer gets stranded in the model, which
 * is exactly the wrong thing to happen in front of an investor.
 */
export default function ModeBar({
  mode,
  setMode,
  measuring,
  setMeasuring,
  measurement,
  clearMeasurement,
  isolated,
  setIsolated,
  showPlan,
  setShowPlan,
}) {
  const inModel = mode !== 'story'

  return (
    <div className="pointer-events-auto absolute left-1/2 top-5 z-30 -translate-x-1/2">
      <div className="flex items-center gap-2 border border-[#24415a] bg-[#0b1622]/94 px-2.5 py-2 backdrop-blur-md">
        <Btn on={mode === 'story'} onClick={() => setMode('story')}>
          Presentation
        </Btn>
        <Btn on={mode === 'orbit'} onClick={() => setMode('orbit')}>
          Inspect
        </Btn>
        <Btn on={mode === 'walk'} onClick={() => setMode('walk')}>
          Walk the site
        </Btn>

        <span className="mx-1 h-5 w-px bg-[#24415a]" />

        <Btn on={showPlan} onClick={() => setShowPlan(!showPlan)}>
          Plan drawing
        </Btn>
        <Btn
          on={measuring}
          onClick={() => {
            setMeasuring(!measuring)
            clearMeasurement()
          }}
        >
          Measure
        </Btn>

        {(isolated || measurement || measuring) && (
          <>
            <span className="mx-1 h-5 w-px bg-[#24415a]" />
            <Btn
              danger
              onClick={() => {
                setIsolated(null)
                setMeasuring(false)
                clearMeasurement()
              }}
            >
              Clear
            </Btn>
          </>
        )}

        {inModel && (
          <>
            <span className="mx-1 h-5 w-px bg-[#24415a]" />
            <Btn danger onClick={() => setMode('story')}>
              ← Back to presentation
            </Btn>
          </>
        )}
      </div>

      {/* Isolation strip, so a single run can be read on its own */}
      {inModel && (
        <div className="mt-2 flex justify-center gap-1.5">
          {RUNS.map((run) => {
            const colour = UTILITY[run.utility]?.color ?? '#f2a33c'
            const on = isolated === run.id
            return (
              <button
                key={run.id}
                type="button"
                onClick={() => setIsolated(on ? null : run.id)}
                className={`flex items-center gap-1.5 border px-2 py-1 backdrop-blur-md transition-colors ${
                  on
                    ? 'border-[#35c8dc] bg-[#16293a]'
                    : 'border-[#16293a] bg-[#0b1622]/85 hover:border-[#24415a]'
                }`}
              >
                <span className="h-0.5 w-3.5" style={{ backgroundColor: colour }} />
                <span className="text-[10px] text-[#e6f0f7]">{run.name}</span>
                <span className="font-mono text-[9px] text-[#4a6b85]">
                  {run.depth.toFixed(2)} m
                </span>
              </button>
            )
          })}
        </div>
      )}

      {mode === 'walk' && (
        <p className="mt-2 text-center font-mono text-[9px] uppercase tracking-[0.16em] text-[#4a6b85]">
          W A S D to walk · drag to look · shift to move faster
        </p>
      )}

      {measuring && (
        <p className="mt-2 text-center font-mono text-[10px] text-[#35c8dc]">
          {measurement
            ? `${measurement.toFixed(2)} m between the two points`
            : 'Click two points to measure'}
        </p>
      )}
    </div>
  )
}
