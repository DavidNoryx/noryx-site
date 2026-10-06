import * as THREE from 'three'

/**
 * Modelled street furniture.
 *
 * Separate from the scene because it is the part that has to outlive this
 * demo: every site will have chambers, cabinets and hydrants, and the
 * geometry for them should be written once and checked once. `dev/furniture.html`
 * renders every type side by side so it can be judged without hunting for one
 * on a street.
 *
 * These materials are lit, unlike the capture: photogrammetry carries its own
 * lighting in the texture and is rendered unlit, but modelled geometry without
 * shading is a silhouette — which is exactly what made the first version of
 * this read as a coloured slab stuck to the road.
 */
export const MAT = {
  iron: new THREE.MeshLambertMaterial({ color: 0x55595e }),
  ironLip: new THREE.MeshLambertMaterial({ color: 0x3e4247 }),
  steel: new THREE.MeshLambertMaterial({ color: 0x9aa4ab }),
  steelDark: new THREE.MeshLambertMaterial({ color: 0x79838a }),
  concrete: new THREE.MeshLambertMaterial({ color: 0x8b8a84 }),
  post: new THREE.MeshLambertMaterial({ color: 0xb9c0c4 }),
  sign: new THREE.MeshLambertMaterial({ color: 0x1d5aa6 }),
  signFace: new THREE.MeshLambertMaterial({ color: 0xe8eef3 }),
}

/** A flush cover: cast iron lid sunk in a frame, the way one actually sits. */
export function buildCover(kind) {
  const g = new THREE.Group()
  const round = kind.form === 'round'
  const w = round ? kind.cover : kind.cover[0]
  const d = round ? kind.cover : kind.cover[1]

  const frame = round
    ? new THREE.Mesh(new THREE.CylinderGeometry(w / 2 + 0.07, w / 2 + 0.07, 0.05, 22), MAT.ironLip)
    : new THREE.Mesh(new THREE.BoxGeometry(w + 0.14, 0.05, d + 0.14), MAT.ironLip)
  frame.position.y = 0.025
  g.add(frame)

  const lid = round
    ? new THREE.Mesh(new THREE.CylinderGeometry(w / 2, w / 2, 0.06, 22), MAT.iron)
    : new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), MAT.iron)
  lid.position.y = 0.055
  g.add(lid)
  return { group: g, pick: lid }
}

/**
 * A street distribution cabinet: concrete plinth, galvanised body, shallow
 * fall on the roof, a door seam down the face and a service band at the base.
 */
export function buildCabinet(kind, tint) {
  const g = new THREE.Group()
  const [w, d] = kind.cover
  const h = kind.above

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(w + 0.14, 0.16, d + 0.14), MAT.concrete)
  plinth.position.y = 0.08
  g.add(plinth)

  const bodyH = h - 0.16
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, bodyH, d), MAT.steel)
  body.position.y = 0.16 + bodyH / 2
  g.add(body)

  // Door seam and handle recess, as two thin darker insets on the face.
  const seam = new THREE.Mesh(new THREE.BoxGeometry(0.015, bodyH - 0.12, 0.01), MAT.steelDark)
  seam.position.set(0, 0.16 + bodyH / 2, d / 2 + 0.006)
  g.add(seam)

  // Roof, tilted so water runs off the back. Cabinets are not flat-topped.
  const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.05, 0.04, d + 0.06), MAT.steelDark)
  roof.position.y = h + 0.01
  roof.rotation.x = -0.07
  g.add(roof)

  // The service colour belongs on an identification band, not on the cabinet.
  const band = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.004, 0.07, d + 0.004),
    new THREE.MeshLambertMaterial({ color: tint }),
  )
  band.position.y = 0.16 + 0.1
  g.add(band)

  return { group: g, pick: body }
}

/**
 * The Finnish hydrant: the valve is in an insulated box under a flush cover,
 * and a marker post with a blue plate says where it is. An above-ground
 * pillar would not survive the winter, which is why there are none.
 */
export function buildMarkerPost(kind, tint) {
  const g = new THREE.Group()
  const cover = buildCover(kind)
  g.add(cover.group)

  const h = kind.above
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.065, h, 0.065), MAT.post)
  post.position.set(0, h / 2, -0.55)
  g.add(post)

  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.24, 0.02), MAT.sign)
  plate.position.set(0, h - 0.06, -0.52)
  g.add(plate)
  const face = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.012), MAT.signFace)
  face.position.set(0, h - 0.06, -0.505)
  g.add(face)

  const collar = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.1, 0.08),
    new THREE.MeshLambertMaterial({ color: tint }),
  )
  collar.position.set(0, 0.2, -0.55)
  g.add(collar)

  return { group: g, pick: plate }
}

/**
 * A metering assembly, the way one is actually plumbed: the service comes up
 * out of the ground, turns through an isolating valve, runs horizontally
 * through the meter, and turns back down to the building. Two bright legs and
 * a box on top read as a toy, because a real one is pipework.
 */
export function buildMeter(kind, tint) {
  const g = new THREE.Group()
  const [w, d] = kind.cover
  const h = kind.above
  const run = h - 0.26

  const base = new THREE.Mesh(new THREE.BoxGeometry(w + 0.12, 0.12, d + 0.1), MAT.concrete)
  base.position.y = 0.06
  g.add(base)

  // Two risers and the horizontal between them, all in galvanised pipe.
  const pipe = (len, axis) =>
    new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, len, 12), MAT.steel)
  for (const x of [-w / 2 + 0.06, w / 2 - 0.06]) {
    const riser = pipe(run)
    riser.position.set(x, 0.12 + run / 2, 0)
    g.add(riser)
    // Elbow at the top of each riser.
    const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 8), MAT.steel)
    elbow.position.set(x, 0.12 + run, 0)
    g.add(elbow)
  }
  const cross = pipe(w - 0.12)
  cross.rotation.z = Math.PI / 2
  cross.position.set(0, 0.12 + run, 0)
  g.add(cross)

  // The meter body sits on the horizontal, with its register facing out.
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.17, 14), MAT.steelDark)
  body.rotation.z = Math.PI / 2
  body.position.set(0, 0.12 + run, 0)
  g.add(body)
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.03, 14), MAT.signFace)
  dial.rotation.x = Math.PI / 2
  dial.position.set(0, 0.12 + run, d / 2 - 0.02)
  g.add(dial)

  // Isolating valve on the inlet riser, in the service colour — the colour
  // belongs on a fitting, not on the whole assembly.
  const valve = new THREE.Mesh(
    new THREE.BoxGeometry(0.075, 0.09, 0.075),
    new THREE.MeshLambertMaterial({ color: tint }),
  )
  valve.position.set(-w / 2 + 0.06, 0.12 + run * 0.45, 0)
  g.add(valve)

  return { group: g, pick: body }
}

/**
 * Pick the geometry for a feature from its kind.
 *
 * Returns the group to add and the mesh to register for picking. A feature
 * with no matching body falls back to a flush cover, because a cover is what
 * nearly everything buried actually has.
 */
export function buildFeatureBody(kind, tint) {
  if (kind.body === 'cabinet') return buildCabinet(kind, tint)
  if (kind.body === 'post') return buildMarkerPost(kind, tint)
  if (kind.body === 'meter') return buildMeter(kind, tint)
  return buildCover(kind)
}
