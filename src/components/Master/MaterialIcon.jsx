function MaterialIcon({ name, className = '', ...props }) {
  return <span className={`material-icons ${className}`.trim()} aria-hidden="true" {...props}>{name}</span>
}

export default MaterialIcon