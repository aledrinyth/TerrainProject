// create-test-users.js
const admin = require('firebase-admin');

// Point to emulator
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'demo-no-project',
  });
}

async function createTestUsers() {
  try {
    console.log('Creating test users in emulator...\n');
    
    // User 1: Regular test user
    try {
      const user1 = await admin.auth().createUser({
        email: 'test@gmail.com',
        password: 'test123',
        emailVerified: true,
        displayName: 'Test User'
      });
      console.log(' Created: test@gmail.com');
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log('  test@gmail.com already exists');
      } else {
        throw error;
      }
    }
    
    // User 2: Admin user
    let adminUser;
    try {
      adminUser = await admin.auth().createUser({
        email: 'admin@gmail.com',
        password: 'admin123',
        emailVerified: true,
        displayName: 'Admin User'
      });
      console.log(' Created: admin@gmail.com');
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log('  admin@gmail.com already exists');
        adminUser = await admin.auth().getUserByEmail('admin@gmail.com');
      } else {
        throw error;
      }
    }
    
    // Set admin claim
    console.log('\n Setting admin claim for admin@gmail.com...');
    await admin.auth().setCustomUserClaims(adminUser.uid, { admin: true });
    console.log(' Admin claim set!');
    
    // Verify all users
    console.log('\n All users in emulator:');
    const listUsersResult = await admin.auth().listUsers();
    listUsersResult.users.forEach(u => {
      console.log(`  - ${u.email} (admin: ${u.customClaims?.admin || false})`);
    });
    
    console.log('\n All done! You can now login.');
    process.exit(0);
    
  } catch (error) {
    console.error(' Error:', error);
    process.exit(1);
  }
}

createTestUsers();