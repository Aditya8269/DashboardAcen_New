import Card from '../common/Card.jsx'
import Pill from '../common/Pill.jsx'
import MaterialIcon from '../Master/MaterialIcon.jsx'

function AttentionCard({ newCount, items, onSelect, onViewAll }) {
  return (
    <Card className="attention-card" aria-label="Attention alerts">
      <div className="attention-card__head">
        <h2 className="card-label">Attention</h2>
        <Pill tone="warning" variant="soft">{newCount} New alerts</Pill>
        {onViewAll && <button type="button" className="attention-card__view-all" onClick={onViewAll}>View All</button>}
      </div>
      <ul className="attention-card__list">
        {items.map((alert) => (
          <li key={alert.id}>
            <button type="button" onClick={() => onSelect?.(alert)}>
              <MaterialIcon name="info" />
              <span>{alert.text}</span>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export default AttentionCard
