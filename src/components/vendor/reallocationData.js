// Sample data for the Cab Reallocation panel. Replace with API calls later.

export const FACILITIES = ['BLR - WTC', 'BLR - ETV', 'GGN - DLF', 'HYD - MDP']
export const TRIP_TYPES = ['PICK', 'DROP']

const LOCATIONS = ['Old Pepsi Godown, Hosa Road', 'Bommanahalli, Hosur Road', 'HSR Layout, Sector 2', 'Silk Board Junction', 'BTM Layout, 2nd Stage']
const VEHICLE_TYPES = ['Medium', 'Small', 'Large']

const hash = (text) => [...text].reduce((total, char) => (total * 31 + char.charCodeAt(0)) % 100000, 7)

// Routes of one shift + trip type. Deterministic, so the same shift always shows the same routes.
export function getShiftRoutes(shift, tripType) {
  const seed = hash(`${shift}-${tripType}`)
  const count = 3 + (seed % 3)
  return Array.from({ length: count }, (_, index) => {
    const n = seed + index * 17
    return {
      id: `759${String(27900 + (n % 900)).padStart(5, '0')}R${index + 1}`,
      cabId: `KA51D${3100 + (n % 90)}`,
      stops: 2 + (n % 4),
      location: LOCATIONS[n % LOCATIONS.length],
      vehicleType: VEHICLE_TYPES[n % VEHICLE_TYPES.length],
      flags: { verified: index % 3 === 0, guard: index % 3 !== 0, medical: index % 3 === 1 },
    }
  })
}

const VEHICLES = ['Swift-WTC', 'Indica-WTC', 'Etios-GTP', '12TT-GTP', 'Indica-GTP', 'Swift-WTC', 'Indica-GTP', 'Swift-WTC']
const PREVIOUS_SHIFTS = ['', '22:30 DROP', '', '00:30 DROP', '', '', '23:00 PICK', '']

// Cabs that are free for the selected shift.
export function getAvailableCabs(shift, tripType) {
  const seed = hash(`cabs-${shift}-${tripType}`)
  return VEHICLES.map((vehicle, index) => ({
    id: `KA51D${3111 + ((seed + index * 13) % 80)}`,
    vehicle,
    regNo: `KA41C${1272 + ((seed + index * 7) % 60)}`,
    previousShift: PREVIOUS_SHIFTS[index],
    occupancy: vehicle.startsWith('12TT') ? 12 : 4,
  }))
}
