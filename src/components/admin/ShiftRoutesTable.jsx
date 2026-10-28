import { useMemo, useState } from 'react'
import Card from '../common/Card.jsx'
import Button from '../common/Button.jsx'
import IconButton from '../common/IconButton.jsx'
import Pill from '../common/Pill.jsx'
import SearchInput from '../common/SearchInput.jsx'
import Dropdown, { DropdownItem } from '../common/Dropdown.jsx'
import MaterialIcon from '../Master/MaterialIcon.jsx'
import { asset } from '../../utils/asset'
import { toastService } from '../../services/toastService'

const TRIP_TYPES = ['All', 'PICK', 'DROP']
const STATUS_TONE = { Accepted: 'success', Refused: 'warning', 'Driver Rejected': 'danger' }
const ROUTE_FLAGS = [
  { key: 'traffic', label: 'Traffic', icon: 'traffic' },
  { key: 'notAccessible', label: 'Not accessible', icon: 'not_accessible' },
  { key: 'car', label: 'Car', icon: 'directions_car' },
  { key: 'guard', label: 'Guard', image: 'images/shield-account.png' },
  { key: 'medical', label: 'Medical', icon: 'add_circle', danger: true },
]

const matchesQuery = (route, term) => [route.id, route.cabId, route.location, route.driver.name].some((value) => value.toLowerCase().includes(term))

function ToggleCell({ expanded, label, onToggle }) {
  return (
    <td className="nested-table__toggle">
      <button type="button" aria-expanded={expanded} aria-label={`${expanded ? 'Collapse' : 'Expand'} ${label}`} onClick={(event) => { event.stopPropagation(); onToggle() }}>
        <MaterialIcon name={expanded ? 'remove' : 'add'} />
      </button>
    </td>
  )
}

function CountCells({ row, acceptedLabel }) {
  return (
    <>
      <td data-label="Routes"><span className="cell-with-pill">{row.routes}<Pill tone="warning" variant="outline">{row.allocated} Allocated</Pill></span></td>
      <td data-label={acceptedLabel}><span className="cell-with-pill">{row.accepted}{row.refused > 0 && <Pill tone="danger" variant="outline">{row.refused} Refused</Pill>}</span></td>
      <td data-label="Started"><span className="cell-with-pill">{row.started}<Pill tone="success" variant="outline">{row.completed} Completed</Pill></span></td>
      <td data-label="Not Started">{row.notStarted}</td>
      <td data-label="Driver Rejected"><span className={row.driverRejected ? 'text-danger' : ''}>{row.driverRejected}</span></td>
    </>
  )
}

function RouteFlags({ flags }) {
  return (
    <ul className="route-flags" aria-label="Route flags">
      {ROUTE_FLAGS.filter((flag) => flags[flag.key]).map((flag) => (
        <li key={flag.key} title={flag.label} aria-label={flag.label} className={flag.danger ? 'is-danger' : ''}>
          {flag.image ? <img src={asset(flag.image)} alt="" /> : <MaterialIcon name={flag.icon} />}
        </li>
      ))}
    </ul>
  )
}

