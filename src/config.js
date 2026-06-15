// Centralised access to build-time configuration.
// Values come from a local `.env` file (see .env.example).

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

export const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

// Demo mode: a flag-guarded, no-login experience backed by in-memory sample
// data. Enabled only when built with VITE_DEMO=1, so it has no effect on the
// real production build.
export const isDemo = import.meta.env.VITE_DEMO === '1'

// True only when the essential Firebase keys are present (or in demo mode, so
// the app skips the setup screen).
export const isFirebaseConfigured =
  isDemo ||
  Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId)

// Live Google Maps is unavailable in the demo (seeded distances are used).
export const isMapsConfigured = !isDemo && Boolean(googleMapsApiKey)
