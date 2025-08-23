import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles.css'
import ScrollToTop from './components/ScrollToTop' // ✅ الاستدعاء هنا

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ScrollToTop />   {/* ✅ ضيفه هنا */}
    <App />
  </BrowserRouter>
)
