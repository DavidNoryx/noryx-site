import { useCallback, useEffect, useRef, useState } from 'react'
import FusionScene from './components/FusionScene'
import Radargram from './components/Radargram'
import Findings from './components/Findings'
import { SITE, SENSORS, FINDINGS } from './site'
import { BEATS } from './narrative'

const ALL_ON = Object.fromEntries(SENSORS.map((s) => [s.key, true]))

function BeatBlock({ index, beat }) {
  const b = BEATS[index]
  const active = beat === index
  return (
    <div
      className={`pointer-events-none w-[540px] transition-all duration-500 ${
        active ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
      }`}
    >
      <div className="flex items-baseline gap-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#4a6b85]">
          {b.index} / 05
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#35c8dc]">
          {b.eyebrow}
        </span>
      </div>

      <h2
        className={`mt-3 font-semibold tracking-tight text-[#e6f0f7] ${
          b.hero ? 'text-[54px] leading-[1.02]' : 'text-[38px] leading-[1.08]'
        }`}
      >
        {b.claim}
      </h2>

      <p
        className={`mt-4 leading-relaxed text-[#7f9bb1] ${
          b.hero ? 'text-[17px]' : 'text-[15px]'
        }`}
      >
        {b.body}
      </p>

      {/* The numbers carry the argument. Every one is measured or cited. */}
      <div className="mt-7 border-t border-[#16293a] pt-5">
        {b.stats.map(([value, label]) => (
          <div key={value} className="flex items-baseline gap-5 py-1.5">
            <span className="w-[150px] shrink-0 font-mono text-[24px] tracking-tight text-[#35c8dc]">
              {value}
            </span>
            <span className="text-[13px] leading-snug text-[#7f9bb1]">{label}</span>
          </div>
        ))}
      </div>

      {b.source && (
        <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.12em] text-[#4a6b85]">
          Source · {b.source}
        </p>
      )}
    </div>
  )
}

