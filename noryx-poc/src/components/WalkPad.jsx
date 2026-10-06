import { useEffect, useRef } from 'react'

// Movement for a device with no keyboard.
//
// Looking already works on touch — the walker listens to pointer events, and a
// drag is a drag whether it came from a mouse or a thumb. What is missing is
// WASD, so this is a four-way pad: press and hold to move, release to stop.
// It sits bottom-right so a right thumb reaches it while the left one looks.

const DIRS = [
  { key: 'fwd', label: '▲', x: 0, z: 1, pos: 'left-[52px] top-0' },
  { key: 'left', label: '◀', x: -1, z: 0, pos: 'left-0 top-[52px]' },
  { key: 'right', label: '▶', x: 1, z: 0, pos: 'left-[104px] top-[52px]' },
  { key: 'back', label: '▼', x: 0, z: -1, pos: 'left-[52px] top-[104px]' },
]

export default function WalkPad({ walkApi, visible }) {
  const held = useRef(new Set())

  // Release everything if the pad is dismissed mid-press, or the walker keeps
  // moving with nothing on screen to stop it.
  useEffect(() => {
    if (!visible) {
      held.current.clear()
      walkApi.current?.setPad?.(0, 0)
    }
  }, [visible, walkApi])

  if (!visible) return null

  const apply = () => {
    let x = 0
    let z = 0
    for (const dir of DIRS) {
      if (held.current.has(dir.key)) {
        x += dir.x
        z += dir.z
      }
    }
    walkApi.current?.setPad?.(x, z)
  }

  const press = (dir) => (e) => {
    e.preventDefault()
    held.current.add(dir.key)
    apply()
  }
  const release = (dir) => (e) => {
    e.preventDefault()
    held.current.delete(dir.key)
    apply()
  }

  return (
    <div
      className="pointer-events-auto absolute bottom-24 right-4 z-40 h-[156px] w-[156px] select-none md:hidden"
      style={{ touchAction: 'none' }}
    >
      {DIRS.map((dir) => (
        <button
          key={dir.key}
          type="button"
          aria-label={dir.key}
          onPointerDown={press(dir)}
          onPointerUp={release(dir)}
          onPointerCancel={release(dir)}
          onPointerLeave={release(dir)}
          className={`absolute ${dir.pos} grid size-[52px] place-items-center border border-[#24415a] bg-[#0b1622]/85 text-[15px] text-[#7f9bb1] backdrop-blur-sm active:border-[#35c8dc] active:text-[#35c8dc]`}
        >
          {dir.label}
        </button>
      ))}
    </div>
  )
}
