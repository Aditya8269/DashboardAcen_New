import MaterialIcon from '../Master/MaterialIcon.jsx'

// variant: plain | soft | primary
function IconButton({ icon, label, variant = 'plain', iconClassName = '', className = '', ...props }) {
  return (
    <button type="button" className={`icon-btn icon-btn--${variant} ${className}`.trim()} aria-label={label} title={label} {...props}>
      <MaterialIcon name={icon} className={iconClassName} />
    </button>
  )
}

export default IconButton
