import { NavLink } from 'react-router-dom'

const I = {
  invoices: (
    <path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm8 0v5h5M8 12h8M8 16h5" />
  ),
  catalog: (
    <path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5v-7Zm0 0 8 4.5m0 0 8-4.5m-8 4.5V20" />
  ),
  clients: (
    <path d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0 0c-3 0-5.5 1.8-5.5 4.5V19h11M16 11a3 3 0 1 0 0-6m4.5 14v-2.5c0-2-1.6-3.4-3.8-3.9" />
  ),
  settings: (
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-3a8 8 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a8 8 0 0 0-2-1.2L15.2 2H8.8L8.4 4.5a8 8 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5A8 8 0 0 0 4 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-1a8 8 0 0 0 2 1.2l.4 2.5h6.4l.4-2.5a8 8 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c0-.4.1-.8.1-1.2Z" />
  )
}

const tabs = [
  { to: '/', icon: 'invoices', label: 'Invoices', end: true },
  { to: '/catalog', icon: 'catalog', label: 'Catalog' },
  { to: '/clients', icon: 'clients', label: 'Clients' },
  { to: '/settings', icon: 'settings', label: 'Settings' }
]

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

export default function TabBar() {
  return (
    <nav className="tabbar">
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) => 'tab' + (isActive ? ' active' : '')}
        >
          <Icon name={t.icon} />
          {t.label}
        </NavLink>
      ))}
    </nav>
  )
}
