const admin = require('firebase-admin');

// Environment-based configuration
const PROJECT_ID = 'your-firebase-project-id'; // Must match docker-compose GCP_PROJECT

// Initialize Firebase Admin
admin.initializeApp({
    projectId: PROJECT_ID,
});

// For development with emulators
if (process.env.NODE_ENV !== 'production') {
    // Firebase Admin SDK emulator
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
    process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";
}

// Get Firestore instance
const db = admin.firestore();
const adminAuth = admin.auth()

// For development, disable SSL warnings from emulator
if (process.env.NODE_ENV !== 'production') {
    db.settings({
        host: 'localhost:8080',
        ssl: false
    });
}

module.exports = { db, admin, adminAuth };