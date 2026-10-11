import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { SENSORS } from '../site'
import { activeSite, activeFindings } from '../sites'

const SITE = activeSite()
const EXPOSURE = SITE.exposure ?? 1.0
const FINDINGS = activeFindings()
import { createWalker, EYE_HEIGHT } from '../walk'
import { createMeasureTool } from '../measure'
import { UTILITY, manholesFor, findCrossings, depthAt, chainageOf } from '../utilities'
import { SURFACE } from '../surface'
import { buildFeatureBody } from '../furniture'
import { gridToMesh, deriveFromMesh, describe, registration, sampleAlong } from '../terrain'
import { envelope, outsideDiameter } from '../risk'

// The capture is Z-up. Everything loaded from it goes inside a wrapper that
// tips it into Y-up and drops the measured floor onto y = 0; the inner offset
// is applied in capture coordinates, before that rotation.
const CAP = SITE.capture
const CAPTURE_OFFSET = new THREE.Vector3(-CAP.centre[0], -CAP.centre[1], -CAP.floor)

function captureWrapper(child) {
  const wrapper = new THREE.Group()
  wrapper.rotation.x = -Math.PI / 2
  child.position.copy(CAPTURE_OFFSET)
  wrapper.add(child)
  return wrapper
}

// Which capture layer a probed object belongs to.
function layerOf(object, groups) {
  for (const [key, group] of Object.entries(groups)) {
    let n = object
    while (n) {
      if (n === group) return key
      n = n.parent
    }
  }
  return null
}

// Beats. The scene reads one number and derives everything from it.
//   0 real place · 1 sensors land misaligned · 2 registration
//   3 subsurface reveal · 4 findings, free control
const damp = (a, b, t) => a + (b - a) * t
const clamp01 = (v) => Math.max(0, Math.min(1, v))

function buildThermal() {
  // A warm patch on the facade, where F03's cavity sits.
  const group = new THREE.Group()
  const patch = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 2.6),
    new THREE.MeshBasicMaterial({
      color: 0xffb164,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  )
  const at = FINDINGS.find((f) => f.id === 'F03')?.at ?? [0, 2, 0]
  patch.position.set(at[0], at[1], at[2])
  group.add(patch)
  return group
}

