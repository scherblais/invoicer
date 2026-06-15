import { Routes, Route, useLocation } from 'react-router-dom'
import { isFirebaseConfigured } from './config'
import { useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import TabBar from './components/TabBar'
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
  const location = useLocation()

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

  // Hide the tab bar on full-screen editor / document views.
  const hideTabs =
    /^\/invoice\//.test(location.pathname) || /^\/client\//.test(location.pathname)

  return (
    <DataProvider>
      <div className="app">
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
        {!hideTabs && <TabBar />}
      </div>
    </DataProvider>
  )
}
