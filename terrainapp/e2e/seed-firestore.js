// ESM script to seed Firestore emulator with bookings
import admin from 'firebase-admin';

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'demo-terrain' });
}

const db = admin.firestore();

function isoAtMidnight(daysFromToday = 1) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + daysFromToday);
  return d;
}

async function main() {
  // wipe
  const snap = await db.collection('bookings').get();
  const batch = db.batch();
  snap.forEach(doc => batch.delete(doc.ref));
  await batch.commit();

  // seed
  const seed = [
    {
      id: 'b1',
      name: 'Regular User',
      userId: 'uid-1',
      deskId: 1,
      dateTimestamp: isoAtMidnight(1),
      status: 'active',
      createdAt: new Date()
    },
    {
      id: 'b2',
      name: 'Regular User',
      userId: 'uid-1',
      deskId: 2,
      dateTimestamp: isoAtMidnight(2),
      status: 'cancelled',
      createdAt: new Date(),
      cancelledAt: new Date(),
      cancellationReason: 'Seeded'
    },
    {
      id: 'b3',
      name: 'Another User',
      userId: 'uid-2',
      deskId: 3,
      dateTimestamp: isoAtMidnight(3),
      status: 'active',
      createdAt: new Date()
    },
  ];

  const batch2 = db.batch();
  seed.forEach(b => {
    const ref = db.collection('bookings').doc(b.id);
    batch2.set(ref, b);
  });
  await batch2.commit();

  console.log('Seeded bookings:', seed.map(s => s.id).join(', '));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});