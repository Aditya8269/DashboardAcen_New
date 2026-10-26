import { useCallback, useMemo, useState } from 'react'
import MasterLayout from './Master/MasterLayout.jsx'
import Card from './common/Card.jsx'
import Button from './common/Button.jsx'
import Pill from './common/Pill.jsx'
import FormField from './common/FormField.jsx'
import ReportTableCard from './common/ReportTableCard.jsx'
import Toast from './common/Toast.jsx'
import { APP_STATUS_FACILITIES, buildAppStatus } from './reports/appStatusData.js'
import { formatDay, todayIso, validateDateRange } from '../utils/date'
import './AppStatusReport.css'

const ALL_ROWS = buildAppStatus()

const columns = [
  { key: 'id', header: 'Route Id', sortable: true, primary: true },
  { key: 'date', header: 'Shift Date', sortable: true, render: (r) => formatDay(r.date) },
  { key: 'facility', header: 'Facility Name', sortable: true },
  { key: 'vendor', header: 'Vendor Name', sortable: true },
  { key: 'vehicleRegNo', header: 'Vehicle Registration No.', sortable: true },
  { key: 'driverName', header: 'Driver Name', sortable: true, render: (r) => `${r.driverId} - ${r.driverName}` },
  { key: 'executedByApp', header: 'Trip Executed By App', sortable: true, render: (r) => <Pill tone={r.executedByApp === 'Yes' ? 'success' : 'danger'} variant="soft">{r.executedByApp}</Pill> },
  { key: 'reason', header: 'Reason', sortable: true, render: (r) => (r.reason ? <span className="app-status-reason">{r.reason}</span> : <span className="text-muted">—</span>) },
]

const CSV_COLUMNS = [
  ['Route Id', (r) => r.id], ['Shift Date', (r) => r.date], ['Facility Name', (r) => r.facility], ['Vendor Name', (r) => r.vendor],
  ['Vehicle Registration No.', (r) => r.vehicleRegNo], ['Driver Id', (r) => r.driverId], ['Driver Name', (r) => r.driverName],
  ['Trip Executed By App', (r) => r.executedByApp], ['Reason', (r) => r.reason],
]

const searchValues = (r) => [r.id, formatDay(r.date), r.facility, r.vendor, r.vehicleRegNo, r.driverId, r.driverName, r.executedByApp, r.reason]

const today = todayIso()
const INITIAL_FILTERS = { startDate: today, endDate: today, facility: APP_STATUS_FACILITIES[0] }

function AppStatusReport() {
  const [form, setForm] = useState(INITIAL_FILTERS)
  const [filters, setFilters] = useState(INITIAL_FILTERS) // applied on Submit
  const [submitCount, setSubmitCount] = useState(0)
  const [dateError, setDateError] = useState('')
  const [notice, setNotice] = useState('')
  const clearNotice = useCallback(() => setNotice(''), [])

  const rows = useMemo(() => ALL_ROWS.filter((row) =>
    row.date >= filters.startDate && row.date <= filters.endDate && row.facility === filters.facility), [filters])
  const notExecuted = rows.filter((row) => row.executedByApp === 'No').length

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
      breadcrumb={{ section: 'Reports', title: 'App Status Report' }}
      assistantContext={`Page: Reports > App Status Report. Lists trips and whether the driver ran them through the eTMS driver app ("Trip Executed By App" Yes/No) with the reason when not. Filters: start date, end date, facility. Showing ${rows.length} trips for ${filters.facility} from ${filters.startDate} to ${filters.endDate}; ${notExecuted} not executed by app. Reasons: ${[...new Set(rows.map((r) => r.reason).filter(Boolean))].join(' | ') || 'none'}.`}
    >
      <div className="page-head">
        <h1 className="page-head__title">App Status Report</h1>
      </div>

      <Card className="report-filters-card">
        <form className="report-filters" style={{ '--report-cols': 3 }} onSubmit={submit} noValidate>
          <FormField label="Start Date" htmlFor="asr-start">
            <input id="asr-start" type="date" className="form-control" value={form.startDate} onChange={set('startDate')} />
          </FormField>
          <FormField label="End Date" htmlFor="asr-end" error={dateError}>
            <input id="asr-end" type="date" className="form-control" value={form.endDate} onChange={set('endDate')} />
          </FormField>
          <FormField label="Facility" htmlFor="asr-facility">
            <select id="asr-facility" className="form-control" value={form.facility} onChange={set('facility')}>
              {APP_STATUS_FACILITIES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </FormField>
          <Button type="submit" className="report-filters__submit">Submit</Button>
        </form>
      </Card>

      <ReportTableCard
        key={submitCount}
        className="app-status-results"
        caption="App status report"
        columns={columns}
        rows={rows}
        searchValues={searchValues}
        defaultSort={{ key: 'id', direction: 'asc' }}
        csvColumns={CSV_COLUMNS}
        csvFileName={`app-status-report-${filters.facility}-${todayIso()}.csv`}
        emptyMessage="No trips found for the selected dates and facility."
        onNotify={setNotice}
      />

      <Toast message={notice} onClose={clearNotice} />
    </MasterLayout>
  )
}

export default AppStatusReport
