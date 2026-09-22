import { LAYERS } from '../layers'

// Thin instrument furniture around the 3D panel: the view header, the corner
// brackets, the active-modality legend, the scale bar and the status strip.
export function ViewportHeader() {
  return (
    <div className="flex items-end justify-between">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#4a6b85]">
          Fused model
        </span>
        <span className="h-3 w-px bg-[#1e3448]" />
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#4a6b85]">
          ITM / EPSG:2039
        </span>
      </div>
      <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#4a6b85]">
        Perspective · 45mm
      </div>
    </div>
  )
}

export function CornerBrackets() {
  const corners = [
    'left-2 top-2 border-l border-t',
    'right-2 top-2 border-r border-t',
    'bottom-2 left-2 border-b border-l',
    'bottom-2 right-2 border-b border-r',
  ]
  return (
    <>
      {corners.map((cls) => (
        <span key={cls} className={`pointer-events-none absolute size-4 border-[#24415a] ${cls}`} />
      ))}
    </>
  )
}

export function Legend({ layers }) {
  const active = LAYERS.filter((layer) => layers[layer.key])
  if (!active.length) return null

  return (
    <div className="pointer-events-none absolute bottom-4 left-4 flex flex-col gap-1.5 border border-[#16293a] bg-[#0b1622]/80 px-3 py-2.5 backdrop-blur-sm">
      {active.map((layer) => (
        <div key={layer.key} className="flex items-center gap-2">
          <span
            className="size-1.5 rounded-full"
            style={{ backgroundColor: layer.color, boxShadow: `0 0 8px ${layer.color}90` }}
          />
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#7f9bb1]">
            {layer.label}
          </span>
        </div>
      ))}
    </div>
  )
}

export function ScaleBar() {
  return (
    <div className="pointer-events-none absolute bottom-4 right-4 flex flex-col items-center">
      <div className="h-1.5 w-16 border-x border-b border-[#4a6b85]" />
      <span className="mt-1 font-mono text-[9px] text-[#4a6b85]">5 m</span>
    </div>
  )
}

export function StatusStrip({ layers }) {
  const active = LAYERS.filter((layer) => layers[layer.key]).length
  return (
    <div className="flex items-center gap-4 font-mono text-[9px] uppercase tracking-[0.14em] text-[#4a6b85]">
      <span className="flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-[#8be0a0]" />
        Registered
      </span>
      <span className="h-3 w-px bg-[#1e3448]" />
      <span>{active} of 4 layers</span>
      <span className="h-3 w-px bg-[#1e3448]" />
      <span>RMS 0.021 m</span>
      <span className="ml-auto">Noryx Technologies</span>
    </div>
  )
}
