import MaterialIcon from '../Master/MaterialIcon.jsx'

// "Showing 1–10 of 25" + page buttons. `page` is 1-based.
function Pagination({ page, pageSize, total, onPageChange }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (total === 0) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <nav className="pagination" aria-label="Pagination">
      <span className="pagination__info">Showing {from}–{to} of {total}</span>
      <div className="pagination__pages">
        <button type="button" onClick={() => onPageChange(page - 1)} disabled={page === 1} aria-label="Previous page"><MaterialIcon name="chevron_left" /></button>
        {Array.from({ length: pages }, (_, index) => index + 1).map((number) => (
          <button key={number} type="button" className={number === page ? 'is-active' : ''} aria-current={number === page ? 'page' : undefined} onClick={() => onPageChange(number)}>{number}</button>
        ))}
        <button type="button" onClick={() => onPageChange(page + 1)} disabled={page === pages} aria-label="Next page"><MaterialIcon name="chevron_right" /></button>
      </div>
    </nav>
  )
}

export default Pagination
