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

// All data is namespaced under the signed-in user's uid:
//   users/{uid}/catalog/{id}
//   users/{uid}/clients/{id}
//   users/{uid}/invoices/{id}
//   users/{uid}/meta/settings   (single document)

const userRoot = (uid) => doc(db, 'users', uid)
const col = (uid, name) => collection(userRoot(uid), name)
const settingsRef = (uid) => doc(userRoot(uid), 'meta', 'settings')

// ---- Generic live subscription, ordered by a field ----
export function subscribeCollection(uid, name, field, cb) {
  const q = query(col(uid, name), orderBy(field))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

// ---- Catalog (services / packages / add-ons) ----
export const subscribeCatalog = (uid, cb) =>
  subscribeCollection(uid, 'catalog', 'name', cb)

export function saveCatalogItem(uid, item) {
  const payload = { ...item, updatedAt: serverTimestamp() }
  delete payload.id
  if (item.id) return setDoc(doc(col(uid, 'catalog'), item.id), payload, { merge: true })
  return addDoc(col(uid, 'catalog'), { ...payload, createdAt: serverTimestamp() })
}

export const deleteCatalogItem = (uid, id) => deleteDoc(doc(col(uid, 'catalog'), id))

// ---- Clients ----
export const subscribeClients = (uid, cb) =>
  subscribeCollection(uid, 'clients', 'name', cb)

export async function getClient(uid, id) {
  const snap = await getDoc(doc(col(uid, 'clients'), id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export function saveClient(uid, client) {
  const payload = { ...client, updatedAt: serverTimestamp() }
  delete payload.id
  if (client.id) return setDoc(doc(col(uid, 'clients'), client.id), payload, { merge: true })
  return addDoc(col(uid, 'clients'), { ...payload, createdAt: serverTimestamp() })
}

export const deleteClient = (uid, id) => deleteDoc(doc(col(uid, 'clients'), id))

// ---- Invoices ----
export const subscribeInvoices = (uid, cb) =>
  subscribeCollection(uid, 'invoices', 'createdAt', cb)

export async function getInvoice(uid, id) {
  const snap = await getDoc(doc(col(uid, 'invoices'), id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// Create a new invoice and atomically claim the next invoice number.
export async function createInvoice(uid, base = {}) {
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
  const payload = { ...data, updatedAt: serverTimestamp() }
  delete payload.id
  return setDoc(doc(col(uid, 'invoices'), id), payload, { merge: true })
}

export const deleteInvoice = (uid, id) => deleteDoc(doc(col(uid, 'invoices'), id))

// ---- Settings ----
export function subscribeSettings(uid, cb) {
  return onSnapshot(settingsRef(uid), (snap) => {
    cb(snap.exists() ? snap.data() : {})
  })
}

export function saveSettings(uid, data) {
  return setDoc(settingsRef(uid), { ...data, updatedAt: serverTimestamp() }, { merge: true })
}
