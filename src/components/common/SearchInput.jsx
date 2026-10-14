import MaterialIcon from '../Master/MaterialIcon.jsx'

function SearchInput({ value, onChange, placeholder = 'Search', label = 'Search', className = '' }) {
  return (
    <label className={`search-input ${className}`.trim()}>
      <span className="sr-only">{label}</span>
      <input type="search" value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      {value
        ? <button type="button" className="search-input__clear" onClick={() => onChange('')} aria-label="Clear search"><MaterialIcon name="close" /></button>
        : <MaterialIcon name="search" className="search-input__icon" />}
    </label>
  )
}

export default SearchInput
