const admin = require('firebase-admin');

// Point to emulators FIRST (before initialization)
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8090';  // Use your Firestore port

// Initialize Firebase Admin for emulator
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'demo-no-project',  // Hardcoded for emulator
  });
}

// Get Firestore instance
const db = admin.firestore();
const adminAuth = admin.auth();

// Firestore will automatically use the emulator based on FIRESTORE_EMULATOR_HOST
// No need for manual settings in emulator mode

console.log('✅ Firebase Admin initialized for emulator');
console.log('   Auth: 127.0.0.1:9099');
console.log('   Firestore: 127.0.0.1:8095');

module.exports = { db, admin, adminAuth };