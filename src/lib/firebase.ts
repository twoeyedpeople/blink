import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import firebaseConfig from '../../firebase-applet-config.json'

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId)
export const auth = getAuth(app)

// Anonymous auth, no login screen. This isn't about identifying who's using
// Tim, it's the difference between "anyone who copies the public web
// config can read every client's rates and hours straight out of Firestore"
// and "you'd have to sign in as the app to do that." Firestore rules key off
// request.auth != null for the main workspace doc; only the redacted
// blink_clients/{shareId} docs stay genuinely public, since that's the
// whole point of the client billing link.
export const authReady = new Promise<void>((resolve) => {
  onAuthStateChanged(auth, (user) => {
    if (user) resolve()
    else signInAnonymously(auth).catch(() => resolve())
  })
})
