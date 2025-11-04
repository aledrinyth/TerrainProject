// backend/tests/firebase.integration.test.js

// Provide env expected by backend/config/firebase.js before requiring anything
process.env.GCP_PROJECT = 'demo-terrain-test';
process.env.DATABASE_NAME = 'test-db';

// --- Mock firebase-admin before importing the module under test ---
jest.mock(
  'firebase-admin',
  () => {
    let _store = {};

    const mockDb = {
      _settings: {},
      settings: jest.fn(cfg => {
        mockDb._settings = cfg || {};
      }),
      collection: name => ({
        doc: id => {
          const key = `${name}/${id}`;
          return {
            set: data => {
              _store[key] = { ...data };
              return Promise.resolve();
            },
            get: () => {
              const exists = Object.prototype.hasOwnProperty.call(_store, key);
              return Promise.resolve({
                exists,
                data: () => (exists ? { ..._store[key] } : undefined),
              });
            },
          };
        },
      }),
      terminate: jest.fn(() => {
        _store = {};
        return Promise.resolve();
      }),
    };

    const initializeApp = jest.fn();

    // Everything defined INSIDE the factory; expose handles for assertions
    return {
      initializeApp,
      firestore: () => mockDb,
      auth: () => ({}),
      apps: [],
      __mockDb: mockDb,
      __initializeApp: initializeApp,
    };
  },
  { virtual: true }
);

// Now import the firebase admin wrapper from config/
const { db } = require('../config/firebase');
const admin = require('firebase-admin'); // the mocked module

describe('Firebase config smoke test', () => {
  test('initializes admin with project + applies database settings', async () => {
    // initializeApp called with project id from env
    expect(admin.__initializeApp).toHaveBeenCalledWith({ projectId: 'demo-terrain-test' });

    // db.settings called with databaseId from env
    expect(admin.__mockDb.settings).toHaveBeenCalled();
    expect(admin.__mockDb._settings).toHaveProperty('databaseId', 'test-db');
  });

  test(
    'writes and reads a document using mocked Firestore',
    async () => {
      const ref = db.collection('integration-tests').doc('ping');
      await ref.set({ timestamp: 123, ok: true });
      const snap = await ref.get();

      expect(snap.exists).toBe(true);
      const data = snap.data();
      expect(data).toHaveProperty('timestamp', 123);
      expect(data).toHaveProperty('ok', true);
    },
    15000
  );

  afterAll(async () => {
    if (typeof db.terminate === 'function') {
      await db.terminate();
    }
  });
});