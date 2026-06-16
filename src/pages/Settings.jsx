import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { saveSettings } from '../lib/db'
import { parseMoney } from '../lib/money'
import { attachAddressAutocomplete } from '../lib/maps'
import { isMapsConfigured } from '../config'
import { AppBar, Field, MoneyInput, Segmented } from '../components/ui'

export default function Settings() {
  const { user, signOut } = useAuth()
  const { settings } = useData()
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const baseRef = useRef(null)

  useEffect(() => {
    if (form === null && settings) {
      setForm({
        businessName: settings.businessName || '',
        businessEmail: settings.businessEmail || user.email || '',
        businessPhone: settings.businessPhone || '',
        businessAddress: settings.businessAddress || '',
        baseAddress: settings.baseAddress || '',
        defaultRadiusKm: settings.defaultRadiusKm ?? 25,
        defaultTravelRatePerKm: settings.defaultTravelRatePerKm ?? '',
        travelMode: settings.travelMode || 'beyond',
        travelRoundTrip: settings.travelRoundTrip !== false,
        taxRate: settings.taxRate ?? '',
        taxLabel: settings.taxLabel || 'Tax',
        currency: settings.currency || 'CAD'
      })
    }
  }, [settings, form, user])

  useEffect(() => {
    if (!isMapsConfigured || !baseRef.current || !form) return
    let cleanup
    attachAddressAutocomplete(baseRef.current, (addr) =>
      setForm((f) => ({ ...f, baseAddress: addr }))
    )
      .then((c) => (cleanup = c))
      .catch(() => {})
    return () => cleanup && cleanup()
  }, [form !== null])

  if (!form) return <AppBar title="Settings" menu />

  const set = (k) => (v) => {
    setForm((f) => ({ ...f, [k]: v }))
    setSaved(false)
  }

  async function save() {
    setBusy(true)
    try {
      await saveSettings(user.uid, {
        businessName: form.businessName.trim(),
        businessEmail: form.businessEmail.trim(),
        businessPhone: form.businessPhone.trim(),
        businessAddress: form.businessAddress.trim(),
        baseAddress: form.baseAddress.trim(),
        defaultRadiusKm: Number(form.defaultRadiusKm) || 0,
        defaultTravelRatePerKm: parseMoney(form.defaultTravelRatePerKm),
        travelMode: form.travelMode,
        travelRoundTrip: form.travelRoundTrip,
        taxRate: form.taxRate === '' ? 0 : Number(form.taxRate),
        taxLabel: form.taxLabel.trim() || 'Tax',
        currency: form.currency
      })
      setSaved(true)
    } catch {
      alert('Could not save settings. Check your connection.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <AppBar title="Settings" menu />
      <div className="content">
        <div className="section-label">Your business</div>
        <div className="card">
          <Field label="Business name">
            <input
              className="input"
              value={form.businessName}
              placeholder="Your business name"
              onChange={(e) => set('businessName')(e.target.value)}
            />
          </Field>
          <Field label="Email">
            <input
              className="input"
              type="email"
              value={form.businessEmail}
              onChange={(e) => set('businessEmail')(e.target.value)}
            />
          </Field>
          <Field label="Phone">
            <input
              className="input"
              type="tel"
              value={form.businessPhone}
              onChange={(e) => set('businessPhone')(e.target.value)}
            />
          </Field>
          <Field label="Address (shown on invoices)">
            <input
              className="input"
              value={form.businessAddress}
              onChange={(e) => set('businessAddress')(e.target.value)}
            />
          </Field>
        </div>

        <div className="section-label">Travel fees</div>
        <div className="card">
          <Field
            label="Home base address"
            hint="Travel distance is measured from here to each listing."
          >
            <input
              ref={baseRef}
              className="input"
              value={form.baseAddress}
              placeholder="Where you travel from"
              onChange={(e) => set('baseAddress')(e.target.value)}
            />
          </Field>
          <div className="field-row">
            <Field label="Free radius (km)">
              <input
                className="input"
                inputMode="decimal"
                value={form.defaultRadiusKm}
                onChange={(e) => set('defaultRadiusKm')(e.target.value)}
              />
            </Field>
            <Field label="Rate / km">
              <MoneyInput
                value={form.defaultTravelRatePerKm}
                onChange={set('defaultTravelRatePerKm')}
              />
            </Field>
          </div>
          <Field label="Charge for">
            <Segmented
              value={form.travelMode}
              onChange={set('travelMode')}
              options={[
                { value: 'beyond', label: 'Distance past radius' },
                { value: 'total', label: 'Full distance' }
              ]}
            />
          </Field>
          <label className="switch">
            <span>Round trip (there &amp; back)</span>
            <input
              type="checkbox"
              checked={form.travelRoundTrip}
              onChange={(e) => set('travelRoundTrip')(e.target.checked)}
            />
          </label>
          {!isMapsConfigured && (
            <p className="hint danger-text">
              Google Maps key not configured — distances must be entered manually.
            </p>
          )}
        </div>

        <div className="section-label">Tax &amp; currency</div>
        <div className="card">
          <div className="field-row">
            <Field label="Tax label">
              <input
                className="input"
                value={form.taxLabel}
                placeholder="GST/QST"
                onChange={(e) => set('taxLabel')(e.target.value)}
              />
            </Field>
            <Field label="Tax rate (%)">
              <input
                className="input"
                inputMode="decimal"
                value={form.taxRate}
                placeholder="0"
                onChange={(e) => set('taxRate')(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Currency">
            <select
              className="input"
              value={form.currency}
              onChange={(e) => set('currency')(e.target.value)}
            >
              <option value="CAD">CAD — Canadian dollar</option>
              <option value="USD">USD — US dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — British pound</option>
            </select>
          </Field>
        </div>

        <button className="btn" onClick={save} disabled={busy}>
          {busy ? 'Saving…' : saved ? 'Saved ✓' : 'Save settings'}
        </button>

        <div className="spacer" />
        <div className="spacer" />
        <button className="btn ghost" onClick={() => signOut()}>
          Sign out
        </button>
        <p className="hint" style={{ textAlign: 'center' }}>
          Signed in as {user.email}
        </p>
      </div>
    </>
  )
}
