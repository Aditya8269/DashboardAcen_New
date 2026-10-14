import { useEffect, useRef } from 'react'
import MaterialIcon from '../Master/MaterialIcon.jsx'

// Right-side panel (offcanvas). `title` / `headerExtra` render in the dark header bar.
function Drawer({ open, onClose, title, headerExtra, width = 495, className = '', children }) {
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKeyDown)
    panelRef.current?.focus()
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null
  return (
    <>
      <button type="button" className="drawer-backdrop" aria-label="Close panel" onClick={onClose} />
      <aside ref={panelRef} tabIndex={-1} className={`drawer ${className}`.trim()} style={{ '--drawer-w': `${width}px` }} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : 'Details'}>
        <header className="drawer__head">
          <h2 className="drawer__title">{title}</h2>
          {headerExtra && <div className="drawer__extra">{headerExtra}</div>}
          <button type="button" className="drawer__close" onClick={onClose} aria-label="Close"><MaterialIcon name="close" /></button>
        </header>
        <div className="drawer__body">{children}</div>
      </aside>
    </>
  )
}

export default Drawer
