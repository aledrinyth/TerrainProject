// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Firebase configuration - values don't matter for emulator
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-no-project.firebaseapp.com",
  projectId: "demo-no-project",  // Changed to match emulator
  storageBucket: "demo-no-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get the auth instance
const auth = getAuth(app);

// Connect to emulator
connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
console.log(" Connected to Firebase Auth Emulator");

export { auth };