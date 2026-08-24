import { StatusBar } from './components/StatusBar'
import { SummaryStrip } from './components/SummaryStrip'
import { FlowDiagram } from './components/schematic/FlowDiagram'
import { CasePanel } from './components/panels/CasePanel'
import { EVPanel } from './components/panels/EVPanel'
import { SolarPanel } from './components/panels/SolarPanel'
import { GridPanel } from './components/panels/GridPanel'
import { FaultPanel } from './components/panels/FaultPanel'
import { ClockControls } from './components/panels/ClockControls'
import { ScenarioPanel } from './components/panels/ScenarioPanel'
import { Panel } from './components/ui/Panel'

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-base text-primary">
      <StatusBar />


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

          {/* center — schematic + log */}
          <div className="col-span-12 space-y-3 lg:col-span-6">
            <Panel title="Energy Flow Schematic" bezel>
              <div className="h-[440px] w-full">
                <FlowDiagram />
              </div>
            </Panel>
          </div>

          {/* right — load case + EVs */}
          <div className="col-span-12 space-y-3 lg:col-span-3">
            <CasePanel />
            <EVPanel />
          </div>
        </div>

        <SummaryStrip />
      </main>
    </div>
  )
}
