import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { SITE, SENSORS, FINDINGS } from '../site'

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

function buildGpr(pickables) {
  const group = new THREE.Group()

  // Ground line. Without an explicit cut plane the runs float in the dark and
  // the viewer has no way to read them as being under anything.
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(46, 46),
    new THREE.MeshBasicMaterial({
      color: 0x0d2233,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  )
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.02
  ground.name = 'Ground plane'
  group.add(ground)

  // The swept volume, so the buried runs read as measured rather than drawn.
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(46, 3.2, 46),
    new THREE.MeshBasicMaterial({ color: 0xf2a33c, transparent: true, opacity: 0.035 }),
  )
  slab.position.y = -1.6
  group.add(slab)

  FINDINGS.filter((f) => f.kind === 'subsurface').forEach((finding) => {
    const points = finding.path.map(([x, z]) => new THREE.Vector3(x, -finding.depth, z))
    const curve = new THREE.CatmullRomCurve3(points)

    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 96, 0.24, 14, false),
      new THREE.MeshBasicMaterial({ color: 0xf2a33c, transparent: true, opacity: 0.9 }),
    )
    tube.userData = finding
    group.add(tube)
    pickables.push(tube)

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

export default function FusionScene({ beat, progress = 0, onPick, onReady }) {
  const hostRef = useRef(null)
  const stateRef = useRef({ beat, progress })
  stateRef.current = { beat, progress }
  const pickRef = useRef(onPick)
  pickRef.current = onPick
  const readyRef = useRef(onReady)
  readyRef.current = onReady

  const [loaded, setLoaded] = useState(0)

  useEffect(() => {
    const host = hostRef.current
    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x060d13, 70, 190)

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 500)
    camera.position.set(46, 34, 56)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    host.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.maxPolarAngle = Math.PI * 0.495
    controls.minDistance = 10
    controls.maxDistance = 160
    controls.target.set(0, 3, 0)
    controls.enabled = false // unlocked at the last beat

    scene.add(new THREE.AmbientLight(0xffffff, 1.4))
    const key = new THREE.DirectionalLight(0xffffff, 1.1)
    key.position.set(12, 24, 10)
    scene.add(key)

    const grid = new THREE.GridHelper(140, 70, 0x1e3448, 0x122436)
    grid.material.transparent = true
    grid.material.opacity = 0.5
    scene.add(grid)

    const pickables = []
    const groups = {
      lidar: new THREE.Group(),
      rgb: new THREE.Group(),
      thermal: buildThermal(),
      gpr: buildGpr(pickables),
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
        result.scene.traverse((node) => {
          if (node.isMesh) {
            node.material.transparent = true
            meshMaterials.push(node.material)
          }
        })
        groups.rgb.add(captureWrapper(result.scene))
        step()
      },
      undefined,
      (err) => {
        console.error('mesh load failed', err)
        step()
      },
    )

    // LiDAR layer: the decimated point cloud.
    Promise.all([
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

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const handleClick = (event) => {
      if (stateRef.current.beat < 3) return
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects(pickables, false)[0]
      if (hit) pickRef.current?.(hit.object.userData)
    }
    renderer.domElement.addEventListener('click', handleClick)

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = host
      if (!w || !h) return
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(host)
    resize()

    let raf = 0
    let handedOver = false
    const clock = new THREE.Clock()
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const t = clock.getElapsedTime()
      const { beat: b, progress: p } = stateRef.current

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
      const reveal = b < 3 ? 0 : b === 3 ? clamp01(p) : 1
      meshMaterials.forEach((m) => {
        m.opacity = damp(1, 0.16, reveal)
      })
      if (cloudMaterial) cloudMaterial.opacity = damp(0.9, 0.34, reveal)
      groups.gpr.visible = reveal > 0.02
      pickables.forEach((tube, i) => {
        tube.material.opacity = reveal * (0.72 + Math.sin(t * 1.6 + i) * 0.22)
      })
      groups.thermal.children.forEach((c) => {
        if (c.material) c.material.opacity = 0.3 * (b >= 4 ? 1 : reveal)
      })

      // Camera: pushed in over the reveal, handed over at the last beat.
      controls.enabled = b >= 4
      if (b < 4) {
        const ang = t * 0.06 + reveal * 0.5
        const dist = damp(74, 46, reveal)
        const height = damp(38, 17, reveal)
        camera.position.set(Math.sin(ang) * dist, height, Math.cos(ang) * dist)
        camera.lookAt(0, damp(6, 1.2, reveal), 0)
      } else {
        // Compose the hand-over view once, then let the viewer drive.
        if (!handedOver) {
          camera.position.set(19, 12, 22)
          controls.target.set(0, 1.5, -0.6)
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
