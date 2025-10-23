// --- Mocks Setup ---
const mockVerifyIdToken = jest.fn();

jest.mock('../config/firebase', () => ({
  adminAuth: {
    verifyIdToken: jest.fn(),
  },
}));

const { adminAuth } = require('../config/firebase');
const { checkIfAdmin } = require('../middleware/auth');

describe('Middleware: checkIfAdmin', () => {
  let req, res, next;

  // Silence console.error during tests
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress error logs
  });

  afterAll(() => {
    console.error.mockRestore(); // Restore after tests
  });

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    next = jest.fn();
  });

  test('returns 401 if no token provided', async () => {
    await checkIfAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith('Unauthorized: No token provided.');
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 if token verification fails', async () => {
    req.headers.authorization = 'Bearer invalidtoken';
    adminAuth.verifyIdToken.mockRejectedValue(new Error('bad token'));

    await checkIfAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith('Unauthorized: Invalid token.');
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 403 if user is not admin', async () => {
    req.headers.authorization = 'Bearer validtoken';
    adminAuth.verifyIdToken.mockResolvedValue({ uid: 'abc123', admin: false });

    await checkIfAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith('Forbidden: User is not an admin.');
    expect(next).not.toHaveBeenCalled();
  });

  test('calls next() if user is admin', async () => {
    req.headers.authorization = 'Bearer validtoken';
    adminAuth.verifyIdToken.mockResolvedValue({ uid: 'abc123', admin: true });

    await checkIfAdmin(req, res, next);

    expect(adminAuth.verifyIdToken).toHaveBeenCalledWith('validtoken');
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
  });
});