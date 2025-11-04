// webapp/src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'dev-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'localhost',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-terrain',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo-terrain.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:000000000000:web:dev',
};

const app = initializeApp(cfg);
const auth = getAuth(app);

// connect to emulator before any other auth call happens
const shouldUseEmu =
  import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true' ||
  ['localhost', '127.0.0.1'].includes(window.location.hostname);

if (shouldUseEmu) {
  const url = 'http://127.0.0.1:9099';
  connectAuthEmulator(auth, url, { disableWarnings: true });
  console.log('[firebase] Auth emulator connected →', url);
}

export { auth };