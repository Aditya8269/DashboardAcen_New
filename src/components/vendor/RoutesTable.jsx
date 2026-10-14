import { useMemo, useState } from 'react'
import Card from '../common/Card.jsx'
import Button from '../common/Button.jsx'
import IconButton from '../common/IconButton.jsx'
import Pill from '../common/Pill.jsx'
import SearchInput from '../common/SearchInput.jsx'
import DataTable from '../common/DataTable.jsx'
import Dropdown, { DropdownItem } from '../common/Dropdown.jsx'
import MaterialIcon from '../Master/MaterialIcon.jsx'

const TRIP_TYPES = ['All', 'PICK', 'DROP']

const exportCsv = (rows) => {
  const header = ['Shift', 'Trip Type', 'Routes', 'Allocated', 'Driver Accepted', 'Started', 'Completed', 'Not Started', 'Rejected']
  const lines = rows.map((r) => [r.shift, r.tripType, r.routes, r.allocated, r.driverAccepted, r.started, r.completed, r.notStarted, r.rejected].join(','))
  const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = Object.assign(document.createElement('a'), { href: url, download: `vendor-routes-${new Date().toLocaleDateString('en-CA')}.csv` })
  link.click()
  URL.revokeObjectURL(url)
}

function RoutesTable({ routes, tripType, onTripTypeChange, onAddGuard, onEdit, onNotify }) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState({ key: 'shift', direction: 'asc' })
  const [refreshing, setRefreshing] = useState(false)

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase()
    const filtered = routes.filter((route) => {
      const matchesType = tripType === 'All' || route.tripType === tripType
      const matchesQuery = !term || route.shift.includes(term) || route.tripType.toLowerCase().includes(term)
      return matchesType && matchesQuery
    })
    const factor = sort.direction === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => String(a[sort.key]).localeCompare(String(b[sort.key]), undefined, { numeric: true }) * factor)
  }, [routes, tripType, query, sort])

  const handleSort = (key) => setSort((current) => ({ key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' }))

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
      onNotify('Routes refreshed')
    }, 700)
  }

  const handleExport = () => {
    exportCsv(rows)
    onNotify(`Exported ${rows.length} routes`)
  }

  const columns = [
    { key: 'shift', header: 'Shift', sortable: true, primary: true },
    { key: 'tripType', header: 'Trip Type', render: (r) => <Pill tone={r.tripType === 'DROP' ? 'danger' : 'info'} variant="solid">{r.tripType}</Pill> },
    { key: 'routes', header: 'Routes', render: (r) => <span className="cell-with-pill">{r.routes}<Pill tone="warning" variant="outline">{r.allocated} Allocated</Pill></span> },
    { key: 'driverAccepted', header: 'Driver Accepted' },
    { key: 'started', header: 'Started', render: (r) => <span className="cell-with-pill">{r.started}<Pill tone="success" variant="outline">{r.completed} Completed</Pill></span> },
    { key: 'notStarted', header: 'Not Started' },
    { key: 'rejected', header: 'Rejected', render: (r) => <span className="text-danger">{r.rejected}</span> },
    { key: 'actions', header: 'Actions', align: 'center', render: (r) => <IconButton icon="edit" variant="primary" label={`Edit ${r.shift} ${r.tripType} route`} onClick={() => onEdit(r)} /> },
  ]

  return (
    <Card className="routes-card" aria-label="Today routes">
      <div className="routes-toolbar">
        <div className="routes-toolbar__filters">
          <MaterialIcon name="filter_alt" className="routes-toolbar__filter-icon" />
          <Dropdown
            trigger={({ open, toggle }) => (
              <Button variant="ghost" size="sm" icon="add" onClick={toggle} aria-haspopup="menu" aria-expanded={open}>Advanced Filter</Button>
            )}
          >
            {(close) => (
              <>
                <p className="dropdown__title">Trip type</p>
                {TRIP_TYPES.map((type) => (
                  <DropdownItem key={type} active={tripType === type} onClick={() => { onTripTypeChange(type); close() }}>{type === 'All' ? 'All trips' : type}</DropdownItem>
                ))}
              </>
            )}
          </Dropdown>
          {tripType !== 'All' && (
            <button type="button" className="filter-chip" onClick={() => onTripTypeChange('All')} aria-label={`Remove ${tripType} filter`}>
              {tripType}<MaterialIcon name="close" />
            </button>
          )}
        </div>

        <div className="routes-toolbar__actions">
          <Button variant="outline" size="sm" icon="add_circle" className="routes-toolbar__add" onClick={onAddGuard}>Add Guard/Employee</Button>
          <SearchInput value={query} onChange={setQuery} placeholder="Search" label="Search routes" className="routes-toolbar__search" />
          <div className="routes-toolbar__icons">
            <IconButton icon="sync" variant="soft" label="Refresh routes" onClick={handleRefresh} iconClassName={refreshing ? 'is-spinning' : ''} disabled={refreshing} />
            <IconButton icon="arrow_downward" label="Download routes" onClick={handleExport} />
            <Dropdown
              align="end"
              trigger={({ open, toggle }) => <IconButton icon="more_horiz" label="More actions" onClick={toggle} aria-haspopup="menu" aria-expanded={open} />}
            >
              {(close) => (
                <>
                  <DropdownItem icon="file_download" onClick={() => { handleExport(); close() }}>Export as CSV</DropdownItem>
                  <DropdownItem icon="filter_alt_off" onClick={() => { onTripTypeChange('All'); setQuery(''); close() }}>Clear filters</DropdownItem>
                </>
              )}
            </Dropdown>
          </div>
        </div>
      </div>

      <DataTable
        caption="Today routes by shift"
        columns={columns}
        rows={rows}
        sort={sort}
        onSortChange={handleSort}
        emptyMessage="No routes match your filters."
      />
    </Card>
  )
}

export default RoutesTable
