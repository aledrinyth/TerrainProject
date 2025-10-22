// set-admin-emulator.js
const admin = require('firebase-admin');

// Point to emulator BEFORE initializing
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

// Initialize for emulator
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'demo-project',
  });
}

async function setAdminClaim(email) {
  try {
    console.log(` Emulator host: ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);
    console.log(`Looking for user: ${email}...`);
    
    // List all users first to verify connection
    const listUsersResult = await admin.auth().listUsers();
    console.log(`Found ${listUsersResult.users.length} total users in emulator`);
    listUsersResult.users.forEach(u => {
      console.log(`  - ${u.email} (UID: ${u.uid})`);
    });
    
    const user = await admin.auth().getUserByEmail(email);
    console.log(`\n Found user: ${user.email} (UID: ${user.uid})`);
    
    // Check existing claims
    console.log(`Current custom claims:`, user.customClaims);
    
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log(` Successfully set admin claim for ${email}`);
    
    // Verify it was set
    const updatedUser = await admin.auth().getUser(user.uid);
    console.log(`Updated custom claims:`, updatedUser.customClaims);
    
    console.log('\n Done! Logout and login again as admin.');
    process.exit(0);
  } catch (error) {
    console.error(' Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

const adminEmail = 'admin@gmail.com';

console.log('Setting admin claim in emulator...\n');
setAdminClaim(adminEmail);