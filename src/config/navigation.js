// Page routes. Admin is the default page.
export const ROUTES = {
  admin: '/',
  vendor: '/vendor',
  userRegistration: '/user-registration',
  routeDetailsReport: '/reports/route-details',
  routeSummaryReport: '/reports/route-summary',
  appInstalledStatus: '/reports/app-installed-status',
  masterData: '/reports/master-data',
  dailyRouteDetails: '/reports/daily-route-details',
  appStatusReport: '/reports/app-status',
  compliance: '/compliance',
}

// Dashboards reachable from the header app switcher (grid icon).
export const DASHBOARDS = [
  { label: 'Transport Admin', to: ROUTES.admin, icon: 'admin_panel_settings' },
  { label: 'Vendor Dashboard', to: ROUTES.vendor, icon: 'local_shipping' },
]

// One sidebar menu for every page. An item uses either `image` (file in /public/images/icons)
// or `icon` (Material icon). Items/children with `to` navigate; the active one follows the URL.
const ADMIN_SECTION = ['Schedules', 'ADHOC’S Management', 'My No Shows', 'My Feedbacks']

export const SIDEBAR_MENU = [
  { label: 'Admin', icon: 'admin_panel_settings', children: [{ label: 'Dashboard', to: ROUTES.admin }, { label: 'User Registration', to: ROUTES.userRegistration }, ...ADMIN_SECTION] },
  { label: 'Vendor', icon: 'local_shipping', children: [{ label: 'Dashboard', to: ROUTES.vendor }, 'Add Employee', 'Assign Vehicle'] },
  { label: 'Compliance', icon: 'assignment_turned_in', children: [{ label: 'Dashboard', to: ROUTES.compliance }, ...ADMIN_SECTION] },
  {
    label: 'Reports',
    icon: 'description',
    children: [
      { label: 'Route Details Report', to: ROUTES.routeDetailsReport },
      { label: 'Route Summary', to: ROUTES.routeSummaryReport },
      'OverSpeeding Report',
      { label: 'Master Data', to: ROUTES.masterData },
      { label: 'App Installed Status', to: ROUTES.appInstalledStatus },
      { label: 'Daily Route Details', to: ROUTES.dailyRouteDetails },
      'Re-Assign Report',
      { label: 'App Status Report', to: ROUTES.appStatusReport },
      'No-Communication Report',
    ],
  },
]
