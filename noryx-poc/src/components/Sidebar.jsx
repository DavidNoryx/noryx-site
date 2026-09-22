import { LAYERS } from '../layers'

function LayerToggle({ layer, active, onToggle }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={() => onToggle(layer.key)}
      className={`group flex w-full items-start gap-3 border px-3 py-3 text-left transition-colors ${
        active
          ? 'border-[#24415a] bg-[#16293a]'
          : 'border-[#16293a] bg-transparent hover:border-[#24415a] hover:bg-[#0f1e2c]'
      }`}
    >
      {/* Modality swatch — dims to a hollow ring when the layer is off */}
      <span
        className="mt-1 size-2.5 shrink-0 rounded-full border transition-all"
        style={{
          borderColor: layer.color,
          backgroundColor: active ? layer.color : 'transparent',
          boxShadow: active ? `0 0 10px ${layer.color}80` : 'none',
        }}
      />

      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span
            className={`text-[13px] font-medium tracking-tight ${
              active ? 'text-[#e6f0f7]' : 'text-[#7f9bb1]'
            }`}
          >
            {layer.label}
          </span>
          <span
            className={`font-mono text-[9px] uppercase tracking-[0.14em] ${
              active ? 'text-[#35c8dc]' : 'text-[#4a6b85]'
            }`}
          >
            {active ? 'ON' : 'OFF'}
          </span>
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-[#5d7d97]">{layer.sub}</span>
        <span className="mt-1.5 block font-mono text-[10px] text-[#4a6b85]">{layer.detail}</span>
      </span>
    </button>
  )
}

export default function Sidebar({ layers, onToggle, onExport, exportState }) {
  const activeCount = Object.values(layers).filter(Boolean).length

  return (
    <aside className="flex w-[218px] shrink-0 flex-col border-r border-[#16293a] bg-[#0b1622]">
      {/* Brand */}
      <div className="flex items-center gap-2.5 border-b border-[#16293a] px-3 py-4">
        <div className="grid size-7 place-items-center border border-[#12618c] bg-[#0f1e2c]">
          <div className="size-2 rotate-45 bg-[#35c8dc]" />
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold tracking-[0.18em]">NORYX</div>
          <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#4a6b85]">
            Subsurface Intelligence
          </div>
        </div>
      </div>

      {/* Project context */}
      <div className="border-b border-[#16293a] px-4 py-3">
        <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#4a6b85]">
          Active Project
        </div>
        <div className="mt-1 text-[12px] text-[#e6f0f7]">Hadera East · Block 14</div>
        <div className="font-mono text-[10px] text-[#5d7d97]">Survey 2026-03-11 · v4</div>
      </div>

      {/* Capture layers */}
      <div className="flex min-h-0 flex-1 flex-col px-3 py-4">
        <div className="mb-2.5 flex items-baseline justify-between">
          <h2 className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#4a6b85]">
            Capture Layers
          </h2>
          <span className="font-mono text-[9px] text-[#35c8dc]">{activeCount}/4</span>
        </div>

        <div className="flex flex-col gap-1.5 overflow-y-auto">
          {LAYERS.map((layer) => (
            <LayerToggle
              key={layer.key}
              layer={layer}
              active={layers[layer.key]}
              onToggle={onToggle}
            />
          ))}
        </div>
      </div>

      {/* Export */}
      <div className="border-t border-[#16293a] p-4">
        <button
          type="button"
          onClick={onExport}
          disabled={exportState === 'working'}
          className="w-full border border-[#12618c] bg-[#12618c] px-4 py-2.5 text-[12px] font-medium tracking-[0.06em] text-white transition-colors hover:border-[#2a8fc4] hover:bg-[#2a8fc4] disabled:cursor-wait disabled:opacity-60"
        >
          {exportState === 'working'
            ? 'Building IFC…'
            : exportState === 'done'
              ? 'Exported ✓'
              : 'Export to BIM'}
        </button>
        <p className="mt-2 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-[#4a6b85]">
          IFC 4.3 · Revit · Civil 3D
        </p>
      </div>
    </aside>
  )
}
