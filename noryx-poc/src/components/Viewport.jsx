import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// Buried service runs the GPR layer reveals. Each entry becomes one tube,
// and clicking one reports it in the AI Insights card.
const SERVICE_RUNS = [
  {
    id: 'pipe-a',
    label: 'Ductile iron main',
    depth: -1.4,
    diameter: '250 mm',
    confidence: 0.94,
    path: [[-9, 2], [-2, 1.2], [3.5, 2.6], [9, 1.8]],
  },
  {
    id: 'pipe-b',
    label: 'PVC storm line',
    depth: -0.9,
    diameter: '400 mm',
    confidence: 0.87,
    path: [[-8, -4], [-1, -3.2], [6, -4.6]],
  },
  {
    id: 'pipe-c',
    label: 'Conduit bank',
    depth: -2.1,
    diameter: '110 mm x 4',
    confidence: 0.79,
    path: [[-4, 6], [-3.4, 0], [-2.6, -7]],
  },
]

// Standing structures: [x, height, width, depth, z]
const STRUCTURES = [
  [-6, 3.2, 2.4, 3.6, 5],
  [1.5, 4.4, 3.2, 4.4, 4.2],
  [7.2, 2.2, 2, 2.6, 3.4],
]

function buildDrone() {
  const group = new THREE.Group()

  // Photogrammetry ground: a lightly displaced wireframe plane.
  const ground = new THREE.PlaneGeometry(26, 20, 42, 32)
  const pos = ground.attributes.position
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    pos.setZ(i, Math.sin(x * 0.35) * 0.22 + Math.cos(y * 0.4) * 0.18)
  }
  ground.computeVertexNormals()
  const mesh = new THREE.Mesh(
    ground,
    new THREE.MeshBasicMaterial({
      color: 0x35c8dc,
      wireframe: true,
      transparent: true,
      opacity: 0.16,
    }),
  )
  mesh.rotation.x = -Math.PI / 2
  group.add(mesh)

  STRUCTURES.forEach(([x, h, w, d, z]) => {
    const geo = new THREE.BoxGeometry(w, h, d)
    const solid = new THREE.Mesh(
      geo,
      new THREE.MeshBasicMaterial({ color: 0x0f2b3c, transparent: true, opacity: 0.85 }),
    )
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: 0x35c8dc, transparent: true, opacity: 0.55 }),
    )
    solid.position.set(x, h / 2, z - 6)
    edges.position.copy(solid.position)
    group.add(solid, edges)
  })

  return group
}

function buildLaser() {
  // Terrestrial LiDAR return: a dense point shell wrapped around the structures.
  const count = 9000
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i += 1) {
    const [x, h, w, d, z] = STRUCTURES[Math.floor(Math.random() * STRUCTURES.length)]
    const t = Math.random()
    const side = Math.floor(Math.random() * 4)
    const cz = z - 6
    let px = x
    let pz = cz
    if (side === 0) {
      px = x - w / 2 + t * w
      pz = cz - d / 2
    } else if (side === 1) {
      px = x - w / 2 + t * w
      pz = cz + d / 2
    } else if (side === 2) {
      px = x - w / 2
      pz = cz - d / 2 + t * d
    } else {
      px = x + w / 2
      pz = cz - d / 2 + t * d
    }
    positions[i * 3] = px + (Math.random() - 0.5) * 0.08
    positions[i * 3 + 1] = Math.random() * h
    positions[i * 3 + 2] = pz + (Math.random() - 0.5) * 0.08
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  return new THREE.Points(
    geo,
    new THREE.PointsMaterial({ color: 0x8be0a0, size: 0.045, transparent: true, opacity: 0.75 }),
  )
}

function buildGpr(pickables) {
  const group = new THREE.Group()

  // Excavation slab: the volume the radar actually swept.
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(26, 3.2, 20),
    new THREE.MeshBasicMaterial({ color: 0xf2a33c, transparent: true, opacity: 0.045 }),
  )
  slab.position.y = -1.6
  group.add(slab)

  SERVICE_RUNS.forEach((run) => {
    const curve = new THREE.CatmullRomCurve3(
      run.path.map(([x, z]) => new THREE.Vector3(x, run.depth, z)),
    )
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 64, 0.16, 10, false),
      new THREE.MeshBasicMaterial({ color: 0xf2a33c, transparent: true, opacity: 0.85 }),
    )
    tube.userData = run
    group.add(tube)
    pickables.push(tube)
  })

  return group
}

function buildMagnetometer() {
  const group = new THREE.Group()
  // [x, y, z, radius] of each ferrous anomaly.
  const anomalies = [
    [-3.6, -1.1, 4.2, 1.1],
    [4.8, -1.8, -2.4, 0.8],
    [-7.4, -0.8, -5.2, 0.6],
  ]
  anomalies.forEach(([x, y, z, r]) => {
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(r, 20, 16),
      new THREE.MeshBasicMaterial({ color: 0xc77dff, transparent: true, opacity: 0.22 }),
    )
    core.position.set(x, y, z)
    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(r * 1.6, 16, 12),
      new THREE.MeshBasicMaterial({
        color: 0xc77dff,
        wireframe: true,
        transparent: true,
        opacity: 0.14,
      }),
    )
    shell.position.copy(core.position)
    group.add(core, shell)
  })
  return group
}

export default function Viewport({ layers, onPick }) {
  const hostRef = useRef(null)

  // Live refs so the animation loop reads current props without re-creating the scene.
  const layersRef = useRef(layers)
  layersRef.current = layers
  const pickRef = useRef(onPick)
  pickRef.current = onPick

  useEffect(() => {
    const host = hostRef.current
    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x060d13, 26, 62)

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 400)
    camera.position.set(16, 12, 20)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    host.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.maxPolarAngle = Math.PI * 0.495
    controls.minDistance = 8
    controls.maxDistance = 60
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.35

    const grid = new THREE.GridHelper(60, 60, 0x1e3448, 0x122436)
    grid.material.transparent = true
    grid.material.opacity = 0.6
    scene.add(grid)

    const pickables = []
    const groups = {
      drone: buildDrone(),
      laser: buildLaser(),
      gpr: buildGpr(pickables),
      magnetometer: buildMagnetometer(),
    }
    Object.values(groups).forEach((group) => scene.add(group))

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const handleClick = (event) => {
      if (!layersRef.current.gpr) return
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects(pickables, false)[0]
      if (hit) pickRef.current(hit.object.userData)
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
    const clock = new THREE.Clock()
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const t = clock.getElapsedTime()

      Object.entries(groups).forEach(([key, group]) => {
        group.visible = Boolean(layersRef.current[key])
      })

      // Buried runs pulse so they stay readable against the dark ground.
      pickables.forEach((tube) => {
        tube.material.opacity = 0.72 + Math.sin(t * 1.6) * 0.22
      })

      controls.update()
      renderer.render(scene, camera)
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      renderer.domElement.removeEventListener('click', handleClick)
      controls.dispose()
      renderer.dispose()
      host.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={hostRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />
}
