import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Add some debug logging
console.log('React version:', React.version);
console.log('Mounting app to element:', document.getElementById('root'));

try {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
  console.log('App mounted successfully');
} catch (error) {
  console.error('Failed to mount React application:', error);
  
  // Display a fallback error UI
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif;">
        <h1>Something went wrong</h1>
        <p>The application failed to load. Please check the console for details.</p>
        <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px;">${error instanceof Error ? error.message : String(error)}</pre>
      </div>
    `;
  }
}