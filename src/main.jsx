import { createRoot } from 'react-dom/client'
import './index.css'
import LoginRoute from './components/LoginRoute.jsx'
import App from './App.jsx'
import VendorDashboard from './components/VendorDashboard.jsx'
import { ROUTES } from './config/navigation'
import { Routes, Route, BrowserRouter, Navigate } from 'react-router-dom'

const basePath = import.meta.env.VITE_BASE_PATH || '/'

createRoot(document.getElementById('root')).render(
  <BrowserRouter basename={basePath === '/' ? undefined : basePath.replace(/\/$/, '')}>
    <Routes>
      {/* Admin dashboard is the default page */}
      <Route path={ROUTES.admin} element={<App />} />
      <Route path={ROUTES.vendor} element={<VendorDashboard />} />
      <Route path="/admin" element={<Navigate to={ROUTES.admin} replace />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="*" element={<Navigate to={ROUTES.admin} replace />} />
    </Routes>
  </BrowserRouter>
)
