import { useNavigate } from 'react-router-dom'

export function AppBar({ title, back, right }) {
  const navigate = useNavigate()
  return (
    <header className="appbar">
      {back && (
        <button
          className="back"
          onClick={() => (typeof back === 'string' ? navigate(back) : navigate(-1))}
          aria-label="Back"
        >
          ‹
        </button>
      )}
      <h1>{title}</h1>
      {right}
    </header>
  )
}

export function Field({ label, hint, children }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      {children}
      {hint && <div className="hint">{hint}</div>}
    </div>
  )
}

export function MoneyInput({ value, onChange, placeholder = '0.00', ...rest }) {
  return (
    <div className="input-prefix">
      <span>$</span>
      <input
        className="input"
        inputMode="decimal"
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
    </div>
  )
}

export function EmptyState({ emoji, title, text, action }) {
  return (
    <div className="empty">
      <span className="emoji">{emoji}</span>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  )
}

export function Segmented({ value, onChange, options }) {
  return (
    <div className="segmented">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={value === o.value ? 'active' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Spinner() {
  return <div className="spinner" />
}
