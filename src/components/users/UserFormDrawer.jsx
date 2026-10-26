import { useState } from 'react'
import Drawer from '../common/Drawer.jsx'
import Button from '../common/Button.jsx'
import FormField from '../common/FormField.jsx'
import { FACILITIES, USER_TYPES, VENDORS } from './usersData.js'

const EMPTY = { employeeId: '', userType: '', baseFacility: '', vendor: '', additionalFacilities: [] }
const MIN_PASSWORD = 6

const validate = (form, { isEdit, existingIds }) => {
  const errors = {}
  const employeeId = form.employeeId.trim()
  if (!employeeId) errors.employeeId = 'Employee Id is required'
  else if (!isEdit && existingIds.has(employeeId.toLowerCase())) errors.employeeId = 'This user already exists'
  if (!form.userType) errors.userType = 'Select a user type'
  if (!form.baseFacility) errors.baseFacility = 'Select a base facility'
  if (!form.vendor) errors.vendor = 'Select a vendor'

  // New user: password required. Edit: leave both blank to keep the current password.
  if (!isEdit || form.password || form.confirmPassword) {
    if (form.password.length < MIN_PASSWORD) errors.password = `Password must be at least ${MIN_PASSWORD} characters`
    else if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match'
  }
  return errors
}

// "New User Details" / "Edit User Details" side panel. `user` = null for a new user.
function UserFormDrawer({ user, existingIds, onClose, onSave }) {
  const isEdit = Boolean(user)
  const [form, setForm] = useState(() => ({ ...EMPTY, ...(user || {}), password: '', confirmPassword: '' }))
  const [submitted, setSubmitted] = useState(false)
  const errors = validate(form, { isEdit, existingIds })
  const errorFor = (key) => (submitted ? errors[key] : '')

  const set = (key) => (event) => {
    const { value } = event.target
    setForm((current) => ({
      ...current,
      [key]: value,
      // The base facility can't also be an additional facility.
      ...(key === 'baseFacility' ? { additionalFacilities: current.additionalFacilities.filter((item) => item !== value) } : {}),
    }))
  }

  const toggleFacility = (facility) => setForm((current) => ({
    ...current,
    additionalFacilities: current.additionalFacilities.includes(facility)
      ? current.additionalFacilities.filter((item) => item !== facility)
      : [...current.additionalFacilities, facility],
  }))

  const submit = (event) => {
    event?.preventDefault()
    setSubmitted(true)
    if (Object.keys(errors).length) return
    const employeeId = form.employeeId.trim()
    // The password is validated here but never stored in the table data; send it to the API when connected.
    onSave({
      id: isEdit ? user.id : employeeId.toLowerCase(),
      employeeId,
      userType: form.userType,
      baseFacility: form.baseFacility,
      vendor: form.vendor,
      additionalFacilities: form.additionalFacilities,
    })
  }

  return (
    <Drawer
      open
      onClose={onClose}
      belowHeader
      title={isEdit ? 'Edit User Details' : 'New User Details'}
      className="user-drawer"
      footer={(
        <>
          <span className="drawer__spacer" />
          <Button variant="outline-dark" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="btn--success" type="submit" form="user-form">Save</Button>
        </>
      )}
    >
      <form id="user-form" className="user-form" onSubmit={submit} noValidate>
        <FormField label="Employee Id" htmlFor="user-id" error={errorFor('employeeId')}>
          <input id="user-id" className="form-control" value={form.employeeId} onChange={set('employeeId')} readOnly={isEdit} autoFocus={!isEdit} autoComplete="off" />
        </FormField>

        <FormField label="User Type" htmlFor="user-type" error={errorFor('userType')}>
          <select id="user-type" className="form-control" value={form.userType} onChange={set('userType')}>
            <option value="" disabled hidden />
            {USER_TYPES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </FormField>

        <FormField label="Base Facility Name" htmlFor="user-base" error={errorFor('baseFacility')}>
          <select id="user-base" className="form-control" value={form.baseFacility} onChange={set('baseFacility')}>
            <option value="" disabled hidden />
            {FACILITIES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </FormField>

        <FormField label="Vendor Name" htmlFor="user-vendor" error={errorFor('vendor')}>
          <select id="user-vendor" className="form-control" value={form.vendor} onChange={set('vendor')}>
            <option value="" disabled hidden />
            {VENDORS.map((item) => <option key={item}>{item}</option>)}
          </select>
        </FormField>

        <fieldset className="user-form__multi">
          <legend className="form-field__label">Additional Facility Name</legend>
          <div className="multi-select" role="group" aria-label="Additional facilities">
            {FACILITIES.filter((item) => item !== form.baseFacility).map((facility) => {
              const checked = form.additionalFacilities.includes(facility)
              return (
                <label key={facility} className={`multi-select__option ${checked ? 'is-checked' : ''}`}>
                  <input type="checkbox" className="check" checked={checked} onChange={() => toggleFacility(facility)} />
                  {facility}
                </label>
              )
            })}
          </div>
        </fieldset>

        <FormField label="Password" htmlFor="user-password" error={errorFor('password')}>
          <input id="user-password" type="password" className="form-control" value={form.password} onChange={set('password')} autoComplete="new-password" placeholder={isEdit ? 'Leave blank to keep current password' : ''} />
        </FormField>

        <FormField label="Confirm Password" htmlFor="user-confirm" error={errorFor('confirmPassword')}>
          <input id="user-confirm" type="password" className="form-control" value={form.confirmPassword} onChange={set('confirmPassword')} autoComplete="new-password" />
        </FormField>
      </form>
    </Drawer>
  )
}

export default UserFormDrawer
