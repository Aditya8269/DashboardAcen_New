import SidebarMenu from './SidebarMenu.jsx'

function MasterSidebar({ show, items, onNavigate }) {
  return (
    <aside id="app-sidebar" className={`app-sidebar ${show ? 'is-open' : ''}`} aria-label="Main navigation" aria-hidden={!show} inert={!show}>
      <SidebarMenu items={items} onNavigate={onNavigate} />
    </aside>
  )
}

export default MasterSidebar
