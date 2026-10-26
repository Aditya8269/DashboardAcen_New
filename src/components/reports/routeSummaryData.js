import { toIsoDate } from '../../utils/date'

// Sample data for the Route Summary Report: one row per date + facility + shift. Replace with the report API later.

export const SUMMARY_FACILITIES = ['GGN', 'BLR', 'Hyderabad', 'Noida', 'Pune']

const SHIFTS = [['06:30', 'PICK'], ['09:00', 'PICK'], ['17:00', 'PICK'], ['19:30', 'DROP'], ['22:00', 'DROP']]

export function buildRouteSummary(today = new Date()) {
  const rows = []
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const day = new Date(today)
    day.setDate(day.getDate() - dayOffset)
    const date = toIsoDate(day)
    SUMMARY_FACILITIES.forEach((facility, facilityIndex) => {
      SHIFTS.forEach(([shift, tripType], shiftIndex) => {
        const n = dayOffset * 31 + facilityIndex * 7 + shiftIndex * 3
        const totalTrips = 20 + (n * 13) % 70
        const allocated = Math.max(1, totalTrips - (n % 9) * 3)
        const driverAccepted = Math.max(0, allocated - (n % 4))
        // Today's later shifts haven't run yet; past days are mostly done.
        const started = dayOffset === 0 && shiftIndex >= 2 ? n % 3 : Math.max(0, driverAccepted - (n % 3))
        const completed = dayOffset === 0 ? Math.floor(started / 2) : Math.max(0, started - (n % 2))
        rows.push({
          id: `${date}-${facility}-${shift}-${tripType}`,
          date,
          facility,
          tripType,
          shift,
          totalTrips,
          allocated,
          driverAccepted,
          tripStarted: started,
          tripNotStarted: totalTrips - started,
          tripCompleted: completed,
          tripNotCompleted: started - completed,
        })
      })
    })
  }
  return rows
}
