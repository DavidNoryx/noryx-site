import { useCallback, useEffect, useRef, useState } from 'react'
import FusionScene from './components/FusionScene'
import Radargram from './components/Radargram'
import Findings from './components/Findings'
import Logo from './components/Logo'
import Toolbar from './components/Toolbar'
import PlanView from './components/PlanView'
import WalkPad from './components/WalkPad'
import ErtSection from './components/ErtSection'
import { SENSORS } from './site'
import { activeSite, activeFindings } from './sites'

const SITE = activeSite()
const FINDINGS = activeFindings()
import { BEATS, STATUS } from './narrative'

const ALL_ON = Object.fromEntries(SENSORS.map((s) => [s.key, true]))
const LAST = BEATS.length - 1

/** Shipped, proven, or planned — stated, never implied. */
function StatusTag({ value }) {
  const s = STATUS[value]
  if (!s) return null
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5">
      <span className="size-1.5 rounded-full" style={{ backgroundColor: s.color }} />
      <span
        className="font-mono text-[9px] uppercase tracking-[0.12em]"
        style={{ color: s.color }}
      >
        {s.label}
      </span>
    </span>
  )
}

function Row({ left, right, color, status }) {
  return (
    <div className="flex gap-4 border-t border-[#16293a] py-3 first:border-t-0">
      <span
        className="w-[96px] shrink-0 font-mono text-[11px] leading-snug md:w-[150px] md:text-[13px]"
        style={{ color: color ?? '#35c8dc' }}
      >
        {left}
      </span>
      <span className="flex-1 text-[11px] leading-snug text-[#7f9bb1] md:text-[13px]">{right}</span>
      {status && <StatusTag value={status} />}
    </div>
  )
}

