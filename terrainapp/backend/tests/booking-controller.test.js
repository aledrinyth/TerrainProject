// Mock pino dependency (used by logger.js)
jest.mock('pino', () => () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// Mock logger.js to avoid circular mock issues
jest.mock('../logger.js', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// Mock firebase-admin (for firebase.js)
const mockVerifyIdToken = jest.fn();
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: () => ({
    collection: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      get: jest.fn(),
      add: jest.fn(),
      doc: jest.fn().mockReturnThis(),
      update: jest.fn(),
    })),
  }),
  auth: () => ({
    verifyIdToken: mockVerifyIdToken,
  }),
}));

// Mock firebase.js config wrapper
jest.mock('../config/firebase.js', () => {
  const admin = require('firebase-admin');
  return {
    db: admin.firestore(),
    admin,
    adminAuth: admin.auth(),
  };
});

// --- IMPORT AFTER MOCKS ---
const {
  createBooking,
  getBookingsByName,
  getAllBookings,
  deleteBooking,
} = require('../controllers/booking-controller');
const { db } = require('../config/firebase');
const logger = require('../logger');

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
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  // --- TEST 1: createBooking ---
  test('createBooking → returns 400 if missing fields', async () => {
    req.body = { name: 'John Doe' }; // Missing required fields

    await createBooking(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Name, userId, deskId, startTimestamp, and endTimestamp are required.',
    });
  });

  // --- TEST 2: getBookingsByName ---
  test('getBookingsByName → returns 200 with bookings', async () => {
    req.params = { name: 'John Doe' };

    const mockBooking1 = { id: '1', data: () => ({ name: 'John Doe', deskId: 'desk1' }) };
    const mockForEach = jest.fn((cb) => cb(mockBooking1));

    db.collection = jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({
        empty: false,
        forEach: mockForEach,
      }),
    });

    await getBookingsByName(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: '1 booking(s) returned successfully.',
      bookings: [{ id: '1', name: 'John Doe', deskId: 'desk1' }],
    });
  });

  // --- TEST 3: getAllBookings ---
  test('getAllBookings → returns 404 when empty', async () => {
    db.collection = jest.fn().mockReturnValue({
      get: jest.fn().mockResolvedValue({ empty: true }),
    });

    await getAllBookings(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'No bookings in database.',
    });
  });

  // --- TEST 4: deleteBooking ---
  test('deleteBooking → returns 401 when no token provided', async () => {
    req.params = { id: 'booking123' };
    req.headers.authorization = undefined;

    await deleteBooking(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Authorisation token required.',
    });
  });
});