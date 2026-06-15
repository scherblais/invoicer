import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { saveClient, deleteClient } from '../lib/db'
import { parseMoney, formatMoney } from '../lib/money'
import { attachAddressAutocomplete } from '../lib/maps'
import { isMapsConfigured } from '../config'
import { AppBar, Field, MoneyInput } from '../components/ui'

const KIND_LABEL = { service: 'Service', package: 'Package', addon: 'Add-on' }

export default function ClientEditor() {
  const { id } = useParams()
  const { user } = useAuth()
  const { clients, catalog, settings } = useData()
  const navigate = useNavigate()
  const existing = useMemo(() => clients.find((c) => c.id === id), [clients, id])

  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    customRadiusKm: '',
    customTravelRatePerKm: ''
  })
  const [customPrices, setCustomPrices] = useState({})
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const addressRef = useRef(null)

  useEffect(() => {
    if (id && existing && !loaded) {
      setForm({
        name: existing.name || '',
        company: existing.company || '',
        email: existing.email || '',
        phone: existing.phone || '',
        address: existing.address || '',
        notes: existing.notes || '',
        customRadiusKm: existing.customRadiusKm ?? '',
        customTravelRatePerKm: existing.customTravelRatePerKm ?? ''
      })
      setCustomPrices(existing.customPrices || {})
      setLoaded(true)
    }
    if (!id) setLoaded(true)
  }, [id, existing, loaded])

  useEffect(() => {
    if (!isMapsConfigured || !addressRef.current) return
    let cleanup
    attachAddressAutocomplete(addressRef.current, (addr) =>
      setForm((f) => ({ ...f, address: addr }))
    )
      .then((c) => (cleanup = c))
      .catch(() => {})
    return () => cleanup && cleanup()
  }, [loaded])

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))

  function setPrice(catId, value) {
    setCustomPrices((p) => {
      const next = { ...p }
      if (value === '' || value == null) delete next[catId]
      else next[catId] = parseMoney(value)
      return next
    })
  }

  async function save() {
    if (!form.name.trim()) return
    setBusy(true)
    try {
      const payload = {
        id,
        ...form,
        name: form.name.trim(),
        customRadiusKm: form.customRadiusKm === '' ? null : Number(form.customRadiusKm),
        customTravelRatePerKm:
          form.customTravelRatePerKm === '' ? null : Number(form.customTravelRatePerKm),
        customPrices
      }
      await saveClient(user.uid, payload)
      navigate('/clients')
    } catch {
      alert('Could not save. Check your connection.')
      setBusy(false)
    }
  }

  async function remove() {
    if (!confirm(`Delete ${form.name || 'this client'}?`)) return
    setBusy(true)
    try {
      await deleteClient(user.uid, id)
      navigate('/clients')
    } catch {
      setBusy(false)
    }
  }

  const currency = settings.currency || 'CAD'
  const defaultRadius = settings.defaultRadiusKm ?? 25
  const defaultRate = settings.defaultTravelRatePerKm ?? 0

  return (
    <>
      <AppBar title={id ? 'Edit client' : 'New client'} back="/clients" />
      <div className="content">
        <Field label="Name">
          <input
            className="input"
            value={form.name}
            autoFocus={!id}
            placeholder="Client name"
            onChange={(e) => set('name')(e.target.value)}
          />
        </Field>
        <Field label="Company (optional)">
          <input
            className="input"
            value={form.company}
            placeholder="Brokerage / company"
            onChange={(e) => set('company')(e.target.value)}
          />
        </Field>
        <div className="field-row">
          <Field label="Email">
            <input
              className="input"
              type="email"
              value={form.email}
              placeholder="name@email.com"
              onChange={(e) => set('email')(e.target.value)}
            />
          </Field>
          <Field label="Phone">
            <input
              className="input"
              type="tel"
              value={form.phone}
              placeholder="(555) 555-5555"
              onChange={(e) => set('phone')(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Billing address (optional)">
          <input
            ref={addressRef}
            className="input"
            value={form.address}
            placeholder="Street, city"
            onChange={(e) => set('address')(e.target.value)}
          />
        </Field>

        <div className="section-label">Travel overrides</div>
        <div className="card">
          <div className="field-row">
            <Field label="Free radius (km)" hint={`Default ${defaultRadius} km`}>
              <input
                className="input"
                inputMode="decimal"
                value={form.customRadiusKm}
                placeholder={String(defaultRadius)}
                onChange={(e) => set('customRadiusKm')(e.target.value)}
              />
            </Field>
            <Field label="Rate / km" hint={`Default ${formatMoney(defaultRate, currency)}`}>
              <MoneyInput
                value={form.customTravelRatePerKm}
                onChange={set('customTravelRatePerKm')}
                placeholder={String(defaultRate)}
              />
            </Field>
          </div>
          <p className="hint" style={{ marginTop: 0 }}>
            Leave blank to use your business defaults.
          </p>
        </div>

        {catalog.length > 0 && (
          <>
            <div className="section-label">Custom prices</div>
            <div className="card">
              {catalog.map((item) => (
                <div className="field" key={item.id} style={{ marginBottom: 12 }}>
                  <label>
                    {item.name}{' '}
                    <span className="muted" style={{ fontWeight: 500 }}>
                      · {KIND_LABEL[item.kind] || 'Service'} · default{' '}
                      {formatMoney(item.price, currency)}
                    </span>
                  </label>
                  <MoneyInput
                    value={customPrices[item.id] ?? ''}
                    onChange={(v) => setPrice(item.id, v)}
                    placeholder={String(item.price ?? 0)}
                  />
                </div>
              ))}
              <p className="hint" style={{ marginTop: 0 }}>
                Leave blank to charge this client the default price.
              </p>
            </div>
          </>
        )}

        <Field label="Notes (optional)">
          <textarea
            className="input"
            value={form.notes}
            onChange={(e) => set('notes')(e.target.value)}
          />
        </Field>

        <button className="btn" onClick={save} disabled={busy || !form.name.trim()}>
          {busy ? 'Saving…' : 'Save client'}
        </button>
        {id && (
          <>
            <div className="spacer" />
            <button className="btn danger" onClick={remove} disabled={busy}>
              Delete client
            </button>
          </>
        )}
      </div>
    </>
  )
}
