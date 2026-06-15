import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { getInvoice } from '../lib/db'
import { formatMoney } from '../lib/money'
import { computeInvoiceTotals } from './InvoiceEditor'
import { AppBar } from '../components/ui'

function fmtDate(d) {
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return d
  }
}

export default function InvoiceView() {
  const { id } = useParams()
  const { user } = useAuth()
  const { invoices, clients, settings } = useData()
  const navigate = useNavigate()
  const [inv, setInv] = useState(() => invoices.find((i) => i.id === id) || null)

  useEffect(() => {
    const live = invoices.find((i) => i.id === id)
    if (live) setInv(live)
    else if (!inv) getInvoice(user.uid, id).then((d) => d && setInv(d))
  }, [invoices, id, inv, user.uid])

  const client = useMemo(
    () => clients.find((c) => c.id === inv?.clientId) || null,
    [clients, inv]
  )

  if (!inv) {
    return (
      <>
        <AppBar title="Invoice" back={`/invoice/${id}`} />
        <div className="content">
          <div className="spinner" />
        </div>
      </>
    )
  }

  const currency = inv.currency || settings.currency || 'CAD'
  const totals = computeInvoiceTotals(inv, client, settings)
  const number = `#${String(inv.number || 0).padStart(4, '0')}`

  async function share() {
    const lines = [
      `${settings.businessName || 'Invoice'} — Invoice ${number}`,
      client ? `Bill to: ${client.name}` : '',
      inv.listingAddress ? `Listing: ${inv.listingAddress}` : '',
      '',
      ...(inv.items || []).map(
        (it) => `${it.qty} × ${it.name} — ${formatMoney(it.unitPrice * it.qty, currency)}`
      ),
      totals.travelFee > 0 ? `Travel — ${formatMoney(totals.travelFee, currency)}` : '',
      `Total: ${formatMoney(totals.total, currency)}`
    ].filter(Boolean)
    const text = lines.join('\n')
    try {
      if (navigator.share) await navigator.share({ title: `Invoice ${number}`, text })
      else {
        await navigator.clipboard.writeText(text)
        alert('Invoice summary copied to clipboard.')
      }
    } catch {
      /* user cancelled */
    }
  }

  return (
    <>
      <AppBar title="Preview" back={`/invoice/${id}`} />
      <div className="content">
        <div className="invoice-doc">
          <div className="doc-head">
            <div>
              <h2>{settings.businessName || 'Your Business'}</h2>
              <div className="muted" style={{ fontSize: 13, whiteSpace: 'pre-line' }}>
                {[settings.businessAddress, settings.businessEmail, settings.businessPhone]
                  .filter(Boolean)
                  .join('\n')}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 760, fontSize: 18 }}>INVOICE</div>
              <div className="muted">{number}</div>
              <div className="muted">{fmtDate(inv.date)}</div>
              <span className={`pill ${inv.status || 'draft'}`} style={{ marginTop: 6 }}>
                {inv.status || 'draft'}
              </span>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase' }}>
              Bill to
            </div>
            <div style={{ fontWeight: 650 }}>{client?.name || inv.clientName || '—'}</div>
            {client?.company && <div className="muted">{client.company}</div>}
            {client?.email && <div className="muted">{client.email}</div>}
            {inv.listingAddress && (
              <div className="muted" style={{ marginTop: 6 }}>
                <b>Listing:</b> {inv.listingAddress}
              </div>
            )}
          </div>

          <table className="doc-table">
            <thead>
              <tr>
                <th>Item</th>
                <th className="num">Qty</th>
                <th className="num">Price</th>
                <th className="num">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(inv.items || []).map((it) => (
                <tr key={it.lid}>
                  <td>{it.name}</td>
                  <td className="num">{it.qty}</td>
                  <td className="num">{formatMoney(it.unitPrice, currency)}</td>
                  <td className="num">{formatMoney(it.unitPrice * it.qty, currency)}</td>
                </tr>
              ))}
              {totals.travelFee > 0 && (
                <tr>
                  <td>
                    Travel
                    {inv.distanceKm ? (
                      <span className="muted"> ({inv.distanceKm} km)</span>
                    ) : null}
                  </td>
                  <td className="num">—</td>
                  <td className="num">—</td>
                  <td className="num">{formatMoney(totals.travelFee, currency)}</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="totals" style={{ marginTop: 8 }}>
            <div className="line">
              <span>Subtotal</span>
              <span className="tabnum">{formatMoney(totals.subtotal, currency)}</span>
            </div>
            {totals.taxAmount > 0 && (
              <div className="line">
                <span>
                  {settings.taxLabel || 'Tax'} ({inv.taxRate}%)
                </span>
                <span className="tabnum">{formatMoney(totals.taxAmount, currency)}</span>
              </div>
            )}
            <div className="line grand">
              <span>Total</span>
              <span className="tabnum">{formatMoney(totals.total, currency)}</span>
            </div>
          </div>

          {inv.notes && (
            <div style={{ marginTop: 18 }}>
              <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase' }}>
                Notes
              </div>
              <div style={{ whiteSpace: 'pre-line' }}>{inv.notes}</div>
            </div>
          )}
        </div>

        <div className="no-print">
          <div className="spacer" />
          <button className="btn" onClick={share}>
            Share
          </button>
          <div className="spacer" />
          <button className="btn secondary" onClick={() => window.print()}>
            Print / Save as PDF
          </button>
        </div>
      </div>
    </>
  )
}
