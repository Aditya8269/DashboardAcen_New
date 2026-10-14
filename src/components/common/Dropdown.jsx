import { useCallback, useRef, useState } from 'react'
import useClickOutside from '../../hooks/useClickOutside'
import MaterialIcon from '../Master/MaterialIcon.jsx'

// `trigger` receives { open, toggle }; `children` may be a function receiving `close`.
function Dropdown({ trigger, children, align = 'start', className = '', menuClassName = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const close = useCallback(() => setOpen(false), [])
  useClickOutside(ref, close, open)

  return (
    <div className={`dropdown ${open ? 'is-open' : ''} ${className}`.trim()} ref={ref}>
      {trigger({ open, toggle: () => setOpen((value) => !value) })}
      {open && (
        <div className={`dropdown__menu dropdown__menu--${align} ${menuClassName}`.trim()} role="menu">
          {typeof children === 'function' ? children(close) : children}
        </div>
      )}
    </div>
  )
}

export function DropdownItem({ icon, active = false, danger = false, onClick, children }) {
  return (
    <button type="button" role="menuitem" className={`dropdown__item ${active ? 'is-active' : ''} ${danger ? 'is-danger' : ''}`.trim()} onClick={onClick}>
      {icon && <MaterialIcon name={icon} />}
      <span>{children}</span>
      {active && <MaterialIcon name="check" className="dropdown__check" />}
    </button>
  )
}

export default Dropdown
