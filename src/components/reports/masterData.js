// Sample master data (vehicles, drivers, guards) for the Master Data / ExportDetailsReport page.
// Replace with the master-data API later.

export const MASTER_FACILITIES = ['GGN', 'BLR', 'Hyderabad', 'Noida']
export const MASTER_VENDORS = ['delta', 'OSFW', 'KMTS']
export const MASTER_REPORT_TYPES = ['Vehicle Details', 'Driver Details', 'Guard Details']

const VEHICLE_TYPES = [['Tavera', 6], ['Innova', 6], ['Dzire', 4], ['Ertiga', 6], ['Tempo Traveller', 12]]
const FIRST = ['Deepak', 'Ramesh', 'Sunil', 'Vikas', 'Amit', 'Rajesh', 'Manoj', 'Sanjay']
const LAST = ['Singh', 'Kumar', 'Yadav', 'Sharma', 'Verma']

// The GGN / delta vehicles from the live screen, then generated rows for other facilities and vendors.
const KNOWN_VEHICLES = [
  ['0162', 'HR55Y016231'], ['DL12345', 'DL12345'], ['DL197729', 'DL197729'], ['TEST01', 'TEST01'], ['TEST02', 'TEST02'],
  ['TEST03', 'TEST03'], ['TEST04', 'TEST04'], ['TEST05', 'TEST05'], ['TEST06', 'TEST06'], ['test123', 'test1234'],
].map(([vehicleNo, regNo]) => ({ vehicleNo, regNo, vehicleType: 'Tavera', occupancy: 6, vendor: 'delta', facility: 'GGN', attrited: 'NO' }))

const generated = []
MASTER_FACILITIES.forEach((facility, f) => {
  MASTER_VENDORS.forEach((vendor, v) => {
    if (facility === 'GGN' && vendor === 'delta') return
    for (let i = 0; i < 4 + ((f + v) % 3); i++) {
      const n = f * 40 + v * 13 + i
      const [vehicleType, occupancy] = VEHICLE_TYPES[n % VEHICLE_TYPES.length]
      const code = `${facility.slice(0, 2).toUpperCase()}${String(10 + (n % 80)).padStart(2, '0')}`
      const number = `${code}AB${String(1000 + n * 37).slice(-4)}`
      generated.push({ vehicleNo: number, regNo: number, vehicleType, occupancy, vendor, facility, attrited: n % 7 === 0 ? 'YES' : 'NO' })
    }
  })
})

export const VEHICLES = [...KNOWN_VEHICLES, ...generated].map((row) => ({ ...row, id: `veh-${row.vehicleNo}` }))

const person = (prefix, index, row) => ({
  id: `${prefix}${String(4700 + index).padStart(5, '0')}`,
  name: `${FIRST[index % FIRST.length]} ${LAST[(index * 3) % LAST.length]}`,
  phone: `+91 98${String(10000000 + index * 7919).slice(0, 8)}`,
  vendor: row.vendor,
  facility: row.facility,
  attrited: index % 9 === 4 ? 'YES' : 'NO',
})

// One driver per vehicle, one guard per two vehicles.
export const DRIVERS = VEHICLES.map((vehicle, index) => ({
  ...person('B10DRVR', index, vehicle),
  licenceNo: `DL-${String(10 + (index % 40)).padStart(2, '0')}-2019-00${4520 + index}`,
  licenceExpiry: `${String(1 + (index % 28)).padStart(2, '0')} ${['Jan', 'Apr', 'Jul', 'Oct'][index % 4]} ${2026 + (index % 3)}`,
  vehicleNo: vehicle.vehicleNo,
}))

export const GUARDS = VEHICLES.filter((_, index) => index % 2 === 0).map((vehicle, index) => person('GRD', index, vehicle))

export const MASTER_DATASETS = {
  'Vehicle Details': VEHICLES,
  'Driver Details': DRIVERS,
  'Guard Details': GUARDS,
}
