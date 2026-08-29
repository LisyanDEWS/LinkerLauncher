import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const userFirebaseConfig = {
  apiKey: "AIzaSyBMGFrXxmMy2nmkXbnbjIhDMvQaRm2h5UY",
  authDomain: "linkerid-f1ce6.firebaseapp.com",
  projectId: "linkerid-f1ce6",
  storageBucket: "linkerid-f1ce6.firebasestorage.app",
  messagingSenderId: "527086892485",
  appId: "1:527086892485:web:cd66d0047a2d219fd707ac",
  measurementId: "G-VWRJMHJS99"
};

// Use a named Firebase app 'userApp' to keep it completely isolated
export const userApp = getApps().find(a => a.name === 'userApp') || initializeApp(userFirebaseConfig, 'userApp');
export const userAuth = getAuth(userApp);
export const userDb = getFirestore(userApp);

/**
 * Purge all session data, caches, IndexedDB, localStorage, and sessionStorage
 * leaving zero traces of the previous account for total privacy and fresh logins.
 */
export async function purgeAllSessionData(): Promise<void> {
  try {
    await signOut(userAuth);
  } catch (e) {
    console.warn('signOut error:', e);
  }

  try {
    localStorage.clear();
  } catch {}

  try {
    sessionStorage.clear();
  } catch {}

  // Delete all CacheStorage items (PWA / dynamic request caches)
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const keys = await window.caches.keys();
      await Promise.all(keys.map((k) => window.caches.delete(k)));
    } catch {}
  }

  // Delete IndexedDB databases (Firebase offline cache, local stores)
  if (typeof window !== 'undefined' && 'indexedDB' in window) {
    try {
      if ('databases' in indexedDB) {
        const dbs = await indexedDB.databases();
        for (const db of dbs) {
          if (db.name) {
            indexedDB.deleteDatabase(db.name);
          }
        }
      }
    } catch {}
  }
}
