import { useCallback, useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import Viewport from './components/Viewport'
import AiInsightsCard from './components/AiInsightsCard'
import {
  CornerBrackets,
  Legend,
  ScaleBar,
  StatusStrip,
  ViewportHeader,
} from './components/ViewportChrome'
import { DEFAULT_LAYER_STATE } from './layers'

// Geometry lifted from the Figma frame "Desktop - 1" (1440 x 1024):
//   sidebar   Rectangle 1  x 0    w 218
//   viewport  Rectangle 2  x 282  y 110  1115 x 857
// which leaves a 64px gutter beside the sidebar, 43px right, 57px bottom.
export default function App() {
  const [layers, setLayers] = useState(DEFAULT_LAYER_STATE)
  const [finding, setFinding] = useState(null)
  const [exportState, setExportState] = useState('idle')

  const toggleLayer = useCallback((key) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const handleExport = useCallback(() => {
    // POC stub: stands in for the IFC 4.3 write the backend will do.
    setExportState('working')
  }, [])

  useEffect(() => {
    if (exportState !== 'working') return undefined
    const done = setTimeout(() => setExportState('done'), 1600)
    const reset = setTimeout(() => setExportState('idle'), 4200)
    return () => {
      clearTimeout(done)
      clearTimeout(reset)
    }
  }, [exportState])

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#060d13] text-[#e6f0f7]">
      <Sidebar
        layers={layers}
        onToggle={toggleLayer}
        onExport={handleExport}
        exportState={exportState}
      />

      <main className="relative min-w-0 flex-1 grid-etch">
        {/* Top band above the viewport rect */}
        <div className="absolute inset-x-0 top-0 flex h-[110px] items-end pb-3 pl-16 pr-[43px]">
          <div className="w-full">
            <ViewportHeader />
          </div>
        </div>

        {/* The viewport rect itself */}
        <div className="absolute bottom-[57px] left-16 right-[43px] top-[110px] border border-[#1e3448] bg-[#050b10]">
          <Viewport layers={layers} onPick={setFinding} />

          <CornerBrackets />
          <Legend layers={layers} />
          <ScaleBar />

          {/* Floating AI card — Figma puts this label at the top left */}
          <div className="pointer-events-none absolute left-4 top-4">
            <AiInsightsCard finding={finding} gprActive={layers.gpr} />
          </div>
        </div>

        {/* Bottom band below the viewport rect */}
        <div className="absolute inset-x-0 bottom-0 flex h-[57px] items-center pl-16 pr-[43px]">
          <div className="w-full">
            <StatusStrip layers={layers} />
          </div>
        </div>
      </main>
    </div>
  )
}
