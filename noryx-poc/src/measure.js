import * as THREE from 'three'

// Measurement that behaves the way a tape measure behaves: you pull it from
// point to point, the number sits on the line, and chaining another leg
// continues from where the last one ended.

function labelSprite(textValue) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 64
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = 'rgba(11,22,34,0.92)'
  ctx.fillRect(0, 0, 256, 64)
  ctx.strokeStyle = '#35c8dc'
  ctx.lineWidth = 3
  ctx.strokeRect(1.5, 1.5, 253, 61)

  ctx.fillStyle = '#e6f0f7'
  ctx.font = '600 30px ui-monospace, monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(textValue, 128, 34)

  const tex = new THREE.CanvasTexture(canvas)
  tex.minFilter = THREE.LinearFilter
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }),
  )
  sprite.scale.set(2.2, 0.55, 1)
  sprite.renderOrder = 20
  return sprite
}

export function createMeasureTool(scene) {
  const group = new THREE.Group()
  group.renderOrder = 15
  scene.add(group)

  /** Each leg: { a, b, line, endA, endB, label } */
  const legs = []
  let pending = null

  const dot = (p) => {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 12, 10),
      new THREE.MeshBasicMaterial({ color: 0x35c8dc, depthTest: false }),
    )
    m.position.copy(p)
    m.renderOrder = 18
    return m
  }

  return {
    group,

    /** Add a point. Two points make a leg; after that each point extends it. */
    addPoint(p) {
      const point = p.clone()
      if (!pending) {
        pending = { a: point, marker: dot(point) }
        group.add(pending.marker)
        return null
      }

      const a = pending.a
      const b = point
      const distance = a.distanceTo(b)

      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([a, b]),
        new THREE.LineBasicMaterial({ color: 0x35c8dc, depthTest: false, linewidth: 2 }),
      )
      line.renderOrder = 16

      const endB = dot(b)
      const label = labelSprite(`${distance.toFixed(2)} m`)
      label.position.copy(a).add(b).multiplyScalar(0.5)
      label.position.y += 0.45

      group.add(line, endB, label)
      legs.push({ a, b, distance, objects: [line, endB, label, pending.marker] })

      // Chain: the next leg starts where this one ended.
      pending = { a: b, marker: endB }
      return { distance, total: legs.reduce((s, l) => s + l.distance, 0), legs: legs.length }
    },

    /** Drop the last leg only. */
    undo() {
      const leg = legs.pop()
      if (!leg) {
        this.clear()
        return null
      }
      leg.objects.forEach((o) => {
        group.remove(o)
        o.geometry?.dispose()
        o.material?.map?.dispose()
        o.material?.dispose()
      })
      pending = null
      return { total: legs.reduce((s, l) => s + l.distance, 0), legs: legs.length }
    },

    clear() {
      ;[...group.children].forEach((o) => {
        group.remove(o)
        o.geometry?.dispose()
        o.material?.map?.dispose()
        o.material?.dispose()
      })
      legs.length = 0
      pending = null
    },

    summary() {
      return { total: legs.reduce((s, l) => s + l.distance, 0), legs: legs.length }
    },

    dispose() {
      this.clear()
      scene.remove(group)
    },
  }
}
