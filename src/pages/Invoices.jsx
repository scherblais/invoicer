import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { createInvoice } from '../lib/db'
import { formatMoney } from '../lib/money'
import { AppBar, EmptyState, Spinner } from '../components/ui'

function fmtDate(ts) {
  try {
    const d = ts?.toDate ? ts.toDate() : ts ? new Date(ts) : null
    if (!d) return ''
    return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return ''
  }
}

export default function Invoices() {
  const { user } = useAuth()
  const { invoices, settings, ready } = useData()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const currency = settings.currency || 'CAD'

  async function newInvoice() {
    setCreating(true)
    try {
      const id = await createInvoice(user.uid, {
        status: 'draft',
        date: new Date().toISOString().slice(0, 10),
        items: [],
        travel: null,
        taxRate: settings.taxRate ?? 0,
        currency
      })
      navigate(`/invoice/${id}`)
    } catch (e) {
      alert('Could not create invoice. Check your connection and try again.')
      setCreating(false)
    }
  }

  return (
    <>
      <AppBar title="Invoices" />
      <div className="content">
        {!ready ? (
          <Spinner />
        ) : invoices.length === 0 ? (
          <EmptyState
            emoji="🧾"
            title="No invoices yet"
            text="Create your first invoice — it saves to the cloud automatically."
            action={
              <button className="btn" onClick={newInvoice} disabled={creating}>
                {creating ? 'Creating…' : '+ New invoice'}
              </button>
            }
          />
        ) : (
          <div className="list">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="row"
                onClick={() => navigate(`/invoice/${inv.id}`)}
              >
                <div className="grow">
                  <div className="title">
                    {inv.clientName || 'No client'}{' '}
                    <span className="muted" style={{ fontWeight: 500 }}>
                      · #{String(inv.number || 0).padStart(4, '0')}
                    </span>
                  </div>
                  <div className="sub">
                    {fmtDate(inv.date || inv.createdAt)}
                    {inv.listingAddress ? ` · ${inv.listingAddress}` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="amount tabnum">
                    {formatMoney(inv.total || 0, inv.currency || currency)}
                  </div>
                  <span className={`pill ${inv.status || 'draft'}`}>
                    {inv.status || 'draft'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {ready && invoices.length > 0 && (
        <button className="fab" onClick={newInvoice} disabled={creating} aria-label="New invoice">
          +
        </button>
      )}
    </>
  )
}
