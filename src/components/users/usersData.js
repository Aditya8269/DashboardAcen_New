// Sample users for the User Registration page. Replace with API data later.

export const USER_TYPES = ['User', 'Admin', 'Super Admin', 'Vendor']
export const VENDORS = ['Admin', 'OSFW', 'KMTS', 'MERU', 'ZOOM']
export const FACILITIES = ['GGN', 'Hyderabad', 'BLR', 'ECO', 'GVT', 'Noida', 'Pune']

const user = (employeeId, userType, vendor, baseFacility, additionalFacilities, updatedBy, updatedAt) => ({
  id: employeeId.toLowerCase(),
  employeeId,
  userType,
  vendor,
  baseFacility,
  additionalFacilities,
  updatedBy,
  updatedAt,
})

export const USERS = [
  user('11437', 'User', 'Admin', 'Hyderabad', [], 'C51344', '2024-12-17T16:23:13'),
  user('11677', 'Admin', 'Admin', 'Hyderabad', [], 'C51344', '2024-12-10T16:47:30'),
  user('11731', 'User', 'Admin', 'Hyderabad', [], 'C51344', '2024-12-10T16:50:02'),
  user('12007', 'User', 'Admin', 'Hyderabad', [], 'C51344', '2025-11-26T17:49:56'),
  user('Admin', 'Super Admin', 'Admin', 'GGN', [], '', '2019-12-24T16:27:11'),
  user('Amit.kishore@se2.com', 'Super Admin', 'Admin', 'GGN', ['BLR', 'ECO', 'GVT', 'Noida', 'Pune'], 'C51344', '2024-09-24T18:34:09'),
  user('Ashok.kumar@se2.com', 'User', 'Admin', 'GGN', [], 'Ashok.kumar@se2.com', '2021-01-11T13:17:56'),
  user('12114', 'Vendor', 'OSFW', 'GGN', ['Noida'], 'C51344', '2025-06-02T10:12:44'),
  user('12188', 'User', 'KMTS', 'BLR', [], 'C51344', '2025-07-15T09:05:20'),
  user('12230', 'Admin', 'MERU', 'Pune', ['BLR'], 'C51344', '2025-08-01T11:42:08'),
  user('Neha.sharma@se2.com', 'Admin', 'Admin', 'Noida', ['GGN'], 'Amit.kishore@se2.com', '2025-09-19T15:30:00'),
  user('12345', 'User', 'ZOOM', 'GVT', [], 'C51344', '2025-10-03T08:20:31'),
  user('Rahul.verma@se2.com', 'User', 'Admin', 'ECO', [], 'C51344', '2025-10-21T12:10:10'),
]
