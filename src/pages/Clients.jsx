import { useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { AppBar, EmptyState, Spinner } from '../components/ui'

export default function Clients() {
  const { clients, ready } = useData()
  const navigate = useNavigate()

  return (
    <>
      <AppBar
        title="Clients"
        right={
          <button className="btn ghost sm" onClick={() => navigate('/client/new')}>
            Add
          </button>
        }
      />
      <div className="content">
        {!ready ? (
          <Spinner />
        ) : clients.length === 0 ? (
          <EmptyState
            title="No clients yet"
            text="Add clients to set custom prices and travel rates."
            action={
              <button className="btn" onClick={() => navigate('/client/new')}>
                + Add client
              </button>
            }
          />
        ) : (
          <div className="list">
            {clients.map((c) => (
              <div key={c.id} className="row" onClick={() => navigate(`/client/${c.id}`)}>
                <div className="grow">
                  <div className="title">{c.name}</div>
                  <div className="sub">
                    {[c.company, c.email, c.phone].filter(Boolean).join(' · ') || 'No contact details'}
                  </div>
                </div>
                {(c.customRadiusKm != null && c.customRadiusKm !== '') ||
                (c.customTravelRatePerKm != null && c.customTravelRatePerKm !== '') ||
                (c.customPrices && Object.keys(c.customPrices).length > 0) ? (
                  <span className="pill">Custom</span>
                ) : null}
                <span className="chev">›</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
