import { useCallback, useMemo, useState } from 'react'
import MasterLayout from './Master/MasterLayout.jsx'
import Card from './common/Card.jsx'
import Button from './common/Button.jsx'
import IconButton from './common/IconButton.jsx'
import SearchInput from './common/SearchInput.jsx'
import DataTable from './common/DataTable.jsx'
import Dropdown from './common/Dropdown.jsx'
import Pagination from './common/Pagination.jsx'
import { toastService } from '../services/toastService'
import UserFormDrawer from './users/UserFormDrawer.jsx'
import { FACILITIES, USERS } from './users/usersData.js'
import { getCurrentUser } from '../authConfig'
import './VendorDashboard.css' // shared toolbar styles
import './UserRegistration.css'

const PAGE_SIZE = 10
const ALL = 'All Facilities'

// "2024-12-17T16:23:13" → "2024-12-17  16:23:13"
const formatDate = (value) => value.replace('T', ' ')

const nowIso = () => {
  const date = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function UserRegistration() {
  const [users, setUsers] = useState(USERS)
  const [facility, setFacility] = useState(ALL)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState({ key: 'employeeId', direction: 'asc' })
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState(null) // null = closed, 'new', or a user object
  const [refreshing, setRefreshing] = useState(false)
  const closeForm = useCallback(() => setEditing(null), [])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    const rows = users.filter((user) => {
      const inFacility = facility === ALL || user.baseFacility === facility || user.additionalFacilities.includes(facility)
      const matches = !term || [user.employeeId, user.userType, user.vendor, user.baseFacility, user.updatedBy, ...user.additionalFacilities]
        .some((value) => value.toLowerCase().includes(term))
      return inFacility && matches
    })
    const factor = sort.direction === 'asc' ? 1 : -1
    return rows.sort((a, b) => String(a[sort.key]).localeCompare(String(b[sort.key]), undefined, { numeric: true, sensitivity: 'base' }) * factor)
  }, [users, facility, query, sort])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pages)
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const changeFilter = (setter) => (value) => {
    setter(value)
    setPage(1)
  }

  const saveUser = (data) => {
    const updatedBy = getCurrentUser()?.profile?.name || 'C51344'
    const saved = { ...data, updatedBy, updatedAt: nowIso() }
    const exists = users.some((user) => user.id === saved.id)
    setUsers((current) => (exists ? current.map((user) => (user.id === saved.id ? saved : user)) : [saved, ...current]))
    setEditing(null)
    toastService.success(exists ? `User ${saved.employeeId} updated` : `User ${saved.employeeId} added`)
  }

  const deleteUser = (user) => {
    setUsers((current) => current.filter((item) => item.id !== user.id))
    toastService.success(`User ${user.employeeId} deleted`)
  }

  const refresh = () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
      toastService.success('User list refreshed')
    }, 600)
  }

  const columns = [
    { key: 'employeeId', header: 'Employee Details', sortable: true, primary: true, render: (u) => <span className="user-id">{u.employeeId}</span> },
    { key: 'userType', header: 'User Type', sortable: true },
    { key: 'vendor', header: 'Vendor', sortable: true },
    { key: 'baseFacility', header: 'Base Facility', sortable: true },
    { key: 'additionalFacilities', header: 'Additional Facility', render: (u) => (u.additionalFacilities.length ? <span className="user-facilities">{u.additionalFacilities.join(', ')}</span> : <span className="text-muted">—</span>) },
    { key: 'updatedBy', header: 'Updated By', sortable: true, render: (u) => u.updatedBy || <span className="text-muted">—</span> },
    { key: 'updatedAt', header: 'Updated At', sortable: true, render: (u) => <span className="user-date">{formatDate(u.updatedAt)}</span> },
    {
      key: 'actions',
      header: 'Actions',
      render: (u) => (
        <div className="user-actions">
          <IconButton icon="edit" variant="primary" label={`Edit ${u.employeeId}`} onClick={() => setEditing(u)} />
          <Dropdown align="end" trigger={({ open, toggle }) => <IconButton icon="delete" className="icon-btn--danger" label={`Delete ${u.employeeId}`} onClick={toggle} aria-expanded={open} />}>
            {(close) => (
              <div className="confirm-menu">
                <p>Delete user <strong>{u.employeeId}</strong>?</p>
                <div>
                  <Button size="sm" variant="ghost" onClick={close}>Cancel</Button>
                  <Button size="sm" className="btn--danger" onClick={() => { deleteUser(u); close() }}>Delete</Button>
                </div>
              </div>
            )}
          </Dropdown>
        </div>
      ),
    },
  ]

  return (
    <MasterLayout
      breadcrumb={{ section: 'Admin', title: 'User Registration' }}
      assistantContext={`Page: Admin > User Registration. Manage eTMS users: add, edit (user type, vendor, base facility, additional facilities) and delete. ${users.length} users; filter by facility and search by employee ID or email.`}
    >
      <div className="page-head">
        <div>
          <h1 className="page-head__title">User Registration</h1>
          <p className="page-head__sub">{users.length} registered users</p>
        </div>
        <Button icon="add_circle" onClick={() => setEditing('new')}>Add New User</Button>
      </div>

      <Card className="users-card" aria-label="Registered users">
        <div className="routes-toolbar users-toolbar">
          <label className="users-facility">
            <span className="sr-only">Facility</span>
            <select className="form-control" value={facility} onChange={(event) => changeFilter(setFacility)(event.target.value)}>
              <option>{ALL}</option>
              {FACILITIES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <SearchInput value={query} onChange={changeFilter(setQuery)} placeholder="Search User..." label="Search users" className="users-search" />
          <IconButton icon="sync" variant="soft" label="Refresh users" onClick={refresh} iconClassName={refreshing ? 'is-spinning' : ''} disabled={refreshing} />
        </div>

        <DataTable
          caption="Registered users"
          columns={columns}
          rows={pageRows}
          sort={sort}
          onSortChange={(key) => setSort((current) => ({ key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' }))}
          emptyMessage="No users match your filters."
        />

        <Pagination page={currentPage} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
      </Card>

      {editing && (
        <UserFormDrawer
          key={editing === 'new' ? 'new' : editing.id}
          user={editing === 'new' ? null : editing}
          existingIds={new Set(users.map((user) => user.id))}
          onClose={closeForm}
          onSave={saveUser}
        />
      )}
    </MasterLayout>
  )
}

export default UserRegistration
