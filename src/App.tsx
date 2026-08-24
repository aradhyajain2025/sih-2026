import { useState } from 'react'
import { StatusBar } from './components/StatusBar'
import { SummaryStrip } from './components/SummaryStrip'
import { FlowDiagram } from './components/schematic/FlowDiagram'
import { ControllerPanel } from './components/panels/ControllerPanel'
import { NoveltyPanel } from './components/panels/NoveltyPanel'
import { EVPanel } from './components/panels/EVPanel'
import { BatteryPanel } from './components/panels/BatteryPanel'
import { SolarPanel } from './components/panels/SolarPanel'
import { GridPanel } from './components/panels/GridPanel'
import { FaultPanel } from './components/panels/FaultPanel'
import { ClockControls } from './components/panels/ClockControls'
import { ScenarioPanel } from './components/panels/ScenarioPanel'
import { DecisionLog } from './components/panels/DecisionLog'
import { Panel } from './components/ui/Panel'

export default function App() {
  const [tab] = useState<'console'>('console')

  return (
    <div className="flex min-h-screen flex-col bg-base text-primary">
      <StatusBar />

      {/* tab nav */}
      <nav className="flex items-center gap-1 border-b border-hairline bg-panel px-3">
        <button
          className={`border-b-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] ${
            tab === 'console'
              ? 'border-grid text-primary'
              : 'border-transparent text-muted'
          }`}
        >
          Live Console
        </button>
        <span className="cursor-not-allowed border-b-2 border-transparent px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted/50">
          Analytics · Phase 2
        </span>
      </nav>

      <main className="flex-1 space-y-3 p-3">
        <div className="grid grid-cols-12 gap-3">
          {/* left — controls */}
          <div className="col-span-12 space-y-3 lg:col-span-3">
            <ClockControls />
            <ScenarioPanel />
            <SolarPanel />
            <GridPanel />
            <FaultPanel />
          </div>

          {/* center — controller + schematic + log */}
          <div className="col-span-12 space-y-3 lg:col-span-6">
            <ControllerPanel />
            <Panel title="Energy Flow Schematic" bezel>
              <div className="h-[440px] w-full">
                <FlowDiagram />
              </div>
            </Panel>
            <DecisionLog />
          </div>

          {/* right — EVs, batteries */}
          <div className="col-span-12 space-y-3 lg:col-span-3">
            <EVPanel />
            <BatteryPanel />
          </div>
        </div>

        {/* full-width novelty band */}
        <NoveltyPanel />

        <SummaryStrip />
      </main>
    </div>
  )
}
