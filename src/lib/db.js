import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore'
import { db } from '../firebase'
import { isDemo } from '../config'
import { seedData } from './demoData'

// ===========================================================================
// Demo backend (in-memory). Active only when VITE_DEMO=1. Same function
// signatures as the Firestore backend below, so no page component changes.
// ===========================================================================
const demo = isDemo ? createDemoBackend() : null

function createDemoBackend() {
  const store = seedData()
  const listeners = { catalog: [], clients: [], invoices: [], settings: [] }
  const uid = () => 'id' + Math.random().toString(36).slice(2, 10)

  const cmp = (field) => (a, b) => {
    const x = a[field]
    const y = b[field]
    if (x instanceof Date && y instanceof Date) return x - y
    return String(x ?? '').localeCompare(String(y ?? ''))
  }

  function emit(name) {
    listeners[name].forEach((l) => {
      if (name === 'settings') l.cb({ ...store.settings })
      else l.cb([...store[name]].sort(cmp(l.field)).map((d) => ({ ...d })))
    })
  }

  function subscribe(name, field, cb) {
    const l = { field, cb }
    listeners[name].push(l)
    // initial emit
    if (name === 'settings') cb({ ...store.settings })
    else cb([...store[name]].sort(cmp(field)).map((d) => ({ ...d })))
    return () => {
      listeners[name] = listeners[name].filter((x) => x !== l)
    }
  }

  function saveItem(name, item) {
    if (item.id) {
      const i = store[name].findIndex((x) => x.id === item.id)
      if (i >= 0) store[name][i] = { ...store[name][i], ...item }
      else store[name].push({ ...item })
    } else {
      store[name].push({ ...item, id: uid(), createdAt: new Date() })
    }
    emit(name)
    return Promise.resolve()
  }

  function remove(name, id) {
    store[name] = store[name].filter((x) => x.id !== id)
    emit(name)
    return Promise.resolve()
  }

  return {
    subscribe,
    saveCatalogItem: (item) => saveItem('catalog', item),
    deleteCatalogItem: (id) => remove('catalog', id),
    saveClient: (client) => saveItem('clients', client),
    deleteClient: (id) => remove('clients', id),
    getClient: (id) => Promise.resolve(store.clients.find((c) => c.id === id) || null),
    getInvoice: (id) => Promise.resolve(store.invoices.find((i) => i.id === id) || null),
    createInvoice: (base) => {
      const number = store.settings.nextInvoiceNumber || 1
      store.settings.nextInvoiceNumber = number + 1
      const id = uid()
      store.invoices.push({ id, number, ...base, createdAt: new Date() })
      emit('invoices')
      return Promise.resolve(id)
    },
    saveInvoice: (id, data) => {
      const i = store.invoices.findIndex((x) => x.id === id)
      if (i >= 0) store.invoices[i] = { ...store.invoices[i], ...data, id }
      emit('invoices')
      return Promise.resolve()
    },
    deleteInvoice: (id) => remove('invoices', id),
    subscribeSettings: (cb) => subscribe('settings', null, cb),
    saveSettings: (data) => {
      store.settings = { ...store.settings, ...data }
      emit('settings')
      return Promise.resolve()
    }
  }
}

// ===========================================================================
// Firestore backend. All data is namespaced under the signed-in user's uid:
//   users/{uid}/catalog/{id}
//   users/{uid}/clients/{id}
//   users/{uid}/invoices/{id}
//   users/{uid}/meta/settings   (single document)
// ===========================================================================
const userRoot = (uid) => doc(db, 'users', uid)
const col = (uid, name) => collection(userRoot(uid), name)
const settingsRef = (uid) => doc(userRoot(uid), 'meta', 'settings')

// ---- Generic live subscription, ordered by a field ----
export function subscribeCollection(uid, name, field, cb) {
  if (demo) return demo.subscribe(name, field, cb)
  const q = query(col(uid, name), orderBy(field))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

// ---- Catalog (services / packages / add-ons) ----
export const subscribeCatalog = (uid, cb) =>
  subscribeCollection(uid, 'catalog', 'name', cb)

export function saveCatalogItem(uid, item) {
  if (demo) return demo.saveCatalogItem(item)
  const payload = { ...item, updatedAt: serverTimestamp() }
  delete payload.id
  if (item.id) return setDoc(doc(col(uid, 'catalog'), item.id), payload, { merge: true })
  return addDoc(col(uid, 'catalog'), { ...payload, createdAt: serverTimestamp() })
}

export const deleteCatalogItem = (uid, id) =>
  demo ? demo.deleteCatalogItem(id) : deleteDoc(doc(col(uid, 'catalog'), id))

// ---- Clients ----
export const subscribeClients = (uid, cb) =>
  subscribeCollection(uid, 'clients', 'name', cb)

export async function getClient(uid, id) {
  if (demo) return demo.getClient(id)
  const snap = await getDoc(doc(col(uid, 'clients'), id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export function saveClient(uid, client) {
  if (demo) return demo.saveClient(client)
  const payload = { ...client, updatedAt: serverTimestamp() }
  delete payload.id
  if (client.id) return setDoc(doc(col(uid, 'clients'), client.id), payload, { merge: true })
  return addDoc(col(uid, 'clients'), { ...payload, createdAt: serverTimestamp() })
}

export const deleteClient = (uid, id) =>
  demo ? demo.deleteClient(id) : deleteDoc(doc(col(uid, 'clients'), id))

// ---- Invoices ----
export const subscribeInvoices = (uid, cb) =>
  subscribeCollection(uid, 'invoices', 'createdAt', cb)

export async function getInvoice(uid, id) {
  if (demo) return demo.getInvoice(id)
  const snap = await getDoc(doc(col(uid, 'invoices'), id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// Create a new invoice and atomically claim the next invoice number.
export async function createInvoice(uid, base = {}) {
  if (demo) return demo.createInvoice(base)
  const newRef = doc(col(uid, 'invoices'))
  await runTransaction(db, async (tx) => {
    const sSnap = await tx.get(settingsRef(uid))
    const next = (sSnap.exists() && sSnap.data().nextInvoiceNumber) || 1
    tx.set(settingsRef(uid), { nextInvoiceNumber: next + 1 }, { merge: true })
    tx.set(newRef, {
      number: next,
      ...base,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  })
  return newRef.id
}

// Persist edits to an invoice (used by the autosave / save-indicator flow).
export function saveInvoice(uid, id, data) {
  if (demo) return demo.saveInvoice(id, data)
  const payload = { ...data, updatedAt: serverTimestamp() }
  delete payload.id
  return setDoc(doc(col(uid, 'invoices'), id), payload, { merge: true })
}

export const deleteInvoice = (uid, id) =>
  demo ? demo.deleteInvoice(id) : deleteDoc(doc(col(uid, 'invoices'), id))

// ---- Settings ----
export function subscribeSettings(uid, cb) {
  if (demo) return demo.subscribeSettings(cb)
  return onSnapshot(settingsRef(uid), (snap) => {
    cb(snap.exists() ? snap.data() : {})
  })
}

export function saveSettings(uid, data) {
  if (demo) return demo.saveSettings(data)
  return setDoc(settingsRef(uid), { ...data, updatedAt: serverTimestamp() }, { merge: true })
}