function buildGpr(pickables, zones, records) {
  const group = new THREE.Group()

  // There used to be a dark 46 m plane here, standing in for a ground line so
  // the runs read as being under something. It was correct only while the
  // capture floated two metres above it. With the road datum measured and the
  // carriageway landing on y = 0, the plane sat just under a surface that
  // undulates by a similar amount, punched through it, and read as a hole in
  // the model. The captured road is the ground line. It does the job better.

  // The swept volume, so the buried runs read as measured rather than drawn.
  // Its top is kept clear of the road for the same reason.
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(46, 3.0, 46),
    new THREE.MeshBasicMaterial({
      color: 0xf2a33c,
      transparent: true,
      opacity: 0.035,
      depthWrite: false,
    }),
  )
  slab.position.set(SITE.focus?.at[0] ?? 0, -2.1, SITE.focus?.at[1] ?? 0)
  group.add(slab)

  FINDINGS.filter((f) => f.kind === 'subsurface').forEach((finding) => {
    // A run with a declared fall is drawn falling. The alternative — a level
    // pipe beside a panel reading "1.1 percent" — is the sort of contradiction
    // an engineer finds in the first ten seconds.
    const points = finding.path.map(([x, z], i) => {
      const f = finding.path.length > 1 ? i / (finding.path.length - 1) : 0
      return new THREE.Vector3(x, -depthAt(finding, f), z)
    })
    const curve = new THREE.CatmullRomCurve3(points)

    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 96, 0.24, 14, false),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(UTILITY[finding.utility]?.color ?? '#f2a33c'),
        transparent: true,
        opacity: 0.9,
      }),
    )
    tube.userData = finding
    group.add(tube)
    pickables.push(tube)

    // The uncertainty volume. A QL-D run is not a line, it is a region the
    // pipe is somewhere inside, and the region is what decides how wide a
    // trench has to be opened. Drawn as a sleeve around the run, sized by the
    // tolerance its own quality level claims.
    const env = envelope(finding)
    const sleeve = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 72, env.plan + outsideDiameter(finding) / 2, 16, false),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(UTILITY[finding.utility]?.color ?? '#f2a33c'),
        transparent: true,
        opacity: 0.14,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    )
    sleeve.userData = finding
    sleeve.name = 'zone'
    zones.push(sleeve)
    group.add(sleeve)

    // Where the owner's records put it. The gap between this and the run is
    // the single most saleable number a survey produces.
    if (finding.record) {
      const [dx, dz] = finding.record.offset
      const rd = finding.record.depth ?? finding.depth
      const ghostPts = finding.path.map(([x, z]) => new THREE.Vector3(x + dx, -rd, z + dz))
      const ghost = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(
          new THREE.CatmullRomCurve3(ghostPts).getPoints(60),
        ),
        new THREE.LineDashedMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.5,
          dashSize: 0.8,
          gapSize: 0.5,
        }),
      )
      ghost.computeLineDistances()
      ghost.name = 'record'
      records.push(ghost)
      group.add(ghost)

      // A tie line at mid-run, so the discrepancy reads as a distance rather
      // than as two unrelated lines.
      const mid = Math.floor(finding.path.length / 2)
      const tie = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(finding.path[mid][0], -depthAt(finding, 0.5), finding.path[mid][1]),
          new THREE.Vector3(finding.path[mid][0] + dx, -rd, finding.path[mid][1] + dz),
        ]),
        new THREE.LineBasicMaterial({ color: 0xe24b4a, transparent: true, opacity: 0.75 }),
      )
      tie.name = 'record'
      records.push(tie)
      group.add(tie)
    }

    // Drop lines from the surface, so depth is something you can see rather
    // than something you read off a panel.
    const drops = []
    for (let i = 0; i <= 8; i += 1) {
      const p = curve.getPoint(i / 8)
      drops.push(p.x, 0, p.z, p.x, p.y, p.z)
    }
    const dropGeo = new THREE.BufferGeometry()
    dropGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(drops), 3))
    group.add(
      new THREE.LineSegments(
        dropGeo,
        new THREE.LineBasicMaterial({ color: 0xf2a33c, transparent: true, opacity: 0.22 }),
      ),
    )

    // The same run traced on the surface: where you would paint the dig line.
    const shadowPts = points.map((p) => new THREE.Vector3(p.x, -0.01, p.z))
    group.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(
          new THREE.CatmullRomCurve3(shadowPts).getPoints(64),
        ),
        new THREE.LineDashedMaterial({
          color: 0xf2a33c,
          transparent: true,
          opacity: 0.5,
          dashSize: 0.5,
          gapSize: 0.35,
        }),
      ).computeLineDistances(),
    )
  })

  return group
}

/**
 * Surface features, and the risers that connect them to what is buried.
 *
 * Everything else in this scene is an inference drawn under the ground. These
 * are the opposite: a lid is a surveyed object, and the run beneath it is
 * pinned to it. Drawing the riser is what turns four parallel lines into a
 * network somebody is connected to — and it answers the question an engineer
 * asks within ten seconds of seeing a utility model, which is "so where does
 * that come up".
 */
