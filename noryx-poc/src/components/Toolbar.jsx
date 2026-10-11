import { MAINS, LATERALS, UTILITY } from '../utilities'
import { QL, assess } from '../sue'
import { SURFACE, surfaceSummary } from '../surface'

// One palette, one active tool at a time. Modelled on how Matterport and the
// CAD viewers do it: the tool you are holding is obvious, switching is one
// click, and there is always a visible way back to the presentation.

const TOOLS = [
  { id: 'orbit', label: 'Navigate', hint: 'Drag to orbit · scroll to zoom', glyph: '✥' },
  {
    id: 'walk',
    label: 'Walk',
    hint: 'Drag to look · hold the arrow to move · W A S D on a keyboard',
    glyph: '↑',
  },
  { id: 'measure', label: 'Measure', hint: 'Click point to point · chains leg to leg', glyph: '⟷' },
  { id: 'select', label: 'Inspect', hint: 'Click a service to read it', glyph: '⌖' },
]

function Tool({ tool, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={tool.hint}
      className={`flex items-center gap-1.5 border px-2.5 py-2 text-[10px] tracking-[0.04em] transition-colors md:gap-2 md:px-3 md:text-[11px] ${
        active
          ? 'border-[#35c8dc] bg-[#16293a] text-[#35c8dc]'
          : 'border-[#24415a] text-[#7f9bb1] hover:border-[#35c8dc] hover:text-[#e6f0f7]'
      }`}
    >
      <span className="font-mono text-[13px] leading-none">
        {tool.id === 'walk' ? '↑' : tool.glyph}
      </span>
      {tool.label}
    </button>
  )
}

