// --- MOCK SETUP (must appear first) ---

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

// Mock firebase-admin for config/firebase.js
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: () => ({
    collection: jest.fn(),
  }),
  auth: jest.fn(() => ({})),
}));

// Create a reusable mockAuth object that simulates Firebase Auth methods
const mockVerifyIdToken = jest.fn();
const mockCreateUser = jest.fn();
const mockGetUserByEmail = jest.fn();
const mockGetUserById = jest.fn();
const mockGetUserByPhoneNumber = jest.fn();
const mockListUsers = jest.fn();
const mockUpdateUser = jest.fn();
const mockDeleteUser = jest.fn();

// Mock ../config/firebase.js to return our mockAuth
jest.mock('../config/firebase.js', () => ({
  getAuth: jest.fn(() => ({
    verifyIdToken: mockVerifyIdToken,
    createUser: mockCreateUser,
    getUserByEmail: mockGetUserByEmail,
    getUserById: mockGetUserById,
    getUserByPhoneNumber: mockGetUserByPhoneNumber,
    listUsers: mockListUsers,
    updateUser: mockUpdateUser,
    deleteUser: mockDeleteUser,
  })),
  db: { collection: jest.fn() },
  adminAuth: { setCustomUserClaims: jest.fn(), getUserByEmail: jest.fn() },
}));

// --- IMPORT AFTER MOCKS ---
const {
  createUser,
  getUserByEmail,
  getUserById,
  getUserByPhoneNumber,
  getAllUsers,
  updateUser,
  deleteUser,
  setAdmin,
} = require('../controllers/user-controller');
const { getAuth, adminAuth } = require('../config/firebase');
const logger = require('../logger');

describe('User Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {},
      params: {},
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  // --- createUser ---
  test('createUser → returns 400 if required fields missing', async () => {
    req.body = { name: 'John' }; // Missing email and phoneNumber

    await createUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Name, email, and phone number are required.',
    });
  });

  test('createUser → returns 401 if no token', async () => {
    req.body = { name: 'John', email: 'john@example.com', phoneNumber: '12345' };
    req.headers.authorization = undefined;

    await createUser(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Authorisation token required.',
    });
  });

  test('createUser → returns 403 if not admin', async () => {
    req.body = { name: 'John', email: 'john@example.com', phoneNumber: '12345' };
    req.headers.authorization = 'Bearer token123';
    mockVerifyIdToken.mockResolvedValue({ admin: false });

    await createUser(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'User creation can only be done by admin.',
    });
  });

  test('createUser → creates user successfully', async () => {
    req.body = { name: 'John', email: 'john@example.com', phoneNumber: '12345' };
    req.headers.authorization = 'Bearer token123';
    mockVerifyIdToken.mockResolvedValue({ admin: true });
    mockCreateUser.mockResolvedValue({
      uid: 'uid123',
      email: 'john@example.com',
      displayName: 'John',
    });

    await createUser(req, res);
    expect(mockCreateUser).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'User created succesfully.',
      user: expect.objectContaining({
        id: 'uid123',
        email: 'john@example.com',
      }),
    });
  });

  // --- getUserByEmail ---
  test('getUserByEmail → returns 403 if not admin', async () => {
    req.params = { email: 'john@example.com' };
    req.headers.authorization = 'Bearer token123';
    mockVerifyIdToken.mockResolvedValue({ admin: false });

    await getUserByEmail(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Get user by email can only be done by admin.',
    });
  });

  test('getUserByEmail → returns user when found', async () => {
    req.params = { email: 'john@example.com' };
    req.headers.authorization = 'Bearer token123';
    mockVerifyIdToken.mockResolvedValue({ admin: true });
    mockGetUserByEmail.mockResolvedValue({
      uid: 'uid123',
      displayName: 'John',
      email: 'john@example.com',
      phoneNumber: '12345',
    });

    await getUserByEmail(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'User returned successfully.',
      user: expect.objectContaining({ id: 'uid123', email: 'john@example.com' }),
    });
  });

  // --- getAllUsers ---
  test('getAllUsers → returns 403 if not admin', async () => {
    req.headers.authorization = 'Bearer token123';
    mockVerifyIdToken.mockResolvedValue({ admin: false });

    await getAllUsers(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Get all users can only be done by admin.',
    });
  });

  test('getAllUsers → returns all users successfully', async () => {
    req.headers.authorization = 'Bearer token123';
    mockVerifyIdToken.mockResolvedValue({ admin: true });
    mockListUsers.mockResolvedValue({
      users: [
        { uid: '1', displayName: 'John', email: 'john@example.com', phoneNumber: '123' },
        { uid: '2', displayName: 'Jane', email: 'jane@example.com', phoneNumber: '456' },
      ],
    });

    await getAllUsers(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Successfully returned all users.',
      users: expect.arrayContaining([
        expect.objectContaining({ id: '1', email: 'john@example.com' }),
        expect.objectContaining({ id: '2', email: 'jane@example.com' }),
      ]),
    });
  });

  // --- deleteUser ---
  test('deleteUser → returns 403 if not admin', async () => {
    req.params = { email: 'john@example.com' };
    req.headers.authorization = 'Bearer token123';
    mockVerifyIdToken.mockResolvedValue({ admin: false });

    await deleteUser(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Delete user can only be done by admin.',
    });
  });

  test('deleteUser → deletes user successfully', async () => {
    req.params = { email: 'john@example.com' };
    req.headers.authorization = 'Bearer token123';
    mockVerifyIdToken.mockResolvedValue({ admin: true });
    mockGetUserByEmail.mockResolvedValue({ uid: 'uid123' });
    mockDeleteUser.mockResolvedValue();

    await deleteUser(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'User deleted successfully.',
    });
  });

  // --- setAdmin ---
  test('setAdmin → returns 400 if no email', async () => {
    req.params = {}; // FIXED
    await setAdmin(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Email is required in the request body.',
    });
  });

  test('setAdmin → promotes user successfully', async () => {
    req.params = { email: 'john@example.com' }; // FIXED
    adminAuth.getUserByEmail.mockResolvedValue({ uid: 'uid123' });
    adminAuth.setCustomUserClaims.mockResolvedValue();

    await setAdmin(req, res);
    expect(adminAuth.getUserByEmail).toHaveBeenCalledWith('john@example.com');
    expect(adminAuth.setCustomUserClaims).toHaveBeenCalledWith('uid123', { admin: true });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Successfully promoted john@example.com to admin.',
    });
  });
});