// Static sample data matching the Figma design. Replace with API data later.

export const ROUTE_METRICS = [
  { key: 'total', label: 'Total', value: 135, tone: 'default' },
  { key: 'allocated', label: 'Allocated', value: 130, tone: 'warning' },
  { key: 'refused', label: 'Driver Refused', value: 9, tone: 'danger' },
  { key: 'started', label: 'Started', value: 114, tone: 'info' },
  { key: 'completed', label: 'Completed', value: 34, tone: 'success' },
  { key: 'rejected', label: 'Rejected', value: 2, tone: 'danger' },
]

export const STATUS_ITEMS = [
  { key: 'guards', label: 'Guards', value: 16, icon: 'shield', tone: 'warning' },
  { key: 'medical', label: 'Medical', value: 4, icon: 'add', tone: 'danger' },
]

export const ALERTS = {
  newCount: 10,
  items: [
    { id: 1, text: 'Cab reached alerts received by driver Ramesh Singh for trip 5515RB10006765/1500/P at place of employee 1334085' },
    { id: 2, text: 'Driver Suresh Kumar is running 15 minutes late for trip 5515RB10006772/0230/D' },
    { id: 3, text: 'Guard not assigned for trip 5515RB10006781/0400/P with a female first pickup' },
  ],
}

const row = (id, shift, tripType) => ({
  id,
  shift,
  tripType,
  routes: 3,
  allocated: 3,
  driverAccepted: 2,
  started: 2,
  completed: 1,
  notStarted: 1,
  rejected: 1,
})

export const ROUTES = [
  row(1, '00:30', 'DROP'),
  row(2, '02:00', 'PICK'),
  row(3, '03:30', 'DROP'),
  row(4, '04:00', 'PICK'),
  row(5, '04:30', 'DROP'),
  row(6, '06:30', 'DROP'),
]
