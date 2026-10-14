import { useEffect } from 'react'
import MaterialIcon from '../Master/MaterialIcon.jsx'

function Toast({ message, onClose, duration = 2800 }) {
  useEffect(() => {
    if (!message) return undefined
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [message, onClose, duration])

  if (!message) return null
  return (
    <div className="toast" role="status">
      <MaterialIcon name="check_circle" />
      <span>{message}</span>
      <button type="button" onClick={onClose} aria-label="Dismiss"><MaterialIcon name="close" /></button>
    </div>
  )
}

export default Toast
