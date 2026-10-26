// Sample data for the App Installed Status (DriverAppInstallReport) page. Replace with the report API later.

export const APP_FACILITIES = ['GGN', 'BLR', 'Hyderabad', 'Noida', 'Pune']

const DRIVER_TOTALS = { GGN: [199, 182], BLR: [146, 120], Hyderabad: [88, 85], Noida: [64, 41], Pune: [52, 52] }
const FIRST = ['Deepak', 'Ramesh', 'Sunil', 'Vikas', 'Amit', 'Rajesh', 'Manoj', 'Sanjay', 'Ravi', 'Ajay']
const LAST = ['Singh', 'Kumar', 'Yadav', 'Sharma', 'Verma', 'Gupta']
const VERSIONS = ['4.2.1', '4.2.0', '4.1.8']

const percent = (part, total) => (total ? Math.round((part / total) * 10000) / 100 : 0)

// One summary row per facility.
export const APP_INSTALL_SUMMARY = APP_FACILITIES.map((facility) => {
  const [totalDrivers, installed] = DRIVER_TOTALS[facility]
  const notInstalled = totalDrivers - installed
  return {
    id: facility,
    facility,
    totalDrivers,
    installed,
    notInstalled,
    installedPct: percent(installed, totalDrivers),
    notInstalledPct: percent(notInstalled, totalDrivers),
  }
})

// Driver-level list behind a summary row (used by "Export Excel").
export function getFacilityDrivers(facility) {
  const summary = APP_INSTALL_SUMMARY.find((row) => row.facility === facility)
  if (!summary) return []
  const code = facility.slice(0, 3).toUpperCase()
  return Array.from({ length: summary.totalDrivers }, (_, index) => {
    const installed = index < summary.installed
    return {
      driverId: `${code}DRVR${String(4700 + index).padStart(5, '0')}`,
      name: `${FIRST[index % FIRST.length]} ${LAST[(index * 7) % LAST.length]}`,
      phone: `+91 98${String(10000000 + index * 7919).slice(0, 8)}`,
      vehicleNo: `DL${12000 + index * 3}`,
      appInstalled: installed ? 'Yes' : 'No',
      appVersion: installed ? VERSIONS[index % VERSIONS.length] : '',
    }
  })
}