function BeatBlock({ index, beat }) {
  const b = BEATS[index]
  const active = beat === index
  return (
    <div
      className={`pointer-events-none w-full transition-all duration-500 md:w-[600px] ${
        active ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
      }`}
    >
      <div className="flex items-baseline gap-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#4a6b85]">
          {b.index} / {String(LAST).padStart(2, '0')}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#35c8dc]">
          {b.eyebrow}
        </span>
        {b.status && (
          <span className="ml-auto">
            <StatusTag value={b.status} />
          </span>
        )}
      </div>

      <h2
        className={`mt-3 font-semibold tracking-tight text-[#e6f0f7] ${
          b.hero
            ? 'text-[30px] leading-[1.06] md:text-[52px] md:leading-[1.03]'
            : 'text-[23px] leading-[1.14] md:text-[36px] md:leading-[1.1]'
        }`}
      >
        {b.claim}
      </h2>

      <p
        className={`mt-4 leading-relaxed text-[#7f9bb1] ${b.hero ? 'text-[14px] md:text-[17px]' : 'text-[13px] md:text-[15px]'}`}
      >
        {b.body}
      </p>

      <div className="mt-6">
        {b.stats?.map(([value, label]) => (
          <Row key={value} left={value} right={label} />
        ))}

        {b.instruments?.map(([name, what, color]) => (
          <Row key={name} left={name} right={what} color={color} />
        ))}

        {b.features?.map(([title, what, status]) => (
          <div key={title} className="border-t border-[#16293a] py-3 first:border-t-0">
            <div className="flex items-baseline gap-3">
              <span className="text-[15px] font-medium text-[#e6f0f7]">{title}</span>
              <span className="ml-auto">
                <StatusTag value={status} />
              </span>
            </div>
            <p className="mt-1 text-[13px] leading-snug text-[#7f9bb1]">{what}</p>
          </div>
        ))}

        {b.integrations?.map(([name, what, status]) => (
          <Row key={name} left={name} right={what} status={status} />
        ))}

        {b.horizon?.map(([when, what, status]) => (
          <Row key={when} left={when} right={what} status={status} />
        ))}
      </div>

      {b.note && (
        <p className="mt-4 text-[13px] italic text-[#4a6b85]">{b.note}</p>
      )}

      {b.honesty && (
        <p className="mt-4 border-l-2 border-[#ffb164] pl-3 text-[13px] leading-snug text-[#7f9bb1]">
          {b.honesty}
        </p>
      )}

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
  const [probe, setProbe] = useState(null)
  const [mode, setMode] = useState('story')
  const [isolated, setIsolated] = useState(null)
  const [tool, setToolState] = useState('orbit')
  const [measureInfo, setMeasureInfo] = useState(null)
  const measureApi = useRef(null)
  const walkApi = useRef(null)
  const [showPlan, setShowPlan] = useState(false)
  const [xray, setXray] = useState(false)
  const [surfaceOn, setSurfaceOn] = useState(true)
  const [showErt, setShowErt] = useState(false)
  const [surfaceItem, setSurfaceItem] = useState(null)

  // The tool decides the mode: walking is a tool, not a separate place.
  const setTool = useCallback((next) => {
    setToolState(next)
    setMode(next === 'walk' ? 'walk' : 'orbit')
  }, [])
  const undoMeasure = useCallback(() => setMeasureInfo(measureApi.current?.undo() ?? null), [])
  const clearMeasure = useCallback(() => {
    measureApi.current?.clear()
    setMeasureInfo(null)
  }, [])
  const trackRef = useRef(null)
  const modeRef = useRef(mode)
  modeRef.current = mode

  useEffect(() => {
    const onScroll = () => {
      if (modeRef.current !== 'story') return
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

  // Narrative beats and scene beats are not the same sequence: the scene holds
  // its final state through the closing argument.
  const sceneBeat = Math.max(0, Math.min(4, beat - 1))
  const showRadar = beat === 4
  const showPanel = beat >= 5
  // The mark lights a plate per instrument as they are introduced.
  const lit = beat < 2 ? 3 : Math.min(3, 1 + Math.floor(progress * 3))

  return (
    <div ref={trackRef} style={{ height: `${BEATS.length * 100}vh` }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#060d13]">
        <FusionScene
          beat={sceneBeat}
          progress={progress}
          onPick={(f) => setSelected(f.id)}
          onProbe={setProbe}
          mode={mode}
          isolated={isolated}
          measuring={tool === 'measure'}
          xray={xray}
          surfaceOn={surfaceOn}
          onSurface={setSurfaceItem}
          onMeasure={setMeasureInfo}
          measureApi={measureApi}
          walkApi={walkApi}
        />

        <WalkPad walkApi={walkApi} visible={mode === 'walk'} />

        <Toolbar
          mode={mode}
          tool={tool}
          setTool={setTool}
          backToStory={() => {
            setMode('story')
            clearMeasure()
          }}
          measurement={measureInfo}
          undoMeasure={undoMeasure}
          clearMeasure={clearMeasure}
          isolated={isolated}
          setIsolated={setIsolated}
          showPlan={showPlan}
          setShowPlan={setShowPlan}
          xray={xray}
          setXray={setXray}
          surfaceOn={surfaceOn}
          setSurfaceOn={setSurfaceOn}
          showErt={showErt}
          setShowErt={setShowErt}
        />

        {/* Entering the model from the story */}
        {mode === 'story' && beat >= 4 && (
          <button
            type="button"
            onClick={() => setMode('orbit')}
            className="absolute right-3 top-3 z-30 border border-[#35c8dc] md:right-10 md:top-5 bg-[#0b1622]/94 px-4 py-2 text-[11px] text-[#35c8dc] backdrop-blur-md transition-colors hover:bg-[#16293a]"
          >
            Open the model →
          </button>
        )}

        {/* The drawing, on call. An engineer still works from a plan. */}
        {showPlan && (
          <div className="absolute inset-x-3 bottom-3 z-30 md:inset-x-auto md:bottom-24 md:left-10 md:w-[520px]">
            <div className="border border-[#24415a] bg-[#0b1622]/95 p-3.5 backdrop-blur-md">
              <PlanView isolated={isolated} onIsolate={setIsolated} />
            </div>
          </div>
        )}

        {/* The resistivity sections. Kept on the opposite side from the plan so
            the two can be read together: the plan says where, the section says
            what the ground there is made of. */}
        {mode !== 'story' && showErt && (
          <div className="absolute inset-x-3 bottom-3 z-30 max-h-[70vh] overflow-auto md:inset-x-auto md:bottom-20 md:right-8 md:w-[400px]">
            <div className="border border-[#24415a] bg-[#0b1622]/95 p-3.5 backdrop-blur-md">
              <ErtSection />
            </div>
          </div>
        )}

        {/* A surface feature, read off the street. This is the only part of the
            network anyone can survey without digging, so it is the only part
            that gets to claim QL-A. */}
        {mode !== 'story' && surfaceItem && (
          <div className="pointer-events-auto absolute inset-x-3 bottom-3 z-30 md:inset-x-auto md:bottom-6 md:right-8 md:w-[320px]">
            <div className="border border-[#24415a] bg-[#0b1622]/95 p-3 backdrop-blur-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[14px] leading-none"
                      style={{ color: surfaceItem.color }}
                    >
                      {surfaceItem.kind.glyph}
                    </span>
                    <span className="text-[12px] text-[#e6f0f7]">{surfaceItem.label}</span>
                  </div>
                  <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#4a6b85]">
                    {surfaceItem.id} · on {surfaceItem.run.id} {surfaceItem.run.name} ·
                    riser {surfaceItem.depth.toFixed(2)} m
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSurfaceItem(null)}
                  className="font-mono text-[11px] text-[#4a6b85] hover:text-[#e6f0f7]"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-[#b6cada]">
                {surfaceItem.note}
              </p>
              <p className="mt-1.5 font-mono text-[9px] leading-relaxed text-[#4a6b85]">
                {surfaceItem.kind.detail}
              </p>
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between bg-gradient-to-b from-[#060d13] to-transparent px-5 pb-8 pt-4 md:px-10 md:pb-10 md:pt-6">
          <Logo size={34} lit={beat === 2 ? lit : 3} />
          <div className="max-w-[42%] text-right font-mono text-[8px] uppercase leading-relaxed tracking-[0.1em] text-[#4a6b85] md:max-w-none md:text-[9px] md:tracking-[0.14em]">
            <div className="text-[#7f9bb1]">{SITE.label}</div>
            <div className="hidden md:block">
              {SITE.kind} · {SITE.region}
            </div>
            <div className="hidden md:block">Captured {SITE.captured}</div>
          </div>
        </div>

        {/* The argument occupies the left column; the model breathes behind it. */}
        {mode === 'story' && (<><div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-[#060d13] via-[#060d13]/92 to-[#060d13]/70 md:inset-y-0 md:right-auto md:w-[980px] md:bg-gradient-to-r md:from-[#060d13] md:from-60% md:via-[#060d13]/88 md:to-transparent" />
        <div className="absolute left-5 right-5 top-[112px] z-10 md:left-10 md:right-auto md:top-[150px] md:w-[600px]">
          {BEATS.map((b, i) => (
            <div key={b.key} className="absolute left-0 right-0 top-0 md:right-auto md:w-[600px]">
              <BeatBlock index={i} beat={beat} />
            </div>
          ))}
        </div></>)}

        {/* Beat 4 — what the sensor returns, beside what we deliver */}
        <div
          className={`absolute inset-x-3 top-auto bottom-3 z-10 h-[220px] transition-all duration-500 md:inset-x-auto md:bottom-auto md:right-8 md:top-32 md:h-[300px] md:w-[380px] ${
            showRadar ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <div className="h-full border border-[#24415a] bg-[#0b1622]/92 p-3.5 backdrop-blur-md">
            <Radargram mode="modelled" reveal={Math.min(1, progress * 1.6)} />
          </div>
        </div>

        {/* Beat 5 onward — the instrument */}
        <div
          className={`absolute inset-x-3 bottom-3 top-auto z-10 max-h-[46vh] transition-all duration-500 md:inset-x-auto md:bottom-16 md:right-8 md:top-24 md:max-h-none md:w-[320px] ${
            showPanel ? 'opacity-100' : 'pointer-events-none translate-x-3 opacity-0'
          }`}
        >
          <div className="flex h-full flex-col overflow-hidden border border-[#24415a] bg-[#0b1622]/92 backdrop-blur-md">
            <div className="border-b border-[#16293a] px-3.5 py-3">
              <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.16em] text-[#4a6b85]">
                Instruments on this site
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
                  ? 'Writing model…'
                  : exportState === 'done'
                    ? 'Exported ✓'
                    : 'Send to Revit / Civil 3D'}
              </button>
              <p className="mt-2 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-[#4a6b85]">
                IFC 4.3 · depth and confidence travel with each object
              </p>
            </div>
          </div>
        </div>

        {/* The unprocessed record, kept beside the clean result */}
        <div
          className={`hidden lg:block absolute bottom-6 right-[360px] z-10 w-[300px] transition-all duration-500 ${
            showPanel ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <div className="border border-[#16293a] bg-[#0b1622]/85 p-2.5 backdrop-blur-sm">
            <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-[#4a6b85]">
              What the instrument returned
            </div>
            <img
              src="/evidence/site-b-radargram-01.png"
              alt="Unprocessed radar record from a field trial"
              className="h-[60px] w-full object-cover opacity-80"
            />
          </div>
        </div>

        {/* Alignment readout. Superposition is a claim until a coordinate
            proves it, so the probe reports position and the layer it landed on. */}
        {(beat >= 2 || mode !== 'story') && (
          <div
            className={`absolute bottom-3 left-3 right-3 z-20 flex-wrap items-end gap-2 md:bottom-6 md:left-10 md:right-auto md:flex md:flex-nowrap md:gap-6 ${
              showPanel || showRadar ? 'hidden md:flex' : 'flex'
            }`}
          >
            <div className="border border-[#16293a] bg-[#0b1622]/85 px-3 py-2 backdrop-blur-sm">
              <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#4a6b85]">
                {probe ? `Probe · ${probe.layer ?? 'surface'}` : 'Click anywhere to probe'}
              </div>
              <div className="mt-1 flex gap-4 font-mono text-[12px] text-[#e6f0f7]">
                {['x', 'y', 'z'].map((k) => (
                  <span key={k}>
                    <span className="text-[#4a6b85]">{k.toUpperCase()} </span>
                    {probe ? probe[k].toFixed(2) : '—'}
                    <span className="text-[#4a6b85]"> m</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="border border-[#16293a] bg-[#0b1622]/85 px-3 py-2 backdrop-blur-sm">
              <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#4a6b85]">
                Registration
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-[#8be0a0]" />
                <span className="font-mono text-[12px] text-[#e6f0f7]">RMS 0.021 m</span>
                <span className="font-mono text-[10px] text-[#4a6b85]">all four layers</span>
              </div>
            </div>

            <span className="pb-1 font-mono text-[9px] uppercase tracking-[0.18em] text-[#4a6b85]">
              {beat >= 5 ? 'Drag to look around' : 'Scroll'}
            </span>
          </div>
        )}
        {beat < 2 && (
          <div className="pointer-events-none absolute bottom-3 left-5 z-20 font-mono md:bottom-6 md:left-10 text-[9px] uppercase tracking-[0.18em] text-[#4a6b85]">
            Scroll
          </div>
        )}
      </div>
    </div>
  )
}
