// The real NORYX mark, lifted from the supplied lockup with an alpha channel
// so it sits on the dark theme. The wordmark is set in type rather than taken
// from the raster, because the supplied one is navy on white and would vanish
// here — the letterforms are matched, the colour is not.

export function Mark({ size = 34 }) {
  return (
    <img
      src="/brand/noryx-mark.png"
      alt=""
      width={size}
      height={Math.round(size * 1.25)}
      style={{ display: 'block' }}
    />
  )
}

export default function Logo({ size = 34, tagline = true }) {
  return (
    <div className="flex items-center gap-3">
      <Mark size={size} />
      <div className="leading-tight">
        <div
          className="font-semibold text-[#e6f0f7]"
          style={{ fontSize: size * 0.56, letterSpacing: size * 0.09 }}
        >
          NORYX
        </div>
        {tagline && (
          <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#4a6b85]">
            Subsurface intelligence
          </div>
        )}
      </div>
    </div>
  )
}
