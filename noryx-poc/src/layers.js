// The four capture modalities NORYX fuses into one model.
// `key` drives both the sidebar toggles and the Three.js scene groups.
export const LAYERS = [
  {
    key: 'drone',
    label: 'Drone',
    sub: 'Photogrammetry mesh',
    color: '#35c8dc',
    detail: '1.8 cm GSD · 412 images',
  },
  {
    key: 'laser',
    label: 'Laser Scan',
    sub: 'Terrestrial LiDAR',
    color: '#8be0a0',
    detail: '14 stations · 62 M pts',
  },
  {
    key: 'gpr',
    label: 'GPR',
    sub: 'Ground penetrating radar',
    color: '#f2a33c',
    detail: '400 MHz · 0–3.2 m depth',
  },
  {
    key: 'magnetometer',
    label: 'Magnetometer',
    sub: 'Ferrous anomaly map',
    color: '#c77dff',
    detail: 'Gradiometer · 0.25 m grid',
  },
]

export const DEFAULT_LAYER_STATE = {
  drone: true,
  laser: true,
  gpr: true,
  magnetometer: false,
}
