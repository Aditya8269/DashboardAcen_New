import { useCallback, useState } from 'react'
import MasterLayout from './Master/MasterLayout.jsx'
import Button from './common/Button.jsx'
import Banner from './common/Banner.jsx'
import Toast from './common/Toast.jsx'
import RouteStatsCard from './vendor/RouteStatsCard.jsx'
import StatusCard from './vendor/StatusCard.jsx'
import AttentionCard from './vendor/AttentionCard.jsx'
import ShiftRoutesTable from './admin/ShiftRoutesTable.jsx'
import RouteDetailDrawer from './admin/RouteDetailDrawer.jsx'
import { ADMIN_ALERTS, ADMIN_METRICS, ADMIN_STATUS, SHIFTS } from './admin/adminData.js'
import './VendorDashboard.css'
import './AdminDashboard.css'

const findRoute = (shifts, routeId) => {
  for (const shift of shifts) {
    for (const vendor of shift.vendors) {
      const route = vendor.routeList.find((item) => item.id === routeId)
      if (route) return route
    }
  }
  return null
}

// Applies `transform` to every vendor's route list, dropping vendor groups that become empty.
const mapRoutes = (shifts, transform) => shifts.map((shift) => ({
  ...shift,
  vendors: shift.vendors.map((vendor) => ({ ...vendor, routeList: transform(vendor.routeList, vendor, shift) })).filter((vendor) => vendor.routeList.length > 0),
}))

const buildAssistantContext = (shifts) => [
  'Page: Transport Admin > Dashboard (admin view across all vendors)',
  `Route counts today: ${ADMIN_METRICS.map((m) => `${m.label} ${m.value}`).join(', ')}`,
  `Status: ${ADMIN_STATUS.map((s) => `${s.label} ${s.value}`).join(', ')}`,
  `Attention: ${ADMIN_ALERTS.newCount} new alerts. Latest: ${ADMIN_ALERTS.items.map((a) => a.text).join(' | ')}`,
  `Shifts: ${shifts.map((s) => `${s.shift} ${s.tripType} (routes ${s.routes}, allocated ${s.allocated}, vendor accepted ${s.accepted}, refused ${s.refused}, started ${s.started}, completed ${s.completed}, not started ${s.notStarted}, driver rejected ${s.driverRejected}; vendors ${s.vendors.map((v) => v.vendor).join('/')})`).join('; ')}`,
  'Admin actions on a route: Re assign (vendor + vehicle type), Add New Employee (employee ID, remarks, Pick Up/Drop), Clear Geofence, remove route.',
].join('\n')

function AdminDashboard() {
  const [shifts, setShifts] = useState(SHIFTS)
  const [activeMetric, setActiveMetric] = useState('total')
  const [selected, setSelected] = useState(null) // { routeId, action }
  const [notice, setNotice] = useState('')
  const clearNotice = useCallback(() => setNotice(''), [])
  const closeDrawer = useCallback(() => setSelected(null), [])

  const selectedRoute = selected ? findRoute(shifts, selected.routeId) : null

  const updateRoute = (routeId, patch) => setShifts((current) => {
    const route = findRoute(current, routeId)
    if (!route) return current
    const updated = { ...route, ...patch }

    // Reassigning to another vendor moves the route into that vendor's group within the same shift.
    if (patch.vendor && patch.vendor !== route.vendor) {
      const withoutRoute = mapRoutes(current, (routes) => routes.filter((item) => item.id !== routeId))
      return withoutRoute.map((shift) => {
        if (shift.shift !== route.shift || shift.tripType !== route.tripType) return shift
        const hasVendor = shift.vendors.some((vendor) => vendor.vendor === patch.vendor)
        const vendors = hasVendor
          ? shift.vendors.map((vendor) => (vendor.vendor === patch.vendor ? { ...vendor, routeList: [...vendor.routeList, updated] } : vendor))
          : [...shift.vendors, { vendor: patch.vendor, routes: 1, allocated: 1, accepted: 0, refused: 0, started: 0, completed: 0, notStarted: 1, driverRejected: 0, routeList: [updated] }]
        return { ...shift, vendors }
      })
    }
    return mapRoutes(current, (routes) => routes.map((item) => (item.id === routeId ? updated : item)))
  })

  const deleteRoute = (route) => {
    setShifts((current) => mapRoutes(current, (routes) => routes.filter((item) => item.id !== route.id)))
    setNotice(`Route ${route.id} removed`)
  }

  const refreshAll = () => {
    setShifts(SHIFTS)
    setActiveMetric('total')
    setNotice('All data refreshed successfully')
  }

  return (
    <MasterLayout
      breadcrumb={{ section: 'Transport Admin', title: 'Transport Admin' }}
      companyLogo="images/accenture-logo.png"
      assistantContext={buildAssistantContext(shifts)}
      headerActions={(
        <div className="header-action-group">
          <Button size="sm" onClick={() => { setActiveMetric('total'); setNotice('Showing all today routes') }}>All Today Routes</Button>
          <Button size="sm" variant="outline-dark" icon="refresh" className="btn--collapse-label" onClick={refreshAll}>Refresh All</Button>
        </div>
      )}
    >
      {({ openNotifications, openAssistant }) => (
        <>
          <h1 className="sr-only">Transport Admin Dashboard</h1>

          <Banner storageKey="etms-admin-welcome">
            Welcome to The Transport Management System. In case you have any query or need support please{' '}
            <button type="button" className="banner__link" onClick={openAssistant}>click here.</button>
          </Banner>

          <div className="vd-summary">
            <RouteStatsCard metrics={ADMIN_METRICS} activeKey={activeMetric} onSelect={setActiveMetric} />
            <StatusCard items={ADMIN_STATUS} />
            <AttentionCard newCount={ADMIN_ALERTS.newCount} items={ADMIN_ALERTS.items} onSelect={openNotifications} onViewAll={openNotifications} />
          </div>

          <ShiftRoutesTable
            shifts={shifts}
            onOpenRoute={(route, action) => setSelected({ routeId: route.id, action })}
            onDeleteRoute={deleteRoute}
            onNotify={setNotice}
          />

          {selectedRoute && (
            <RouteDetailDrawer
              key={`${selectedRoute.id}-${selected.action}`}
              route={selectedRoute}
              initialAction={selected.action}
              onClose={closeDrawer}
              onUpdateRoute={updateRoute}
              onNotify={setNotice}
            />
          )}

          <Toast message={notice} onClose={clearNotice} />
        </>
      )}
    </MasterLayout>
  )
}

export default AdminDashboard
