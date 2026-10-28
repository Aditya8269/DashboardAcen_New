import { useMemo, useState } from 'react'
import MasterLayout from './Master/MasterLayout.jsx'
import Card from './common/Card.jsx'
import Button from './common/Button.jsx'
import FormField from './common/FormField.jsx'
import DataTable from './common/DataTable.jsx'
import { toastService } from '../services/toastService'
import { APP_FACILITIES, APP_INSTALL_SUMMARY, getFacilityDrivers } from './reports/appInstallData.js'
import { downloadCsv } from '../utils/csv'
import { todayIso } from '../utils/date'
import './common/report.css'
import './DriverAppInstallReport.css'

const ALL = 'All Facilities'

const driverCsvColumns = (facility) => [
  ['Facility', () => facility],
  ['Driver ID', (d) => d.driverId],
  ['Driver Name', (d) => d.name],
  ['Phone', (d) => d.phone],
  ['Vehicle No', (d) => d.vehicleNo],
  ['App Installed', (d) => d.appInstalled],
  ['App Version', (d) => d.appVersion],
]

const formatPct = (value) => value.toFixed(2)

function PercentCell({ value, tone }) {
  return (
    <span className="pct-cell">
      <span>{formatPct(value)}</span>
      <span className={`pct-bar pct-bar--${tone}`} aria-hidden="true"><i style={{ width: `${value}%` }} /></span>
    </span>
  )
}

function DriverAppInstallReport() {
  const [facility, setFacility] = useState(APP_FACILITIES[0])
  const [sort, setSort] = useState({ key: 'facility', direction: 'asc' })

  const rows = useMemo(() => {
    const matched = APP_INSTALL_SUMMARY.filter((row) => facility === ALL || row.facility === facility)
    const factor = sort.direction === 'asc' ? 1 : -1
    return [...matched].sort((a, b) => String(a[sort.key]).localeCompare(String(b[sort.key]), undefined, { numeric: true }) * factor)
  }, [facility, sort])

  const exportFacility = (row) => {
    const drivers = getFacilityDrivers(row.facility)
    downloadCsv(`app-installed-status-${row.facility}-${todayIso()}.csv`, driverCsvColumns(row.facility), drivers)
    toastService.success(`Exported ${drivers.length} drivers of ${row.facility}`)
  }

  const columns = [
    { key: 'facility', header: 'Facility Name', sortable: true, primary: true },
    { key: 'totalDrivers', header: 'Total Driver', sortable: true },
    { key: 'installed', header: 'Installed App', sortable: true, render: (r) => <span className="text-success">{r.installed}</span> },
    { key: 'notInstalled', header: 'Not Installed App', sortable: true, render: (r) => <span className={r.notInstalled ? 'text-danger' : ''}>{r.notInstalled}</span> },
    { key: 'installedPct', header: 'Installed App(%)', sortable: true, render: (r) => <PercentCell value={r.installedPct} tone="success" /> },
    { key: 'notInstalledPct', header: 'Not Installed App(%)', sortable: true, render: (r) => <PercentCell value={r.notInstalledPct} tone="danger" /> },
    {
      key: 'actions', header: 'Export', align: 'center',
      render: (r) => <Button size="sm" variant="ghost" icon="file_download" className="export-btn" onClick={() => exportFacility(r)}>Export Excel</Button>,
    },
  ]

  return (
    <MasterLayout
      breadcrumb={{ section: 'Reports', title: 'App Installed Status' }}
      assistantContext={`Page: Reports > App Installed Status (driver app install report). For each facility: total drivers, drivers with the eTMS driver app installed / not installed and percentages. ${rows.map((r) => `${r.facility}: ${r.installed}/${r.totalDrivers} installed (${formatPct(r.installedPct)}%), ${r.notInstalled} not installed`).join('; ')}. "Export Excel" downloads the driver list of a facility with install status.`}
    >
      <div className="page-head">
        <h1 className="page-head__title">App Installed Status</h1>
      </div>

      <Card className="report-filters-card">
        <div className="report-filters app-install-filters">
          <FormField label="Facility" htmlFor="app-facility">
            <select id="app-facility" className="form-control" value={facility} onChange={(event) => setFacility(event.target.value)}>
              {APP_FACILITIES.map((item) => <option key={item}>{item}</option>)}
              <option>{ALL}</option>
            </select>
          </FormField>
        </div>
      </Card>

      <Card className="report-card app-install-card" aria-label="App installed status">
        <DataTable
          caption="Driver app installed status by facility"
          columns={columns}
          rows={rows}
          rowKey="id"
          sort={sort}
          onSortChange={(key) => setSort((current) => ({ key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' }))}
          emptyMessage="No data for this facility."
        />
      </Card>
    </MasterLayout>
  )
}

export default DriverAppInstallReport
