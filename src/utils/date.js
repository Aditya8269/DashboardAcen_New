const pad = (n) => String(n).padStart(2, '0')

// Date → "YYYY-MM-DD" in local time (the value format of <input type="date">).
export const toIsoDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
export const todayIso = () => toIsoDate(new Date())

// "2026-10-26" → "26 Oct 2026"
export const formatDay = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

// Returns an error message for a report date range, or '' when valid.
export function validateDateRange(startDate, endDate) {
  if (!startDate || !endDate) return 'Select both Start Date and End Date'
  if (endDate < startDate) return 'End Date cannot be before Start Date'
  return ''
}
