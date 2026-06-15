import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

function friendlyError(code) {
  const map = {
    'auth/invalid-email': 'That email address looks invalid.',
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/wrong-password': 'Email or password is incorrect.',
    'auth/user-not-found': 'No account found with that email.',
    'auth/email-already-in-use': 'An account already exists for that email.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Please try again shortly.'
  }
  return map[code] || 'Something went wrong. Please try again.'
}

export default function Login() {
  const { signIn, signUp, resetPassword } = useAuth()
  const [mode, setMode] = useState('signin') // signin | signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  async function submit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setBusy(true)
    try {
      if (mode === 'signup') await signUp(email.trim(), password)
      else await signIn(email.trim(), password)
    } catch (err) {
      setError(friendlyError(err.code))
    } finally {
      setBusy(false)
    }
  }

  async function forgot() {
    if (!email.trim()) {
      setError('Enter your email first, then tap “Forgot password”.')
      return
    }
    setError('')
    try {
      await resetPassword(email.trim())
      setInfo('Password reset email sent. Check your inbox.')
    } catch (err) {
      setError(friendlyError(err.code))
    }
  }

  return (
    <div className="app">
      <div className="auth">
        <div className="brand">
          <img className="logo" src="/icon.svg" alt="" />
          <h1>Invoicer</h1>
          <p>Invoices for your photography, saved in the cloud.</p>
        </div>

        {error && <div className="notice error">{error}</div>}
        {info && <div className="notice info">{info}</div>}

        <form onSubmit={submit} className="stack">
          <input
            className="input"
            type="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="btn" disabled={busy} type="submit">
            {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <div className="spacer" />
        {mode === 'signin' && (
          <button className="btn ghost" onClick={forgot}>
            Forgot password?
          </button>
        )}
        <button
          className="btn ghost"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin')
            setError('')
            setInfo('')
          }}
        >
          {mode === 'signin'
            ? 'New here? Create an account'
            : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}
