import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { saveInvoice, deleteInvoice, getInvoice } from '../lib/db'
import { formatMoney, parseMoney, round2 } from '../lib/money'
import { computeTravelFee, resolveTravelSettings } from '../lib/travel'
import { getDrivingDistanceKm, attachAddressAutocomplete } from '../lib/maps'
import { isMapsConfigured } from '../config'
import { AppBar, Field, MoneyInput, Segmented } from '../components/ui'
import { Sheet } from './Catalog'
import SaveIndicator from '../components/SaveIndicator'

const KINDS = [
  { value: 'service', label: 'Services' },
  { value: 'package', label: 'Packages' },
  { value: 'addon', label: 'Add-ons' }
]

// ---- Pure totals calculation, shared by editor and document view ----
export function computeInvoiceTotals(inv, client, settings) {
  const items = inv.items || []
  const subtotal = round2(
    items.reduce((sum, it) => sum + (Number(it.unitPrice) || 0) * (Number(it.qty) || 0), 0)
  )

  const ts = resolveTravelSettings(client, settings)
  const calc = computeTravelFee({
    distanceKm: Number(inv.distanceKm) || 0,
    freeRadiusKm: ts.freeRadiusKm,
    ratePerKm: ts.ratePerKm,
    mode: ts.mode,
    roundTrip: ts.roundTrip
  })

  let travelFee = 0
  if (inv.travelEnabled !== false) {
    travelFee =
      inv.travelFeeOverride != null && inv.travelFeeOverride !== ''
        ? round2(Number(inv.travelFeeOverride))
        : calc.fee
  }

  const taxRate = Number(inv.taxRate) || 0
  const taxable = round2(subtotal + travelFee)
  const taxAmount = round2(taxable * (taxRate / 100))
  const total = round2(taxable + taxAmount)

  return { subtotal, travelFee, taxAmount, total, travelCalc: calc, travelSettings: ts }
}