function buildSurface(picks, nodes) {
  const group = new THREE.Group()
  if (!SURFACE.length) return group

  // Rect features sit square to the street, not to the world axes.
  const along = SITE.frame?.along ?? [1, 0]
  const heading = Math.atan2(-along[1], along[0])

  SURFACE.forEach((item) => {
    const { kind, at, color } = item
    const tint = new THREE.Color(color)
    const node = new THREE.Group()
    node.position.set(at[0], 0, at[1])
    node.rotation.y = heading

    const round = kind.form === 'round'
    const built = buildFeatureBody(kind, tint)
    built.pick.userData = item
    node.add(built.group)
    picks.push(built.pick)

    // A ring on the ground, in the service colour, so you can tell at a glance
    // which network a lid belongs to without lifting it. Sized to the chamber
    // rather than to the lid, with a floor: a 300 mm valve box is invisible
    // from the hand-over camera, and the point of the ring is to be seen.
    const r = Math.max(0.55, (round ? kind.cover : Math.max(...kind.cover)) / 2 + 0.14)
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(r, r + 0.16, 28),
      new THREE.MeshBasicMaterial({
        color: tint,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    )
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.008
    // The ring is the part you can actually see from the hand-over camera, so
    // it is the part that has to be clickable. Picking only the 600 mm lid in
    // the middle of it is a target nobody can hit.
    ring.userData = item
    node.add(ring)
    picks.push(ring)

    // An invisible hit area. A 1.4 m lid is about ten pixels from the camera
    // this scene hands over at, and asking anyone to hit ten pixels is asking
    // them to conclude the feature is not clickable.
    const target = new THREE.Mesh(
      new THREE.CircleGeometry(1.6, 16),
      new THREE.MeshBasicMaterial({ visible: false }),
    )
    target.rotation.x = -Math.PI / 2
    target.position.y = 0.02
    target.userData = item
    node.add(target)
    picks.push(target)

    // The riser: cover down to the run it serves.
    const shaftMat = new THREE.MeshBasicMaterial({
      color: tint,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
    })
    const h = Math.max(0.2, item.depth)
    const shaft = round
      ? new THREE.Mesh(new THREE.CylinderGeometry(kind.shaft / 2, kind.shaft / 2, h, 16, 1, true), shaftMat)
      : new THREE.Mesh(new THREE.BoxGeometry(kind.shaft[0], h, kind.shaft[1]), shaftMat)
    shaft.position.y = -h / 2
    node.add(shaft)

    // This layer draws over the capture rather than inside it. The alternative
    // was tried and does not work: the 2017 aerial drapes over whatever was
    // parked that morning, so half the chambers ended up underneath a car.
    // Solid furniture still depth-sorts against itself, or a cabinet's own
    // back face would draw over its front and the shading would be lost.
    node.traverse((n) => {
      if (!n.material) return
      n.renderOrder = 6
      if (n.material.transparent) {
        n.material.depthWrite = false
        n.material.depthTest = false
      } else {
        n.material.depthTest = true
        n.material.depthWrite = true
      }
    })

    group.add(node)
    nodes.push({ node, item, shaft, riserMat: shaftMat, built: h })
  })

  return group
}

/**
 * Drop each surface feature onto the captured street and re-length its riser.
 *
 * Called once the textured mesh is in the scene. Depth is measured from the
 * local surface, not from the datum, so the riser has to grow by however far
 * the road sits above y = 0 for its bottom to meet the pipe.
 */
function settleSurface(nodes, target) {
  const down = new THREE.Raycaster()
  const dir = new THREE.Vector3(0, -1, 0)

  // An aerial mesh drapes over whatever was parked on the street that morning,
  // so a single ray straight down lands on a van roof as readily as on the
  // road — the first run of this put a valve cover 1.53 m in the air. Sampling
  // a ring and taking the lowest return finds the carriageway beside the
  // vehicle, and the clamp catches the case where the whole ring is covered.
  const RING = [[0, 0], [0.9, 0], [-0.9, 0], [0, 0.9], [0, -0.9], [0.7, 0.7], [-0.7, -0.7]]
  const LIMIT = 0.7

  const groundAt = (x, z) => {
    let lowest = null
    for (const [dx, dz] of RING) {
      down.set(new THREE.Vector3(x + dx, 60, z + dz), dir)
      const h = down.intersectObject(target, true)[0]
      if (h && (lowest === null || h.point.y < lowest)) lowest = h.point.y
    }
    if (lowest === null) return null
    return Math.max(-LIMIT, Math.min(LIMIT, lowest))
  }

  let missed = 0
  nodes.forEach(({ node, item, shaft, built }) => {
    const ground = groundAt(node.position.x, node.position.z)
    if (ground === null) {
      missed += 1
      return
    }
    const hit = { point: { y: ground } }
    // Sixty millimetres proud of the road. A lid set exactly on the captured
    // surface fights it for the same pixels and flickers out; this is also
    // roughly where a real cover sits relative to the wearing course.
    node.position.y = hit.point.y + 0.06
    const needed = Math.max(0.2, item.depth + node.position.y)
    shaft.scale.y = needed / built
    shaft.position.y = -needed / 2
  })

  // A feature that found no ground is a feature sitting in mid-air at y = 0,
  // which is exactly the sort of thing that survives a demo and embarrasses
  // you in front of an engineer. Say so while there is still a console open.
  if (import.meta.env.DEV) {
    console.info(
      `surface: settled ${nodes.length - missed}/${nodes.length}`,
      nodes.map(({ item, node }) => `${item.id}@${node.position.y.toFixed(2)}`).join(' '),
    )
  }
}

export default function FusionScene({
  measureApi,
  walkApi,
  terrainApi,
  beat,
  progress = 0,
  mode = 'story',
  isolated = null,
  measuring = false,
  xray = false,
  surfaceOn = true,
  zonesOn = false,
  recordsOn = false,
  onPick,
  onSurface,
  onProbe,
  onMeasure,
  onReady,
}) {
  const hostRef = useRef(null)
  const stateRef = useRef({ beat, progress, mode, isolated, measuring, xray, surfaceOn, zonesOn, recordsOn })
  stateRef.current = { beat, progress, mode, isolated, measuring, xray, surfaceOn, zonesOn, recordsOn }
  const pickRef = useRef(onPick)
  pickRef.current = onPick
  const surfaceRef = useRef(onSurface)
  surfaceRef.current = onSurface
  const probeRef = useRef(onProbe)
  probeRef.current = onProbe
  const measureRef = useRef(onMeasure)
  measureRef.current = onMeasure
  const readyRef = useRef(onReady)
  readyRef.current = onReady

  const [loaded, setLoaded] = useState(0)
  const toolRef = useRef(null)

  useEffect(() => {
    const host = hostRef.current
    const scene = new THREE.Scene()
    scene.fog = null

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 500)
    const FOCUS = SITE.focus ?? null
    const SPAN = FOCUS ? FOCUS.span : Math.max(
      CAP.extent.along[1] - CAP.extent.along[0],
      CAP.extent.across[1] - CAP.extent.across[0],
    )
    const FOCUS_AT = new THREE.Vector3(FOCUS ? FOCUS.at[0] : 0, 0, FOCUS ? FOCUS.at[1] : 0)
    camera.position.set(SPAN * 0.6, SPAN * 0.42, SPAN * 0.75)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace

    // Clip the capture down to the street under discussion. The viewer should
    // be looking at one road and the buildings that front it, not at 250 m of
    // city they were not asked about.
    const CLIP = SITE.clip ?? null
    const clipPlanes = CLIP
      ? [
          new THREE.Plane(new THREE.Vector3(1, 0, 0), -(CLIP.at[0] - CLIP.halfWidth)),
          new THREE.Plane(new THREE.Vector3(-1, 0, 0), CLIP.at[0] + CLIP.halfWidth),
          new THREE.Plane(new THREE.Vector3(0, 0, 1), -(CLIP.at[1] - CLIP.halfWidth)),
          new THREE.Plane(new THREE.Vector3(0, 0, -1), CLIP.at[1] + CLIP.halfWidth),
        ]
      : []
    renderer.localClippingEnabled = clipPlanes.length > 0
    host.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.maxPolarAngle = Math.PI * 0.495
    controls.minDistance = 10
    controls.maxDistance = 900
    controls.target.set(0, 1.2, 0)
    controls.enabled = false // unlocked at the last beat

    const walker = createWalker(camera, renderer.domElement)
    const measure = createMeasureTool(scene)
    toolRef.current = measure
    if (measureApi) measureApi.current = measure
    if (walkApi) walkApi.current = walker

    // Ground surfaces. Handed out as an API rather than a prop because a
    // terrain arrives from a file picker, not from React state, and rebuilding
    // this effect to show one would reload seventeen megabytes of capture.
    // What the terrain API is currently showing, so a profile can be taken
    // through it rather than through the capture underneath it.
    const loaded = { grid: null, offset: [0, 0], label: null }

    if (terrainApi) {
      terrainApi.current = {
        show(grid, options = {}) {
          this.clear()
          const reg = registration(grid)
          const mesh = gridToMesh(grid, { ...options, offset: reg.offset })
          groups.terrain.add(mesh)
          loaded.grid = grid
          loaded.offset = reg.offset
          loaded.label = grid.kind === 'DTM' ? 'Ground model' : 'Surface model'
          return { ...describe(grid), ...reg }
        },
        clear() {
          for (const child of [...groups.terrain.children]) {
            child.geometry?.dispose()
            child.material?.dispose()
            groups.terrain.remove(child)
          }
          loaded.grid = null
          loaded.offset = [0, 0]
          loaded.label = null
        },
        setVisible(v) {
          groups.terrain.visible = v
        },
        /** Sample the capture itself, which is the only ground most sites have. */
        derive(cell = 1) {
          if (!groups.rgb.children.length) return null
          groups.rgb.updateMatrixWorld(true)
          const clip = SITE.clip
          return deriveFromMesh(groups.rgb, {
            centre: clip?.at ?? SITE.focus?.at ?? [0, 0],
            halfWidth: Math.min(clip?.halfWidth ?? 40, 40),
            cell,
          })
        },
        hasCapture() {
          return groups.rgb.children.length > 0
        },

        /**
         * Ground level along a polyline, for the long section.
         *
         * Prefers a loaded surface, because that is the one the viewer can see
         * and the one they chose. Falls back to the capture, so a profile is
         * available before anybody has imported anything.
         */
        groundAlong(path, samples = 120) {
          if (loaded.grid) {
            return {
              source: loaded.label,
              points: sampleAlong(loaded.grid, path, samples, loaded.offset),
            }
          }
          if (!groups.rgb.children.length) return null
          groups.rgb.updateMatrixWorld(true)
          const ray = new THREE.Raycaster()
          const down = new THREE.Vector3(0, -1, 0)
          const points = []
          for (let i = 0; i < samples; i += 1) {
            const f = samples === 1 ? 0 : i / (samples - 1)
            const t = f * (path.length - 1)
            const k = Math.min(path.length - 2, Math.floor(t))
            const r = t - k
            const x = path[k][0] + (path[k + 1][0] - path[k][0]) * r
            const z = path[k][1] + (path[k + 1][1] - path[k][1]) * r
            // Lowest of a small ring, for the same reason the surface features
            // use one: a single ray lands on a parked car.
            let lowest = null
            for (const [dx, dz] of [[0, 0], [0.8, 0], [-0.8, 0], [0, 0.8], [0, -0.8]]) {
              ray.set(new THREE.Vector3(x + dx, 200, z + dz), down)
              const hit = ray.intersectObject(groups.rgb, true)[0]
              if (hit && (lowest === null || hit.point.y < lowest)) lowest = hit.point.y
            }
            points.push({ f, x, z, y: lowest })
          }
          return { source: 'Sampled from the capture', points }
        },
      }
    }

    // These lights reach the street furniture and nothing else: the capture is
    // unlit on purpose, because photogrammetry has its lighting baked into the
    // texture. They were set for a lit capture and left at ambient 1.4, which
    // is why a cabinet rendered as a flat silhouette with no form — it is
    // modelled geometry and it needs a key light to read as an object.
    scene.add(new THREE.AmbientLight(0xffffff, 0.62))
    const key = new THREE.DirectionalLight(0xffffff, 0.85)
    key.position.set(14, 20, 6)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xbfd4e4, 0.3)
    fill.position.set(-10, 6, -12)
    scene.add(fill)

    const grid = new THREE.GridHelper(600, 120, 0x1e3448, 0x122436)
    grid.material.transparent = true
    grid.material.opacity = 0.5
    // Below the deepest service rather than at the datum. Now that the captured
    // road sits on y = 0, a grid at y = 0 is coplanar with the carriageway and
    // tears across it; down here it reads as the floor of the excavation.
    grid.position.y = -3.6
    scene.add(grid)

    const pickables = []
    const zoneMeshes = []
    const recordLines = []
    const surfacePicks = []
    const surfaceNodes = []
    const groups = {
      lidar: new THREE.Group(),
      rgb: new THREE.Group(),
      thermal: buildThermal(),
      gpr: buildGpr(pickables, zoneMeshes, recordLines),
      surface: buildSurface(surfacePicks, surfaceNodes),
      terrain: new THREE.Group(),
    }
    Object.values(groups).forEach((g) => scene.add(g))

    let meshMaterials = []
    let cloudMaterial = null
    let disposed = false
    let expected = 2
    let done = 0
    const step = () => {
      done += 1
      setLoaded(done / expected)
      if (done >= expected) readyRef.current?.()
    }

    // RGB layer: the Matterport mesh.
    const draco = new DRACOLoader().setDecoderPath('/draco/')
    const gltf = new GLTFLoader().setDRACOLoader(draco)
    gltf.load(
      SITE.mesh,
      (result) => {
        if (disposed) return
        // Photogrammetry bakes the lighting into the texture. Rendering it
        // through a PBR material and then lighting the scene darkens it twice,
        // which is why the capture looked like it was shot at dusk. Unlit is
        // the correct material for a reality mesh.
        result.scene.traverse((node) => {
          if (!node.isMesh) return
          const old = node.material
          // The texture must be tagged sRGB or the renderer treats it as
          // linear and the capture comes out two stops dark.
          if (old.map) old.map.colorSpace = THREE.SRGBColorSpace
          const unlit = new THREE.MeshBasicMaterial({
            map: old.map ?? null,
            color: old.map
              ? new THREE.Color(EXPOSURE, EXPOSURE, EXPOSURE)
              : (old.color ?? new THREE.Color(0xffffff)),
            transparent: true,
            side: THREE.DoubleSide,
            clippingPlanes: clipPlanes,
          })
          node.material = unlit
          old.dispose?.()
          meshMaterials.push(unlit)
        })
        groups.rgb.add(captureWrapper(result.scene))
        groups.rgb.updateMatrixWorld(true)
        settleSurface(surfaceNodes, groups.rgb)
        step()
      },
      undefined,
      (err) => {
        console.error('mesh load failed', err)
        step()
      },
    )

    // LiDAR layer: the decimated point cloud, when the site has one.
    if (!SITE.cloudPos) {
      step()
    } else Promise.all([
      fetch(SITE.cloudPos).then((r) => r.arrayBuffer()),
      fetch(SITE.cloudCol).then((r) => r.arrayBuffer()),
    ])
      .then(([posBuf, colBuf]) => {
        if (disposed) return
        const positions = new Float32Array(posBuf)
        const raw = new Uint8Array(colBuf)
        const colors = new Float32Array(raw.length)
        for (let i = 0; i < raw.length; i += 1) colors[i] = raw[i] / 255

        const geo = new THREE.BufferGeometry()
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
        const points = new THREE.Points(
          geo,
          new THREE.PointsMaterial({
            size: 0.035,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
          }),
        )
        cloudMaterial = points.material
        groups.lidar.add(captureWrapper(points))
        step()
      })
      .catch((err) => {
        console.error('cloud load failed', err)
        step()
      })

    // Crosshair left wherever the viewer last probed.
    const probe = new THREE.Group()
    probe.visible = false
    for (const axis of [[1, 0, 0], [0, 1, 0], [0, 0, 1]]) {
      const g = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-axis[0] * 0.6, -axis[1] * 0.6, -axis[2] * 0.6),
        new THREE.Vector3(axis[0] * 0.6, axis[1] * 0.6, axis[2] * 0.6),
      ])
      probe.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x35c8dc })))
    }
    scene.add(probe)

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const handleClick = (event) => {
      if (stateRef.current.beat < 2) return
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      // A surface feature is in front of the run it sits on, and is the more
      // specific answer, so it wins the pick. It still selects its own service,
      // because "which main is this a lid for" is the next question.
      const onLid = raycaster.intersectObjects(surfacePicks, false)[0]
      if (onLid) {
        const item = onLid.object.userData
        surfaceRef.current?.(item)
        pickRef.current?.(item.run)
      } else {
        const onRun = raycaster.intersectObjects(pickables, false)[0]
        if (onRun) {
          surfaceRef.current?.(null)
          pickRef.current?.(onRun.object.userData)
        }
      }

      // Probe every visible layer, so the readout proves they coincide.
      const all = raycaster.intersectObjects(scene.children, true)
      const hit = all.find((h) => h.object.visible && h.object.type !== 'GridHelper')
      if (hit) {
        probe.position.copy(hit.point)
        probe.visible = true
        if (stateRef.current.measuring) {
          const r = measure.addPoint(hit.point)
          measureRef.current?.(r)
        }
        probeRef.current?.({
          x: hit.point.x,
          y: hit.point.y,
          z: hit.point.z,
          layer: layerOf(hit.object, groups),
        })
      }
    }
    renderer.domElement.addEventListener('click', handleClick)

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = host
      if (!w || !h) return
      // `false` here would skip the CSS size, and a canvas with no CSS size
      // lays out at its backing-store width — so on any screen with a device
      // pixel ratio above 1 the viewport rendered oversized and was clipped by
      // the host, which also put every pick a proportional distance off.
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(host)
    resize()

    let raf = 0
    let handedOver = false
    let walkEntered = false
    const clock = new THREE.Clock()
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(0.05, clock.getDelta())
      const t = clock.elapsedTime
      const { beat: rawBeat, progress: p, mode, isolated: isol } = stateRef.current
      // Outside the story the model is always in its final, fully revealed
      // state — a viewer who stepped out of the narrative should not find half
      // the layers switched off.
      const b = mode === 'story' ? rawBeat : 4
      const walking = mode === 'walk'
      const xray = stateRef.current.xray ? 1 : 0

      // Registration: offsets collapse to zero across beat 2.
      const align = b >= 3 ? 1 : b === 2 ? clamp01(p) : 0
      SENSORS.forEach((sensor) => {
        const group = groups[sensor.key]
        if (!group) return
        const k = 1 - align
        group.position.x = sensor.offset.x * k
        group.position.z = sensor.offset.z * k
        group.rotation.y = sensor.offset.ry * k
      })

      // Layers arrive one at a time through beat 1.
      const arrival = b < 1 ? 0 : b === 1 ? clamp01(p) : 1
      SENSORS.forEach((sensor, i) => {
        const group = groups[sensor.key]
        if (!group) return
        const share = clamp01(arrival * SENSORS.length - i)
        group.visible = share > 0.01
        group.scale.setScalar(damp(0.94, 1, share))
      })

      // The reveal: the surface gives way so the subsurface can be seen.
      // In the story it is driven by the beat. Outside it, the viewer owns it —
      // somebody exploring a street wants the street solid, and reaches for
      // x-ray when they want to look through it.
      const reveal = mode === 'story' ? (b < 3 ? 0 : b === 3 ? clamp01(p) : 1) : xray
      meshMaterials.forEach((m) => {
        m.opacity = damp(1, 0.16, reveal)
      })
      if (cloudMaterial) cloudMaterial.opacity = damp(0.9, 0.34, reveal)
      groups.gpr.visible = mode !== 'story' || reveal > 0.02
      pickables.forEach((tube, i) => {
        const pulse = 0.78 + Math.sin(t * 1.6 + i) * 0.18
        tube.material.opacity = mode === 'story' ? reveal * pulse : pulse
      })
      groups.thermal.children.forEach((c) => {
        if (c.material) c.material.opacity = 0.3 * (b >= 4 ? 1 : reveal)
      })

      // Isolation: looking at one run means seeing only that run.
      pickables.forEach((tube) => {
        const wanted = !isol || tube.userData.id === isol
        tube.visible = groups.gpr.visible && wanted
      })

      // The uncertainty sleeves and the record positions, each on its own
      // switch. Both are off by default: they answer a second question, and
      // showing them unasked turns a readable street into a fog.
      const { zonesOn, recordsOn } = stateRef.current
      zoneMeshes.forEach((m) => {
        m.visible = Boolean(zonesOn) && groups.gpr.visible && (!isol || m.userData.id === isol)
      })
      recordLines.forEach((m) => {
        m.visible = Boolean(recordsOn) && groups.gpr.visible
      })

      // Surface features follow the services they belong to: they appear with
      // the reveal, and isolating a run leaves its own lids standing.
      groups.surface.visible = groups.gpr.visible && stateRef.current.surfaceOn
      surfaceNodes.forEach(({ node, item, riserMat }) => {
        node.visible = !isol || item.on === isol
        // The riser answers "where does it come up", and it answers it under
        // the road. Hiding it behind the road entirely loses the answer, and
        // drawing it solid makes a 2.4 m chamber look like it is standing on
        // the carriageway. Ghosted, it reads as what it is: a shaft below the
        // lid, which firms up when the viewer asks to see through the ground.
        riserMat.opacity = 0.18 + xray * 0.4
      })

      // Walk mode. Services are drawn through the floor on purpose — the whole
      // point is standing in the room and seeing what runs under your feet.
      if (walking) {
        controls.enabled = false
        walker.setEnabled(true)
        if (!walkEntered) {
          // Start at the centre of the measured footprint, facing along the
          // building's long axis, so the first frame is the room and not a wall.
          const down = new THREE.Raycaster(
            new THREE.Vector3(FOCUS_AT.x, 200, FOCUS_AT.z),
            new THREE.Vector3(0, -1, 0),
          )
          const floorHit = down.intersectObject(groups.rgb, true)[0]
          const standOn = floorHit ? floorHit.point.y : 0
          camera.position.set(FOCUS_AT.x, standOn + EYE_HEIGHT, FOCUS_AT.z)
          walker.setGround(standOn)
          camera.lookAt(FOCUS_AT.x - 6, standOn + EYE_HEIGHT - 2.5, FOCUS_AT.z - 22)
          walkEntered = true
        }
        walker.update(dt)
        pickables.forEach((tube) => {
          tube.material.depthTest = false
          tube.material.opacity = 0.95
          tube.renderOrder = 5
        })
        groups.gpr.visible = true
        // The textured mesh IS the virtual tour. The point cloud is the raw
        // return behind it, and in here it reads as noise over the photograph —
        // so it goes off, and the room looks like the room.
        groups.lidar.visible = false
        groups.rgb.visible = true
        meshMaterials.forEach((m) => {
          m.opacity = 1
          m.transparent = false
        })
        renderer.render(scene, camera)
        return
      }

      walker.setEnabled(false)
      walkEntered = false
      groups.lidar.visible = true
      meshMaterials.forEach((m) => {
        m.transparent = true
      })
      pickables.forEach((tube) => {
        tube.material.depthTest = !(mode !== 'story' && xray)
        tube.renderOrder = xray ? 5 : 0
      })

      // Camera: pushed in over the reveal, handed over at the last beat.
      controls.enabled = b >= 4
      if (b < 4) {
        const ang = t * 0.06 + reveal * 0.5
        const dist = damp(SPAN * 1.5, SPAN * 1.05, reveal)
        const height = damp(SPAN * 0.9, SPAN * 0.55, reveal)
        camera.position.set(
          FOCUS_AT.x + Math.sin(ang) * dist,
          height,
          FOCUS_AT.z + Math.cos(ang) * dist,
        )
        camera.lookAt(FOCUS_AT.x, damp(2.4, -0.3, reveal), FOCUS_AT.z)
      } else {
        // Compose the hand-over view once, then let the viewer drive.
        if (!handedOver) {
          camera.position.set(
            FOCUS_AT.x + SPAN * 0.78,
            SPAN * 0.72,
            FOCUS_AT.z + SPAN * 0.95,
          )
          controls.target.copy(FOCUS_AT)
          handedOver = true
        }
        controls.update()
      }

      renderer.render(scene, camera)
    }
    tick()

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      observer.disconnect()
      renderer.domElement.removeEventListener('click', handleClick)
      walker.dispose()
      measure.dispose()
      controls.dispose()
      draco.dispose()
      renderer.dispose()
      host.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div className="absolute inset-0">
      <div ref={hostRef} className="absolute inset-0" />
      {loaded < 1 && (
        <div className="absolute inset-0 grid place-items-center bg-[#060d13]">
          <div className="text-center">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#4a6b85]">
              Loading {SITE.label}
            </div>
            <div className="mt-3 h-px w-40 bg-[#16293a]">
              <div
                className="h-full bg-[#35c8dc] transition-[width] duration-500"
                style={{ width: `${Math.round(loaded * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
