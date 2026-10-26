import { useCallback, useMemo, useState } from 'react'
import MasterLayout from './Master/MasterLayout.jsx'
import Card from './common/Card.jsx'
import Button from './common/Button.jsx'
import Pill from './common/Pill.jsx'
import FormField from './common/FormField.jsx'
import ReportTableCard from './common/ReportTableCard.jsx'
import Toast from './common/Toast.jsx'
import { SUMMARY_FACILITIES, buildRouteSummary } from './reports/routeSummaryData.js'
import { formatDay, todayIso, validateDateRange } from '../utils/date'

const ALL_ROWS = buildRouteSummary()

const NUMBER_COLUMNS = [
  ['totalTrips', 'Total trip'],
  ['allocated', 'Allocated'],
  ['driverAccepted', 'Driver Accepted'],
  ['tripStarted', 'Trip Started'],
  ['tripNotStarted', 'Trip Not Started'],
  ['tripCompleted', 'Trip Completed'],
  ['tripNotCompleted', 'Trip Not Completed'],
]

const columns = [
  { key: 'date', header: 'Shift Date', sortable: true, primary: true, render: (r) => formatDay(r.date) },
  { key: 'facility', header: 'Facility Name', sortable: true },
  { key: 'tripType', header: 'Trip type', sortable: true, render: (r) => <Pill tone={r.tripType === 'PICK' ? 'primary' : 'danger'} variant="solid">{r.tripType}</Pill> },
  { key: 'shift', header: 'Shift Time', sortable: true, render: (r) => r.shift.replace(':', '') },
  ...NUMBER_COLUMNS.map(([key, header]) => ({ key, header, sortable: true })),
]

const CSV_COLUMNS = [
  ['Shift Date', (r) => r.date], ['Facility Name', (r) => r.facility], ['Trip Type', (r) => r.tripType], ['Shift Time', (r) => r.shift],
  ...NUMBER_COLUMNS.map(([key, header]) => [header, (r) => r[key]]),
]

const searchValues = (r) => [formatDay(r.date), r.facility, r.tripType, r.shift, r.shift.replace(':', '')]
// Date sorts together with the shift time so a day's shifts stay in order.
const sortValue = (r, key) => (key === 'date' ? `${r.date} ${r.shift}` : r[key])

const today = todayIso()
const INITIAL_FILTERS = { startDate: today, endDate: today, facility: SUMMARY_FACILITIES[0] }

function RouteSummaryReport() {
  const [form, setForm] = useState(INITIAL_FILTERS)
  const [filters, setFilters] = useState(INITIAL_FILTERS) // applied on Submit
  const [submitCount, setSubmitCount] = useState(0)
  const [dateError, setDateError] = useState('')
  const [notice, setNotice] = useState('')
  const clearNotice = useCallback(() => setNotice(''), [])

  const rows = useMemo(() => ALL_ROWS.filter((row) =>
    row.date >= filters.startDate && row.date <= filters.endDate && row.facility === filters.facility), [filters])

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))

  const submit = (event) => {
    event.preventDefault()
    const error = validateDateRange(form.startDate, form.endDate)
    setDateError(error)
    if (error) return
    setFilters(form)
    setSubmitCount((count) => count + 1)
  }

  const totals = NUMBER_COLUMNS.map(([key, header]) => `${header} ${rows.reduce((sum, row) => sum + row[key], 0)}`).join(', ')

  return (
    <MasterLayout
      breadcrumb={{ section: 'Reports', title: 'Route Summary Report' }}
      assistantContext={`Page: Reports > Route Summary Report. One row per shift date, facility, trip type and shift time with trip counts (total, allocated, driver accepted, started, not started, completed, not completed). Filters: start date, end date, facility. Showing ${rows.length} shifts for ${filters.facility} from ${filters.startDate} to ${filters.endDate}. Totals: ${totals}.`}
    >
      <div className="page-head">
        <h1 className="page-head__title">Route Summary Report</h1>
      </div>

      <Card className="report-filters-card">
        <form className="report-filters" style={{ '--report-cols': 3 }} onSubmit={submit} noValidate>
          <FormField label="Start Date" htmlFor="rsr-start">
            <input id="rsr-start" type="date" className="form-control" value={form.startDate} onChange={set('startDate')} />
          </FormField>
          <FormField label="End Date" htmlFor="rsr-end" error={dateError}>
            <input id="rsr-end" type="date" className="form-control" value={form.endDate} onChange={set('endDate')} />
          </FormField>
          <FormField label="Facility" htmlFor="rsr-facility">
            <select id="rsr-facility" className="form-control" value={form.facility} onChange={set('facility')}>
              {SUMMARY_FACILITIES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </FormField>
          <Button type="submit" className="report-filters__submit">Submit</Button>
        </form>
      </Card>

      <ReportTableCard
        key={submitCount}
        caption="Route summary report"
        columns={columns}
        rows={rows}
        searchValues={searchValues}
        sortValue={sortValue}
        defaultSort={{ key: 'date', direction: 'asc' }}
        csvColumns={CSV_COLUMNS}
        csvFileName={`route-summary-report-${todayIso()}.csv`}
        emptyMessage="No shifts found for the selected dates and facility."
        onNotify={setNotice}
      />

      <Toast message={notice} onClose={clearNotice} />
    </MasterLayout>
  )
}

export default RouteSummaryReport
