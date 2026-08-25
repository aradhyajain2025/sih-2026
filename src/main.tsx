import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { SimProvider } from './state/SimContext'
import './index.css'

function InteractiveRoot() {
  React.useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null
      const button = target?.closest('button') as HTMLElement | null
      if (!button) return
      const rect = button.getBoundingClientRect()
      button.style.setProperty('--mx', `${event.clientX - rect.left}px`)
      button.style.setProperty('--my', `${event.clientY - rect.top}px`)
    }

    const onDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null
      const button = target?.closest('button') as HTMLElement | null
      if (!button) return
      const rect = button.getBoundingClientRect()
      const ripple = document.createElement('span')
      ripple.className = 'click-energy-ripple'
      ripple.style.left = `${event.clientX - rect.left}px`
      ripple.style.top = `${event.clientY - rect.top}px`
      button.appendChild(ripple)
      window.setTimeout(() => ripple.remove(), 650)
    }

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerdown', onDown)
    return () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [])

  return <App />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SimProvider>
      <InteractiveRoot />
    </SimProvider>
  </React.StrictMode>,
)