export default function InvoiceEditor() {
  const { id } = useParams()
  const { user } = useAuth()
  const { invoices, clients, catalog, settings } = useData()
  const navigate = useNavigate()

  const [inv, setInv] = useState(null)
  const [status, setStatus] = useState('saved') // saved | saving | error
  const [pickerKind, setPickerKind] = useState(null)
  const [distBusy, setDistBusy] = useState(false)
  const [distErr, setDistErr] = useState('')
  const saveTimer = useRef(null)
  const listingRef = useRef(null)
  // Refs always hold the latest values so the debounced save and the
  // flush-on-unmount never persist stale data or drop the final edit.
  const invRef = useRef(null)
  const ctxRef = useRef({ client: null, settings })

  const liveInvoice = useMemo(() => invoices.find((i) => i.id === id), [invoices, id])

  // Hydrate local editing state once.
  useEffect(() => {
    let cancelled = false
    if (inv) return
    if (liveInvoice) {
      invRef.current = liveInvoice
      setInv(liveInvoice)
    } else if (id) {
      getInvoice(user.uid, id).then((doc) => {
        if (!cancelled && doc) {
          invRef.current = doc
          setInv(doc)
        }
      })
    }
    return () => {
      cancelled = true
    }
  }, [liveInvoice, id, inv, user.uid])

  // Address autocomplete for the listing field.
  useEffect(() => {
    if (!isMapsConfigured || !listingRef.current || !inv) return
    let cleanup
    attachAddressAutocomplete(listingRef.current, (addr) => {
      patch({ listingAddress: addr })
      autoDistance(addr)
    })
      .then((c) => (cleanup = c))
      .catch(() => {})
    return () => cleanup && cleanup()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inv !== null])

  const client = useMemo(
    () => clients.find((c) => c.id === inv?.clientId) || null,
    [clients, inv]
  )

  const totals = useMemo(
    () => (inv ? computeInvoiceTotals(inv, client, settings) : null),
    [inv, client, settings]
  )

  // Keep the latest client/settings available to the (closure-captured) saver.
  useEffect(() => {
    ctxRef.current = { client, settings }
  }, [client, settings])

  // ---- Persist (debounced) ----
  function scheduleSave(next) {
    setStatus('saving')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => flush(next), 650)
  }

  async function flush(state) {
    const data = state || invRef.current
    if (!data) return
    const { client: c, settings: s } = ctxRef.current
    const t = computeInvoiceTotals(data, c, s)
    try {
      await saveInvoice(user.uid, id, {
        clientId: data.clientId || null,
        clientName: data.clientName || '',
        date: data.date || '',
        status: data.status || 'draft',
        listingAddress: data.listingAddress || '',
        distanceKm: data.distanceKm === '' ? null : Number(data.distanceKm) || 0,
        items: data.items || [],
        travelEnabled: data.travelEnabled !== false,
        travelFeeOverride:
          data.travelFeeOverride === '' || data.travelFeeOverride == null
            ? null
            : Number(data.travelFeeOverride),
        taxRate: Number(data.taxRate) || 0,
        notes: data.notes || '',
        currency: data.currency || s.currency || 'CAD',
        subtotal: t.subtotal,
        travelFee: t.travelFee,
        taxAmount: t.taxAmount,
        total: t.total
      })
      setStatus('saved')
    } catch {
      setStatus('error')
    }
  }

  // Flush any pending change when leaving the screen.
  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
        flush(invRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function patch(partial) {
    const next = { ...invRef.current, ...partial }
    invRef.current = next
    setInv(next)
    scheduleSave(next)
  }

  // ---- Client change: re-resolve custom prices ----
  function changeClient(clientId) {
    const c = clients.find((x) => x.id === clientId) || null
    const items = (inv.items || []).map((it) => {
      if (it.manualPrice || !it.catalogId) return it
      const cat = catalog.find((k) => k.id === it.catalogId)
      const base = cat ? cat.price : it.unitPrice
      const custom = c?.customPrices?.[it.catalogId]
      return { ...it, unitPrice: custom != null ? custom : base }
    })
    patch({ clientId: clientId || null, clientName: c?.name || '', items })
  }

  // ---- Line items ----
  function addItem(cat) {
    const custom = client?.customPrices?.[cat.id]
    const unitPrice = custom != null ? custom : cat.price || 0
    const existing = (inv.items || []).find((it) => it.catalogId === cat.id && !it.manualPrice)
    let items
    if (existing) {
      items = inv.items.map((it) =>
        it === existing ? { ...it, qty: (Number(it.qty) || 0) + 1 } : it
      )
    } else {
      items = [
        ...(inv.items || []),
        { lid: crypto.randomUUID(), catalogId: cat.id, name: cat.name, unitPrice, qty: 1 }
      ]
    }
    patch({ items })
    setPickerKind(null)
  }

  function updateItem(lid, partial) {
    patch({
      items: inv.items.map((it) => (it.lid === lid ? { ...it, ...partial } : it))
    })
  }

  function removeItem(lid) {
    patch({ items: inv.items.filter((it) => it.lid !== lid) })
  }

  // ---- Distance ----
  async function autoDistance(addressOverride) {
    const listing = addressOverride ?? inv.listingAddress
    setDistErr('')
    if (!settings.baseAddress) {
      setDistErr('Set your home base address in Settings first.')
      return
    }
    if (!listing) {
      setDistErr('Enter the listing address first.')
      return
    }
    setDistBusy(true)
    try {
      const km = await getDrivingDistanceKm(settings.baseAddress, listing)
      patch({ distanceKm: round2(km), travelFeeOverride: null })
    } catch (e) {
      setDistErr(e.message || 'Could not calculate distance.')
    } finally {
      setDistBusy(false)
    }
  }

  if (!inv) {
    return (
      <>
        <AppBar title="Invoice" back="/" />
        <div className="content">
          <div className="spinner" />
        </div>
      </>
    )
  }

  const currency = inv.currency || settings.currency || 'CAD'
  const items = inv.items || []
  const ts = totals.travelSettings

  return (
    <>
      <AppBar
        title={`Invoice #${String(inv.number || 0).padStart(4, '0')}`}
        back="/"
        right={<SaveIndicator status={status} />}
      />
      <div className="content">
        {/* Client + date + status */}
        <div className="card">
          <Field label="Client">
            <select
              className="input"
              value={inv.clientId || ''}
              onChange={(e) => changeClient(e.target.value)}
            >
              <option value="">— No client —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="field-row">
            <Field label="Date">
              <input
                className="input"
                type="date"
                value={inv.date || ''}
                onChange={(e) => patch({ date: e.target.value })}
              />
            </Field>
            <Field label="Status">
              <select
                className="input"
                value={inv.status || 'draft'}
                onChange={(e) => patch({ status: e.target.value })}
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
              </select>
            </Field>
          </div>
        </div>

        {/* Line items */}
        <div className="section-label">Items</div>
        <div className="card">
          {items.length === 0 ? (
            <p className="muted" style={{ margin: '4px 0 14px' }}>
              No items yet. Add the services, packages and add-ons for this job.
            </p>
          ) : (
            items.map((it) => (
              <div className="lineitem" key={it.lid}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="name">{it.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                    <div className="qtybox">
                      <button
                        onClick={() =>
                          updateItem(it.lid, { qty: Math.max(1, (Number(it.qty) || 1) - 1) })
                        }
                        aria-label="Decrease"
                      >
                        −
                      </button>
                      <span>{it.qty}</span>
                      <button
                        onClick={() => updateItem(it.lid, { qty: (Number(it.qty) || 1) + 1 })}
                        aria-label="Increase"
                      >
                        +
                      </button>
                    </div>
                    <div style={{ width: 110 }}>
                      <MoneyInput
                        value={String(it.unitPrice ?? '')}
                        onChange={(v) =>
                          updateItem(it.lid, { unitPrice: parseMoney(v), manualPrice: true })
                        }
                      />
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="amount tabnum">
                    {formatMoney((Number(it.unitPrice) || 0) * (Number(it.qty) || 0), currency)}
                  </div>
                  <button className="iconbtn" onClick={() => removeItem(it.lid)} aria-label="Remove">
                    ×
                  </button>
                </div>
              </div>
            ))
          )}
          <div className="spacer" />
          <div className="field-row">
            {KINDS.map((k) => (
              <button
                key={k.value}
                className="btn secondary sm"
                onClick={() => setPickerKind(k.value)}
              >
                + {k.label}
              </button>
            ))}
          </div>
        </div>

        {/* Travel */}
        <div className="section-label">Travel</div>
        <div className="card">
          <label className="switch" style={{ marginBottom: 6 }}>
            <span>Add travel fee</span>
            <input
              type="checkbox"
              checked={inv.travelEnabled !== false}
              onChange={(e) => patch({ travelEnabled: e.target.checked })}
            />
          </label>

          {inv.travelEnabled !== false && (
            <>
              <Field label="Listing address">
                <input
                  ref={listingRef}
                  className="input"
                  value={inv.listingAddress || ''}
                  placeholder="Address of the property"
                  onChange={(e) => patch({ listingAddress: e.target.value })}
                />
              </Field>

              <div className="field-row" style={{ alignItems: 'flex-end' }}>
                <Field label="Distance (km)">
                  <input
                    className="input"
                    inputMode="decimal"
                    value={inv.distanceKm ?? ''}
                    placeholder="0"
                    onChange={(e) =>
                      patch({ distanceKm: e.target.value, travelFeeOverride: null })
                    }
                  />
                </Field>
                {isMapsConfigured && (
                  <div className="field">
                    <button
                      className="btn secondary"
                      onClick={() => autoDistance()}
                      disabled={distBusy}
                    >
                      {distBusy ? '…' : 'Auto'}
                    </button>
                  </div>
                )}
              </div>
              {distErr && <p className="hint danger-text">{distErr}</p>}

              <p className="hint" style={{ marginTop: 0 }}>
                Free within {ts.freeRadiusKm} km · {formatMoney(ts.ratePerKm, currency)}/km
                {ts.roundTrip ? ' · round trip' : ''}
                {totals.travelCalc.billableKm > 0
                  ? ` · billing ${totals.travelCalc.billableKm} km`
                  : ''}
              </p>

              <Field label="Travel fee" hint="Auto-calculated. Edit to override.">
                <MoneyInput
                  value={
                    inv.travelFeeOverride != null && inv.travelFeeOverride !== ''
                      ? String(inv.travelFeeOverride)
                      : String(totals.travelFee)
                  }
                  onChange={(v) => patch({ travelFeeOverride: parseMoney(v) })}
                />
              </Field>
              {inv.travelFeeOverride != null && inv.travelFeeOverride !== '' && (
                <button
                  className="btn ghost sm"
                  onClick={() => patch({ travelFeeOverride: null })}
                >
                  Reset to auto
                </button>
              )}
            </>
          )}
        </div>

        {/* Tax */}
        <div className="card">
          <Field label={`Tax rate (%)`}>
            <input
              className="input"
              inputMode="decimal"
              value={inv.taxRate ?? 0}
              onChange={(e) => patch({ taxRate: e.target.value })}
            />
          </Field>
        </div>

        {/* Totals */}
        <div className="card">
          <div className="totals">
            <div className="line">
              <span>Subtotal</span>
              <span className="tabnum">{formatMoney(totals.subtotal, currency)}</span>
            </div>
            {totals.travelFee > 0 && (
              <div className="line">
                <span>Travel</span>
                <span className="tabnum">{formatMoney(totals.travelFee, currency)}</span>
              </div>
            )}
            {totals.taxAmount > 0 && (
              <div className="line">
                <span>{settings.taxLabel || 'Tax'}</span>
                <span className="tabnum">{formatMoney(totals.taxAmount, currency)}</span>
              </div>
            )}
            <div className="line grand">
              <span>Total</span>
              <span className="tabnum">{formatMoney(totals.total, currency)}</span>
            </div>
          </div>
        </div>

        <Field label="Notes (optional)">
          <textarea
            className="input"
            value={inv.notes || ''}
            placeholder="Anything to show on the invoice"
            onChange={(e) => patch({ notes: e.target.value })}
          />
        </Field>

        <button className="btn" onClick={() => navigate(`/invoice/${id}/view`)}>
          View &amp; share
        </button>
        <div className="spacer" />
        <button
          className="btn danger"
          onClick={async () => {
            if (!confirm('Delete this invoice?')) return
            clearTimeout(saveTimer.current)
            await deleteInvoice(user.uid, id)
            navigate('/')
          }}
        >
          Delete invoice
        </button>
      </div>

      {/* Item picker */}
      {pickerKind && (
        <ItemPicker
          kind={pickerKind}
          catalog={catalog}
          client={client}
          currency={currency}
          onPick={addItem}
          onClose={() => setPickerKind(null)}
          onManage={() => {
            clearTimeout(saveTimer.current)
            flush()
            navigate('/catalog')
          }}
        />
      )}
    </>
  )
}

function ItemPicker({ kind, catalog, client, currency, onPick, onClose, onManage }) {
  const label = { service: 'service', package: 'package', addon: 'add-on' }[kind]
  const items = catalog.filter((c) => (c.kind || 'service') === kind)
  return (
    <Sheet title={`Add ${label}`} onClose={onClose}>
      {items.length === 0 ? (
        <div className="empty" style={{ padding: '20px 0 30px' }}>
          <h3>No {label}s yet</h3>
          <p>Create one in your catalog first.</p>
          <button className="btn" onClick={onManage}>
            Go to catalog
          </button>
        </div>
      ) : (
        <div className="list">
          {items.map((c) => {
            const custom = client?.customPrices?.[c.id]
            const price = custom != null ? custom : c.price
            return (
              <div key={c.id} className="row" onClick={() => onPick(c)}>
                <div className="grow">
                  <div className="title">{c.name}</div>
                  {custom != null && <div className="sub">Custom price for {client.name}</div>}
                </div>
                <div className="amount tabnum">{formatMoney(price, currency)}</div>
                <span className="chev">+</span>
              </div>
            )
          })}
        </div>
      )}
    </Sheet>
  )
}
