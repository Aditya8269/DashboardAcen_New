import { useCallback, useMemo, useState } from 'react'
import MasterLayout from './Master/MasterLayout.jsx'
import Card from './common/Card.jsx'
import Button from './common/Button.jsx'
import FormField from './common/FormField.jsx'
import ReportTableCard from './common/ReportTableCard.jsx'
import Toast from './common/Toast.jsx'
import { DAILY_NUMBER_COLUMNS, buildDailyRoutes } from './reports/dailyRouteData.js'
import { formatDay, todayIso } from '../utils/date'
import './DailyRouteDetails.css'

const ALL_ROWS = buildDailyRoutes()

const columns = [
  { key: 'facility', header: 'Facility Name', sortable: true, primary: true },
  ...DAILY_NUMBER_COLUMNS.map(([key, header]) => ({
    key,
    header,
    sortable: true,
    ...(key === 'tripsNotAccepted' ? { render: (r) => <span className={r.tripsNotAccepted ? 'text-danger' : ''}>{r.tripsNotAccepted}</span> } : {}),
  })),
]

const CSV_COLUMNS = [['Facility Name', (r) => r.facility], ...DAILY_NUMBER_COLUMNS.map(([key, header]) => [header, (r) => r[key]])]
const searchValues = (r) => [r.facility]

// Sum of every number column over the visible facilities.
const totalRow = (rows) => ({
  id: 'total',
  facility: 'Total',
  ...Object.fromEntries(DAILY_NUMBER_COLUMNS.map(([key]) => [key, rows.reduce((sum, row) => sum + row[key], 0)])),
})

function DailyRouteDetails() {
  const [startDate, setStartDate] = useState(todayIso)
  const [date, setDate] = useState(todayIso) // applied on Submit
  const [dateError, setDateError] = useState('')
  const [submitCount, setSubmitCount] = useState(0)
  const [notice, setNotice] = useState('')
  const clearNotice = useCallback(() => setNotice(''), [])

  const rows = useMemo(() => ALL_ROWS.filter((row) => row.date === date), [date])
  const totals = rows.length ? totalRow(rows) : null

  const submit = (event) => {
    event.preventDefault()
    if (!startDate) {
      setDateError('Select a Start Date')
      return
    }
    setDateError('')
    setDate(startDate)
    setSubmitCount((count) => count + 1)
  }

  return (
    <MasterLayout
      breadcrumb={{ section: 'Reports', title: 'Daily Route Details' }}
      assistantContext={`Page: Reports > Daily Route Details. For one day, per facility: routes pushed from TMS, trips allocated, trips accepted by driver, trips not accepted, routes started, routes completed, plus a Total row. Showing ${formatDay(date)}: ${totals ? DAILY_NUMBER_COLUMNS.map(([key, header]) => `${header} ${totals[key]}`).join(', ') : 'no data'}.`}
    >
      <div className="page-head">
        <h1 className="page-head__title">Daily Route Details</h1>
      </div>

      <Card className="report-filters-card">
        <form className="report-filters daily-filters" onSubmit={submit} noValidate>
          <FormField label="Start Date" htmlFor="drd-date" error={dateError}>
            <input id="drd-date" type="date" className="form-control" value={startDate} max={todayIso()} onChange={(event) => setStartDate(event.target.value)} />
          </FormField>
          <Button type="submit" className="report-filters__submit">Submit</Button>
        </form>
      </Card>

      <ReportTableCard
        key={submitCount}
        caption={`Daily route details for ${formatDay(date)}`}
        columns={columns}
        rows={rows}
        searchValues={searchValues}
        defaultSort={{ key: 'facility', direction: 'asc' }}
        csvColumns={CSV_COLUMNS}
        csvFileName={`daily-route-details-${date}.csv`}
        emptyMessage={`No routes found for ${formatDay(date)}.`}
        totalRow={totalRow}
        onNotify={setNotice}
      />

      <Toast message={notice} onClose={clearNotice} />
    </MasterLayout>
  )
}

export default DailyRouteDetails
