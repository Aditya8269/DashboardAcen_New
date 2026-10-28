import { useEffect, useRef, useState } from 'react'
import Drawer from '../common/Drawer.jsx'
import Button from '../common/Button.jsx'
import FormField from '../common/FormField.jsx'
import MaterialIcon from '../Master/MaterialIcon.jsx'
import { FACILITIES, TRIP_TYPES, getAvailableCabs, getShiftRoutes } from './reallocationData.js'
import { toastService } from '../../services/toastService'

const today = () => new Date().toLocaleDateString('en-CA')

function Checkbox({ checked, indeterminate = false, onChange, label }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate
  }, [indeterminate])
  return <input ref={ref} type="checkbox" className="check" checked={checked} onChange={onChange} aria-label={label} />
}

function RouteFlags({ flags }) {
  return (
    <span className="realloc-flags">
      {flags.verified && <span className="realloc-flag realloc-flag--ok" title="Verified"><MaterialIcon name="check" /></span>}
      {flags.guard && <span className="realloc-flag realloc-flag--guard" title="Guard"><MaterialIcon name="shield" /></span>}
      {flags.medical && <span className="realloc-flag realloc-flag--medical" title="Medical"><MaterialIcon name="add" /></span>}
    </span>
  )
}

// Cab Reallocation panel, opened from a shift row's edit (pencil) button.
// Step 1: pick route(s) → step 2: the cab table slides up → pick a cab → Reallocate.
function CabReallocationDrawer({ shift, shifts, onClose }) {
  const [filters, setFilters] = useState({ date: today(), facility: FACILITIES[0], shift: shift.shift, tripType: shift.tripType })
  const [loaded, setLoaded] = useState({ shift: shift.shift, tripType: shift.tripType })
  const [routes, setRoutes] = useState(() => getShiftRoutes(shift.shift, shift.tripType))
  const [cabs, setCabs] = useState(() => getAvailableCabs(shift.shift, shift.tripType))
  const [selectedRoutes, setSelectedRoutes] = useState(() => new Set())
  const [selectedCab, setSelectedCab] = useState(null)
  const [tabView, setTabView] = useState(false)

  const showCabs = selectedRoutes.size > 0
  const allSelected = routes.length > 0 && selectedRoutes.size === routes.length
  const setFilter = (key) => (event) => setFilters((current) => ({ ...current, [key]: event.target.value }))

  const toggleRoute = (routeId) => {
    const next = new Set(selectedRoutes)
    if (next.has(routeId)) next.delete(routeId)
    else next.add(routeId)
    setSelectedRoutes(next)
    if (next.size === 0) setSelectedCab(null) // cab table hides → clear its selection
  }

  const toggleAll = () => {
    if (allSelected) {
      setSelectedRoutes(new Set())
      setSelectedCab(null)
    } else {
      setSelectedRoutes(new Set(routes.map((route) => route.id)))
    }
  }

  const submitFilters = (event) => {
    event.preventDefault()
    setLoaded({ shift: filters.shift, tripType: filters.tripType })
    setRoutes(getShiftRoutes(filters.shift, filters.tripType))
    setCabs(getAvailableCabs(filters.shift, filters.tripType))
    setSelectedRoutes(new Set())
    setSelectedCab(null)
  }

  const reallocate = () => {
    const cab = cabs.find((item) => item.id === selectedCab)
    if (!cab) return
    setRoutes((current) => current.map((route) => (selectedRoutes.has(route.id) ? { ...route, cabId: cab.id } : route)))
    toastService.success(`${cab.id} (${cab.vehicle}) allocated to ${selectedRoutes.size} route${selectedRoutes.size > 1 ? 's' : ''}`)
    setSelectedRoutes(new Set())
    setSelectedCab(null)
  }

  const shiftOptions = [...new Set(shifts.map((item) => item.shift))]

  return (
    <Drawer
      open
      onClose={onClose}
      belowHeader
      width={tabView ? 'full' : 1100}
      className="realloc-drawer"
      title="Cab Reallocation"
      titleExtra={(
        <button type="button" className="drawer-chip" onClick={() => setTabView((value) => !value)} aria-pressed={tabView}>
          {tabView ? 'Show Panel View' : 'Show Tab View'}
        </button>
      )}
      footer={showCabs ? (
        <>
          <p className="realloc-summary">
            <strong>{selectedRoutes.size}</strong> route{selectedRoutes.size > 1 ? 's' : ''} selected
            {selectedCab ? <> · cab <strong>{selectedCab}</strong></> : ' · select a cab below'}
          </p>
          <Button variant="outline-dark" onClick={() => { setSelectedRoutes(new Set()); setSelectedCab(null) }}>Clear</Button>
          <Button onClick={reallocate} disabled={!selectedCab}>Reallocate</Button>
        </>
      ) : null}
    >
      <form className="realloc-filters" onSubmit={submitFilters}>
        <FormField label="Date" htmlFor="realloc-date">
          <input id="realloc-date" type="date" className="form-control" value={filters.date} onChange={setFilter('date')} />
        </FormField>
        <FormField label="Facility" htmlFor="realloc-facility">
          <select id="realloc-facility" className="form-control" value={filters.facility} onChange={setFilter('facility')}>
            {FACILITIES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </FormField>
        <FormField label="Shift Time" htmlFor="realloc-shift">
          <select id="realloc-shift" className="form-control" value={filters.shift} onChange={setFilter('shift')}>
            {shiftOptions.map((item) => <option key={item}>{item}</option>)}
          </select>
        </FormField>
        <FormField label="Trip Type" htmlFor="realloc-trip">
          <select id="realloc-trip" className="form-control" value={filters.tripType} onChange={setFilter('tripType')}>
            {TRIP_TYPES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </FormField>
        <Button type="submit" className="btn--dark realloc-filters__submit">Submit</Button>
      </form>

      <p className="realloc-caption">
        Routes for <strong>{loaded.shift} {loaded.tripType}</strong> · select route(s) to see available cabs
      </p>

      <div className="realloc-table-wrap">
        <table className="realloc-table">
          <thead>
            <tr>
              <th className="realloc-table__check"><Checkbox checked={allSelected} indeterminate={selectedRoutes.size > 0 && !allSelected} onChange={toggleAll} label="Select all routes" /></th>
              <th>Route ID</th><th>Cab ID</th><th>Stops</th><th>Location</th><th>Vehicle Type</th>
            </tr>
          </thead>
          <tbody>
            {routes.length === 0 && <tr><td colSpan={6} className="realloc-table__empty">No routes for this shift.</td></tr>}
            {routes.map((route) => {
              const checked = selectedRoutes.has(route.id)
              return (
                <tr key={route.id} className={checked ? 'is-selected' : showCabs ? 'is-dimmed' : ''} onClick={() => toggleRoute(route.id)}>
                  <td className="realloc-table__check" onClick={(event) => event.stopPropagation()}>
                    <Checkbox checked={checked} onChange={() => toggleRoute(route.id)} label={`Select route ${route.id}`} />
                  </td>
                  <td data-label="Route ID"><span className="realloc-route-id">{route.id}<RouteFlags flags={route.flags} /></span></td>
                  <td data-label="Cab ID">{route.cabId}</td>
                  <td data-label="Stops">{route.stops}</td>
                  <td data-label="Location" className="is-wide">{route.location}</td>
                  <td data-label="Vehicle Type">{route.vehicleType}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Available cabs: slides up when at least one route is checked, slides away when none are. */}
      <section className={`realloc-cabs ${showCabs ? 'is-open' : ''}`} aria-hidden={!showCabs} inert={!showCabs} aria-label="Available cabs">
        <div className="realloc-cabs__inner">
          <div className="realloc-table-wrap">
            <table className="realloc-table realloc-table--cabs">
              <thead>
                <tr><th className="realloc-table__check"><span className="sr-only">Select</span></th><th>Cab ID</th><th>Vehicle</th><th>Vehicle Reg. No.</th><th>Previous Shift</th><th>Occupancy</th></tr>
              </thead>
              <tbody>
                {cabs.map((cab) => {
                  const checked = selectedCab === cab.id
                  const pick = () => setSelectedCab(checked ? null : cab.id)
                  return (
                    <tr key={`${cab.id}-${cab.regNo}`} className={checked ? 'is-selected' : ''} onClick={pick}>
                      <td className="realloc-table__check" onClick={(event) => event.stopPropagation()}>
                        <Checkbox checked={checked} onChange={pick} label={`Select cab ${cab.id}`} />
                      </td>
                      <td data-label="Cab ID">{cab.id}</td>
                      <td data-label="Vehicle">{cab.vehicle}</td>
                      <td data-label="Vehicle Reg. No.">{cab.regNo}</td>
                      <td data-label="Previous Shift">{cab.previousShift || '—'}</td>
                      <td data-label="Occupancy">{cab.occupancy}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </Drawer>
  )
}

export default CabReallocationDrawer
