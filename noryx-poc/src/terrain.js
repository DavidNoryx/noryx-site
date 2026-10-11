import * as THREE from 'three'
import { activeSite } from './sites'

/**
 * Ground surface: reading one in, deriving one from the capture, writing one out.
 *
 * A utility model without a terrain is a model with no datum. Depth has to be
 * measured from something, and "the ground" is only a number once somebody
 * fixes what the ground is. Three ways in and one way out:
 *
 *   - ESRI ASCII Grid (.asc / .txt) — plain text, parsed here
 *   - XYZ point lists (.xyz / .csv)  — plain text, gridded here
 *   - GeoTIFF (.tif / .tiff)         — loaded on demand, it is a heavy library
 *     and most sessions never open one
 *
 * Out is always ASCII Grid, because it is the format every GIS and every
 * surveyor can open without asking what it is.
 */

const SITE = activeSite()

/** The grid everything in this module passes around. */
function makeGrid({ ncols, nrows, xll, yll, cell, nodata, values, crs }) {
  return { ncols, nrows, xll, yll, cell, nodata: nodata ?? -9999, values, crs: crs ?? null }
}

/* ------------------------------------------------------------------ parse */

/**
 * ESRI ASCII Grid.
 *
 * Six header lines then the cells, written north row first — which is the
 * opposite of the order a plotter wants, and the single most common reason an
 * imported terrain comes out mirrored.
 */
export function parseAsc(text) {
  const tokens = text.trim().split(/\s+/)
  const head = {}
  let i = 0
  while (i < tokens.length - 1) {
    const key = tokens[i].toLowerCase()
    if (!/^(ncols|nrows|xllcorner|yllcorner|xllcenter|yllcenter|cellsize|nodata_value)$/.test(key)) break
    head[key] = Number(tokens[i + 1])
    i += 2
  }
  if (!head.ncols || !head.nrows || !head.cellsize) {
    throw new Error('Not an ESRI ASCII Grid: missing ncols, nrows or cellsize')
  }

  const ncols = head.ncols
  const nrows = head.nrows
  const cell = head.cellsize
  // A grid given by cell centres has its corner half a cell further out.
  const xll = head.xllcorner ?? (head.xllcenter ?? 0) - cell / 2
  const yll = head.yllcorner ?? (head.yllcenter ?? 0) - cell / 2
  const nodata = head.nodata_value ?? -9999

  const values = new Float32Array(ncols * nrows)
  for (let r = 0; r < nrows; r += 1) {
    for (let c = 0; c < ncols; c += 1) {
      const v = Number(tokens[i])
      i += 1
      // Store south-row-first so row 0 is the bottom, which is how the rest of
      // this file and three.js both think about it.
      values[(nrows - 1 - r) * ncols + c] = v
    }
  }
  return makeGrid({ ncols, nrows, xll, yll, cell, nodata, values })
}

/** Loose XYZ or CSV point list, gridded onto a regular mesh by nearest cell. */
export function parseXyz(text, cellHint = 1) {
  const pts = []
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim()
    if (!t || /[a-df-zA-DF-Z]/.test(t[0])) continue // skip headers
    const p = t.split(/[\s,;]+/).map(Number)
    if (p.length >= 3 && p.every(Number.isFinite)) pts.push(p)
  }
  if (pts.length < 4) throw new Error('Fewer than four usable points in the file')

  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  // Guess the spacing from the data rather than trusting the hint, so a 0.5 m
  // survey does not get flattened onto a 1 m grid.
  const span = Math.max(maxX - minX, maxY - minY)
  const cell = Math.max(cellHint, span / Math.sqrt(pts.length * 2))

  const ncols = Math.max(2, Math.ceil((maxX - minX) / cell) + 1)
  const nrows = Math.max(2, Math.ceil((maxY - minY) / cell) + 1)
  const sum = new Float64Array(ncols * nrows)
  const count = new Uint32Array(ncols * nrows)
  for (const [x, y, z] of pts) {
    const c = Math.min(ncols - 1, Math.round((x - minX) / cell))
    const r = Math.min(nrows - 1, Math.round((y - minY) / cell))
    sum[r * ncols + c] += z
    count[r * ncols + c] += 1
  }
  const values = new Float32Array(ncols * nrows)
  for (let k = 0; k < values.length; k += 1) {
    values[k] = count[k] ? sum[k] / count[k] : -9999
  }
  return makeGrid({ ncols, nrows, xll: minX, yll: minY, cell, nodata: -9999, values })
}

