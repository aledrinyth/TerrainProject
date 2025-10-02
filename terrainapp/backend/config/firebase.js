const admin = require('firebase-admin');

// Environment-based configuration
const PROJECT_ID = process.env.GCP_PROJECT;

// Initialize Firebase Admin
admin.initializeApp({
    projectId: PROJECT_ID,
});

// Get Firestore instance
const db = admin.firestore();
const adminAuth = admin.auth()

// For development, disable SSL warnings from emulator
if (process.env.NODE_ENV !== 'production') {
    db.settings({
        host: process.env.FIRESTORE_EMULATOR_HOST,
        ssl: false
    });
}

module.exports = { db, admin, adminAuth };