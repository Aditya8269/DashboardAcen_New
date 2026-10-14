// Labelled form control wrapper: <FormField label="Vendor" error={...}><select className="form-control" /></FormField>
function FormField({ label, htmlFor, error, children }) {
  return (
    <div className={`form-field ${error ? 'has-error' : ''}`.trim()}>
      {label && <label className="form-field__label" htmlFor={htmlFor}>{label}</label>}
      {children}
      {error && <p className="form-field__error" role="alert">{error}</p>}
    </div>
  )
}

export default FormField
