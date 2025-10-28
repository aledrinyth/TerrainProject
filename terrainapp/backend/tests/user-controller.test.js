// tests/user-controller.test.js

// --- MOCK SETUP (must appear first) ---

// Mock express so controllers that `require("express")` don't need the package installed
jest.mock('express', function () { return {}; }, { virtual: true });

// Mock pino (used in logger.js) — mark as virtual so the package isn't required
jest.mock(
  'pino',
  function () {
    return function () {
      return {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
      };
    };
  },
  { virtual: true }
);

// Mock logger.js
jest.mock('../logger.js', function () {
  return {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };
});

// Create a reusable mockAuth object that simulates Firebase Auth methods
var mockVerifyIdToken = jest.fn();
var mockCreateUser = jest.fn();
var mockGetUserByEmail = jest.fn();
var mockGetUserById = jest.fn();
var mockGetUserByPhoneNumber = jest.fn();
var mockListUsers = jest.fn();
var mockUpdateUser = jest.fn();
var mockDeleteUser = jest.fn();

// Mock ../config/firebase.js to return our mockAuth and adminAuth
jest.mock('../config/firebase.js', function () {
  return {
    getAuth: jest.fn(function () {
      return {
        verifyIdToken: mockVerifyIdToken,
        createUser: mockCreateUser,
        getUserByEmail: mockGetUserByEmail,
        getUserById: mockGetUserById,
        getUserByPhoneNumber: mockGetUserByPhoneNumber,
        listUsers: mockListUsers,
        updateUser: mockUpdateUser,
        deleteUser: mockDeleteUser,
      };
    }),
    db: { collection: jest.fn() },
    adminAuth: { setCustomUserClaims: jest.fn(), getUserByEmail: jest.fn() },
  };
});

// --- IMPORT AFTER MOCKS ---
var controllers = require('../controllers/user-controller');
var createUser = controllers.createUser;
var getUserByEmail = controllers.getUserByEmail;
var getUserById = controllers.getUserById;
var getUserByPhoneNumber = controllers.getUserByPhoneNumber;
var getAllUsers = controllers.getAllUsers;
var updateUser = controllers.updateUser;
var deleteUser = controllers.deleteUser;
var setAdmin = controllers.setAdmin;

var firebaseCfg = require('../config/firebase');
var getAuth = firebaseCfg.getAuth;
var adminAuth = firebaseCfg.adminAuth;
var logger = require('../logger');

describe('User Controller', function () {
  var req, res;

  beforeEach(function () {
    jest.clearAllMocks();
    req = {
      body: {},
      params: {},
      headers: {},
    };
    res = {
      status: jest.fn(function () { return this; }),
      json: jest.fn(function () { return this; }),
    };
  });

  // --- createUser ---
  test('createUser returns 400 if required fields missing', async function () {
    req.body = { name: 'John' }; // Missing email and phoneNumber

    await createUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Name, email, and phone number are required.',
    });
  });

  test('createUser returns 401 if no token', async function () {
    req.body = { name: 'John', email: 'john@example.com', phoneNumber: '12345' };
    req.headers.authorization = undefined;

    await createUser(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Authorisation token required.',
    });
  });

  test('createUser returns 403 if not admin', async function () {
    req.body = { name: 'John', email: 'john@example.com', phoneNumber: '12345' };
    req.headers.authorization = 'Bearer token123';
    mockVerifyIdToken.mockResolvedValue({ admin: false });

    await createUser(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'User creation can only be done by admin.',
    });
  });

  test('createUser creates user successfully', async function () {
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
  test('getUserByEmail returns 403 if not admin', async function () {
    req.params = { email: 'john@example.com' };
    req.headers.authorization = 'Bearer token123';
    mockVerifyIdToken.mockResolvedValue({ admin: false });

    await getUserByEmail(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Get user by email can only be done by admin.',
    });
  });

  test('getUserByEmail returns user when found', async function () {
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
  test('getAllUsers returns 403 if not admin', async function () {
    req.headers.authorization = 'Bearer token123';
    mockVerifyIdToken.mockResolvedValue({ admin: false });

    await getAllUsers(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Get all users can only be done by admin.',
    });
  });

  test('getAllUsers returns all users successfully', async function () {
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
  test('deleteUser returns 403 if not admin', async function () {
    req.params = { email: 'john@example.com' };
    req.headers.authorization = 'Bearer token123';
    mockVerifyIdToken.mockResolvedValue({ admin: false });

    await deleteUser(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Delete user can only be done by admin.',
    });
  });

  test('deleteUser deletes user successfully', async function () {
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
  test('setAdmin returns 400 if no email', async function () {
    req.params = {}; // missing email
    await setAdmin(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Email is required in the request body.',
    });
  });

  test('setAdmin promotes user successfully', async function () {
    req.params = { email: 'john@example.com' };
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