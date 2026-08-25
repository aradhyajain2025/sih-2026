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
import { SimulationAtmosphere } from './components/SimulationAtmosphere'
import { useSim } from './state/SimContext'
import { ArrowLeft, Square } from 'lucide-react'

export default function App() {
  const { state, dispatch } = useSim()
  const simulationActive = state.running

  return (
    <div className={`app-shell flex min-h-screen flex-col bg-base text-primary ${simulationActive ? 'simulation-mode' : ''}`}>
      <StatusBar />

      {simulationActive ? (
        <main className="simulation-stage relative flex-1 overflow-hidden p-3 md:p-5">
          <SimulationAtmosphere />
          <div className="simulation-ui relative z-10 mx-auto flex h-full max-w-[1700px] flex-col gap-3">
            <div className="simulation-heading flex items-center justify-between gap-3">
              <div>
                <div className="simulation-kicker">LIVE ENERGY ORCHESTRATION</div>
                <h1 className="simulation-title">Charging Network Simulation</h1>
              </div>
              <div className="simulation-heading-actions">
                <div className="live-chip"><span /> LIVE · THERMAL / POWER LOOP</div>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'SET_RUNNING', value: false })}
                  className="simulation-stop-button"
                  title="Stop simulation and return to dashboard"
                >
                  <Square className="h-3.5 w-3.5" />
                  <span>STOP SIMULATION</span>
                  <ArrowLeft className="h-3 w-3 opacity-60" />
                </button>
              </div>
            </div>

            <div className="simulation-main grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
              <Panel title="Live Energy Flow" bezel className="simulation-flow-panel min-h-[540px] overflow-hidden">
                <div className="simulation-flow-wrap h-full min-h-[500px] w-full">
                  <FlowDiagram />
                  <div className="flow-hud hud-left">POWER ROUTING <b>AUTO</b></div>
                  <div className="flow-hud hud-right">FLOW STATE <b>OPTIMIZED</b></div>
                </div>
              </Panel>

              <aside className="flex min-h-0 flex-col gap-3">
                <CasePanel />
                <EVPanel />
              </aside>
            </div>
          </div>
        </main>
      ) : (
        <main className="flex-1 space-y-3 p-3">
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-12 space-y-3 lg:col-span-3">
              <ClockControls />
              <ScenarioPanel />
              <SolarPanel />
              <GridPanel />
              <FaultPanel />
            </div>

            <div className="col-span-12 space-y-3 lg:col-span-6">
              <Panel title="Energy Flow Schematic" bezel>
                <div className="h-[440px] w-full">
                  <FlowDiagram />
                </div>
              </Panel>
            </div>

            <div className="col-span-12 space-y-3 lg:col-span-3">
              <CasePanel />
              <EVPanel />
            </div>
          </div>

          <SummaryStrip />
        </main>
      )}
    </div>
  )
}
