import { useEffect, useState } from 'react'
import { useSim } from '../state/SimContext'

export function SimulationAtmosphere() {
  const { state } = useSim()
  const [pulses, setPulses] = useState(0)

  useEffect(() => {
    if (!state.running) return
    const id = window.setInterval(() => setPulses((v) => (v + 1) % 4), 1100)
    return () => window.clearInterval(id)
  }, [state.running])

  if (!state.running) return null

  return (
    <div className="simulation-atmosphere" aria-hidden="true">
      <div className="energy-grid" />
      <div className="energy-orbit orbit-a" />
      <div className="energy-orbit orbit-b" />
      <div className="charging-core">
        <span className="core-ring ring-1" />
        <span className="core-ring ring-2" />
        <span className="core-ring ring-3" />
        <span className="core-dot" />
      </div>
      <div className="charge-stream stream-one" />
      <div className="charge-stream stream-two" />
      <div className="charge-stream stream-three" />
      <div className="energy-particles">
        {Array.from({ length: 24 }).map((_, i) => (
          <i key={i} className={`energy-particle particle-${(i % 8) + 1}`} />
        ))}
      </div>
      <div className={`charge-pulse pulse-${pulses}`} />
      <div className="ambient-scan scan-a" />
      <div className="ambient-scan scan-b" />
      <div className="ambient-data data-left"><b>PV</b><span>HARVESTING</span><i /></div>
      <div className="ambient-data data-right"><b>EV</b><span>CHARGING</span><i /></div>
      <div className="ambient-beam beam-a" />
      <div className="ambient-beam beam-b" />
      <div className="simulation-vignette" />
    </div>
  )
}
