import { useCallback, useState } from 'react'
import MasterLayout from './Master/MasterLayout.jsx'
import Button from './common/Button.jsx'
import { toastService } from '../services/toastService'
import RouteStatsCard from './vendor/RouteStatsCard.jsx'
import StatusCard from './vendor/StatusCard.jsx'
import AttentionCard from './vendor/AttentionCard.jsx'
import RoutesTable from './vendor/RoutesTable.jsx'
import CabReallocationDrawer from './vendor/CabReallocationDrawer.jsx'
import { ALERTS, ROUTES, ROUTE_METRICS, STATUS_ITEMS } from './vendor/vendorData.js'
import './VendorDashboard.css'

// Plain-text summary of what's on screen, sent to the AI assistant with each question.
const ASSISTANT_CONTEXT = [
  'Page: Vendor > Dashboard',
  `Route counts today: ${ROUTE_METRICS.map((m) => `${m.label} ${m.value}`).join(', ')}`,
  `Status: ${STATUS_ITEMS.map((s) => `${s.label} ${s.value}`).join(', ')}`,
  `Attention: ${ALERTS.newCount} new alerts. Latest: ${ALERTS.items.map((a) => a.text).join(' | ')}`,
  `Routes by shift: ${ROUTES.map((r) => `${r.shift} ${r.tripType} (routes ${r.routes}, allocated ${r.allocated}, driver accepted ${r.driverAccepted}, started ${r.started}, completed ${r.completed}, not started ${r.notStarted}, rejected ${r.rejected})`).join('; ')}`,
].join('\n')

function VendorDashboard() {
  const [activeMetric, setActiveMetric] = useState('total')
  const [tripType, setTripType] = useState('All')
  const [reallocShift, setReallocShift] = useState(null) // shift row whose pencil was clicked
  const closeRealloc = useCallback(() => setReallocShift(null), [])

  const showAllTodayRoutes = () => {
    setActiveMetric('total')
    setTripType('All')
    toastService.info('Showing all today routes')
  }

  return (
    <MasterLayout
      assistantContext={ASSISTANT_CONTEXT}
      headerActions={<Button size="sm" onClick={showAllTodayRoutes}>All Today Routes</Button>}
    >
      <h1 className="sr-only">Vendor Dashboard</h1>

      <div className="vd-summary">
        <RouteStatsCard metrics={ROUTE_METRICS} activeKey={activeMetric} onSelect={setActiveMetric} />
        <StatusCard items={STATUS_ITEMS} />
        <AttentionCard newCount={ALERTS.newCount} items={ALERTS.items} onSelect={() => toastService.info('Opening alert details')} />
      </div>

      <RoutesTable
        routes={ROUTES}
        tripType={tripType}
        onTripTypeChange={setTripType}
        onAddGuard={() => toastService.info('Add Guard/Employee')}
        onEdit={setReallocShift}
      />

      {reallocShift && (
        <CabReallocationDrawer
          key={reallocShift.id}
          shift={reallocShift}
          shifts={ROUTES}
          onClose={closeRealloc}
        />
      )}
    </MasterLayout>
  )
}

export default VendorDashboard
