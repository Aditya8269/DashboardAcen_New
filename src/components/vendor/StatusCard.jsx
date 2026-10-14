import Card from '../common/Card.jsx'
import MaterialIcon from '../Master/MaterialIcon.jsx'
import { padNumber } from '../../utils/asset'

function StatusCard({ items }) {
  return (
    <Card className="status-card">
      <h2 className="card-label">Status</h2>
      <div className="status-card__list">
        {items.map((item) => (
          <div className="status-item" key={item.key}>
            <span className="status-item__label">
              <span className={`status-item__icon status-item__icon--${item.tone}`}><MaterialIcon name={item.icon} /></span>
              {item.label}
            </span>
            <strong>{padNumber(item.value)}</strong>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default StatusCard
