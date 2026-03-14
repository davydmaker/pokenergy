import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

let playerIdPromise: Promise<string> | null = null;

export function getPlayerId(): Promise<string> {
  if (playerIdPromise) return playerIdPromise;

  playerIdPromise = new Promise<string>((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        unsubscribe();
        resolve(user.uid);
      }
    });

    signInAnonymously(auth).catch((error) => {
      unsubscribe();
      playerIdPromise = null;
      reject(error);
    });

    setTimeout(() => {
      unsubscribe();
      if (!auth.currentUser) {
        playerIdPromise = null;
        reject(new Error('Auth timeout'));
      }
    }, 10000);
  });

  return playerIdPromise;
}
