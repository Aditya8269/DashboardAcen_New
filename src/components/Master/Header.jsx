import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getCurrentUser, signOut } from '../../authConfig'
import { asset, padNumber } from '../../utils/asset'
import { DASHBOARDS } from '../../config/navigation'
import Dropdown, { DropdownItem } from '../common/Dropdown.jsx'
import MaterialIcon from './MaterialIcon.jsx'
import CalendarPicker from './CalendarPicker.jsx'
import LocationPicker from './LocationPicker.jsx'

const today = () => new Date().toLocaleDateString('en-CA')

// Common header for every page.
// Optional: `breadcrumb` ({ section, title }), `companyLogo` (path in /public), page specific `actions`.
function Header({ sidebarOpen, notificationsOpen, notificationCount = 0, onSidebarToggle, onNotificationsToggle, actions, breadcrumb, companyLogo }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [date, setDate] = useState(today)
  const [location, setLocation] = useState('BLR - WTC')
  const account = getCurrentUser()?.profile
  const userName = account?.name || 'John Doe'
  const initials = userName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()

  const handleLogout = () => {
    signOut()
    navigate('/login', { replace: true })
  }

  return (
    <header className="app-header">
      <div className="app-header__brand">
        <button type="button" className="app-header__menu" onClick={onSidebarToggle} aria-label={sidebarOpen ? 'Close menu' : 'Open menu'} aria-expanded={sidebarOpen} aria-controls="app-sidebar">
          <MaterialIcon name={sidebarOpen ? 'menu_open' : 'menu'} />
        </button>
        <Link to="/" className="app-header__logo"><img src={asset('images/logo.svg')} alt="eTMS" /></Link>
      </div>

      <div className="app-header__context">
        {breadcrumb && (
          <div className="header-segment header-segment--breadcrumb">
            <nav aria-label="Breadcrumb" className="header-breadcrumb">
              <small>Etms <MaterialIcon name="chevron_right" /> {breadcrumb.section}</small>
              <strong>{breadcrumb.title}</strong>
            </nav>
          </div>
        )}
        <div className="header-segment"><CalendarPicker value={date} onChange={setDate} /></div>
        <div className="header-segment"><LocationPicker value={location} onChange={setLocation} /></div>
        {actions && <div className="header-segment header-segment--actions">{actions}</div>}
      </div>

      <div className="app-header__user">
        {companyLogo && <img className="header-company-logo" src={asset(companyLogo)} alt="Company" />}

        <Dropdown
          align="end"
          className="header-apps"
          trigger={({ open, toggle }) => (
            <button type="button" className={`header-bell ${open ? 'is-active' : ''}`} onClick={toggle} aria-label="Switch dashboard" aria-haspopup="menu" aria-expanded={open}>
              <MaterialIcon name="grid_view" />
            </button>
          )}
        >
          {(close) => (
            <>
              <p className="dropdown__title">Dashboards</p>
              {DASHBOARDS.map((item) => (
                <DropdownItem key={item.to} icon={item.icon} active={pathname === item.to} onClick={() => { navigate(item.to); close() }}>{item.label}</DropdownItem>
              ))}
            </>
          )}
        </Dropdown>

        <button type="button" className={`header-bell ${notificationsOpen ? 'is-active' : ''}`} onClick={onNotificationsToggle} aria-label={`Notifications (${notificationCount} unread)`} aria-expanded={notificationsOpen}>
          <MaterialIcon name="notifications_none" />
          {notificationCount > 0 && <span className="header-bell__badge">{padNumber(notificationCount)}</span>}
        </button>

        <Dropdown
          align="end"
          className="header-profile-wrap"
          trigger={({ open, toggle }) => (
            <button type="button" className="header-profile" onClick={toggle} aria-haspopup="menu" aria-expanded={open}>
              <span className="avatar">{initials}</span>
              <strong className="header-profile__name">{userName}</strong>
              <MaterialIcon name="keyboard_arrow_down" className="header-profile__caret" />
            </button>
          )}
        >
          {(close) => (
            <>
              <div className="profile-menu__head">
                <span className="avatar avatar--lg">{initials}</span>
                <div><strong>{userName}</strong><small>{account?.upn || account?.email || 'eTMS user'}</small></div>
              </div>
              <DropdownItem icon="person_outline" onClick={close}>My Profile</DropdownItem>
              <DropdownItem icon="menu_book" onClick={close}>Help Documents</DropdownItem>
              <div className="dropdown__divider" />
              <DropdownItem icon="logout" danger onClick={handleLogout}>Logout</DropdownItem>
            </>
          )}
        </Dropdown>
      </div>
    </header>
  )
}

export default Header
