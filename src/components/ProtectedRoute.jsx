import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { authorizeCurrentUser, initializeAuth } from '../authConfig'
import App from '../App.jsx'

function ProtectedRoute() {
  const [ready, setReady] = useState(false)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    let active = true

    initializeAuth()
      .then(() => authorizeCurrentUser())
      .then((result) => {
        if (active) setAuthorized(Boolean(result))
      })
      .catch(() => {
        if (active) {
          setAuthorized(false)
          setReady(true)
        }
      })
      .finally(() => {
        if (active) setReady(true)
      })

    return () => { active = false }
  }, [])

  if (!ready) return <div className="auth-loading">Checking your session...</div>

  return authorized ? <App /> : <Navigate to="/login" replace />
}

export default ProtectedRoute
