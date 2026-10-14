import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { asset } from '../../utils/asset'
import { SIDEBAR_MENU } from '../../config/navigation'
import MaterialIcon from './MaterialIcon.jsx'

const childLabel = (child) => (typeof child === 'string' ? child : child.label)

// Finds the menu item (and child) whose `to` matches the current URL.
const findActive = (items, pathname) => {
  for (const item of items) {
    if (item.to === pathname) return { parent: item.label, child: null }
    const child = item.children?.find((entry) => typeof entry !== 'string' && entry.to === pathname)
    if (child) return { parent: item.label, child: child.label }
  }
  return { parent: null, child: null }
}

function SidebarMenu({ items = SIDEBAR_MENU, onNavigate }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const active = findActive(items, pathname)
  const [openItem, setOpenItem] = useState(active.parent)

  const go = (to) => {
    if (to && to !== pathname) navigate(to)
    onNavigate?.()
  }

  return (
    <div className="sidebar-inner">
      <nav className="sidebar-nav">
        {items.map((item) => {
          const isActive = item.label === active.parent
          const isOpen = openItem === item.label
          return (
            <div className="sidebar-item" key={item.label}>
              <button
                type="button"
                className={`sidebar-link ${isActive ? 'is-active' : ''} ${isOpen ? 'is-open' : ''}`}
                aria-expanded={item.children ? isOpen : undefined}
                aria-current={isActive && !item.children ? 'page' : undefined}
                onClick={() => (item.children ? setOpenItem(isOpen ? null : item.label) : go(item.to))}
              >
                <span className="sidebar-link__icon">
                  {item.image ? <img src={asset(`images/icons/${item.image}`)} alt="" /> : <MaterialIcon name={item.icon} />}
                </span>
                <span className="sidebar-link__label">{item.label}</span>
                {item.children && <MaterialIcon name="expand_more" className="sidebar-link__caret" />}
              </button>
              {item.children && isOpen && (
                <div className="sidebar-submenu">
                  {item.children.map((child) => {
                    const label = childLabel(child)
                    const current = isActive && label === active.child
                    return (
                      <button type="button" key={label} className={current ? 'is-active' : ''} aria-current={current ? 'page' : undefined} onClick={() => go(child.to)}>
                        {label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>
      <div className="sidebar-help">
        <span className="sidebar-help__icon"><MaterialIcon name="help_outline" /></span>
        <strong>Need help?</strong>
        <p>Please connect with our support team.</p>
        <button type="button">GET IN TOUCH</button>
      </div>
    </div>
  )
}

export default SidebarMenu
