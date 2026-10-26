import { useCallback, useMemo, useState } from 'react'
import MasterLayout from './Master/MasterLayout.jsx'
import MaterialIcon from './Master/MaterialIcon.jsx'
import Card from './common/Card.jsx'
import Button from './common/Button.jsx'
import Pill from './common/Pill.jsx'
import FormField from './common/FormField.jsx'
import ReportTableCard from './common/ReportTableCard.jsx'
import Toast from './common/Toast.jsx'
import { FACILITIES, REPORT_TYPES, VENDORS, buildRouteReport } from './reports/routeDetailsData.js'
import { formatDay, todayIso, validateDateRange } from '../utils/date'
import './RouteDetailsReport.css'

const ALL_ROWS = buildRouteReport()
const STATUS_TONE = { Accepted: 'success', Completed: 'info', Rejected: 'danger', Pending: 'warning' }

const CSV_COLUMNS = [
  ['Route Id', (r) => r.id], ['Facility', (r) => r.facility], ['Date', (r) => r.date], ['Shift', (r) => r.shift], ['Trip Type', (r) => r.tripType],
  ['Male', (r) => r.male], ['Female', (r) => r.female], ['Location', (r) => r.location], ['Vendor', (r) => r.vendor], ['Kms', (r) => r.kms ?? 'NA'],
  ['Vehicle No', (r) => r.vehicleNo], ['Vehicle Type', (r) => r.vehicleType], ['Start Time', (r) => r.startTime], ['End Time', (r) => r.endTime],
  ['Driver', (r) => r.driver.name], ['Driver Phone', (r) => r.driver.phone], ['Guard', (r) => r.guard?.name ?? 'NA'], ['Status', (r) => r.status],
]

const searchValues = (r) => [r.id, r.facility, r.location, r.vendor, r.vehicleNo, r.vehicleType, r.driver.name, r.driver.phone, r.status, r.tripType]
const sortValue = (r, key) => (key === 'date' ? `${r.date} ${r.shift}` : r[key])

const columns = [
  {
    key: 'id', header: 'Route Id/Facility', sortable: true, primary: true,
    render: (r) => (
      <div className="rdr-route">
        <span className="rdr-route__id">
          {r.id}
          {r.flags.medical && <span className="rdr-flag rdr-flag--medical" title="Medical"><MaterialIcon name="add" /></span>}
          {r.flags.guard && <span className="rdr-flag rdr-flag--guard" title="Guard"><MaterialIcon name="shield" /></span>}
        </span>
        <small>{r.facility}</small>
      </div>
    ),
  },
  {
    key: 'date', header: 'Shift Date & Time', sortable: true,
    render: (r) => <div className="rdr-stack"><span>{formatDay(r.date)} - {r.shift.replace(':', '')}</span><Pill tone={r.tripType === 'PICK' ? 'primary' : 'danger'} variant="solid">{r.tripType}</Pill></div>,
  },
  {
    key: 'employees', header: 'Total Emp.',
    render: (r) => <div className="rdr-stack"><span>{r.male + r.female}</span><span className="rdr-gender"><Pill tone="info" variant="soft">{r.male}M</Pill><Pill tone="danger" variant="soft">{r.female}F</Pill></span></div>,
  },
  { key: 'location', header: 'Location', sortable: true, render: (r) => <span className="rdr-wrap">{r.location}</span> },
  { key: 'vendor', header: 'Vendor', sortable: true },
  { key: 'kms', header: 'Kms', sortable: true, render: (r) => r.kms ?? 'NA' },
  { key: 'vehicleNo', header: 'Vehicle No./Vehicle Reg. No.', sortable: true, render: (r) => <div className="rdr-stack"><span>{r.vehicleNo} / {r.vehicleReg}</span><small>{r.vehicleType}</small></div> },
  {
    key: 'startTime', header: 'Vehicle Start/End Time', sortable: true,
    render: (r) => <div className="rdr-stack rdr-muted"><span>{r.startTime ?? 'Not started'}</span><span>{r.endTime ? `– ${r.endTime}` : '– NA'}</span></div>,
  },
  {
    key: 'driver', header: 'Driver Info',
    render: (r) => <div className="rdr-stack"><span>{r.driver.name}</span><span>{r.driver.phone}</span><small>Last Updated {r.driver.lastUpdated}</small></div>,
  },
  {
    key: 'guard', header: 'Guard Info',
    render: (r) => (r.guard ? <div className="rdr-stack"><span>{r.guard.name}</span><small>{r.guard.phone}</small></div> : <span className="rdr-muted">NA</span>),
  },
  { key: 'status', header: 'Status', sortable: true, render: (r) => <Pill tone={STATUS_TONE[r.status] || 'muted'} variant="soft" className="rdr-status">{r.status.toUpperCase()}</Pill> },
]

