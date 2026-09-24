// A modelled GPR B-scan.
//
// The hyperbola is not drawn by hand. A buried cylinder returns energy to an
// antenna at horizontal offset x after a two-way travel time
//
//     t(x) = (2 / v) * sqrt(d^2 + (x - x0)^2)
//
// with v = c / sqrt(eps_r) the wave velocity in the host medium. That equation
// is the whole reason a pipe looks like a hyperbola on a radargram, and it is
// what produces the curve below. Only the target is invented; the shape of its
// signature is physics.

const C = 0.2998 // m/ns, speed of light in vacuum

// Ricker wavelet — the standard model of the pulse a GPR antenna emits.
function ricker(t, fc) {
  const a = Math.PI * fc * t
  const a2 = a * a
  return (1 - 2 * a2) * Math.exp(-a2)
}

// Deterministic noise so the image is identical on every render.
function hash(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}

/**
 * Draws a B-scan into a canvas.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} opts
 *   width/height  canvas size in px
 *   span          horizontal distance covered, metres
 *   maxDepth      vertical extent, metres
 *   epsR          relative permittivity of the host medium
 *   fc            centre frequency, MHz
 *   targets       [{ x0, depth, amp }] buried cylinders
 *   reveal        0..1, how much of the scan has been acquired
 */
export function drawRadargram(ctx, opts) {
  const {
    width,
    height,
    span = 12,
    maxDepth = 3.2,
    epsR = 9,
    fc = 400,
    targets = [],
    reveal = 1,
  } = opts

  const v = C / Math.sqrt(epsR) // m/ns
  const tMax = (2 * maxDepth) / v // ns for the deepest sample
  const fcGHz = fc / 1000

  const img = ctx.createImageData(width, height)
  const cut = Math.floor(width * Math.max(0, Math.min(1, reveal)))

  for (let px = 0; px < width; px += 1) {
    const x = (px / width) * span

    for (let py = 0; py < height; py += 1) {
      const t = (py / height) * tMax
      let amp = 0

      // Direct wave: the pulse the antenna hears from itself, always there,
      // always saturating the top of the record.
      amp += 1.6 * ricker(t - 2.2, fcGHz) + 1.1 * ricker(t - 4.4, fcGHz)

      // Layered clutter, attenuating with depth.
      const att = Math.exp(-t / 34)
      // Clutter: a little layering, mostly incoherent scatter.
      amp += att * 0.22 * Math.sin(t * 0.7 + x * 2.3 + hash(px, 7) * 3) 
      amp += att * 1.35 * (hash(px, py) - 0.5)
      amp += att * 0.55 * (hash(px * 3.1, py * 1.7) - 0.5)

      // Target returns.
      for (const target of targets) {
        const dx = x - target.x0
        const tt = (2 / v) * Math.sqrt(target.depth * target.depth + dx * dx)
        const spread = 1 / (1 + (dx * dx) / 2.6) // energy falls off along the limbs
        amp += (target.amp ?? 1) * 3.1 * spread * Math.exp(-tt / 40) * ricker(t - tt, fcGHz)
      }

      // Two-tone, the way field software renders it.
      const value = amp > 0.06 ? 255 : amp < -0.06 ? 0 : amp > 0 ? 200 : 40
      const i = (py * width + px) * 4
      const acquired = px < cut
      img.data[i] = img.data[i + 1] = img.data[i + 2] = acquired ? value : 0
      img.data[i + 3] = 255
    }
  }

  ctx.putImageData(img, 0, 0)
}

/** Depth of a target given the apex travel time, for the axis labels. */
export function depthFromTime(tNs, epsR = 9) {
  return (tNs * (C / Math.sqrt(epsR))) / 2
}