/**
 * GeoTIFF. The library is large and most sessions never open one, so it is
 * fetched only when a .tif actually arrives.
 */
export async function parseGeoTiff(arrayBuffer) {
  const { fromArrayBuffer } = await import('geotiff')
  const tiff = await fromArrayBuffer(arrayBuffer)
  const image = await tiff.getImage()
  const ncols = image.getWidth()
  const nrows = image.getHeight()
  const [sx, sy] = image.getResolution() // sy is negative for north-up images
  const [ox, oy] = image.getOrigin()
  const cell = Math.abs(sx)
  const raster = (await image.readRasters({ interleave: false }))[0]

  const nodata = Number(image.getGDALNoData?.() ?? -9999)
  const values = new Float32Array(ncols * nrows)
  const northUp = sy < 0
  for (let r = 0; r < nrows; r += 1) {
    const src = r * ncols
    // A north-up raster stores the top row first; flip it so row 0 is south.
    const dst = (northUp ? nrows - 1 - r : r) * ncols
    for (let c = 0; c < ncols; c += 1) values[dst + c] = raster[src + c]
  }

  const yll = northUp ? oy - nrows * cell : oy
  return makeGrid({
    ncols,
    nrows,
    xll: ox,
    yll,
    cell,
    nodata,
    values,
    crs: image.geoKeys?.ProjectedCSTypeGeoKey
      ? `EPSG:${image.geoKeys.ProjectedCSTypeGeoKey}`
      : null,
  })
}

/** Dispatch on the file name. */
export async function parseTerrainFile(file) {
  const name = file.name.toLowerCase()
  if (name.endsWith('.tif') || name.endsWith('.tiff')) {
    return parseGeoTiff(await file.arrayBuffer())
  }
  const text = await file.text()
  if (name.endsWith('.xyz') || name.endsWith('.csv')) return parseXyz(text)
  return parseAsc(text)
}

/* ----------------------------------------------------------------- derive */

/**
 * Derive a ground model from the capture itself.
 *
 * This is the one most sites will actually use, because the photogrammetry is
 * already there and nobody has a survey. Sample on a regular grid by casting
 * down onto the mesh.
 *
 * What comes out is a DSM, not a DTM: an aerial mesh drapes over cars, trees
 * and roofs, so the surface includes them. Taking the lowest of several rays
 * per cell knocks the worst of it off, and the difference is named rather than
 * hidden — calling this a bare-earth model would be a lie a surveyor spots in
 * one glance.
 */
export function deriveFromMesh(object, { centre, halfWidth, cell = 1 }) {
  const ray = new THREE.Raycaster()
  const down = new THREE.Vector3(0, -1, 0)
  const ring = [[0, 0], [0.3, 0.3], [-0.3, 0.3], [0.3, -0.3], [-0.3, -0.3]]

  const xll = centre[0] - halfWidth
  const yll = centre[1] - halfWidth
  const n = Math.max(2, Math.round((halfWidth * 2) / cell) + 1)
  const values = new Float32Array(n * n)
  let hits = 0

  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) {
      const x = xll + c * cell
      const z = yll + r * cell
      let lowest = null
      for (const [dx, dz] of ring) {
        ray.set(new THREE.Vector3(x + dx, 200, z + dz), down)
        const hit = ray.intersectObject(object, true)[0]
        if (hit && (lowest === null || hit.point.y < lowest)) lowest = hit.point.y
      }
      if (lowest === null) {
        values[r * n + c] = -9999
      } else {
        values[r * n + c] = lowest
        hits += 1
      }
    }
  }
  const grid = makeGrid({ ncols: n, nrows: n, xll, yll, cell, nodata: -9999, values })
  grid.coverage = hits / (n * n)
  grid.kind = 'DSM'
  return grid
}

/* ------------------------------------------------------------ classify */

/** Minimum over a square window — the erosion half of a morphological opening. */
function erode(src, ncols, nrows, half, nodata) {
  const out = new Float32Array(src.length)
  for (let r = 0; r < nrows; r += 1) {
    for (let c = 0; c < ncols; c += 1) {
      let m = Infinity
      for (let dr = -half; dr <= half; dr += 1) {
        const rr = r + dr
        if (rr < 0 || rr >= nrows) continue
        for (let dc = -half; dc <= half; dc += 1) {
          const cc = c + dc
          if (cc < 0 || cc >= ncols) continue
          const v = src[rr * ncols + cc]
          if (v !== nodata && Number.isFinite(v) && v < m) m = v
        }
      }
      out[r * ncols + c] = m === Infinity ? nodata : m
    }
  }
  return out
}

