import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Simple app provider for template purposes
function Providers({ children }: { children: React.ReactNode }) {
  return (
    <React.Fragment>
      {children}
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Providers>
        <App />
      </Providers>
    </BrowserRouter>
  </React.StrictMode>,
)