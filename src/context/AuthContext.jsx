import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail
} from 'firebase/auth'
import { auth } from '../firebase'
import { isDemo } from '../config'

const AuthContext = createContext(null)

const DEMO_USER = { uid: 'demo', email: 'you@demo.app' }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(isDemo ? DEMO_USER : null)
  const [loading, setLoading] = useState(!isDemo)

  useEffect(() => {
    if (isDemo) return
    if (!auth) {
      setLoading(false)
      return
    }
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  if (isDemo) {
    const noop = async () => {}
    return (
      <AuthContext.Provider
        value={{
          user: DEMO_USER,
          loading: false,
          signIn: noop,
          signUp: noop,
          resetPassword: noop,
          signOut: noop
        }}
      >
        {children}
      </AuthContext.Provider>
    )
  }

  const value = {
    user,
    loading,
    signIn: (email, pw) => signInWithEmailAndPassword(auth, email, pw),
    signUp: (email, pw) => createUserWithEmailAndPassword(auth, email, pw),
    resetPassword: (email) => sendPasswordResetEmail(auth, email),
    signOut: () => fbSignOut(auth)
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