/** Maximum over a square window — the dilation half. */
function dilate(src, ncols, nrows, half, nodata) {
  const out = new Float32Array(src.length)
  for (let r = 0; r < nrows; r += 1) {
    for (let c = 0; c < ncols; c += 1) {
      let m = -Infinity
      for (let dr = -half; dr <= half; dr += 1) {
        const rr = r + dr
        if (rr < 0 || rr >= nrows) continue
        for (let dc = -half; dc <= half; dc += 1) {
          const cc = c + dc
          if (cc < 0 || cc >= ncols) continue
          const v = src[rr * ncols + cc]
          if (v !== nodata && Number.isFinite(v) && v > m) m = v
        }
      }
      out[r * ncols + c] = m === -Infinity ? nodata : m
    }
  }
  return out
}

/**
 * Surface model to ground model.
 *
 * A progressive morphological filter, after Zhang et al. (2003), simplified to
 * what a square grid needs. Open the surface with a window, and anything
 * standing more than a threshold above the opened result is not ground. Repeat
 * with larger windows and looser thresholds, so a kerb survives the first pass
 * and a building does not survive the last.
 *
 * The window has to grow past the largest thing you want removed: a 19 m block
 * is not removable with a 5 m window, because the whole window sits on the
 * roof and the roof becomes the ground.
 *
 * This is an approximation and it is labelled as one. Under a continuous
 * building there is no ground measurement at all — what comes out is the
 * surrounding ground carried inward, which is a guess, however reasonable.
 */
export function toDtm(grid, { slope = 0.12, cap = 2.5 } = {}) {
  const { ncols, nrows, cell, nodata } = grid
  let ground = Float32Array.from(grid.values)
  const isGround = new Uint8Array(ground.length).fill(1)

  // Windows in cells, growing until one is wider than the widest structure.
  const maxHalf = Math.max(4, Math.ceil(30 / cell))
  for (let half = 1; half <= maxHalf; half = Math.min(maxHalf, Math.ceil(half * 2.2))) {
    const opened = dilate(erode(ground, ncols, nrows, half, nodata), ncols, nrows, half, nodata)
    // Threshold grows with the window, because a wider window legitimately
    // spans more real terrain relief. Capped so a hillside is not eaten.
    const limit = Math.min(cap, slope * half * cell * 2 + 0.3)
    for (let k = 0; k < ground.length; k += 1) {
      const v = ground[k]
      const o = opened[k]
      if (v === nodata || o === nodata) continue
      if (v - o > limit) {
        isGround[k] = 0
        ground[k] = o
      }
    }
    if (half >= maxHalf) break
  }

  let removed = 0
  for (const g of isGround) if (!g) removed += 1

  const out = makeGrid({ ...grid, values: ground })
  out.kind = 'DTM'
  out.removed = removed / ground.length
  out.derivedFrom = grid.kind ?? 'DSM'
  return out
}

/* ----------------------------------------------------------------- export */

/** Write an ESRI ASCII Grid. North row first, as the format requires. */
export function toAsc(grid, { crs } = {}) {
  const lines = [
    `ncols         ${grid.ncols}`,
    `nrows         ${grid.nrows}`,
    `xllcorner     ${grid.xll}`,
    `yllcorner     ${grid.yll}`,
    `cellsize      ${grid.cell}`,
    `NODATA_value  ${grid.nodata}`,
  ]
  for (let r = grid.nrows - 1; r >= 0; r -= 1) {
    const row = new Array(grid.ncols)
    for (let c = 0; c < grid.ncols; c += 1) {
      const v = grid.values[r * grid.ncols + c]
      row[c] = v === grid.nodata ? String(grid.nodata) : v.toFixed(3)
    }
    lines.push(row.join(' '))
  }
  // A .prj beside the grid is what stops the next person guessing the datum,
  // so the chosen CRS is at least recorded in a comment the reader can see.
  if (crs) lines.push(`# CRS ${crs}`)
  return `${lines.join('\n')}\n`
}

/* ---------------------------------------------------------------- profile */

