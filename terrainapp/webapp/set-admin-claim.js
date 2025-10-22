// set-admin-emulator.js
const admin = require('firebase-admin');

// Initialize for emulator
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'demo-project',
  });
}

// Point to emulator
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

async function setAdminClaim(email) {
  try {
    console.log(`Looking for user: ${email}...`);
    
    const user = await admin.auth().getUserByEmail(email);
    console.log(` Found user: ${user.email} (UID: ${user.uid})`);
    
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log(` Successfully set admin claim for ${email}`);
    
    console.log('\n Done! You can now login as admin.');
    process.exit(0);
  } catch (error) {
    console.error(' Error:', error.message);
    console.log('\n Tip: Make sure the emulator is running and the user exists.');
    process.exit(1);
  }
}

const adminEmail = 'admin@terrain.com';

console.log('Setting admin claim in emulator...\n');
setAdminClaim(adminEmail);