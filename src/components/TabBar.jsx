import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', icon: '🧾', label: 'Invoices', end: true },
  { to: '/catalog', icon: '📦', label: 'Catalog' },
  { to: '/clients', icon: '👥', label: 'Clients' },
  { to: '/settings', icon: '⚙️', label: 'Settings' }
]

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
          <span className="ic">{t.icon}</span>
          {t.label}
        </NavLink>
      ))}
    </nav>
  )
}
