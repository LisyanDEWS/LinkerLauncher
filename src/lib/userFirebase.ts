import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
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
