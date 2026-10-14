import MaterialIcon from '../Master/MaterialIcon.jsx'

// variant: primary | outline | ghost ; size: sm | md
function Button({ variant = 'primary', size = 'md', icon, className = '', children, type = 'button', ...props }) {
  return (
    <button type={type} className={`btn btn--${variant} btn--${size} ${className}`.trim()} {...props}>
      {icon && <MaterialIcon name={icon} />}
      {children && <span className="btn__label">{children}</span>}
    </button>
  )
}

export default Button
