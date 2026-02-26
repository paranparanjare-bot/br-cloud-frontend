import React from 'react'
import ReactDOM from 'react-dom/client'
// KITA GANTI IMPORT-NYA KE HashRouter
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* HAPUS BrowserRouter dan basename, GANTI JADI HashRouter */}
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
)