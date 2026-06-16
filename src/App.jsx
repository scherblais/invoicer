import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { isFirebaseConfigured, isDemo } from './config'
import { useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import Drawer, { MenuProvider } from './components/Drawer'
import { Spinner } from './components/ui'
import SetupNeeded from './pages/SetupNeeded'
import Login from './pages/Login'
import Invoices from './pages/Invoices'
import InvoiceEditor from './pages/InvoiceEditor'
import InvoiceView from './pages/InvoiceView'
import Catalog from './pages/Catalog'
import Clients from './pages/Clients'
import ClientEditor from './pages/ClientEditor'
import Settings from './pages/Settings'

export default function App() {
  const { user, loading } = useAuth()

  if (!isFirebaseConfigured) return <SetupNeeded />

  if (loading) {
    return (
      <div className="app">
        <div className="center-screen">
          <Spinner />
        </div>
      </div>
    )
  }

  if (!user) return <Login />

  return (
    <MenuProvider>
      <DataProvider>
        <div className="app">
          <DemoBanner />
          <Routes>
            <Route path="/" element={<Invoices />} />
            <Route path="/invoice/new" element={<InvoiceEditor />} />
            <Route path="/invoice/:id" element={<InvoiceEditor />} />
            <Route path="/invoice/:id/view" element={<InvoiceView />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/client/new" element={<ClientEditor />} />
            <Route path="/client/:id" element={<ClientEditor />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Invoices />} />
          </Routes>
          <Drawer />
        </div>
      </DataProvider>
    </MenuProvider>
  )
}

function DemoBanner() {
  const [show, setShow] = useState(true)
  if (!isDemo || !show) return null
  return (
    <div className="demo-banner">
      <span>Demo — sample data, nothing is saved</span>
      <button onClick={() => setShow(false)} aria-label="Dismiss">
        ✕
      </button>
    </div>
  )
}
