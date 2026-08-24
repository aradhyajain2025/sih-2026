import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { SimProvider } from './state/SimContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SimProvider>
      <App />
    </SimProvider>
  </React.StrictMode>,
)
