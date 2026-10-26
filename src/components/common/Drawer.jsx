import { useEffect, useRef } from 'react'
import MaterialIcon from '../Master/MaterialIcon.jsx'

// Right-side panel (offcanvas) with a dark header bar.
// - `titleExtra`: rendered right after the title (e.g. a small button)
// - `headerExtra`: rendered at the right end, before the close button
// - `belowHeader`: opens under the app header instead of covering it
// - `width`: px, or 'full' for the whole width; `footer`: sticky bottom bar
function Drawer({ open, onClose, title, titleExtra, headerExtra, width = 495, belowHeader = false, footer, className = '', children }) {
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKeyDown)
    panelRef.current?.focus()
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null
  const position = belowHeader ? 'is-below-header' : ''
  return (
    <>
      <button type="button" className={`drawer-backdrop ${position}`.trim()} aria-label="Close panel" onClick={onClose} />
      <aside
        ref={panelRef}
        tabIndex={-1}
        className={`drawer ${position} ${className}`.trim()}
        style={{ '--drawer-w': width === 'full' ? '100vw' : `${width}px` }}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : 'Details'}
      >
        <header className="drawer__head">
          <h2 className="drawer__title">{title}</h2>
          {titleExtra}
          <span className="drawer__spacer" />
          {headerExtra && <div className="drawer__extra">{headerExtra}</div>}
          <button type="button" className="drawer__close" onClick={onClose} aria-label="Close"><MaterialIcon name="close" /></button>
        </header>
        <div className="drawer__body">{children}</div>
        {footer && <footer className="drawer__footer">{footer}</footer>}
      </aside>
    </>
  )
}

export default Drawer
