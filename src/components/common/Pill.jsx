// tone: primary | info | success | warning | danger | muted
// variant: solid | soft | outline
function Pill({ tone = 'muted', variant = 'soft', className = '', children }) {
  return <span className={`pill pill--${tone} pill--${variant} ${className}`.trim()}>{children}</span>
}

export default Pill
