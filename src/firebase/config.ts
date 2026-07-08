import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Sandbox mode: when the Firebase env vars are absent (e.g. local dev without a
// Firebase project), we skip initialization entirely so solo mode still works.
// Only multiplayer requires Firebase.
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

let app: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  dbInstance = getFirestore(app);
  authInstance = getAuth(app);
} else {
  console.warn(
    '[PokEnergy] Firebase not configured — running in sandbox mode. ' +
      'Solo play works; multiplayer is disabled. Set the VITE_FIREBASE_* env vars to enable it.',
  );
}

// Non-null assertions are safe: these are only consumed by multiplayer code
// paths, which are gated behind `isFirebaseConfigured` in the UI.
export const db = dbInstance as Firestore;
export const auth = authInstance as Auth;

let playerIdPromise: Promise<string> | null = null;

export function getPlayerId(): Promise<string> {
  if (!isFirebaseConfigured) {
    return Promise.reject(new Error('Firebase not configured (sandbox mode)'));
  }
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
