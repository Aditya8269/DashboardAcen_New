import { createRoot } from 'react-dom/client'
import './index.css'
import LoginRoute from './components/LoginRoute.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { Routes, Route, BrowserRouter, Navigate } from 'react-router-dom'

const basePath = import.meta.env.VITE_BASE_PATH || '/'

createRoot(document.getElementById('root')).render(
  <BrowserRouter basename={basePath === '/' ? undefined : basePath.replace(/\/$/, '')}>
    <Routes>
      <Route path="/" element={<ProtectedRoute />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
)

   
