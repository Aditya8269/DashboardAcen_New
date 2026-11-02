import { useState } from 'react'
import { Link } from 'react-router-dom'
import MasterLayout from './Master/MasterLayout.jsx'
import Card from './common/Card.jsx'
import FormField from './common/FormField.jsx'
import Button from './common/Button.jsx'
import MaterialIcon from './Master/MaterialIcon.jsx'
import { asset } from '../utils/asset'
import { toastService } from '../services/toastService'
import './common/common.css'
import './ChangePassword.css'

const EMPTY = { userName: '', oldPassword: '', newPassword: '', confirmPassword: '' }
const MIN_LENGTH = 6

const FIELDS = [
  { name: 'userName', label: 'User Name', placeholder: 'Enter user name', icon: 'person_outline', autoComplete: 'username' },
  { name: 'oldPassword', label: 'Current Password', placeholder: 'Enter current password', icon: 'lock_outline', secret: true, autoComplete: 'current-password' },
  { name: 'newPassword', label: 'New Password', placeholder: 'Enter new password', icon: 'lock_reset', secret: true, autoComplete: 'new-password' },
  { name: 'confirmPassword', label: 'Confirm Password', placeholder: 'Re-enter new password', icon: 'lock_reset', secret: true, autoComplete: 'new-password' },
]

const validate = (values) => {
  const errors = {}
  if (!values.userName.trim()) errors.userName = 'User name is required'
  if (!values.oldPassword) errors.oldPassword = 'Current password is required'
  if (!values.newPassword) errors.newPassword = 'New password is required'
  else if (values.newPassword.length < MIN_LENGTH) errors.newPassword = `Use at least ${MIN_LENGTH} characters`
  else if (values.newPassword === values.oldPassword) errors.newPassword = 'New password must be different from the current one'
  if (!values.confirmPassword) errors.confirmPassword = 'Please confirm the new password'
  else if (values.confirmPassword !== values.newPassword) errors.confirmPassword = 'Passwords do not match'
  return errors
}

function ChangePassword() {
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [visible, setVisible] = useState({})

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    toastService.success('Password changed successfully')
    setValues(EMPTY)
    setVisible({})
  }

  return (
    <MasterLayout
      breadcrumb={{ section: 'Account', title: 'Change Password' }}
      assistantContext="Page: Account > Change Password. The user enters user name, current password, new password (min 6 characters, different from current) and confirm password, then submits."
    >
      <div className="change-password-page">
      <Card className="change-password-card" aria-labelledby="change-password-title">
        <img className="change-password-card__logo" src={asset('images/logo.svg')} alt="eTMS" />
        <span className="change-password-card__icon"><MaterialIcon name="key" /></span>
        <h1 id="change-password-title">Change Password</h1>
        <p className="change-password-card__copy">Enter your current password, then choose a new one.</p>

        <form className="change-password-form" onSubmit={handleSubmit} noValidate>
          {FIELDS.map((field) => {
            const id = `cp-${field.name}`
            const shown = visible[field.name]
            return (
              <FormField key={field.name} label={field.label} htmlFor={id} error={errors[field.name]}>
                <div className="input-icon">
                  <MaterialIcon name={field.icon} className="input-icon__lead" />
                  <input
                    id={id}
                    name={field.name}
                    type={field.secret && !shown ? 'password' : 'text'}
                    className="form-control"
                    placeholder={field.placeholder}
                    autoComplete={field.autoComplete}
                    value={values[field.name]}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors[field.name])}
                  />
                  {field.secret && (
                    <button
                      type="button"
                      className="input-icon__toggle"
                      onClick={() => setVisible((current) => ({ ...current, [field.name]: !shown }))}
                      aria-label={shown ? `Hide ${field.label}` : `Show ${field.label}`}
                    >
                      <MaterialIcon name={shown ? 'visibility_off' : 'visibility'} />
                    </button>
                  )}
                </div>
              </FormField>
            )
          })}

          <Button type="submit" className="change-password-form__submit">Submit</Button>
        </form>

        <Link to="/login" className="change-password-card__login">
          <MaterialIcon name="arrow_back" /> Back to Login
        </Link>
      </Card>
      </div>
    </MasterLayout>
  )
}

export default ChangePassword
