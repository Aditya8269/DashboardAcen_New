import MaterialIcon from '../Master/MaterialIcon.jsx'

const sortIcon = (active, direction) => {
  if (!active) return 'unfold_more'
  return direction === 'asc' ? 'arrow_upward' : 'arrow_downward'
}

const cellClasses = (column) => [column.primary && 'is-primary', column.key === 'actions' && 'is-actions', column.align && `is-${column.align}`].filter(Boolean).join(' ') || undefined

// columns: [{ key, header, sortable?, primary?, align?, render?(row) }]
// footerRow: optional row (e.g. totals) shown in <tfoot>, outside sorting and paging.
// On narrow screens every row turns into a labelled card (see common.css).
function DataTable({ columns, rows, rowKey = 'id', sort, onSortChange, caption, emptyMessage = 'No records found.', footerRow }) {
  const renderCells = (row) => columns.map((column) => (
    <td key={column.key} data-label={column.header} className={cellClasses(column)}>{column.render ? column.render(row) : row[column.key]}</td>
  ))

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((column) => {
              const active = sort?.key === column.key
              return (
                <th key={column.key} scope="col" className={column.align ? `is-${column.align}` : undefined} aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}>
                  {column.sortable
                    ? <button type="button" className="data-table__sort" onClick={() => onSortChange?.(column.key)}>{column.header}<MaterialIcon name={sortIcon(active, sort?.direction)} /></button>
                    : column.header}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? rows.map((row) => <tr key={row[rowKey]}>{renderCells(row)}</tr>) : (
            <tr className="data-table__empty"><td colSpan={columns.length}>{emptyMessage}</td></tr>
          )}
        </tbody>
        {footerRow && rows.length > 0 && (
          <tfoot>
            <tr className="data-table__total">{renderCells(footerRow)}</tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}

export default DataTable
