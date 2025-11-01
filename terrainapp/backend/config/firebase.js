const admin = require('firebase-admin');
const path = require('path');

// Load environment variables from .env file in the parent directory
require('dotenv').config({ path: path.join(__dirname, '../..', '.env') });

// Environment-based configuration
const PROJECT_ID = process.env.PROJECT_ID_FIREBASE;

// Initialize Firebase Admin
admin.initializeApp({
    projectId: PROJECT_ID,
});

// Get Firestore instance
const db = admin.firestore();

// In the event that you want to use a database that is not (default)
db.settings({
  databaseId: process.env.DATABASE_NAME
});

const adminAuth = admin.auth()

module.exports = { db, admin, adminAuth };