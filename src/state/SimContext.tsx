import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { SimulationEngine } from '../engine/engine'
import { REAL_INTERVAL_MS } from '../engine/constants'
import type { Action, SimState } from '../engine/types'

interface SimContextValue {
  state: SimState
  dispatch: (action: Action) => void
}

const SimContext = createContext<SimContextValue | null>(null)

export function SimProvider({ children }: { children: ReactNode }) {
  const engineRef = useRef<SimulationEngine | null>(null)
  if (engineRef.current === null) engineRef.current = new SimulationEngine()
  const engine = engineRef.current

  const [snapshot, setSnapshot] = useState<SimState>(() => engine.getSnapshot())

  const dispatch = useCallback(
    (action: Action) => {
      engine.dispatch(action)
      setSnapshot(engine.getSnapshot())
    },
    [engine],
  )

  useEffect(() => {
    const iv = setInterval(() => {
      if (!engine.state.running) return
      engine.tick()
      setSnapshot(engine.getSnapshot())
    }, REAL_INTERVAL_MS)
    return () => clearInterval(iv)
  }, [engine])

  return (
    <SimContext.Provider value={{ state: snapshot, dispatch }}>
      {children}
    </SimContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSim(): SimContextValue {
  const ctx = useContext(SimContext)
  if (!ctx) throw new Error('useSim must be used within <SimProvider>')
  return ctx
}
