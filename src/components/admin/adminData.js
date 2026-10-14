// Sample data for the Transport Admin dashboard. Replace with API data later.

export const ADMIN_METRICS = [
  { key: 'total', label: 'Total', value: 135, tone: 'default' },
  { key: 'allocated', label: 'Allocated', value: 130, tone: 'warning' },
  { key: 'vendorRefused', label: 'Vendor Refused', value: 9, tone: 'danger' },
  { key: 'started', label: 'Started', value: 114, tone: 'info' },
  { key: 'completed', label: 'Completed', value: 34, tone: 'success' },
  { key: 'rejected', label: 'Rejected', value: 2, tone: 'danger' },
]

export const ADMIN_STATUS = [
  { key: 'guards', label: 'Guards', value: 16, icon: 'shield', tone: 'warning' },
  { key: 'medical', label: 'Medical', value: 4, icon: 'add', tone: 'danger' },
]

export const ADMIN_ALERTS = {
  newCount: 10,
  items: [
    { id: 1, text: 'Cab reached alerts received by driver Ramesh Singh for trip 5515RB10006765/1500/P at place of employee 1334085' },
    { id: 2, text: 'Vendor KMTS refused 2 routes for the 02:00 PICK shift' },
    { id: 3, text: 'Geofence mismatch reported for route 223568R0014 (Sector 28, Gurgaon)' },
  ],
}

export const VENDORS = ['OSFW', 'KMTS', 'MERU', 'ZOOM']
export const VEHICLE_TYPES = ['Small (4 seater)', 'Medium (6 seater)', 'Large (7 seater)', 'Tempo Traveller']

const LOCATIONS = [
  'Sector 28-Gurgaon, Sector 28-Gurgaon',
  'Zone1 - BEGUR, Fullinfaws College',
  'Ramachandra pura, Ramachandra pura-bus stop',
  'Whitefield, ITPL Main Road',
  'Koramangala, 5th Block',
  'Electronic City, Phase 1',
]
const DRIVERS = ['Ramesh Singh', 'Suresh Kumar', 'Mahesh Yadav', 'Anil Sharma', 'Vikram Rao', 'Sunil Verma']
const STATUSES = ['Accepted', 'Refused', 'Driver Rejected', 'Accepted', 'Accepted', 'Refused']

let routeCounter = 1
const makeRoutes = (shift, tripType, vendor, count) => Array.from({ length: count }, () => {
  const n = routeCounter++
  const id = `223568R${String(n).padStart(4, '0')}`
  return {
    id,
    shift,
    tripType,
    vendor,
    stops: [20, 5, 8, 12, 3, 6][n % 6],
    location: LOCATIONS[n % LOCATIONS.length],
    cabId: `KA51AA${4200 + n * 7}`,
    status: STATUSES[n % STATUSES.length],
    flags: {
      traffic: n % 3 === 0,
      notAccessible: n % 4 === 0,
      car: true,
      guard: n % 2 === 0,
      medical: n % 5 === 0,
    },
    driver: { name: DRIVERS[n % DRIVERS.length], id: `B10DRVR${4760 + n}`, contact: `+91 98765 4${String(3200 + n).padStart(4, '0')}` },
    licenceNo: `KA-${10 + (n % 40)}-2019-00${4520 + n}`,
    licenceExp: '12 Oct 2026',
    vehicleReg: `5515RB1000${20 + n}`,
    vehicleType: VEHICLE_TYPES[n % VEHICLE_TYPES.length],
    badgeNo: `C21ESTS${5870 + n}`,
    badgeExp: '12 Oct 2026',
    geofenceCleared: n % 3 === 1,
    lastUpdated: { at: '06/02/2023 16:05:05', by: 'shubham.singh@accenture.com' },
  }
})

const vendorRow = (shift, tripType, vendor, stats, routeCount) => ({ vendor, ...stats, routeList: makeRoutes(shift, tripType, vendor, routeCount) })

const STATS_A = { routes: 28, allocated: 20, accepted: 18, refused: 2, started: 14, completed: 5, notStarted: 4, driverRejected: 2 }
const STATS_B = { routes: 16, allocated: 14, accepted: 12, refused: 1, started: 9, completed: 3, notStarted: 3, driverRejected: 1 }
const STATS_C = { routes: 10, allocated: 10, accepted: 9, refused: 0, started: 7, completed: 4, notStarted: 2, driverRejected: 0 }

const SHIFT_PLAN = [
  { shift: '00:30', tripType: 'DROP', vendors: [['OSFW', STATS_A, 3], ['KMTS', STATS_B, 2]] },
  { shift: '02:00', tripType: 'PICK', vendors: [['KMTS', STATS_B, 3], ['MERU', STATS_C, 2]] },
  { shift: '03:30', tripType: 'DROP', vendors: [['OSFW', STATS_C, 2], ['ZOOM', STATS_B, 2]] },
  { shift: '06:30', tripType: 'PICK', vendors: [['MERU', STATS_A, 3]] },
]

const sum = (rows, key) => rows.reduce((total, row) => total + row[key], 0)
const STAT_KEYS = Object.keys(STATS_A)

// Shift totals are the sum of their vendors.
export const SHIFTS = SHIFT_PLAN.map(({ shift, tripType, vendors }) => {
  const vendorRows = vendors.map(([vendor, stats, count]) => vendorRow(shift, tripType, vendor, stats, count))
  return {
    id: `${shift}-${tripType}`,
    shift,
    tripType,
    vendors: vendorRows,
    ...Object.fromEntries(STAT_KEYS.map((key) => [key, sum(vendorRows, key)])),
  }
})
