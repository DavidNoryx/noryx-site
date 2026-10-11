import { useRef, useState } from 'react'
import { parseTerrainFile, toAsc, describe, toDtm } from '../terrain'
import { activeSite } from '../sites'

const SITE = activeSite()

/**
 * Ground surface in and out.
 *
 * Three doors in — a surveyor's grid, a point list, or the capture itself —
 * and one door out, because a model nobody can get data back out of is a model
 * nobody will put data into.
 */
export default function TerrainPanel({ terrainApi }) {
  const fileRef = useRef(null)
  const [grid, setGrid] = useState(null)
  const [info, setInfo] = useState(null)
  const [source, setSource] = useState(null)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  const [exaggeration, setExaggeration] = useState(1)
  const [visible, setVisible] = useState(true)

  const [raw, setRaw] = useState(null)

  const present = (g, label, keepRaw = true) => {
    const stats = terrainApi.current?.show(g, { exaggeration })
    setGrid(g)
    if (keepRaw) setRaw(g)
    setSource(label)
    setInfo(stats ?? describe(g))
    setError(null)
  }

  /**
   * Strip the buildings and the parked cars off, or put them back.
   *
   * Two surfaces, one source. Which one is on screen has to be unmistakable,
   * because a depth measured off a roof is not a depth.
   */
  const onGroundFilter = async () => {
    if (!raw) return
    if (grid?.kind === 'DTM') {
      present(raw, source, false)
      return
    }
    setBusy('Classifying ground')
    await new Promise((r) => setTimeout(r, 30))
    try {
      present(toDtm(raw), source, false)
    } catch (err) {
      setError(err.message ?? 'Could not classify')
    } finally {
      setBusy(null)
    }
  }

  const onFile = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setBusy('Reading')
    setError(null)
    try {
      const g = await parseTerrainFile(file)
      present(g, file.name)
    } catch (err) {
      setError(err.message ?? 'Could not read that file')
      setGrid(null)
      setInfo(null)
    } finally {
      setBusy(null)
      event.target.value = ''
    }
  }

  const onDerive = async () => {
    if (!terrainApi.current?.hasCapture()) {
      setError('The capture has not finished loading yet')
      return
    }
    setBusy('Sampling the capture')
    setError(null)
    // Let the button repaint before the raycasting locks the frame.
    await new Promise((r) => setTimeout(r, 30))
    try {
      const g = terrainApi.current.derive(1)
      if (!g) throw new Error('Nothing to sample')
      present(g, 'Derived from the capture')
    } catch (err) {
      setError(err.message ?? 'Could not sample the capture')
    } finally {
      setBusy(null)
    }
  }

  const onDownload = () => {
    if (!grid) return
    const text = toAsc(grid, { crs: SITE.crs ?? null })
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${SITE.id}-terrain-${grid.cell}m.asc`
    a.click()
    URL.revokeObjectURL(url)
  }

  const reExaggerate = (value) => {
    setExaggeration(value)
    if (grid) terrainApi.current?.show(grid, { exaggeration: value })
  }

  const toggle = () => {
    const next = !visible
    setVisible(next)
    terrainApi.current?.setVisible(next)
  }

  const clear = () => {
    terrainApi.current?.clear()
    setGrid(null)
    setInfo(null)
    setSource(null)
    setError(null)
  }

  return (
    <div className="flex flex-col">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#7f9bb1]">
          Ground surface
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#4a6b85]">
          DTM / DSM
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={Boolean(busy)}
          className="border border-[#24415a] px-2.5 py-1.5 text-[10px] text-[#e6f0f7] transition-colors hover:border-[#35c8dc] disabled:opacity-40"
        >
          Import a surface
        </button>
        <button
          type="button"
          onClick={onDerive}
          disabled={Boolean(busy)}
          title="Cast rays down onto the capture and build a grid from what they hit"
          className="border border-[#24415a] px-2.5 py-1.5 text-[10px] text-[#e6f0f7] transition-colors hover:border-[#35c8dc] disabled:opacity-40"
        >
          Derive from capture
        </button>
        {grid && (
          <>
            <button
              type="button"
              onClick={onGroundFilter}
              disabled={Boolean(busy)}
              title="Remove buildings, vehicles and canopy to leave bare earth"
              className={`border px-2.5 py-1.5 text-[10px] transition-colors disabled:opacity-40 ${
                grid.kind === 'DTM'
                  ? 'border-[#8be0a0] bg-[#16293a] text-[#8be0a0]'
                  : 'border-[#24415a] text-[#7f9bb1] hover:border-[#8be0a0]'
              }`}
            >
              {grid.kind === 'DTM' ? 'Ground only' : 'Filter to ground'}
            </button>
            <button
              type="button"
              onClick={onDownload}
              className="border border-[#35c8dc] px-2.5 py-1.5 text-[10px] text-[#35c8dc] transition-colors hover:bg-[#16293a]"
            >
              Download .asc
            </button>
            <button
              type="button"
              onClick={toggle}
              className="border border-[#24415a] px-2.5 py-1.5 text-[10px] text-[#7f9bb1] transition-colors hover:border-[#35c8dc]"
            >
              {visible ? 'Hide' : 'Show'}
            </button>
            <button
              type="button"
              onClick={clear}
              className="border border-[#24415a] px-2.5 py-1.5 text-[10px] text-[#7f9bb1] transition-colors hover:border-[#e24b4a] hover:text-[#e24b4a]"
            >
              Clear
            </button>
          </>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".asc,.txt,.tif,.tiff,.xyz,.csv"
        onChange={onFile}
        className="hidden"
      />

      <p className="mt-1.5 font-mono text-[9px] leading-relaxed text-[#4a6b85]">
        ESRI ASCII Grid · GeoTIFF · XYZ / CSV
      </p>

      {busy && (
        <p className="mt-2 font-mono text-[10px] text-[#35c8dc]">{busy}…</p>
      )}

      {error && (
        <p className="mt-2 border-l-2 border-[#e24b4a] pl-2 text-[11px] leading-snug text-[#e24b4a]">
          {error}
        </p>
      )}

      {info && (
        <>
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[10px]">
            <span className="text-[#4a6b85]">Source</span>
            <span className="truncate text-[#e6f0f7]" title={source}>{source}</span>
            <span className="text-[#4a6b85]">Extent</span>
            <span className="text-[#e6f0f7]">
              {info.extent[0].toFixed(0)} × {info.extent[1].toFixed(0)} m
            </span>
            <span className="text-[#4a6b85]">Cells</span>
            <span className="text-[#e6f0f7]">{info.cells.toLocaleString()}</span>
            <span className="text-[#4a6b85]">Coverage</span>
            <span className={info.coverage < 0.9 ? 'text-[#ffb164]' : 'text-[#e6f0f7]'}>
              {(info.coverage * 100).toFixed(0)}%
            </span>
            <span className="text-[#4a6b85]">Height</span>
            <span className="text-[#e6f0f7]">
              {info.min.toFixed(2)} … {info.max.toFixed(2)} m
            </span>
            <span className="text-[#4a6b85]">Relief</span>
            <span className="text-[#e6f0f7]">{(info.max - info.min).toFixed(2)} m</span>
            <span className="text-[#4a6b85]">Model</span>
            <span className={grid?.kind === 'DTM' ? 'text-[#8be0a0]' : 'text-[#ffb164]'}>
              {grid?.kind === 'DTM' ? 'DTM · bare earth' : 'DSM · includes objects'}
            </span>
          </div>

          {grid?.kind === 'DTM' && (
            <p className="mt-2 border-l-2 border-[#8be0a0] pl-2 text-[10px] leading-snug text-[#7f9bb1]">
              {(grid.removed * 100).toFixed(0)}% of cells classified as not
              ground and replaced. Under a continuous building there is no
              ground measurement at all — what you see there is the surrounding
              level carried inward.
            </p>
          )}

          {/* Vertical exaggeration is a reading aid. It must be obvious that it
              is on, or somebody will measure a slope off an exaggerated view. */}
          <div className="mt-3">
            <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.12em] text-[#4a6b85]">
              <span>Vertical exaggeration</span>
              <span className={exaggeration === 1 ? 'text-[#4a6b85]' : 'text-[#ffb164]'}>
                × {exaggeration.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="0.5"
              value={exaggeration}
              onChange={(e) => reExaggerate(Number(e.target.value))}
              className="mt-1 w-full accent-[#35c8dc]"
            />
            {exaggeration !== 1 && (
              <p className="mt-1 text-[10px] leading-snug text-[#ffb164]">
                Heights are stretched for viewing. Do not read a gradient off this.
              </p>
            )}
          </div>

          {info.shifted && (
            <p className="mt-3 border-l-2 border-[#ffb164] pl-2 text-[10px] leading-snug text-[#ffb164]">
              Moved to the site. The grid is centred on{' '}
              {info.from[0].toFixed(0)}, {info.from[1].toFixed(0)} — a projected
              coordinate, not the capture's local metres. Nothing was rescaled,
              only translated.
            </p>
          )}

          {/* Only while the surface model is the one on screen. Once it has
              been filtered this sentence is false, and a caveat that contradicts
              the panel above it costs more credibility than it buys. */}
          {source === 'Derived from the capture' && grid?.kind !== 'DTM' && (
            <p className="mt-3 border-l-2 border-[#24415a] pl-2 text-[10px] leading-snug text-[#7f9bb1]">
              This is a surface model, not bare earth. An aerial mesh drapes over
              parked cars, trees and roofs, so they are in it. Use it for a datum
              and a slope, not for earthworks volumes.
            </p>
          )}
        </>
      )}
    </div>
  )
}
