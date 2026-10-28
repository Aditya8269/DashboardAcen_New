import { useEffect, useRef, useState } from 'react'
import Drawer from '../common/Drawer.jsx'
import Button from '../common/Button.jsx'
import Pill from '../common/Pill.jsx'
import FormField from '../common/FormField.jsx'
import MaterialIcon from '../Master/MaterialIcon.jsx'
import { asset } from '../../utils/asset'
import { VENDORS, VEHICLE_TYPES } from './adminData.js'
import { toastService } from '../../services/toastService'

const ACTIONS = [
  { key: 'assign', label: 'Re assign', icon: 'swap_horiz', variant: 'primary' },
  { key: 'employee', label: 'Add New Employee', icon: 'person_add', variant: 'outline-success' },
  { key: 'geofence', label: 'Clear Geofence', icon: 'location_off', variant: 'outline-dark' },
]

const LOG_HISTORY = [
  { at: '06/02/2023 16:05:05', text: 'Route accepted by vendor' },
  { at: '06/02/2023 15:42:10', text: 'Cab assigned' },
  { at: '06/02/2023 15:30:00', text: 'Route created by system' },
]

function ReassignForm({ route, onCancel, onSave }) {
  const [vendor, setVendor] = useState('')
  const [vehicleType, setVehicleType] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const submit = (event) => {
    event.preventDefault()
    setSubmitted(true)
    if (vendor && vehicleType) onSave({ vendor, vehicleType })
  }

  return (
    <form className="drawer-form" onSubmit={submit} noValidate>
      <FormField label="Vendor" htmlFor="reassign-vendor" error={submitted && !vendor ? 'Select a vendor' : ''}>
        <select id="reassign-vendor" className="form-control" value={vendor} onChange={(event) => setVendor(event.target.value)}>
          <option value="">Select Vendor</option>
          {VENDORS.filter((name) => name !== route.vendor).map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
      </FormField>
      <FormField label="Vehicle Type" htmlFor="reassign-vehicle" error={submitted && !vehicleType ? 'Select a vehicle type' : ''}>
        <select id="reassign-vehicle" className="form-control" value={vehicleType} onChange={(event) => setVehicleType(event.target.value)}>
          <option value="">Vehicle Type</option>
          {VEHICLE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
      </FormField>
      <div className="drawer-form__actions">
        <Button variant="outline-dark" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="btn--success">Save</Button>
      </div>
    </form>
  )
}

function AddEmployeeForm({ route, onCancel, onSave }) {
  const [employeeId, setEmployeeId] = useState('')
  const [remarks, setRemarks] = useState('')
  const [tripType, setTripType] = useState(route.tripType === 'DROP' ? 'Drop' : 'Pick Up')
  const [submitted, setSubmitted] = useState(false)
  const idError = submitted && !/^\w{4,}$/.test(employeeId.trim()) ? 'Enter a valid employee ID' : ''

  const submit = (event) => {
    event.preventDefault()
    setSubmitted(true)
    if (/^\w{4,}$/.test(employeeId.trim())) onSave({ employeeId: employeeId.trim(), remarks, tripType })
  }

  return (
    <form className="drawer-form" onSubmit={submit} noValidate>
      <FormField label="Employee ID" htmlFor="employee-id" error={idError}>
        <input id="employee-id" className="form-control" placeholder="Enter Employee ID" value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} />
      </FormField>
      <FormField label="Remarks" htmlFor="employee-remarks">
        <input id="employee-remarks" className="form-control" placeholder="Enter Remarks" value={remarks} onChange={(event) => setRemarks(event.target.value)} />
      </FormField>
      <div className="segmented" role="radiogroup" aria-label="Trip type">
        {['Pick Up', 'Drop'].map((option) => (
          <button key={option} type="button" role="radio" aria-checked={tripType === option} className={tripType === option ? 'is-active' : ''} onClick={() => setTripType(option)}>{option}</button>
        ))}
      </div>
      <div className="drawer-form__actions">
        <Button variant="outline-dark" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="btn--success">Save</Button>
      </div>
    </form>
  )
}

function ClearGeofence({ onDone }) {
  const doneRef = useRef(onDone)
  useEffect(() => {
    doneRef.current = onDone
  })
  useEffect(() => {
    const timer = setTimeout(() => doneRef.current(), 1600)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="geofence-progress" role="status">
      <div className="progress-bar"><span /></div>
      <p>Clearing Geofencing..</p>
    </div>
  )
}

// Route details panel opened from a Route ID. `initialAction` opens a form straight away.
function RouteDetailDrawer({ route, initialAction, onClose, onUpdateRoute }) {
  const [action, setAction] = useState(initialAction === 'details' ? null : initialAction)
  const [showLog, setShowLog] = useState(false)

  if (!route) return null

  const details = [
    ['Vendor Name', route.vendor],
    ['Shift', route.shift],
    ['Stop', String(route.stops).padStart(2, '0')],
    ['Location', route.location, 'is-full'],
    ['Driver Name', <>{route.driver.name}<small>{route.driver.id}</small></>],
    ['Contact', route.driver.contact],
    ['Licence No.', route.licenceNo],
    ['Licence Exp Date', route.licenceExp],
    ['Vehicle Reg No.', route.vehicleReg],
    ['Vehicle Type', route.vehicleType],
    ['Badge No.', route.badgeNo],
    ['Badge Exp Date', route.badgeExp],
  ]

  const finish = (message) => {
    setAction(null)
    toastService.success(message)
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={route.id}
      headerExtra={(
        <>
          {route.flags.guard && <img className="drawer-guard" src={asset('images/shield-account.png')} alt="Guard on trip" title="Guard on trip" />}
          <Pill tone="muted" variant="soft" className="drawer-trip">{route.tripType}</Pill>
        </>
      )}
    >
      {route.geofenceCleared && <div className="cutoff-alert"><MaterialIcon name="where_to_vote" /> Geofencing Cleared</div>}

      <div className="detail-card">
        <dl className="detail-grid">
          {details.map(([label, value, className]) => (
            <div key={label} className={className}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="detail-card detail-card--muted">
        <p className="detail-card__meta">{route.lastUpdated.at}</p>
        <p className="detail-card__by">Last updated by {route.lastUpdated.by}</p>
        <button type="button" className="link-button" onClick={() => setShowLog((value) => !value)} aria-expanded={showLog}>{showLog ? 'Hide Log History' : 'Show Log History'}</button>
        {showLog && (
          <ul className="log-list">
            {LOG_HISTORY.map((entry) => <li key={entry.at}><small>{entry.at}</small>{entry.text}</li>)}
          </ul>
        )}
      </div>

      <div className="drawer-actions">
        {ACTIONS.map((item) => (
          <Button key={item.key} size="md" variant={item.variant} icon={item.icon} className={action === item.key ? 'is-current' : ''} aria-pressed={action === item.key} onClick={() => setAction(action === item.key ? null : item.key)}>
            {item.label}
          </Button>
        ))}
      </div>

      {action === 'assign' && (
        <ReassignForm
          key={`assign-${route.id}`}
          route={route}
          onCancel={() => setAction(null)}
          onSave={({ vendor, vehicleType }) => {
            onUpdateRoute(route.id, { vendor, vehicleType })
            finish(`${route.id} reassigned to ${vendor}`)
          }}
        />
      )}
      {action === 'employee' && (
        <AddEmployeeForm
          key={`employee-${route.id}`}
          route={route}
          onCancel={() => setAction(null)}
          onSave={({ employeeId, tripType }) => finish(`Employee ${employeeId} added to ${route.id} (${tripType})`)}
        />
      )}
      {action === 'geofence' && (
        <ClearGeofence
          key={`geofence-${route.id}`}
          onDone={() => {
            onUpdateRoute(route.id, { geofenceCleared: true })
            finish(`Geofencing cleared for ${route.id}`)
          }}
        />
      )}
    </Drawer>
  )
}

export default RouteDetailDrawer
