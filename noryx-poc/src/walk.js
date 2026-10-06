import * as THREE from 'three'

// First-person walk.
//
// The point of this mode is one specific moment: an engineer standing in a
// room, looking down, and seeing the run pass under their own feet at a stated
// depth. Everything here serves that — eye height is real, movement is slow
// enough to read the ground, and the services are drawn through the floor on
// purpose rather than hidden by it.

export const EYE_HEIGHT = 1.7
const SPEED = 3.2 // m/s, a walking pace
const LOOK = 0.0022

export function createWalker(camera, domElement) {
  const keys = new Set()
  const euler = new THREE.Euler(0, 0, 0, 'YXZ')
  let dragging = false
  let enabled = false

  const onKeyDown = (e) => {
    if (!enabled) return
    keys.add(e.code)
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault()
    }
  }
  const onKeyUp = (e) => keys.delete(e.code)

  const onPointerDown = (e) => {
    if (!enabled) return
    dragging = true
    domElement.setPointerCapture?.(e.pointerId)
  }
  const onPointerUp = (e) => {
    dragging = false
    domElement.releasePointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e) => {
    if (!enabled || !dragging) return
    euler.setFromQuaternion(camera.quaternion)
    euler.y -= e.movementX * LOOK
    euler.x -= e.movementY * LOOK
    euler.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, euler.x))
    camera.quaternion.setFromEuler(euler)
  }

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  domElement.addEventListener('pointerdown', onPointerDown)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointermove', onPointerMove)

  let groundY = 0
  // A phone has no WASD. The pad sets this instead, and the two paths meet at
  // the same movement code.
  let padX = 0
  let padZ = 0

  const forward = new THREE.Vector3()
  const right = new THREE.Vector3()

  return {
    setPad(x, z) {
      padX = x
      padZ = z
    },
    setGround(y) {
      groundY = y
    },
    setEnabled(v) {
      enabled = v
      if (!v) {
        keys.clear()
        dragging = false
        padX = 0
        padZ = 0
      }
    },
    update(dt) {
      if (!enabled) return
      forward.set(0, 0, -1).applyQuaternion(camera.quaternion)
      forward.y = 0
      forward.normalize()
      right.set(1, 0, 0).applyQuaternion(camera.quaternion)
      right.y = 0
      right.normalize()

      const step = SPEED * dt * (keys.has('ShiftLeft') ? 2.2 : 1)
      if (keys.has('KeyW') || keys.has('ArrowUp')) camera.position.addScaledVector(forward, step)
      if (keys.has('KeyS') || keys.has('ArrowDown')) camera.position.addScaledVector(forward, -step)
      if (keys.has('KeyA') || keys.has('ArrowLeft')) camera.position.addScaledVector(right, -step)
      if (keys.has('KeyD') || keys.has('ArrowRight')) camera.position.addScaledVector(right, step)

      if (padZ) camera.position.addScaledVector(forward, step * padZ)
      if (padX) camera.position.addScaledVector(right, step * padX)

      // Feet stay on the floor. No flying — the whole illusion depends on the
      // viewer believing they are standing in the room.
      camera.position.y = groundY + EYE_HEIGHT
    },
    dispose() {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      domElement.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointermove', onPointerMove)
    },
  }
}