function RoutesSubTable({ routes, onOpenRoute, onDeleteRoute }) {
  return (
    <table className="nested-table nested-table--routes">
      <thead>
        <tr><th>Route ID</th><th>Total Stops</th><th>Location</th><th>Cab Id</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr>
      </thead>
      <tbody>
        {routes.map((route) => (
          <tr key={route.id}>
            <td data-label="Route ID" className="is-primary">
              <div className="route-id-cell">
                <button type="button" className="link-button" onClick={() => onOpenRoute(route, 'details')}>{route.id}</button>
                <RouteFlags flags={route.flags} />
              </div>
            </td>
            <td data-label="Total Stops">{String(route.stops).padStart(2, '0')}</td>
            <td data-label="Location" className="is-wide">{route.location}</td>
            <td data-label="Cab Id">{route.cabId}</td>
            <td data-label="Status"><Pill tone={STATUS_TONE[route.status] || 'muted'} variant="soft">{route.status}</Pill></td>
            <td className="nested-table__actions">
              <IconButton icon="person_add" label={`Add employee to ${route.id}`} onClick={() => onOpenRoute(route, 'employee')} />
              <Dropdown
                align="end"
                trigger={({ open, toggle }) => <IconButton icon="delete_outline" label={`Remove ${route.id}`} onClick={toggle} aria-expanded={open} />}
              >
                {(close) => (
                  <div className="confirm-menu">
                    <p>Remove route <strong>{route.id}</strong>?</p>
                    <div>
                      <Button size="sm" variant="ghost" onClick={close}>Cancel</Button>
                      <Button size="sm" className="btn--danger" onClick={() => { onDeleteRoute(route); close() }}>Remove</Button>
                    </div>
                  </div>
                )}
              </Dropdown>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// Shift → Vendor → Route drill-down table (Transport Admin).
function ShiftRoutesTable({ shifts, onOpenRoute, onDeleteRoute }) {
  // Everything starts collapsed: only the shift rows show; the + button opens vendors, then routes.
  const [expanded, setExpanded] = useState(() => new Set())
  const [query, setQuery] = useState('')
  const [tripType, setTripType] = useState('All')
  const term = query.trim().toLowerCase()

  // With a search term, keep only matching routes and show them expanded.
  const visibleShifts = useMemo(() => shifts
    .filter((shift) => tripType === 'All' || shift.tripType === tripType)
    .map((shift) => {
      if (!term) return shift
      const vendors = shift.vendors
        .map((vendor) => ({ ...vendor, routeList: vendor.routeList.filter((route) => matchesQuery(route, term)) }))
        .filter((vendor) => vendor.routeList.length > 0)
      return vendors.length ? { ...shift, vendors } : null
    })
    .filter(Boolean), [shifts, tripType, term])

  const isOpen = (key) => Boolean(term) || expanded.has(key)
  const toggle = (key) => setExpanded((current) => {
    const next = new Set(current)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    return next
  })
  const expandAll = () => setExpanded(new Set(shifts.flatMap((shift) => [shift.id, ...shift.vendors.map((vendor) => `${shift.id}/${vendor.vendor}`)])))
  const collapseAll = () => setExpanded(new Set())

  return (
    <Card className="shift-table-card" aria-label="Shift wise routes">
      <div className="routes-toolbar">
        <div className="routes-toolbar__filters">
          <h2 className="card-label">Shift-wise Routes</h2>
          <Dropdown
            trigger={({ open, toggle: toggleMenu }) => (
              <Button variant="ghost" size="sm" icon="filter_alt" onClick={toggleMenu} aria-haspopup="menu" aria-expanded={open}>{tripType === 'All' ? 'All trips' : tripType}</Button>
            )}
          >
            {(close) => TRIP_TYPES.map((type) => (
              <DropdownItem key={type} active={tripType === type} onClick={() => { setTripType(type); close() }}>{type === 'All' ? 'All trips' : type}</DropdownItem>
            ))}
          </Dropdown>
        </div>
        <div className="routes-toolbar__actions">
          <SearchInput value={query} onChange={setQuery} placeholder="Route ID, cab, location, driver" label="Search routes" className="routes-toolbar__search" />
          <div className="routes-toolbar__icons">
            <IconButton icon="unfold_more" label="Expand all" onClick={expandAll} />
            <IconButton icon="unfold_less" label="Collapse all" onClick={collapseAll} />
            <IconButton icon="sync" variant="soft" label="Refresh" onClick={() => toastService.success('Routes refreshed')} />
          </div>
        </div>
      </div>

      <div className="nested-table-wrap">
        <table className="nested-table nested-table--shifts">
          <thead>
            <tr><th><span className="sr-only">Expand</span></th><th>Shift Time</th><th>Routes</th><th>Vendor Accepted</th><th>Started</th><th>Not Started</th><th>Driver Rejected</th></tr>
          </thead>
          <tbody>
            {visibleShifts.length === 0 && <tr className="nested-table__empty"><td colSpan={7}>No routes match your search.</td></tr>}
            {visibleShifts.map((shift) => {
              const shiftOpen = isOpen(shift.id)
              return [
                <tr key={shift.id} className={`nested-row ${shiftOpen ? 'is-expanded' : ''}`} onClick={() => toggle(shift.id)}>
                  <ToggleCell expanded={shiftOpen} label={`shift ${shift.shift}`} onToggle={() => toggle(shift.id)} />
                  <td data-label="Shift Time" className="is-primary">{shift.shift} <small className={`trip-label trip-label--${shift.tripType.toLowerCase()}`}>{shift.tripType === 'DROP' ? 'Drop' : 'Pick'}</small></td>
                  <CountCells row={shift} acceptedLabel="Vendor Accepted" />
                </tr>,
                shiftOpen && (
                  <tr key={`${shift.id}-vendors`} className="nested-child">
                    <td colSpan={7}>
                      <div className="nested-child__inner">
                        <table className="nested-table nested-table--vendors">
                          <thead>
                            <tr><th><span className="sr-only">Expand</span></th><th>Vendor</th><th>Routes</th><th>Accepted</th><th>Started</th><th>Not Started</th><th>Driver Rejected</th></tr>
                          </thead>
                          <tbody>
                            {shift.vendors.map((vendor) => {
                              const key = `${shift.id}/${vendor.vendor}`
                              const vendorOpen = isOpen(key)
                              return [
                                <tr key={key} className={`nested-row ${vendorOpen ? 'is-expanded' : ''}`} onClick={() => toggle(key)}>
                                  <ToggleCell expanded={vendorOpen} label={`vendor ${vendor.vendor}`} onToggle={() => toggle(key)} />
                                  <td data-label="Vendor" className="is-primary"><Pill tone="dark" variant="solid">{vendor.vendor}</Pill></td>
                                  <CountCells row={vendor} acceptedLabel="Accepted" />
                                </tr>,
                                vendorOpen && (
                                  <tr key={`${key}-routes`} className="nested-child">
                                    <td colSpan={7}>
                                      <div className="nested-child__inner">
                                        <RoutesSubTable routes={vendor.routeList} onOpenRoute={onOpenRoute} onDeleteRoute={onDeleteRoute} />
                                      </div>
                                    </td>
                                  </tr>
                                ),
                              ]
                            })}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                ),
              ]
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export default ShiftRoutesTable
