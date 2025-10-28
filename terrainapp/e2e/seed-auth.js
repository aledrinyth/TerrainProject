// terrainapp/e2e/seed-auth.js  (ESM)

import admin from 'firebase-admin';

async function main() {
  // Point Admin SDK to the Auth Emulator
  process.env.FIREBASE_AUTH_EMULATOR_HOST =
    process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';

  // No real creds needed for emulator
  if (!admin.apps.length) {
    admin.initializeApp({ projectId: 'demo-terrain' });
  }

  const auth = admin.auth();

  // Optional: clean slate for deterministic tests
  try {
    const list = await auth.listUsers();
    await Promise.all(list.users.map(u => auth.deleteUser(u.uid)));
  } catch {
    // ignore
  }

  // Regular user
  const regular = await auth.createUser({
    email: 'test@gmail.com',
    password: 'test123',
    displayName: 'Regular User',
  });

  // Admin user
  const adminUser = await auth.createUser({
    email: 'admin@gmail.com',
    password: 'admin123',
    displayName: 'Admin User',
  });

  // Admin claim
  await auth.setCustomUserClaims(adminUser.uid, { admin: true });

  console.log('Seeded users:', { regular: regular.email, admin: adminUser.email });
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});