/** Bilinear height at a point in the grid's own coordinates. */
export function heightAt(grid, x, y) {
  const gx = (x - grid.xll) / grid.cell
  const gy = (y - grid.yll) / grid.cell
  if (gx < 0 || gy < 0 || gx > grid.ncols - 1 || gy > grid.nrows - 1) return null
  const c0 = Math.floor(gx)
  const r0 = Math.floor(gy)
  const c1 = Math.min(grid.ncols - 1, c0 + 1)
  const r1 = Math.min(grid.nrows - 1, r0 + 1)
  const tx = gx - c0
  const ty = gy - r0
  const v = (r, c) => {
    const h = grid.values[r * grid.ncols + c]
    return h === grid.nodata || !Number.isFinite(h) ? null : h
  }
  const a = v(r0, c0)
  const b = v(r0, c1)
  const c = v(r1, c0)
  const d = v(r1, c1)
  if (a === null || b === null || c === null || d === null) return null
  return a * (1 - tx) * (1 - ty) + b * tx * (1 - ty) + c * (1 - tx) * ty + d * tx * ty
}

/**
 * Ground level at every station along a polyline.
 *
 * `offset` is the same registration shift the mesh was drawn with, so a profile
 * taken through an imported survey lands on the same ground the viewer sees.
 */
export function sampleAlong(grid, path, samples = 120, offset = [0, 0]) {
  const out = []
  for (let i = 0; i < samples; i += 1) {
    const f = samples === 1 ? 0 : i / (samples - 1)
    const t = f * (path.length - 1)
    const k = Math.min(path.length - 2, Math.floor(t))
    const r = t - k
    const x = path[k][0] + (path[k + 1][0] - path[k][0]) * r
    const z = path[k][1] + (path[k + 1][1] - path[k][1]) * r
    out.push({ f, x, z, y: heightAt(grid, x - offset[0], z - offset[1]) })
  }
  return out
}

/* ------------------------------------------------------------------- mesh */

/** Statistics a reader needs before trusting a surface. */
export function describe(grid) {
  let min = Infinity
  let max = -Infinity
  let sum = 0
  let n = 0
  for (const v of grid.values) {
    if (v === grid.nodata || !Number.isFinite(v)) continue
    if (v < min) min = v
    if (v > max) max = v
    sum += v
    n += 1
  }
  return {
    cells: grid.ncols * grid.nrows,
    filled: n,
    coverage: n / (grid.ncols * grid.nrows),
    min: n ? min : 0,
    max: n ? max : 0,
    mean: n ? sum / n : 0,
    extent: [grid.ncols * grid.cell, grid.nrows * grid.cell],
  }
}

/**
 * Build a surface.
 *
 * `offset` moves the grid's own coordinates into the scene's local frame. A
 * terrain imported in ITM carries six-figure eastings, and dropping those into
 * a scene built around the origin puts the ground two hundred kilometres away
 * — which renders as nothing at all and reads as a broken import.
 */
export function gridToMesh(grid, { offset = [0, 0], exaggeration = 1, color = 0x6f8fa6 } = {}) {
  const { ncols, nrows, cell } = grid
  const geo = new THREE.PlaneGeometry(
    (ncols - 1) * cell,
    (nrows - 1) * cell,
    ncols - 1,
    nrows - 1,
  )
  geo.rotateX(-Math.PI / 2)

  const pos = geo.attributes.position
  const stats = describe(grid)
  for (let r = 0; r < nrows; r += 1) {
    for (let c = 0; c < ncols; c += 1) {
      // PlaneGeometry lays vertices out first row at -Z; our row 0 is south.
      const vi = (nrows - 1 - r) * ncols + c
      const v = grid.values[r * ncols + c]
      const h = v === grid.nodata || !Number.isFinite(v) ? stats.mean : v
      pos.setY(vi, h * exaggeration)
    }
  }
  pos.needsUpdate = true
  geo.computeVertexNormals()

  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshLambertMaterial({
      color,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      wireframe: false,
    }),
  )
  mesh.position.set(
    grid.xll + ((ncols - 1) * cell) / 2 + offset[0],
    0,
    grid.yll + ((nrows - 1) * cell) / 2 + offset[1],
  )
  mesh.name = 'Terrain'
  return mesh
}

/**
 * Where a grid should sit in the scene.
 *
 * An imported survey is almost never in the capture's local metres. If the
 * grid's origin is far from the scene origin, assume it is in a projected CRS
 * and shift it so its centre lands on the site focus — and say so, rather than
 * silently moving somebody's survey.
 */
export function registration(grid) {
  const cx = grid.xll + (grid.ncols * grid.cell) / 2
  const cy = grid.yll + (grid.nrows * grid.cell) / 2
  const far = Math.hypot(cx, cy) > 1000
  if (!far) return { offset: [0, 0], shifted: false, from: [cx, cy] }
  const focus = SITE.focus?.at ?? [0, 0]
  return { offset: [focus[0] - cx, focus[1] - cy], shifted: true, from: [cx, cy] }
}
