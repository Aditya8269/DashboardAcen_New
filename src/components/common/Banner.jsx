import { useState } from 'react'
import MaterialIcon from '../Master/MaterialIcon.jsx'

const isDismissed = (key) => {
  try {
    return sessionStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

// Dismissible info strip. `storageKey` keeps it hidden for the rest of the browser session.
function Banner({ storageKey, icon = 'campaign', children }) {
  const [hidden, setHidden] = useState(() => (storageKey ? isDismissed(storageKey) : false))
  if (hidden) return null

  const dismiss = () => {
    setHidden(true)
    try {
      if (storageKey) sessionStorage.setItem(storageKey, '1')
    } catch { /* storage unavailable */ }
  }

  return (
    <div className="banner" role="status">
      <MaterialIcon name={icon} className="banner__icon" />
      <p className="banner__text">{children}</p>
      <button type="button" className="banner__close" onClick={dismiss} aria-label="Dismiss message"><MaterialIcon name="close" /></button>
    </div>
  )
}

export default Banner
