import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import {
  subscribeCatalog,
  subscribeClients,
  subscribeInvoices,
  subscribeSettings
} from '../lib/db'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const { user } = useAuth()
  const [catalog, setCatalog] = useState([])
  const [clients, setClients] = useState([])
  const [invoices, setInvoices] = useState([])
  const [settings, setSettings] = useState({})
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!user) return
    const uid = user.uid
    let loaded = 0
    const markReady = () => {
      loaded += 1
      if (loaded >= 4) setReady(true)
    }
    const unsubs = [
      subscribeCatalog(uid, (d) => {
        setCatalog(d)
        markReady()
      }),
      subscribeClients(uid, (d) => {
        setClients(d)
        markReady()
      }),
      subscribeInvoices(uid, (d) => {
        // newest first
        setInvoices([...d].reverse())
        markReady()
      }),
      subscribeSettings(uid, (d) => {
        setSettings(d)
        markReady()
      })
    ]
    return () => unsubs.forEach((u) => u && u())
  }, [user])

  return (
    <DataContext.Provider value={{ catalog, clients, invoices, settings, ready }}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => useContext(DataContext)

// Convenience lookups
export function useClientMap() {
  const { clients } = useData()
  return Object.fromEntries(clients.map((c) => [c.id, c]))
}
