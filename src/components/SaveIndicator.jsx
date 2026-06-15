// Visual confirmation that data has reached the cloud.
// status: 'saved' | 'saving' | 'error'
export default function SaveIndicator({ status }) {
  const map = {
    saved: { cls: 'saved', label: 'Saved' },
    saving: { cls: 'saving', label: 'Saving…' },
    error: { cls: 'error', label: 'Not saved' }
  }
  const s = map[status] || map.saved
  return (
    <span className={`saveind ${s.cls}`} aria-live="polite">
      <span className="dot" />
      {s.label}
    </span>
  )
}
