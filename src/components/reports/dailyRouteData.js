import { toIsoDate } from '../../utils/date'

// Sample data for the Daily Route Details report: one row per facility per day. Replace with the report API later.

export const DAILY_FACILITIES = ['GGN', 'BLR', 'Hyderabad', 'Noida', 'Pune']

export const DAILY_NUMBER_COLUMNS = [
  ['routesPushed', 'Routes pushed from TMS'],
  ['tripsAllocated', 'Trips Allocated'],
  ['tripsAccepted', 'Trips Accepted by Driver'],
  ['tripsNotAccepted', 'Trip Not Accepted'],
  ['routesStarted', 'Routes Started'],
  ['routesCompleted', 'Routes Completed'],
]

export function buildDailyRoutes(today = new Date()) {
  const rows = []
  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const day = new Date(today)
    day.setDate(day.getDate() - dayOffset)
    const date = toIsoDate(day)
    DAILY_FACILITIES.forEach((facility, index) => {
      // Today's GGN numbers match the live screen (76 / 1 / 1 / 0 / 1 / 0).
      if (dayOffset === 0 && facility === 'GGN') {
        rows.push({ id: `${date}-${facility}`, date, facility, routesPushed: 76, tripsAllocated: 1, tripsAccepted: 1, tripsNotAccepted: 0, routesStarted: 1, routesCompleted: 0 })
        return
      }
      const n = dayOffset * 11 + index * 5
      const routesPushed = 30 + (n * 17) % 60
      const tripsAllocated = dayOffset === 0 ? (n % 20) : routesPushed - (n % 6)
      const tripsAccepted = Math.max(0, tripsAllocated - (n % 4))
      const routesStarted = dayOffset === 0 ? Math.floor(tripsAccepted / 3) : Math.max(0, tripsAccepted - (n % 3))
      const routesCompleted = dayOffset === 0 ? Math.floor(routesStarted / 2) : routesStarted - (n % 2 ? 0 : Math.min(1, routesStarted))
      rows.push({
        id: `${date}-${facility}`,
        date,
        facility,
        routesPushed,
        tripsAllocated,
        tripsAccepted,
        tripsNotAccepted: tripsAllocated - tripsAccepted,
        routesStarted,
        routesCompleted,
      })
    })
  }
  return rows
}
