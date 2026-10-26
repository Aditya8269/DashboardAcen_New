import { toIsoDate } from '../../utils/date'

// Sample data for the Route Details Report. Replace with the report API later.

export const FACILITIES = ['GGN', 'BLR', 'Hyderabad', 'Noida', 'Pune']
export const VENDORS = ['delta', 'OSFW', 'KMTS', 'MERU']
export const REPORT_TYPES = ['All', 'Accepted', 'Rejected', 'Pending', 'Completed']

const LOCATIONS = [
  'DLF City Phase 4-Gurgaon - DLF City Phase 4-Gurgaon',
  'Sector 28-Gurgaon - Cyber Hub Gate 2',
  'Sohna Road - Vatika City Point',
  'MG Road Metro - Udyog Vihar Phase 1',
  'Golf Course Road - Sector 54 Chowk',
]
const DRIVERS = [['Deepak singh', '+91 9911793268'], ['Ramesh Kumar', '+91 9810022114'], ['Sunil Yadav', '+91 9958123401'], ['Vikas Sharma', '+91 9899011220']]
const VEHICLE_TYPES = ['Tavera', 'Innova', 'Dzire', 'Ertiga']
const STATUSES = ['Accepted', 'Accepted', 'Completed', 'Rejected', 'Pending']
const SHIFTS = ['06:30', '09:00', '17:00', '19:30']

const pad = (n) => String(n).padStart(2, '0')

// 4 routes per day for the last 7 days (including today).
export function buildRouteReport(today = new Date()) {
  const rows = []
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const day = new Date(today)
    day.setDate(day.getDate() - dayOffset)
    const date = toIsoDate(day)
    SHIFTS.forEach((shift, index) => {
      const n = dayOffset * SHIFTS.length + index
      const [driverName, driverPhone] = DRIVERS[n % DRIVERS.length]
      const male = 2 + (n % 5)
      const female = n % 3
      const vehicleNo = `DL${12345 + n * 11}`
      const started = n % 5 !== 4
      rows.push({
        id: `0146${81 + n}R0${191 + n}`,
        facility: FACILITIES[n % 2 === 0 ? 0 : (n % FACILITIES.length)],
        date,
        shift,
        tripType: index < 2 ? 'PICK' : 'DROP',
        male,
        female,
        location: LOCATIONS[n % LOCATIONS.length],
        vendor: VENDORS[n % VENDORS.length],
        kms: n % 3 === 0 ? null : 12 + (n * 7) % 30,
        vehicleNo,
        vehicleReg: vehicleNo,
        vehicleType: VEHICLE_TYPES[n % VEHICLE_TYPES.length],
        startTime: started ? `${date} ${shift}:${pad((n * 13) % 60)}` : null,
        endTime: n % 4 === 0 ? null : started ? `${date} ${pad((Number(shift.slice(0, 2)) + 1) % 24)}:${pad((n * 7) % 60)}` : null,
        driver: { name: driverName, phone: driverPhone, lastUpdated: `${date} ${pad(8 + (n % 10))}:${pad((n * 17) % 60)}` },
        guard: n % 3 === 1 ? { name: 'Rakesh (Guard)', phone: '+91 9811100022' } : null,
        flags: { medical: n % 4 === 0, guard: n % 3 === 1 },
        status: STATUSES[n % STATUSES.length],
      })
    })
  }
  return rows
}
