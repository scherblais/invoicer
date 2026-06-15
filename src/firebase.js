import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore'
import { firebaseConfig, isFirebaseConfigured, isDemo } from './config'

// We only initialise Firebase when real configuration is present so the app can
// still render a helpful setup screen if the user hasn't added their keys yet.
// In demo mode we skip Firebase entirely and use the in-memory backend in db.js.
let app = null
let auth = null
let db = null

if (isFirebaseConfigured && !isDemo) {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)

  // Cloud is always the source of truth. The local cache only lets the UI stay
  // responsive and queue writes during brief connection drops — every change is
  // still synced to Firestore in the cloud, which is what the save indicator
  // reflects.
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  })
}

export { app, auth, db }
