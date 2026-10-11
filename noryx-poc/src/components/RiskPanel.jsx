import { useState } from 'react'
import { UTILITY } from '../utilities'
import { activeFindings } from '../sites'
import { corridors, upgradeCase, recordSummary, TOLERANCE, SAFE_DIG_MARGIN } from '../risk'
import { QL } from '../sue'

const FINDINGS = activeFindings()

/**
 * What the survey is worth, in the two terms a buyer actually transacts in.
 *
 * Left: the trench. An unproven service has to be dug around by hand across
 * the full width of its uncertainty, and that width is the product of the
 * quality level, not of the pipe. Right: the records. The distance between
 * where the owner's drawing put a service and where it turned out to be is the
 * number that tells an authority what the rest of its drawings are worth.
 */
export default function RiskPanel({ zonesOn, setZonesOn, recordsOn, setRecordsOn, onIsolate }) {
  const [tab, setTab] = useState('corridor')
  const rows = corridors()
  const made = upgradeCase()
  const records = recordSummary(FINDINGS)

  return (
    <div className="flex flex-col">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#7f9bb1]">
          Risk and records
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#4a6b85]">
          ASCE 38-22
        </span>
      </div>

      <div className="mb-2 flex gap-1">
        {[
          ['corridor', 'Excavation'],
          ['records', 'Records vs measured'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`border px-2 py-1 text-[10px] transition-colors ${
              tab === key
                ? 'border-[#35c8dc] bg-[#16293a] text-[#35c8dc]'
                : 'border-[#16293a] text-[#7f9bb1] hover:border-[#24415a]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'corridor' ? (
        <>
          <button
            type="button"
            onClick={() => setZonesOn(!zonesOn)}
            className={`mb-2 border px-2.5 py-1.5 text-[10px] transition-colors ${
              zonesOn
                ? 'border-[#35c8dc] bg-[#16293a] text-[#35c8dc]'
                : 'border-[#24415a] text-[#7f9bb1] hover:border-[#35c8dc]'
            }`}
          >
            {zonesOn ? 'Hide uncertainty volumes' : 'Show uncertainty volumes'}
          </button>

          <div className="grid grid-cols-[1fr_auto_auto] gap-x-2 gap-y-1 font-mono text-[10px]">
            <span className="text-[#4a6b85]">Run</span>
            <span className="text-right text-[#4a6b85]">Trench</span>
            <span className="text-right text-[#4a6b85]">If QL-A</span>
            {rows.map((r) => (
              <button
                key={r.run.id}
                type="button"
                onClick={() => onIsolate?.(r.run.id)}
                className="col-span-3 grid grid-cols-[1fr_auto_auto] gap-x-2 text-left hover:bg-[#0f1f2d]"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <span
                    className="h-0.5 w-2.5 shrink-0"
                    style={{ backgroundColor: UTILITY[r.run.utility]?.color }}
                  />
                  <span className="text-[#e6f0f7]">{r.run.id}</span>
                  <span
                    className="border px-1 text-[8px]"
                    style={{ color: QL[r.level]?.color, borderColor: QL[r.level]?.color }}
                  >
                    {QL[r.level]?.label}
                  </span>
                </span>
                <span
                  className={`text-right ${r.width > 2 ? 'text-[#e24b4a]' : 'text-[#e6f0f7]'}`}
                >
                  {r.width.toFixed(2)} m
                </span>
                <span className="text-right text-[#8be0a0]">{r.ifProven.toFixed(2)} m</span>
              </button>
            ))}
          </div>

          <div className="mt-3 border-t border-[#16293a] pt-2 font-mono text-[10px]">
            <div className="flex justify-between">
              <span className="text-[#4a6b85]">Hand dig as surveyed</span>
              <span className="text-[#e24b4a]">{made.handDigArea.toFixed(0)} m²</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#4a6b85]">If every run were QL-A</span>
              <span className="text-[#8be0a0]">{made.provenArea.toFixed(0)} m²</span>
            </div>
            <div className="mt-1 flex justify-between border-t border-[#16293a] pt-1">
              <span className="text-[#7f9bb1]">Difference</span>
              <span className="text-[#e6f0f7]">{made.saving.toFixed(0)} m²</span>
            </div>
          </div>

          <p className="mt-2 text-[10px] leading-snug text-[#7f9bb1]">
            Trench width is the pipe, plus the positional tolerance its quality
            level claims either side, plus {SAFE_DIG_MARGIN * 1000} mm of working
            margin. {made.unproven} of these runs are QL-C or QL-D over{' '}
            {made.unprovenLength.toFixed(0)} m — those are the ones carrying the
            width.
          </p>
          <p className="mt-1.5 font-mono text-[9px] leading-relaxed text-[#4a6b85]">
            Area, not currency. A rate per square metre is local and dated; the
            area is ours to measure and the rate is yours to apply.
          </p>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setRecordsOn(!recordsOn)}
            className={`mb-2 border px-2.5 py-1.5 text-[10px] transition-colors ${
              recordsOn
                ? 'border-[#35c8dc] bg-[#16293a] text-[#35c8dc]'
                : 'border-[#24415a] text-[#7f9bb1] hover:border-[#35c8dc]'
            }`}
          >
            {recordsOn ? 'Hide record positions' : 'Show record positions'}
          </button>

          {records ? (
            <>
              <div className="grid grid-cols-[1fr_auto_auto] gap-x-2 gap-y-1 font-mono text-[10px]">
                <span className="text-[#4a6b85]">Run</span>
                <span className="text-right text-[#4a6b85]">Plan</span>
                <span className="text-right text-[#4a6b85]">Depth</span>
                {records.rows.map((r) => (
                  <button
                    key={r.run.id}
                    type="button"
                    onClick={() => onIsolate?.(r.run.id)}
                    className="col-span-3 grid grid-cols-[1fr_auto_auto] gap-x-2 text-left hover:bg-[#0f1f2d]"
                    title={r.source}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <span
                        className="h-0.5 w-2.5 shrink-0"
                        style={{ backgroundColor: UTILITY[r.run.utility]?.color }}
                      />
                      <span className="text-[#e6f0f7]">{r.run.id}</span>
                    </span>
                    <span
                      className={
                        r.plan > (TOLERANCE[r.run.ql]?.plan ?? 1)
                          ? 'text-right text-[#e24b4a]'
                          : 'text-right text-[#e6f0f7]'
                      }
                    >
                      {(r.plan * 1000).toFixed(0)} mm
                    </span>
                    <span className="text-right text-[#7f9bb1]">
                      {r.depth >= 0 ? '+' : ''}
                      {(r.depth * 1000).toFixed(0)} mm
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-3 border-t border-[#16293a] pt-2 font-mono text-[10px]">
                <div className="flex justify-between">
                  <span className="text-[#4a6b85]">Median plan error</span>
                  <span className="text-[#e6f0f7]">{(records.median * 1000).toFixed(0)} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4a6b85]">Worst</span>
                  <span className="text-[#e24b4a]">
                    {records.worst.run.id} · {(records.worst.plan * 1000).toFixed(0)} mm
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4a6b85]">Outside stated tolerance</span>
                  <span className={records.outside ? 'text-[#e24b4a]' : 'text-[#8be0a0]'}>
                    {records.outside} of {records.count}
                  </span>
                </div>
              </div>

              {/* The run with no record at all is the strongest single line in
                  this panel, so it is not left to be inferred from an absence. */}
              {FINDINGS.filter((f) => f.kind === 'subsurface' && !f.lateral && !f.record).map(
                (f) => (
                  <p
                    key={f.id}
                    className="mt-2 border-l-2 border-[#e24b4a] pl-2 text-[10px] leading-snug text-[#e24b4a]"
                  >
                    {f.id} {f.name} does not appear in the records at all. An
                    unrecorded duct bank is not a tolerance problem — it is a
                    service nobody knows to look for.
                  </p>
                ),
              )}

              <p className="mt-2 text-[10px] leading-snug text-[#7f9bb1]">
                The distance between a record and a measurement is what tells an
                owner what the rest of their records are worth. It is the one
                output of a survey that keeps paying after the trench is closed.
              </p>
            </>
          ) : (
            <p className="text-[10px] text-[#7f9bb1]">No records supplied for this site.</p>
          )}
        </>
      )}
    </div>
  )
}
