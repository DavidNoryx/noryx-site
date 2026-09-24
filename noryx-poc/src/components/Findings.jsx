import { SENSORS } from '../site'
import { rank, supporting, principal } from '../fusion'

function Bar({ finding, enabled }) {
  // One stacked bar showing which instrument earned which slice of the score.
  const parts = SENSORS.map((s, i) => ({
    key: s.key,
    color: s.color,
    value: enabled[s.key] ? finding.strength[i] * finding.weights[i] : 0,
  })).filter((p) => p.value > 0.001)
  const total = parts.reduce((a, p) => a + p.value, 0) || 1

  return (
    <div className="mt-2 flex h-1 w-full overflow-hidden bg-[#16293a]">
      {parts.map((p) => (
        <span
          key={p.key}
          style={{ width: `${(p.value / total) * total * 100}%`, backgroundColor: p.color }}
        />
      ))}
    </div>
  )
}

export default function Findings({ findings, enabled, threshold, selected, onSelect }) {
  const ranked = rank(findings, enabled, threshold)

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2.5 flex items-baseline justify-between">
        <h2 className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#4a6b85]">
          Candidates
        </h2>
        <span className="font-mono text-[9px] text-[#35c8dc]">{ranked.length} above threshold</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto">
        {ranked.length === 0 && (
          <p className="border border-[#16293a] px-3 py-4 text-center text-[11px] text-[#4a6b85]">
            Nothing clears this threshold. Lower it, or switch a sensor back on.
          </p>
        )}

        {ranked.map(({ finding, value }) => {
          const lead = principal(finding, enabled)
          const backers = supporting(finding, enabled)
          const isOpen = selected === finding.id

          return (
            <button
              key={finding.id}
              type="button"
              onClick={() => onSelect(isOpen ? null : finding.id)}
              className={`border px-3 py-2.5 text-left transition-colors ${
                isOpen
                  ? 'border-[#24415a] bg-[#16293a]'
                  : 'border-[#16293a] hover:border-[#24415a] hover:bg-[#0f1e2c]'
              }`}
            >
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-[10px] text-[#4a6b85]">{finding.id}</span>
                <strong className="flex-1 text-[13px] font-medium text-[#e6f0f7]">
                  {finding.name}
                </strong>
                <span className="font-mono text-[12px] text-[#35c8dc]">
                  {Math.round(value * 100)}%
                </span>
              </div>

              <Bar finding={finding} enabled={enabled} />

              <div className="mt-1.5 flex items-center gap-1.5">
                {backers.length ? (
                  backers.map((s) => (
                    <span
                      key={s.key}
                      className="font-mono text-[9px] uppercase tracking-[0.1em]"
                      style={{ color: s.color }}
                    >
                      {s.label}
                    </span>
                  ))
                ) : (
                  <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#4a6b85]">
                    Weak support
                  </span>
                )}
              </div>

              {isOpen && (
                <div className="mt-2.5 border-t border-[#24415a] pt-2.5">
                  <p className="text-[11px] leading-relaxed text-[#7f9bb1]">{finding.text}</p>

                  <dl className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-2">
                    {finding.depth > 0 && (
                      <div>
                        <dt className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#4a6b85]">
                          Depth
                        </dt>
                        <dd className="font-mono text-[12px] text-[#e6f0f7]">
                          {finding.depth.toFixed(2)} m
                        </dd>
                      </div>
                    )}
                    {finding.diameter && (
                      <div>
                        <dt className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#4a6b85]">
                          Diameter
                        </dt>
                        <dd className="font-mono text-[12px] text-[#e6f0f7]">{finding.diameter}</dd>
                      </div>
                    )}
                    {lead && (
                      <div>
                        <dt className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#4a6b85]">
                          Carried by
                        </dt>
                        <dd className="font-mono text-[12px]" style={{ color: lead.color }}>
                          {lead.label}
                        </dd>
                      </div>
                    )}
                  </dl>

                  <p className="mt-2.5 border-l border-[#35c8dc] pl-2 text-[11px] text-[#35c8dc]">
                    {finding.next}
                  </p>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