export default function App() {
  const [beat, setBeat] = useState(0)
  const [progress, setProgress] = useState(0)
  const [enabled, setEnabled] = useState(ALL_ON)
  const [threshold, setThreshold] = useState(0.25)
  const [selected, setSelected] = useState(null)
  const [exportState, setExportState] = useState('idle')
  const trackRef = useRef(null)

  useEffect(() => {
    const onScroll = () => {
      const track = trackRef.current
      if (!track) return
      const scrollable = track.scrollHeight - window.innerHeight
      const p = scrollable > 0 ? window.scrollY / scrollable : 0
      const raw = Math.min(p, 0.9999) * BEATS.length
      setBeat(Math.floor(raw))
      setProgress(raw % 1)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const toggle = useCallback((key) => {
    setEnabled((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const handleExport = useCallback(() => setExportState('working'), [])

  useEffect(() => {
    if (exportState !== 'working') return undefined
    const done = setTimeout(() => setExportState('done'), 1500)
    const reset = setTimeout(() => setExportState('idle'), 4500)
    return () => {
      clearTimeout(done)
      clearTimeout(reset)
    }
  }, [exportState])

  const showRadar = beat === 4
  const showPanel = beat >= 5
  

  return (
    <div ref={trackRef} style={{ height: `${BEATS.length * 100}vh` }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#060d13]">
        <FusionScene beat={Math.max(0, beat - 1)} progress={progress} onPick={(f) => setSelected(f.id)} />

        {/* Header */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between bg-gradient-to-b from-[#060d13] to-transparent px-8 pb-10 pt-6">
          <div className="flex items-center gap-2.5">
            <div className="grid size-7 place-items-center border border-[#12618c] bg-[#0f1e2c]">
              <div className="size-2 rotate-45 bg-[#35c8dc]" />
            </div>
            <div className="leading-tight">
              <div className="text-[13px] font-semibold tracking-[0.18em] text-[#e6f0f7]">
                NORYX
              </div>
              <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#4a6b85]">
                Subsurface intelligence
              </div>
            </div>
          </div>
          <div className="text-right font-mono text-[9px] uppercase leading-relaxed tracking-[0.14em] text-[#4a6b85]">
            <div className="text-[#7f9bb1]">{SITE.label}</div>
            <div>
              {SITE.kind} · {SITE.region}
            </div>
            <div>Captured {SITE.captured}</div>
          </div>
        </div>

        {/* The argument occupies the left column; the model breathes behind it. */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-0 w-[900px] bg-gradient-to-r from-[#060d13] from-55% via-[#060d13]/85 to-transparent" />
        <div className="absolute left-10 top-[210px] z-10 w-[540px]">
          {BEATS.map((b, i) => (
            <div key={b.key} className="absolute left-0 top-0 w-[540px]">
              <BeatBlock index={i} beat={beat} />
            </div>
          ))}
        </div>

        {/* No third-party embed. The capture on screen is rendered from our own
            mesh, so nothing in the pitch depends on someone else's server. */}

        {/* Beat 4 — what the sensor returns, beside what we deliver */}
        <div
          className={`absolute right-8 top-32 h-[300px] w-[380px] transition-all duration-500 ${
            showRadar ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <div className="h-full border border-[#24415a] bg-[#0b1622]/92 p-3.5 backdrop-blur-md">
            <Radargram mode="modelled" reveal={Math.min(1, progress * 1.6)} />
          </div>
        </div>

        {/* Beat 5 — the instrument */}
        <div
          className={`absolute right-8 top-24 bottom-16 w-[320px] transition-all duration-500 ${
            showPanel ? 'opacity-100' : 'pointer-events-none translate-x-3 opacity-0'
          }`}
        >
          <div className="flex h-full flex-col border border-[#24415a] bg-[#0b1622]/92 backdrop-blur-md">
            <div className="border-b border-[#16293a] px-3.5 py-3">
              <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.16em] text-[#4a6b85]">
                Sensors
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {SENSORS.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    role="switch"
                    aria-checked={enabled[s.key]}
                    onClick={() => toggle(s.key)}
                    className={`flex items-center gap-2 border px-2 py-1.5 text-left transition-colors ${
                      enabled[s.key]
                        ? 'border-[#24415a] bg-[#16293a]'
                        : 'border-[#16293a] hover:border-[#24415a]'
                    }`}
                  >
                    <span
                      className="size-2 shrink-0 rounded-full border"
                      style={{
                        borderColor: s.color,
                        backgroundColor: enabled[s.key] ? s.color : 'transparent',
                      }}
                    />
                    <span
                      className={`truncate text-[11px] ${
                        enabled[s.key] ? 'text-[#e6f0f7]' : 'text-[#4a6b85]'
                      }`}
                    >
                      {s.label}
                    </span>
                  </button>
                ))}
              </div>

              <label className="mt-3 block">
                <span className="flex items-baseline justify-between font-mono text-[9px] uppercase tracking-[0.12em] text-[#4a6b85]">
                  Score threshold
                  <span className="text-[#35c8dc]">{Math.round(threshold * 100)}%</span>
                </span>
                <input
                  type="range"
                  min="0"
                  max="80"
                  step="1"
                  value={Math.round(threshold * 100)}
                  onChange={(e) => setThreshold(Number(e.target.value) / 100)}
                  className="mt-1.5 w-full accent-[#35c8dc]"
                />
              </label>
            </div>

            <div className="min-h-0 flex-1 px-3.5 py-3">
              <Findings
                findings={FINDINGS}
                enabled={enabled}
                threshold={threshold}
                selected={selected}
                onSelect={setSelected}
              />
            </div>

            <div className="border-t border-[#16293a] p-3.5">
              <button
                type="button"
                onClick={handleExport}
                disabled={exportState === 'working'}
                className="w-full border border-[#12618c] bg-[#12618c] px-4 py-2.5 text-[12px] font-medium tracking-[0.06em] text-white transition-colors hover:border-[#2a8fc4] hover:bg-[#2a8fc4] disabled:cursor-wait disabled:opacity-60"
              >
                {exportState === 'working'
                  ? 'Writing IFC…'
                  : exportState === 'done'
                    ? 'Exported ✓'
                    : 'Export to BIM'}
              </button>
              <p className="mt-2 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-[#4a6b85]">
                IFC 4.3 · Revit · Civil 3D
              </p>
            </div>
          </div>
        </div>

        {/* Evidence strip — the ugly truth, kept on screen next to the clean result */}
        <div
          className={`absolute bottom-16 right-8 w-[380px] transition-all duration-500 ${
            showRadar || showPanel ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          {showPanel && (
            <div className="border border-[#16293a] bg-[#0b1622]/85 p-2.5 backdrop-blur-sm">
              <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-[#4a6b85]">
                Field capture · unprocessed
              </div>
              <img
                src="/evidence/site-b-radargram-01.png"
                alt="Unprocessed radar record from a field trial"
                className="h-[70px] w-full object-cover opacity-80"
              />
            </div>
          )}
        </div>

        {/* Scroll hint / free-look cue */}
        <div className="pointer-events-none absolute bottom-6 left-8 font-mono text-[9px] uppercase tracking-[0.18em] text-[#4a6b85]">
          {beat >= 4 ? 'Drag to look around · click a run to inspect' : 'Scroll'}
        </div>
      </div>
    </div>
  )
}
