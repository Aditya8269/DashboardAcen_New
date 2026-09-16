import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { authorizeCurrentUser, initializeAuth } from '../authConfig'
import Login from './Login.jsx'

function LoginRoute() {
  const [checking, setChecking] = useState(true)
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    let active = true

    initializeAuth()
      .then(() => authorizeCurrentUser())
      .then((result) => {
        if (active) setHasSession(Boolean(result))
      })
      .catch(() => {
        if (active) setHasSession(false)
      })
      .finally(() => {
        if (active) setChecking(false)
      })

    return () => { active = false }
  }, [])

  if (checking) return <div className="auth-loading">Checking your session...</div>
  return hasSession ? <Navigate to="/" replace /> : <Login />
}

export default LoginRoute