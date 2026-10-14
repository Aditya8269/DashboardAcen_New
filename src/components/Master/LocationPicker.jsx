import Dropdown, { DropdownItem } from '../common/Dropdown.jsx'
import MaterialIcon from './MaterialIcon.jsx'

const LOCATIONS = ['BLR - WTC', 'BLR - ETV', 'GGN - DLF', 'HYD - MDP', 'PUN - HJW']

function LocationPicker({ value, onChange, options = LOCATIONS }) {
  return (
    <Dropdown
      className="header-select location-picker"
      trigger={({ open, toggle }) => (
        <button type="button" className="header-select__button" onClick={toggle} aria-haspopup="menu" aria-expanded={open} aria-label={`Change location. Selected ${value}`}>
          <MaterialIcon name="location_on" className="header-select__icon" />
          <span className="header-select__text">{value}</span>
          <MaterialIcon name="arrow_drop_down" className="header-select__caret" />
        </button>
      )}
    >
      {(close) => options.map((option) => (
        <DropdownItem key={option} icon="location_on" active={option === value} onClick={() => { onChange(option); close() }}>{option}</DropdownItem>
      ))}
    </Dropdown>
  )
}

export default LocationPicker
