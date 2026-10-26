import { useMemo, useState } from 'react'
import Card from './Card.jsx'
import IconButton from './IconButton.jsx'
import SearchInput from './SearchInput.jsx'
import DataTable from './DataTable.jsx'
import Pagination from './Pagination.jsx'
import { downloadCsv } from '../../utils/csv'
import '../VendorDashboard.css' // shared toolbar styles
import './report.css'

const PAGE_SIZES = [10, 25, 50, 100]

// Results box shared by report pages: "Show N entries", search, refresh, CSV download, sortable table, pagination.
// - rows: already filtered by the page's filter form (give the card a new `key` on Submit to reset it)
// - searchValues(row): values the search box looks in
// - sortValue(row, key): optional custom sort value for a column
// - csvColumns: [[title, row => value]], csvFileName
// - totalRow(visibleRows): optional totals row shown at the bottom (and added to the CSV)
function ReportTableCard({ caption, columns, rows, searchValues, sortValue, defaultSort, csvColumns, csvFileName, emptyMessage, onNotify, totalRow, className = '' }) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState(defaultSort)
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0])
  const [page, setPage] = useState(1)
  const [refreshing, setRefreshing] = useState(false)

  const visibleRows = useMemo(() => {
    const term = query.trim().toLowerCase()
    const matched = rows.filter((row) => !term || searchValues(row).some((value) => String(value ?? '').toLowerCase().includes(term)))
    if (!sort) return matched
    const factor = sort.direction === 'asc' ? 1 : -1
    const value = (row) => (sortValue ? sortValue(row, sort.key) : row[sort.key]) ?? ''
    return [...matched].sort((a, b) => String(value(a)).localeCompare(String(value(b)), undefined, { numeric: true }) * factor)
  }, [rows, query, sort, searchValues, sortValue])

  const pages = Math.max(1, Math.ceil(visibleRows.length / pageSize))
  const currentPage = Math.min(page, pages)
  const pageRows = visibleRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const totals = totalRow && visibleRows.length ? totalRow(visibleRows) : null

  const refresh = () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
      onNotify?.('Report refreshed')
    }, 600)
  }

  const download = () => {
    if (!visibleRows.length) {
      onNotify?.('No records to download')
      return
    }
    downloadCsv(csvFileName, csvColumns, totals ? [...visibleRows, totals] : visibleRows)
    onNotify?.(`Downloaded ${visibleRows.length} record${visibleRows.length > 1 ? 's' : ''}`)
  }

  return (
    <Card className={`report-card ${className}`.trim()} aria-label={caption}>
      <div className="routes-toolbar report-toolbar">
        <label className="report-entries">
          Show
          <select className="form-control" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}>
            {PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
          entries
        </label>
        <div className="routes-toolbar__actions">
          <SearchInput value={query} onChange={(value) => { setQuery(value); setPage(1) }} placeholder="Search Records..." label="Search records" className="report-search" />
          <IconButton icon="sync" variant="soft" label="Refresh report" onClick={refresh} iconClassName={refreshing ? 'is-spinning' : ''} disabled={refreshing} />
          <IconButton icon="arrow_downward" label="Download report (CSV)" onClick={download} />
        </div>
      </div>

      <DataTable
        caption={caption}
        columns={columns}
        rows={pageRows}
        sort={sort}
        onSortChange={(key) => setSort((current) => ({ key, direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc' }))}
        emptyMessage={emptyMessage}
        footerRow={totals}
      />

      <Pagination page={currentPage} pageSize={pageSize} total={visibleRows.length} onPageChange={setPage} />
    </Card>
  )
}

export default ReportTableCard
