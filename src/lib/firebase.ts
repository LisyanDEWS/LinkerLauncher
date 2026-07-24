import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCsodcY22_YOMLqkW80A0VRiacXIoz_93o",
  authDomain: "lisyanconnect.firebaseapp.com",
  projectId: "lisyanconnect",
  storageBucket: "lisyanconnect.firebasestorage.app",
  messagingSenderId: "77541730619",
  appId: "1:77541730619:web:870fe8c73b26b60f5d6f1e",
  measurementId: "G-19WFH992C9"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
