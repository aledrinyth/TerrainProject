// tests/booking-controller.test.js

// 0) Mock packages that may not be installed in test env
jest.mock('express', () => ({}), { virtual: true });
jest.mock('ics', () => ({
  createEvent: jest.fn(() => ({ error: null, value: 'BEGIN:VCALENDAR\nEND:VCALENDAR' })),
}), { virtual: true });

// 1) Mock pino (logger.js depends on it). Virtual so it needn't be installed.
jest.mock('pino', () => jest.fn(() => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
})), { virtual: true });

// 2) Mock our logger wrapper to avoid circular deps / side effects
jest.mock('../logger.js', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// 3) Mock firebase-admin/auth exactly as the controller imports it
const mockVerifyIdToken = jest.fn();
jest.mock('firebase-admin/auth', () => ({
  getAuth: () => ({ verifyIdToken: mockVerifyIdToken }),
}), { virtual: true });

// 4) Mock Firestore config with the EXACT id used by the controller
// We'll override db.collection() per-test to simulate queries.
jest.mock('../config/firebase.js', () => {
  return {
    db: {
      collection: jest.fn(), // overridden inside tests
    },
  };
});

// --- IMPORT AFTER MOCKS ---
const {
  createBooking,
  getBookingsByName,
  getAllBookings,
  deleteBooking,
} = require('../controllers/booking-controller');

const { db } = require('../config/firebase.js'); // keep .js to match controller import
const logger = require('../logger.js');

describe('Booking Controller (Smoke Tests)', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      params: {},
      query: {},
      headers: {},
    };

    res = {
      status: jest.fn(function () { return this; }),
      json: jest.fn(function () { return this; }),
      send: jest.fn(function () { return this; }),
      setHeader: jest.fn(), // in case generateICS path is ever exercised
    };
  });

  // --- TEST 1: createBooking ---
  test('createBooking → returns 400 if missing fields', async () => {
    // Only name provided; userId/deskId/dateTimestamp missing
    req.body = { name: 'John Doe' };

    await createBooking(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Name, userId, deskId, and dateTimestamp are required.',
    });
  });

  // --- TEST 2: getBookingsByName ---
  test('getBookingsByName → returns 200 with bookings', async () => {
    req.params = { name: 'John Doe' };

    // Simulate Firestore query + snapshot
    const mockDoc = { id: '1', data: () => ({ name: 'John Doe', deskId: 'desk1' }) };
    const mockWhere = jest.fn().mockReturnThis();
    const mockGet = jest.fn().mockResolvedValue({
      empty: false,
      forEach: (cb) => cb(mockDoc),
    });

    db.collection.mockReturnValue({
      where: mockWhere,
      get: mockGet,
    });

    await getBookingsByName(req, res);

    expect(db.collection).toHaveBeenCalledWith('bookings');
    expect(mockWhere).toHaveBeenCalledWith('name', '==', 'John Doe');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: '1 booking(s) returned successfully.',
      bookings: [{ id: '1', name: 'John Doe', deskId: 'desk1' }],
    });
  });

  // --- TEST 3: getAllBookings ---
  test('getAllBookings → returns 404 when empty', async () => {
    const mockGet = jest.fn().mockResolvedValue({ empty: true });

    db.collection.mockReturnValue({
      get: mockGet,
    });

    await getAllBookings(req, res);

    expect(db.collection).toHaveBeenCalledWith('bookings');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'No bookings in database.',
    });
  });

  // --- TEST 4: deleteBooking ---
  test('deleteBooking → returns 401 when no token provided', async () => {
    req.params = { id: 'booking123' };
    req.headers.authorization = undefined; // no "Bearer ..." header

    await deleteBooking(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Authorisation token required.',
    });
  });
});