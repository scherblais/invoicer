import { createContext, useContext, useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

// ---- Menu open/close state, shared so the app bar's button (rendered inside
// each page) can open the single Drawer rendered at the app root. ----
const MenuContext = createContext({ open: false, openMenu: () => {}, closeMenu: () => {} })

export function MenuProvider({ children }) {
  const [open, setOpen] = useState(false)
  return (
    <MenuContext.Provider
      value={{ open, openMenu: () => setOpen(true), closeMenu: () => setOpen(false) }}
    >
      {children}
    </MenuContext.Provider>
  )
}

export const useMenu = () => useContext(MenuContext)

const I = {
  invoices: (
    <path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm8 0v5h5M8 12h8M8 16h5" />
  ),
  catalog: <path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5v-7Zm0 0 8 4.5m0 0 8-4.5m-8 4.5V20" />,
  clients: (
    <path d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0 0c-3 0-5.5 1.8-5.5 4.5V19h11M16 11a3 3 0 1 0 0-6m4.5 14v-2.5c0-2-1.6-3.4-3.8-3.9" />
  ),
  settings: (
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-3a8 8 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a8 8 0 0 0-2-1.2L15.2 2H8.8L8.4 4.5a8 8 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5A8 8 0 0 0 4 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-1a8 8 0 0 0 2 1.2l.4 2.5h6.4l.4-2.5a8 8 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c0-.4.1-.8.1-1.2Z" />
  )
}

function Icon({ name }) {
  return (
    <svg
      className="ic"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {I[name]}
    </svg>
  )
}

const items = [
  { to: '/', icon: 'invoices', label: 'Invoices', end: true },
  { to: '/catalog', icon: 'catalog', label: 'Catalog' },
  { to: '/clients', icon: 'clients', label: 'Clients' },
  { to: '/settings', icon: 'settings', label: 'Settings' }
]

export function MenuButton() {
  const { openMenu } = useMenu()
  return (
    <button className="iconbtn-bar" onClick={openMenu} aria-label="Open menu">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    </button>
  )
}

export default function Drawer() {
  const { open, closeMenu } = useMenu()
  const location = useLocation()

  // Close on route change and on Escape.
  useEffect(() => {
    closeMenu()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && closeMenu()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, closeMenu])

  return (
    <>
      <div
        className={'drawer-scrim' + (open ? ' show' : '')}
        onClick={closeMenu}
        aria-hidden="true"
      />
      <aside className={'drawer' + (open ? ' open' : '')} aria-hidden={!open}>
        <div className="drawer-brand">Invoicer</div>
        <nav className="drawer-nav">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              onClick={closeMenu}
              className={({ isActive }) => 'drawer-item' + (isActive ? ' active' : '')}
            >
              <Icon name={it.icon} />
              {it.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
