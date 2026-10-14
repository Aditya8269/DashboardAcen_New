import Card from '../common/Card.jsx'
import { padNumber } from '../../utils/asset'

function RouteStatsCard({ metrics, activeKey, onSelect }) {
  return (
    <Card className="route-stats">
      <h2 className="card-label">Routes</h2>
      <div className="route-stats__list" role="tablist" aria-label="Route status">
        {metrics.map((metric) => (
          <button
            key={metric.key}
            type="button"
            role="tab"
            aria-selected={metric.key === activeKey}
            className={`route-stat route-stat--${metric.tone} ${metric.key === activeKey ? 'is-active' : ''}`}
            onClick={() => onSelect(metric.key)}
          >
            <strong>{padNumber(metric.value)}</strong>
            <span>{metric.label}</span>
          </button>
        ))}
      </div>
    </Card>
  )
}

export default RouteStatsCard
