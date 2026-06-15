import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { saveCatalogItem, deleteCatalogItem } from '../lib/db'
import { formatMoney, parseMoney } from '../lib/money'
import { AppBar, EmptyState, Field, MoneyInput, Segmented, Spinner } from '../components/ui'

const KINDS = [
  { value: 'service', label: 'Services' },
  { value: 'package', label: 'Packages' },
  { value: 'addon', label: 'Add-ons' }
]
const KIND_SINGULAR = { service: 'service', package: 'package', addon: 'add-on' }

export default function Catalog() {
  const { user } = useAuth()
  const { catalog, settings, ready } = useData()
  const [kind, setKind] = useState('service')
  const [editing, setEditing] = useState(null) // item object or null
  const currency = settings.currency || 'CAD'

  const items = catalog.filter((c) => (c.kind || 'service') === kind)

  return (
    <>
      <AppBar title="Catalog" />
      <div className="content">
        <Segmented value={kind} onChange={setKind} options={KINDS} />
        <div className="spacer" />

        {!ready ? (
          <Spinner />
        ) : items.length === 0 ? (
          <EmptyState
            emoji="📦"
            title={`No ${KIND_SINGULAR[kind]}s yet`}
            text="Add the items you offer and set their prices."
            action={
              <button className="btn" onClick={() => setEditing({ kind })}>
                + Add {KIND_SINGULAR[kind]}
              </button>
            }
          />
        ) : (
          <div className="list">
            {items.map((item) => (
              <div key={item.id} className="row" onClick={() => setEditing(item)}>
                <div className="grow">
                  <div className="title">{item.name}</div>
                  {item.description && <div className="sub">{item.description}</div>}
                </div>
                <div className="amount tabnum">{formatMoney(item.price, currency)}</div>
                <span className="chev">›</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {ready && items.length > 0 && (
        <button className="fab" onClick={() => setEditing({ kind })} aria-label="Add item">
          +
        </button>
      )}

      {editing && (
        <CatalogEditor
          uid={user.uid}
          item={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}

function CatalogEditor({ uid, item, onClose }) {
  const isNew = !item.id
  const [name, setName] = useState(item.name || '')
  const [price, setPrice] = useState(item.price != null ? String(item.price) : '')
  const [description, setDescription] = useState(item.description || '')
  const [kind, setKind] = useState(item.kind || 'service')
  const [busy, setBusy] = useState(false)

  async function save() {
    if (!name.trim()) return
    setBusy(true)
    try {
      await saveCatalogItem(uid, {
        id: item.id,
        name: name.trim(),
        price: parseMoney(price),
        description: description.trim(),
        kind
      })
      onClose()
    } catch {
      alert('Could not save. Check your connection.')
      setBusy(false)
    }
  }

  async function remove() {
    if (!confirm(`Delete “${item.name}”?`)) return
    setBusy(true)
    try {
      await deleteCatalogItem(uid, item.id)
      onClose()
    } catch {
      setBusy(false)
    }
  }

  return (
    <Sheet title={isNew ? 'New item' : 'Edit item'} onClose={onClose}>
      <Field label="Type">
        <Segmented
          value={kind}
          onChange={setKind}
          options={[
            { value: 'service', label: 'Service' },
            { value: 'package', label: 'Package' },
            { value: 'addon', label: 'Add-on' }
          ]}
        />
      </Field>
      <Field label="Name">
        <input
          className="input"
          value={name}
          autoFocus
          placeholder="e.g. HDR Photos (25)"
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <Field label="Price">
        <MoneyInput value={price} onChange={setPrice} />
      </Field>
      <Field label="Description (optional)">
        <textarea
          className="input"
          value={description}
          placeholder="Shown on the invoice"
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>

      <button className="btn" onClick={save} disabled={busy || !name.trim()}>
        {busy ? 'Saving…' : 'Save'}
      </button>
      {!isNew && (
        <>
          <div className="spacer" />
          <button className="btn danger" onClick={remove} disabled={busy}>
            Delete
          </button>
        </>
      )}
    </Sheet>
  )
}

export function Sheet({ title, onClose, children }) {
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="iconbtn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  )
}
