// --- ✅ MOCK SETUP (must be on top) ---

// Mock pino (used in logger.js)
jest.mock('pino', () => () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// Mock logger.js
jest.mock('../logger.js', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// Mock firebase-admin for firebase.js
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: () => ({
    collection: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      get: jest.fn(),
      add: jest.fn(),
      doc: jest.fn().mockReturnThis(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
  }),
}));

// Mock firebase.js config wrapper
jest.mock('../config/firebase.js', () => {
  const admin = require('firebase-admin');
  return {
    db: admin.firestore(),
    admin,
    adminAuth: admin.auth?.(),
  };
});

// --- ✅ IMPORT AFTER MOCKS ---
const {
  createDesk,
  getDesksByName,
  getDeskById,
  getAllDesks,
  updateDesk,
  deleteDesk,
} = require('../controllers/desk-controller');
const { db } = require('../config/firebase');
const logger = require('../logger');

describe('Desk Controller', () => {
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

  // --- ✅ createDesk ---
  test('createDesk → returns 400 if required fields missing', async () => {
    req.body = { name: 'Desk A' }; // Missing seats and roomId

    await createDesk(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Name, seats and roomId are required.',
    });
  });

  test('createDesk → creates a new desk successfully', async () => {
    req.body = {
      name: 'Desk A',
      seats: 4,
      roomId: 'Room1',
    };

    const mockAdd = jest.fn().mockResolvedValue({ id: 'desk123' });
    db.collection = jest.fn().mockReturnValue({
      add: mockAdd,
    });

    await createDesk(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Desk created successfully.',
      desk: expect.objectContaining({
        id: 'desk123',
        name: 'Desk A',
        roomId: 'Room1',
        seats: 4,
        isBooked: false,
      }),
    });
  });

  test('createDesk → handles database errors gracefully', async () => {
    req.body = { name: 'Desk A', seats: 4, roomId: 'Room1' };
    db.collection = jest.fn().mockReturnValue({
      add: jest.fn().mockRejectedValue(new Error('DB Error')),
    });

    await createDesk(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal server error',
    });
    expect(logger.error).toHaveBeenCalled();
  });

  // --- ✅ getDesksByName ---
  test('getDesksByName → returns desks when found', async () => {
    req.params = { name: 'Desk A' };

    const mockDesk = { id: 'desk1', data: () => ({ name: 'Desk A', roomId: 'Room1' }) };
    const mockForEach = jest.fn((cb) => cb(mockDesk));

    db.collection = jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ empty: false, forEach: mockForEach }),
    });

    await getDesksByName(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: '1 desk(s) returned successfully.',
      desks: [{ id: 'desk1', name: 'Desk A', roomId: 'Room1' }],
    });
  });

  test('getDesksByName → returns 404 if no desks found', async () => {
    req.params = { name: 'Desk A' };

    db.collection = jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ empty: true }),
    });

    await getDesksByName(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'No desk(s) found.' });
  });

  // --- ✅ getDeskById ---
  test('getDeskById → returns 400 if id missing', async () => {
    req.params = {}; // no id
    await getDeskById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Id is required.' });
  });

  test('getDeskById → returns 404 if desk not found', async () => {
    req.params = { id: 'desk123' };

    db.collection = jest.fn().mockReturnValue({
      doc: jest.fn().mockReturnValue({ get: jest.fn().mockResolvedValue({ exists: false }) }),
    });

    await getDeskById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Desk not found.' });
  });

  // --- ✅ getAllDesks ---
  test('getAllDesks → returns 404 when empty', async () => {
    db.collection = jest.fn().mockReturnValue({
      get: jest.fn().mockResolvedValue({ empty: true }),
    });

    await getAllDesks(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'No desks in database.' });
  });

  // --- ✅ updateDesk ---
  test('updateDesk → updates a desk successfully', async () => {
    req.params = { id: 'desk1' };
    req.body = { name: 'Updated Desk' };

    const mockUpdate = jest.fn().mockResolvedValue();
    const mockGet = jest.fn().mockResolvedValue({
      exists: true,
      id: 'desk1',
      data: () => ({ name: 'Updated Desk' }),
    });

    db.collection = jest.fn().mockReturnValue({
      doc: jest.fn().mockReturnValue({ update: mockUpdate, get: mockGet }),
    });

    await updateDesk(req, res);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Updated Desk',
        updatedAt: expect.any(Date),
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Desk updated successfully.',
      desk: expect.any(Object),
    });
  });

  // --- ✅ deleteDesk ---
  test('deleteDesk → returns 400 if id missing', async () => {
    req.params = {};
    await deleteDesk(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'id is required.' });
  });

  test('deleteDesk → returns 404 if desk not found', async () => {
    req.params = { id: 'desk123' };

    db.collection = jest.fn().mockReturnValue({
      doc: jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue({ exists: false }),
      }),
    });

    await deleteDesk(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'No desk with id desk123 found.',
    });
  });
});