import { toIsoDate } from '../../utils/date'

// Sample data for the App Status Report: whether each trip was run through the driver app, and why not.
// Replace with the report API later.

export const APP_STATUS_FACILITIES = ['GGN', 'BLR', 'Hyderabad', 'Noida', 'Pune']

const VENDORS = ['delta', 'OSFW', 'KMTS']
const DRIVERS = ['Deepak singh', 'Ramesh Kumar', 'Sunil Yadav', 'Vikas Sharma', 'Amit Verma', 'Manoj Gupta']
const NOT_EXECUTED_REASONS = [
  'Driver started but did not end the trip.',
  'Driver did not start the trip in the app.',
  'App not installed on driver phone.',
  'Driver phone switched off during trip.',
  'GPS permission denied on driver phone.',
]

export function buildAppStatus(today = new Date()) {
  const rows = []
  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const day = new Date(today)
    day.setDate(day.getDate() - dayOffset)
    const date = toIsoDate(day)
    APP_STATUS_FACILITIES.forEach((facility, f) => {
      // Today's GGN row matches the live screen.
      if (dayOffset === 0 && facility === 'GGN') {
        rows.push({ id: '014681R0191', date, facility, vendor: 'delta', vehicleRegNo: 'DL12345', driverId: 'G1D000014', driverName: 'Deepak singh', executedByApp: 'No', reason: NOT_EXECUTED_REASONS[0] })
        return
      }
      const count = dayOffset === 0 ? f % 3 : 2 + ((dayOffset + f) % 3)
      for (let i = 0; i < count; i++) {
        const n = dayOffset * 37 + f * 11 + i * 5
        const executed = n % 3 !== 0
        rows.push({
          id: `0${14682 + n}R0${200 + n}`,
          date,
          facility,
          vendor: VENDORS[n % VENDORS.length],
          vehicleRegNo: `${facility.slice(0, 2).toUpperCase()}${String(10 + (n % 80)).padStart(2, '0')}AB${String(1000 + n * 37).slice(-4)}`,
          driverId: `G1D${String(15 + (n % 400)).padStart(6, '0')}`,
          driverName: DRIVERS[n % DRIVERS.length],
          executedByApp: executed ? 'Yes' : 'No',
          reason: executed ? '' : NOT_EXECUTED_REASONS[n % NOT_EXECUTED_REASONS.length],
        })
      }
    })
  }
  return rows
}
