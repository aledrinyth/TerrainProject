// tests/firebase-admin.integration.test.js

// --- Mock firebase-admin before loading the config module ---
var _store = {};
var mockDb = {
  _settings: {},
  settings: jest.fn(function (cfg) {
    mockDb._settings = cfg || {};
  }),
  collection: function (name) {
    return {
      doc: function (id) {
        var key = name + "/" + id;
        return {
          set: function (data) {
            _store[key] = Object.assign({}, data);
            return Promise.resolve();
          },
          get: function () {
            var exists = Object.prototype.hasOwnProperty.call(_store, key);
            return Promise.resolve({
              exists: exists,
              data: function () {
                return exists ? Object.assign({}, _store[key]) : undefined;
              },
            });
          },
        };
      },
    };
  },
  terminate: jest.fn(function () {
    _store = {};
    return Promise.resolve();
  }),
};

jest.mock(
  'firebase-admin',
  function () {
    return {
      initializeApp: jest.fn(function () { /* no-op */ }),
      firestore: function () { return mockDb; },
      auth: function () { return {}; },
    };
  },
  { virtual: true }
);

// Now require config
var cfg = require('../config/firebase'); 
var db = cfg.db;

describe('Firebase config smoke test', function () {
  test(
    'writes and reads a document using mocked Firestore',
    async function () {
      var ref = db.collection('integration-tests').doc('ping');
      await ref.set({ timestamp: 123, ok: true });
      var snap = await ref.get();

      expect(snap.exists).toBe(true);
      var data = snap.data();
      expect(data).toHaveProperty('timestamp', 123);
      expect(data).toHaveProperty('ok', true);
    },
    15000
  );

  afterAll(async function () {
    if (typeof db.terminate === 'function') {
      await db.terminate();
    }
  });
});