import { useCallback, useEffect, useState } from 'react'
import Header from './Header.jsx'
import MasterSidebar from './MasterSidebar.jsx'
import Notifications from './Notifications.jsx'
import ChatWidget from '../Assistant/ChatWidget.jsx'
import '../common/common.css'
import './Master.css'


// Below this width the sidebar overlays the page instead of pushing it.
const OVERLAY_QUERY = '(max-width: 1199px)'

// Common page shell: header + sidebar + notifications + AI assistant. Wrap every page with it.
// - `menu`: sidebar items (defaults to SIDEBAR_MENU in config/navigation.js); the active item follows the URL.
// - `assistantContext`: short description of the current page that the assistant uses to answer.
// - `children` may be a function receiving { openNotifications, openAssistant }.
function MasterLayout({ headerActions, breadcrumb, companyLogo, menu, assistantContext = '', notificationCount = 4, className = '', children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(false)

  const closeSidebarOnOverlay = useCallback(() => {
    if (window.matchMedia(OVERLAY_QUERY).matches) setSidebarOpen(false)
  }, [])

  useEffect(() => {
    if (!sidebarOpen) return undefined
    const onKeyDown = (event) => event.key === 'Escape' && closeSidebarOnOverlay()
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [sidebarOpen, closeSidebarOnOverlay])

  const pageApi = {
    openNotifications: () => setNotificationsOpen(true),
    openAssistant: () => setAssistantOpen(true),
  }

  return (
    <div className={`app-shell ${sidebarOpen ? 'is-sidebar-open' : ''} ${className}`.trim()}>
      <Header
        sidebarOpen={sidebarOpen}
        notificationsOpen={notificationsOpen}
        notificationCount={notificationCount}
        onSidebarToggle={() => setSidebarOpen((open) => !open)}
        onNotificationsToggle={() => setNotificationsOpen((open) => !open)}
        actions={headerActions}
        breadcrumb={breadcrumb}
        companyLogo={companyLogo}
      />
      <MasterSidebar show={sidebarOpen} items={menu} onNavigate={closeSidebarOnOverlay} />
      {sidebarOpen && <button type="button" className="app-backdrop app-backdrop--sidebar" aria-label="Close menu" onClick={() => setSidebarOpen(false)} />}
      <Notifications show={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
      <main className="app-main">{typeof children === 'function' ? children(pageApi) : children}</main>
      <ChatWidget context={assistantContext} open={assistantOpen} onOpenChange={setAssistantOpen} />
    </div>
  )
}

export default MasterLayout
