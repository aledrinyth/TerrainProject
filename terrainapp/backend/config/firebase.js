// backend/firebase.js
const admin = require('firebase-admin');
const path = require('path');

// Load environment variables from .env file in the parent directory
require('dotenv').config({ path: path.join(__dirname, '../..', '.env') });

// GCP_PROJECT and fall back ---
const PROJECT_ID =
  process.env.GCP_PROJECT ||          // <— used by npm:dev:api / CI
  process.env.PROJECT_ID_FIREBASE ||  
  'demo-terrain';                     // <— safe default for local

// Initialize Firebase Admin (guard against double-init in tests/tools)
if (!admin.apps.length) {
  admin.initializeApp({ projectId: PROJECT_ID });
}

// Get Firestore instance
const db = admin.firestore();

db.settings({ databaseId: process.env.DATABASE_NAME });

// log when using emulator
if (process.env.FIRESTORE_EMULATOR_HOST) {
  console.log('[firebase-admin] Using Firestore emulator at', process.env.FIRESTORE_EMULATOR_HOST, 'for project', PROJECT_ID);
}

const adminAuth = admin.auth();

module.exports = { db, admin, adminAuth };