export default function Toolbar({
  mode,
  tool,
  setTool,
  backToStory,
  measurement,
  undoMeasure,
  clearMeasure,
  isolated,
  setIsolated,
  showPlan,
  setShowPlan,
  xray,
  setXray,
  surfaceOn,
  setSurfaceOn,
  showErt,
  showTerrain,
  showProfile,
  showRisk,
  setShowRisk,
  setShowProfile,
  setShowTerrain,
  setShowErt,
}) {
  if (mode === 'story') return null
  const active = TOOLS.find((t) => t.id === tool)

  // One button per run, carrying the quality level it was actually surveyed to.
  const Run = ({ run, compact }) => {
    const colour = UTILITY[run.utility]?.color ?? '#f2a33c'
    const { level } = assess(run)
    const on = isolated === run.id
    return (
      <button
        type="button"
        onClick={() => setIsolated(on ? null : run.id)}
        title={run.diameter}
        className={`flex items-center gap-2 border px-2.5 backdrop-blur-md transition-colors ${
          compact ? 'py-1' : 'py-1.5'
        } ${
          on
            ? 'border-[#35c8dc] bg-[#16293a]'
            : 'border-[#16293a] bg-[#0b1622]/85 hover:border-[#24415a]'
        }`}
      >
        <span
          className={compact ? 'h-0.5 w-2.5' : 'h-0.5 w-3.5'}
          style={{
            backgroundColor: colour,
            // A connection is drawn as a branch, not a main: dashed, so the
            // legend tells you which is the street and which is the customer.
            ...(compact ? { opacity: 0.85 } : null),
          }}
        />
        <span className={compact ? 'text-[9px] text-[#b6cada]' : 'text-[10px] text-[#e6f0f7]'}>
          {run.name}
        </span>
        <span
          className="border px-1 font-mono text-[9px]"
          style={{ color: level.color, borderColor: level.color }}
          title={level.means}
        >
          {level.label}
        </span>
        <span className="hidden font-mono text-[9px] text-[#4a6b85] md:inline">
          {run.depth.toFixed(2)} m
        </span>
      </button>
    )
  }

  return (
    <div className="pointer-events-auto absolute inset-x-3 top-3 z-30 md:inset-x-auto md:left-1/2 md:top-5 md:-translate-x-1/2">
      <div className="flex flex-wrap items-center justify-center gap-1.5 border border-[#24415a] bg-[#0b1622]/94 px-2 py-2 backdrop-blur-md md:flex-nowrap md:gap-2 md:px-2.5">
        {TOOLS.map((t) => (
          <Tool key={t.id} tool={t} active={tool === t.id} onClick={() => setTool(t.id)} />
        ))}

        <span className="mx-1 h-6 w-px bg-[#24415a]" />

        <button
          type="button"
          onClick={() => setXray(!xray)}
          title="See the services through the ground"
          className={`border px-2.5 py-2 text-[10px] transition-colors md:px-3 md:text-[11px] ${
            xray
              ? 'border-[#35c8dc] bg-[#16293a] text-[#35c8dc]'
              : 'border-[#24415a] text-[#7f9bb1] hover:border-[#35c8dc] hover:text-[#e6f0f7]'
          }`}
        >
          X-ray
        </button>

        {SURFACE.length > 0 && (
          <button
            type="button"
            onClick={() => setSurfaceOn(!surfaceOn)}
            title="Chambers, valves, pillars and hydrants, with the risers down to the services they serve"
            className={`border px-2.5 py-2 text-[10px] transition-colors md:px-3 md:text-[11px] ${
              surfaceOn
                ? 'border-[#35c8dc] bg-[#16293a] text-[#35c8dc]'
                : 'border-[#24415a] text-[#7f9bb1] hover:border-[#35c8dc] hover:text-[#e6f0f7]'
            }`}
          >
            Surface
          </button>
        )}

        <button
          type="button"
          onClick={() => setShowRisk(!showRisk)}
          title="Excavation corridor, and records against measurement"
          className={`border px-2.5 py-2 text-[10px] transition-colors md:px-3 md:text-[11px] ${
            showRisk
              ? 'border-[#e24b4a] bg-[#16293a] text-[#e24b4a]'
              : 'border-[#24415a] text-[#7f9bb1] hover:border-[#e24b4a] hover:text-[#e6f0f7]'
          }`}
        >
          Risk
        </button>

        <button
          type="button"
          onClick={() => setShowProfile(!showProfile)}
          title="Long section along a run — fall, invert levels and cover depth"
          className={`border px-2.5 py-2 text-[10px] transition-colors md:px-3 md:text-[11px] ${
            showProfile
              ? 'border-[#35c8dc] bg-[#16293a] text-[#35c8dc]'
              : 'border-[#24415a] text-[#7f9bb1] hover:border-[#35c8dc] hover:text-[#e6f0f7]'
          }`}
        >
          Long section
        </button>

        <button
          type="button"
          onClick={() => setShowTerrain(!showTerrain)}
          title="Import, derive and export a ground surface"
          className={`border px-2.5 py-2 text-[10px] transition-colors md:px-3 md:text-[11px] ${
            showTerrain
              ? 'border-[#35c8dc] bg-[#16293a] text-[#35c8dc]'
              : 'border-[#24415a] text-[#7f9bb1] hover:border-[#35c8dc] hover:text-[#e6f0f7]'
          }`}
        >
          Terrain
        </button>

        <button
          type="button"
          onClick={() => setShowErt(!showErt)}
          title="Real resistivity sections from the controlled pipe-burial trial"
          className={`border px-2.5 py-2 text-[10px] transition-colors md:px-3 md:text-[11px] ${
            showErt
              ? 'border-[#8be0a0] bg-[#16293a] text-[#8be0a0]'
              : 'border-[#24415a] text-[#7f9bb1] hover:border-[#8be0a0] hover:text-[#e6f0f7]'
          }`}
        >
          ERT
        </button>

        <button
          type="button"
          onClick={() => setShowPlan(!showPlan)}
          className={`border px-2.5 py-2 text-[10px] transition-colors md:px-3 md:text-[11px] ${
            showPlan
              ? 'border-[#35c8dc] bg-[#16293a] text-[#35c8dc]'
              : 'border-[#24415a] text-[#7f9bb1] hover:border-[#35c8dc] hover:text-[#e6f0f7]'
          }`}
        >
          Plan drawing
        </button>

        <span className="mx-1 h-6 w-px bg-[#24415a]" />

        <button
          type="button"
          onClick={backToStory}
          className="border border-[#24415a] px-2.5 py-2 text-[10px] text-[#e6f0f7] transition-colors hover:border-[#e24b4a] hover:text-[#e24b4a] md:px-3 md:text-[11px]"
        >
          ← Back to presentation
        </button>
      </div>

      <p className="mt-2 text-center font-mono text-[9px] uppercase tracking-[0.16em] text-[#4a6b85]">
        {active?.hint}
      </p>

      {tool === 'measure' && (
        <div className="mt-2 flex items-center justify-center gap-2 border border-[#24415a] bg-[#0b1622]/94 px-3 py-2 backdrop-blur-md">
          <span className="font-mono text-[12px] text-[#35c8dc]">
            {measurement
              ? `${measurement.total.toFixed(2)} m over ${measurement.legs} leg${measurement.legs > 1 ? 's' : ''}`
              : 'Click two points'}
          </span>
          <button
            type="button"
            onClick={undoMeasure}
            className="border border-[#24415a] px-2 py-1 text-[10px] text-[#7f9bb1] hover:border-[#35c8dc] hover:text-[#e6f0f7]"
          >
            Undo leg
          </button>
          <button
            type="button"
            onClick={clearMeasure}
            className="border border-[#24415a] px-2 py-1 text-[10px] text-[#7f9bb1] hover:border-[#e24b4a] hover:text-[#e24b4a]"
          >
            Clear all
          </button>
        </div>
      )}

      {/* The mains: what the street carries. */}
      <div className="mt-2 flex flex-wrap justify-center gap-1.5">
        {MAINS.map((run) => (
          <Run key={run.id} run={run} />
        ))}
        <span
          className="hidden items-center border border-[#16293a] bg-[#0b1622]/85 px-2 font-mono text-[9px] uppercase tracking-[0.1em] text-[#4a6b85] backdrop-blur-md md:flex"
          title={Object.values(QL)
            .map((q) => `${q.label} — ${q.name}`)
            .join('\n')}
        >
          ASCE 38-22
        </span>
      </div>

      {/* The connections: who is attached to it, and what is visible on top. */}
      {(LATERALS.length > 0 || SURFACE.length > 0) && (
        <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5">
          {LATERALS.length > 0 && (
            <span className="hidden font-mono text-[9px] uppercase tracking-[0.14em] text-[#4a6b85] md:inline">
              Connections
            </span>
          )}
          {LATERALS.map((run) => (
            <Run key={run.id} run={run} compact />
          ))}
          {SURFACE.length > 0 && (
            <span className="flex items-center gap-2 border border-[#16293a] bg-[#0b1622]/85 px-2 py-1 backdrop-blur-md">
              {surfaceSummary().map((entry) => (
                <span
                  key={entry.type}
                  title={`${entry.kind.label} — ${entry.kind.detail}`}
                  className="flex items-center gap-1 font-mono text-[9px] text-[#7f9bb1]"
                >
                  <span className="text-[11px] leading-none text-[#b6cada]">
                    {entry.kind.glyph}
                  </span>
                  {entry.count}
                </span>
              ))}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
