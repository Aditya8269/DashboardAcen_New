import { useMemo, useState } from 'react'
import MasterLayout from './Master/MasterLayout.jsx'
import Card from './common/Card.jsx'
import Button from './common/Button.jsx'
import FormField from './common/FormField.jsx'
import ReportTableCard from './common/ReportTableCard.jsx'
import { MASTER_DATASETS, MASTER_FACILITIES, MASTER_REPORT_TYPES, MASTER_VENDORS } from './reports/masterData.js'
import { todayIso } from '../utils/date'
import './ExportDetailsReport.css'

const ALL_VENDORS = 'All Vendors'

const attritedCell = (r) => <span className={r.attrited === 'YES' ? 'text-danger' : ''}>{r.attrited}</span>

// Columns, CSV columns and searchable fields for each Report Type.
const REPORTS = {
  'Vehicle Details': {
    columns: [
      { key: 'vehicleNo', header: 'Vehicle No.', sortable: true, primary: true },
      { key: 'regNo', header: 'Vehicle Registration No.', sortable: true },
      { key: 'vehicleType', header: 'Vehicle Type', sortable: true },
      { key: 'occupancy', header: 'Occupancy', sortable: true },
      { key: 'vendor', header: 'Vendor Name', sortable: true },
      { key: 'facility', header: 'Facility Name', sortable: true },
      { key: 'attrited', header: 'Attrited', sortable: true, render: attritedCell },
    ],
    detailFields: (r) => [r.vehicleNo, r.regNo],
    detailLabel: 'vehicle no. or registration no.',
  },
  'Driver Details': {
    columns: [
      { key: 'id', header: 'Driver ID', sortable: true, primary: true },
      { key: 'name', header: 'Driver Name', sortable: true },
      { key: 'phone', header: 'Phone No.', sortable: true },
      { key: 'licenceNo', header: 'Licence No.', sortable: true },
      { key: 'licenceExpiry', header: 'Licence Expiry', sortable: true },
      { key: 'vehicleNo', header: 'Vehicle No.', sortable: true },
      { key: 'vendor', header: 'Vendor Name', sortable: true },
      { key: 'facility', header: 'Facility Name', sortable: true },
      { key: 'attrited', header: 'Attrited', sortable: true, render: attritedCell },
    ],
    detailFields: (r) => [r.id, r.name, r.phone, r.licenceNo, r.vehicleNo],
    detailLabel: 'driver ID, name, phone or licence no.',
  },
  'Guard Details': {
    columns: [
      { key: 'id', header: 'Guard ID', sortable: true, primary: true },
      { key: 'name', header: 'Guard Name', sortable: true },
      { key: 'phone', header: 'Phone No.', sortable: true },
      { key: 'vendor', header: 'Vendor Name', sortable: true },
      { key: 'facility', header: 'Facility Name', sortable: true },
      { key: 'attrited', header: 'Attrited', sortable: true, render: attritedCell },
    ],
    detailFields: (r) => [r.id, r.name, r.phone],
    detailLabel: 'guard ID, name or phone',
  },
}

// Table search and CSV both use every column of the current report.
const searchValuesFor = (reportType) => (row) => REPORTS[reportType].columns.map((column) => row[column.key])
const csvColumnsFor = (reportType) => REPORTS[reportType].columns.map((column) => [column.header, (row) => row[column.key]])
const SEARCH_VALUES = Object.fromEntries(MASTER_REPORT_TYPES.map((type) => [type, searchValuesFor(type)]))

const INITIAL_FORM = { facility: MASTER_FACILITIES[0], vendor: MASTER_VENDORS[0], reportType: MASTER_REPORT_TYPES[0] }

