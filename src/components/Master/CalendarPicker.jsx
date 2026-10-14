import { useRef } from 'react'
import MaterialIcon from './MaterialIcon.jsx'

const formatDate = (value) => {
  if (!value) return { weekday: '', dayMonth: 'Select date' }
  const date = new Date(`${value}T00:00:00`)
  return {
    weekday: date.toLocaleDateString('en-GB', { weekday: 'long' }),
    dayMonth: `${String(date.getDate()).padStart(2, '0')}, ${date.toLocaleDateString('en-GB', { month: 'short' })}`,
  }
}

// Header date selector, e.g. "Monday 04, Oct". Opens the native date picker.
function CalendarPicker({ value, onChange }) {
  const inputRef = useRef(null)
  const { weekday, dayMonth } = formatDate(value)

  const openPicker = () => {
    const input = inputRef.current
    if (!input) return
    try {
      input.showPicker()
    } catch {
      input.focus()
    }
  }

  return (
    <div className="header-select date-picker">
      <button type="button" className="header-select__button" onClick={openPicker} aria-label={`Change date. Selected ${weekday} ${dayMonth}`}>
        <MaterialIcon name="calendar_today" className="header-select__icon" />
        <span className="header-select__text"><span className="date-picker__weekday">{weekday}</span> {dayMonth}</span>
        <MaterialIcon name="arrow_drop_down" className="header-select__caret" />
      </button>
      <input ref={inputRef} className="date-picker__input" type="date" value={value} onChange={(event) => event.target.value && onChange(event.target.value)} tabIndex={-1} aria-hidden="true" />
    </div>
  )
}

export default CalendarPicker
