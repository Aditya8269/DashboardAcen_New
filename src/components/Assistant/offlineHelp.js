// Built-in eTMS help used when the AI service isn't configured or reachable.
// Each topic matches on English and Hinglish keywords; the best-scoring topic wins.

const TOPICS = [
  {
    keywords: ['refuse', 'refused', 'mana', 'reject kar', 'driver ne', 'driver refused'],
    answer: `**Driver refused a route - what to do**
1. On the Vendor Dashboard, click **Driver Refused** in the Routes card to see the count.
2. In the routes table, find the shift and click the **edit** (pencil) icon.
3. Assign another available driver/vehicle, or open **Reassign** from the sidebar.
4. Inform the driver and check the trip moves to **Driver Accepted**.
5. If no vehicle is free, contact the transport desk via **GET IN TOUCH** in the sidebar.`,
  },
  {
    keywords: ['reassign', 'change vehicle', 'vehicle change', 'gaadi badal', 'vehicle badal', 'assign vehicle', 'cab change'],
    answer: `**Reassign / assign a vehicle**
1. Open the sidebar (menu icon, top-left).
2. Go to **Reassign** to move a route to another vehicle, or **Vendor > Assign Vehicle** to assign one.
3. Select the date and location in the header first, then pick the route/shift.
4. Choose the new vehicle and driver, then save.
5. Come back to the Dashboard and press **refresh** on the routes table to confirm.`,
  },
  {
    keywords: ['not started', 'start nahi', 'started nahi', 'shuru nahi'],
    answer: `**"Not Started" means** the route is allocated (and maybe accepted) but the driver hasn't started the trip yet.

What to check:
1. Is the shift time close? Trips usually start shortly before pick-up.
2. Call the driver and confirm they are on the way.
3. If the driver can't come, reassign the route (sidebar > **Reassign**).`,
  },
  {
    keywords: ['guard', 'escort', 'security'],
    answer: `**Guard not assigned / guard issues**
1. Night trips and trips with a female first pick-up or last drop usually need a guard.
2. In the routes table, use **Add Guard/Employee** to add a guard to the route.
3. The **Status** card shows how many trips currently have guards.
4. If no guard is available, escalate to the transport desk immediately - don't start the trip without one when it is required.`,
  },
  {
    keywords: ['late', 'delay', 'der', 'running late', 'reached', 'pahuch'],
    answer: `**Driver late / cab reached alerts**
1. Check the **Attention** card on the Dashboard for the latest alerts.
2. Call the driver to get an ETA.
3. Inform the employee about the delay.
4. If the delay is long, reassign the route (sidebar > **Reassign**).
5. Use **Transport > Tracking Employees** to track the trip.`,
  },
  {
    keywords: ['geofenc', 'geo fence', 'location wrong', 'gps', 'map'],
    answer: `**Geofencing problems**
1. Open **Clear Geofencing** from the sidebar.
2. Search the employee or trip that has the wrong location.
3. Clear the geofence and save, then ask the driver to refresh their app.
4. If the employee's address itself is wrong, update it from the employee details.`,
  },
  {
    keywords: ['add employee', 'new employee', 'employee add', 'employee jod', 'naya employee'],
    answer: `**Add an employee**
1. Open the sidebar and go to **Add Employee** (or **Vendor > Add Employee**).
2. Fill in name, employee ID, contact, address and shift.
3. Save - the employee will appear for routing from the next schedule.
You can also add one directly to a route with **Add Guard/Employee** on the Dashboard.`,
  },
  {
    keywords: ['download', 'export', 'csv', 'report', 'excel'],
    answer: `**Download data / reports**
- On the Dashboard routes table, click the **download arrow** (or "…" > Export as CSV) to download the current list.
- For detailed reports, open **Reports** or **Transport > Reports Data** in the sidebar.`,
  },
  {
    keywords: ['date', 'location', 'site', 'tarikh', 'change date', 'branch'],
    answer: `**Change date or location**
Use the header at the top: click the **date** to pick another day, and the **location** (e.g. BLR - WTC) to switch site. The dashboard shows data for the selected date and location.`,
  },
  {
    keywords: ['filter', 'search', 'pick', 'drop', 'trip type', 'dhund'],
    answer: `**Find routes quickly**
- Type a shift time (e.g. 04:30) or PICK/DROP in the **Search** box.
- Click **Advanced Filter** to show only PICK or DROP trips; remove it with the × on the chip.
- Click the **Shift** column header to sort by time.`,
  },
  {
    keywords: ['allocated', 'total', 'completed', 'rejected', 'meaning', 'matlab', 'kya hai', 'numbers', 'count'],
    answer: `**What the Routes numbers mean**
- **Total** - all routes for the selected date/location.
- **Allocated** - routes that have a vehicle/driver assigned.
- **Driver Refused** - drivers declined the route; these need reassignment.
- **Started** - trips in progress.
- **Completed** - trips finished.
- **Rejected** - routes rejected and not running.`,
  },
  {
    keywords: ['edit', 'update route', 'change route', 'route edit'],
    answer: `**Edit a route**
In the Dashboard routes table, click the blue **edit** (pencil) icon on the shift row, make your changes (vehicle, driver, employees) and save.`,
  },
  {
    keywords: ['notification', 'alert', 'bell'],
    answer: `**Notifications**
Click the **bell** icon in the header. **Alerts** shows operational alerts and **Announcements** shows updates from the admin. Urgent trip alerts also appear in the **Attention** card on the Dashboard.`,
  },
  {
    keywords: ['login', 'password', 'logout', 'access', 'account'],
    answer: `**Login / account issues**
Use **Logout** from the profile menu (top-right) and sign in again with your Microsoft account. For access or permission problems, contact your administrator via **GET IN TOUCH** in the sidebar.`,
  },
]

const FALLBACK = `I couldn't find a built-in answer for that. I can help with:
- Driver refused / reassign vehicle
- Not started or late trips
- Guards and escorts
- Geofencing
- Adding employees, editing routes
- Filters, search, downloads and reports

Try asking about one of these, or contact support via **GET IN TOUCH** in the sidebar.`

export function getOfflineAnswer(question) {
  const text = question.toLowerCase()
  let best = null
  let bestScore = 0
  for (const topic of TOPICS) {
    const score = topic.keywords.reduce((total, keyword) => total + (text.includes(keyword) ? keyword.length : 0), 0)
    if (score > bestScore) {
      best = topic
      bestScore = score
    }
  }
  return best ? best.answer : FALLBACK
}