const today = todayIso()
const INITIAL_FILTERS = { startDate: today, endDate: today, facility: FACILITIES[0], vendor: '', reportType: 'Accepted' }

const applyFilters = (rows, filters) => rows.filter((row) =>
  row.date >= filters.startDate && row.date <= filters.endDate
  && (!filters.facility || row.facility === filters.facility)
  && (!filters.vendor || row.vendor === filters.vendor)
  && (filters.reportType === 'All' || row.status === filters.reportType))

function RouteDetailsReport() {
  const [form, setForm] = useState(INITIAL_FILTERS)
  const [filters, setFilters] = useState(INITIAL_FILTERS) // applied on Submit
  const [submitCount, setSubmitCount] = useState(0)
  const [dateError, setDateError] = useState('')
  const [notice, setNotice] = useState('')
  const clearNotice = useCallback(() => setNotice(''), [])
  const rows = useMemo(() => applyFilters(ALL_ROWS, filters), [filters])

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))

  const submit = (event) => {
    event.preventDefault()
    const error = validateDateRange(form.startDate, form.endDate)
    setDateError(error)
    if (error) return
    setFilters(form)
    setSubmitCount((count) => count + 1)
  }

  return (
    <MasterLayout
      breadcrumb={{ section: 'Reports', title: 'Route Details Report' }}
      assistantContext={`Page: Reports > Route Details Report. Filters: start date, end date, facility, vendor, report type (All/Accepted/Rejected/Pending/Completed). Currently showing ${rows.length} routes from ${filters.startDate} to ${filters.endDate}, facility ${filters.facility || 'any'}, type ${filters.reportType}. Columns: route id/facility, shift date & time, total employees (male/female), location, vendor, kms, vehicle, start/end time, driver, guard, status.`}
    >
      <div className="page-head">
        <h1 className="page-head__title">Route Details Report</h1>
      </div>

      <Card className="report-filters-card">
        <form className="report-filters" style={{ '--report-cols': 5 }} onSubmit={submit} noValidate>
          <FormField label="Start Date" htmlFor="rdr-start">
            <input id="rdr-start" type="date" className="form-control" value={form.startDate} onChange={set('startDate')} />
          </FormField>
          <FormField label="End Date" htmlFor="rdr-end" error={dateError}>
            <input id="rdr-end" type="date" className="form-control" value={form.endDate} onChange={set('endDate')} />
          </FormField>
          <FormField label="Facility" htmlFor="rdr-facility">
            <select id="rdr-facility" className="form-control" value={form.facility} onChange={set('facility')}>
              {FACILITIES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </FormField>
          <FormField label="Vendor" htmlFor="rdr-vendor">
            <select id="rdr-vendor" className="form-control" value={form.vendor} onChange={set('vendor')}>
              <option value="">Select</option>
              {VENDORS.map((item) => <option key={item}>{item}</option>)}
            </select>
          </FormField>
          <FormField label="Report Type" htmlFor="rdr-type">
            <select id="rdr-type" className="form-control" value={form.reportType} onChange={set('reportType')}>
              {REPORT_TYPES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </FormField>
          <Button type="submit" className="report-filters__submit">Submit</Button>
        </form>
      </Card>

      <ReportTableCard
        key={submitCount}
        className="rdr-results"
        caption="Route details report"
        columns={columns}
        rows={rows}
        searchValues={searchValues}
        sortValue={sortValue}
        defaultSort={{ key: 'id', direction: 'asc' }}
        csvColumns={CSV_COLUMNS}
        csvFileName={`route-details-report-${todayIso()}.csv`}
        emptyMessage="No routes found for the selected filters. Try another date range or report type."
        onNotify={setNotice}
      />

      <Toast message={notice} onClose={clearNotice} />
    </MasterLayout>
  )
}

export default RouteDetailsReport
