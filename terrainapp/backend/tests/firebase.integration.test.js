const { db } = require('../config/firebase'); // adjust path

describe('Firebase Admin integration', () => {
  test(
    'can connect to Firestore emulator and write/read a doc',
    async () => {
      const testRef = db.collection('integration-tests').doc('ping');
      await testRef.set({ timestamp: Date.now() });
      const doc = await testRef.get();

      expect(doc.exists).toBe(true);
      expect(doc.data()).toHaveProperty('timestamp');
    },
    15000 // increase timeout
  );

  afterAll(async () => {
    // close any hanging Firestore streams
    if (typeof db.terminate === 'function') {
      await db.terminate();
    }
  });
});