function ExportDetailsReport() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [filters, setFilters] = useState({ ...INITIAL_FORM, details: '' }) // applied on Submit / Search
  const [details, setDetails] = useState('')
  const [detailsError, setDetailsError] = useState('')
  const [runCount, setRunCount] = useState(0)

  const report = REPORTS[filters.reportType]
  const rows = useMemo(() => {
    const term = filters.details.trim().toLowerCase()
    return MASTER_DATASETS[filters.reportType].filter((row) =>
      row.facility === filters.facility
      && (filters.vendor === ALL_VENDORS || row.vendor === filters.vendor)
      && (!term || REPORTS[filters.reportType].detailFields(row).some((value) => String(value).toLowerCase().includes(term))))
  }, [filters])

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))
  const run = (next) => {
    setFilters(next)
    setRunCount((count) => count + 1)
  }

  // Submit: load the report for the selected filters (clears any detail search).
  const submit = (event) => {
    event.preventDefault()
    setDetails('')
    setDetailsError('')
    run({ ...form, details: '' })
  }

  // Search: look up a specific record within the selected filters.
  const search = (event) => {
    event.preventDefault()
    if (!details.trim()) {
      setDetailsError(`Enter a ${REPORTS[form.reportType].detailLabel}`)
      return
    }
    setDetailsError('')
    run({ ...form, details })
  }

  return (
    <MasterLayout
      breadcrumb={{ section: 'Reports', title: 'Master Data' }}
      assistantContext={`Page: Reports > Master Data (ExportDetailsReport). Shows master records by facility, vendor and report type (Vehicle Details, Driver Details, Guard Details); "Enter Details" + Search finds a specific record. Currently: ${filters.reportType} for ${filters.facility} / ${filters.vendor}, ${rows.length} records${filters.details ? `, searched "${filters.details}"` : ''}. "Attrited" = YES means the record is no longer active.`}
    >
      <div className="page-head">
        <h1 className="page-head__title">Master Data</h1>
      </div>

      <Card className="report-filters-card">
        <div className="master-filters">
          <form className="report-filters master-filters__main" style={{ '--report-cols': 3 }} onSubmit={submit}>
            <FormField label="Facility" htmlFor="md-facility">
              <select id="md-facility" className="form-control" value={form.facility} onChange={set('facility')}>
                {MASTER_FACILITIES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </FormField>
            <FormField label="Vendor" htmlFor="md-vendor">
              <select id="md-vendor" className="form-control" value={form.vendor} onChange={set('vendor')}>
                {MASTER_VENDORS.map((item) => <option key={item}>{item}</option>)}
                <option>{ALL_VENDORS}</option>
              </select>
            </FormField>
            <FormField label="Report Type" htmlFor="md-type">
              <select id="md-type" className="form-control" value={form.reportType} onChange={set('reportType')}>
                {MASTER_REPORT_TYPES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </FormField>
            <Button type="submit" className="report-filters__submit">Submit</Button>
          </form>

          <form className="master-filters__details" onSubmit={search} noValidate>
            <FormField label="Enter Details" htmlFor="md-details" error={detailsError}>
              <input id="md-details" className="form-control" value={details} onChange={(event) => setDetails(event.target.value)} placeholder={REPORTS[form.reportType].detailLabel} />
            </FormField>
            <Button type="submit" className="report-filters__submit">Search</Button>
          </form>
        </div>
      </Card>

      {filters.details && (
        <p className="master-search-note">
          Showing {filters.reportType.toLowerCase()} matching “{filters.details}”.{' '}
          <button type="button" className="link-button" onClick={() => { setDetails(''); run({ ...filters, details: '' }) }}>Clear search</button>
        </p>
      )}

      <ReportTableCard
        key={runCount}
        className="master-results"
        caption={`Master data: ${filters.reportType}`}
        columns={report.columns}
        rows={rows}
        searchValues={SEARCH_VALUES[filters.reportType]}
        defaultSort={{ key: report.columns[0].key, direction: 'asc' }}
        csvColumns={csvColumnsFor(filters.reportType)}
        csvFileName={`master-data-${filters.reportType.toLowerCase().replace(/\s+/g, '-')}-${filters.facility}-${todayIso()}.csv`}
        emptyMessage={filters.details ? `No ${filters.reportType.toLowerCase()} found for “${filters.details}”.` : 'No records for the selected facility and vendor.'}
      />
    </MasterLayout>
  )
}

export default ExportDetailsReport
