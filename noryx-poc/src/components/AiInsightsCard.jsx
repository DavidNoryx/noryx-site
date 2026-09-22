const DEFAULT_FINDING = {
  label: 'Ductile iron main',
  depth: -1.4,
  diameter: '250 mm',
  confidence: 0.94,
}

export default function AiInsightsCard({ finding, gprActive }) {
  const item = finding ?? DEFAULT_FINDING
  const confidence = Math.round(item.confidence * 100)

  return (
    <div className="pointer-events-auto w-[300px] border border-[#24415a] bg-[#0b1622]/92 shadow-[0_20px_50px_rgba(0,0,0,0.55)] backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[#16293a] px-3.5 py-2.5">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#35c8dc] opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-[#35c8dc]" />
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#7f9bb1]">
          AI Insights
        </span>
        <span className="ml-auto font-mono text-[9px] text-[#4a6b85]">v4 · live</span>
      </div>

      {gprActive ? (
        <div className="px-3.5 py-3">
          <div className="flex items-baseline gap-2">
            <h3 className="text-[15px] font-semibold tracking-tight text-[#e6f0f7]">Found pipe</h3>
            <span className="font-mono text-[10px] text-[#f2a33c]">{item.label}</span>
          </div>

          <p className="mt-1.5 text-[11px] leading-relaxed text-[#7f9bb1]">
            Continuous hyperbolic response across 14 GPR passes, cross-checked against the
            magnetometer gradient. Not present in the as-built set.
          </p>

          {/* Measurements */}
          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-[#16293a] pt-3">
            <div>
              <dt className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#4a6b85]">
                Depth
              </dt>
              <dd className="font-mono text-[13px] text-[#e6f0f7]">
                {Math.abs(item.depth).toFixed(2)} m
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#4a6b85]">
                Diameter
              </dt>
              <dd className="font-mono text-[13px] text-[#e6f0f7]">{item.diameter}</dd>
            </div>
          </dl>

          {/* Confidence */}
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#4a6b85]">
                Confidence
              </span>
              <span className="font-mono text-[11px] text-[#35c8dc]">{confidence}%</span>
            </div>
            <div className="mt-1.5 h-1 w-full bg-[#16293a]">
              <div
                className="h-full bg-[#35c8dc] transition-[width] duration-500"
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>

          <p className="mt-3 border-t border-[#16293a] pt-2.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[#4a6b85]">
            Click any run in the model to inspect
          </p>
        </div>
      ) : (
        <div className="px-3.5 py-5 text-center">
          <p className="text-[12px] text-[#7f9bb1]">GPR layer is off.</p>
          <p className="mt-1 text-[11px] text-[#4a6b85]">
            Enable it to surface buried findings.
          </p>
        </div>
      )}
    </div>
  )
}
