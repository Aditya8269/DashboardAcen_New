import { useState } from 'react'
import { asset } from '../../utils/asset'
import IconButton from '../common/IconButton.jsx'

const announcements = [
  { title: 'Welcome to eTMS', text: 'We are very delighted to see you here.' },
  { title: 'Adhoc request approved', text: 'Your request has been approved successfully.' },
  { title: 'Report generated', text: 'Your average trip hours report is ready.' },
]

function Notifications({ show, onClose }) {
  const [tab, setTab] = useState('alerts')
  if (!show) return null

  return (
    <>
      <button type="button" className="app-backdrop app-backdrop--notifications" aria-label="Close notifications" onClick={onClose} />
      <aside className="notifications-panel" role="dialog" aria-modal="true" aria-label="Notifications">
        <div className="notifications-panel__head">
          <h2>Notifications</h2>
          <IconButton icon="close" label="Close notifications" onClick={onClose} />
        </div>
        <div className="notifications-panel__tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'alerts'} className={tab === 'alerts' ? 'is-active' : ''} onClick={() => setTab('alerts')}>Alerts</button>
          <button type="button" role="tab" aria-selected={tab === 'announcements'} className={tab === 'announcements' ? 'is-active' : ''} onClick={() => setTab('announcements')}>
            Announcements {tab !== 'announcements' && <i className="dot" />}
          </button>
        </div>
        {tab === 'alerts' ? (
          <div className="notifications-panel__empty">
            <img src={asset('images/notification.png')} alt="" />
            <p>You don’t have any notifications</p>
          </div>
        ) : (
          <ul className="notifications-panel__list">
            {announcements.map((item) => <li key={item.title}>{item.title}<small>{item.text}</small></li>)}
          </ul>
        )}
      </aside>
    </>
  )
}

export default Notifications
