// tests/apiRequest.unit.test.js

// Mock must use a string literal, not a variable
jest.mock('../firebase', () => {
  // a mutable mock so tests can toggle currentUser / token
  return {
    auth: {
      currentUser: null,
    },
  };
});

describe('apiRequest()', () => {
  let apiRequest, API_BASE_URL, auth;
  const originalFetch = global.fetch;

  beforeAll(() => {
    // Import after mocks are set up
    ({ apiRequest, default: API_BASE_URL } = require('../src/services/api'));
    ({ auth } = require('../firebase'));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    auth.currentUser = null; // default: signed-out
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  test('calls fetch with the composed URL and no Authorization when signed out', async () => {
    global.fetch.mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    await apiRequest('/hello');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, config] = global.fetch.mock.calls[0];
    expect(url).toContain('/hello');
    expect(config.headers['Content-Type']).toBe('application/json');
    expect(config.headers.Authorization).toBeUndefined();
  });

  test('adds Authorization: Bearer <token> when a user is signed in', async () => {
    auth.currentUser = {
      getIdToken: jest.fn().mockResolvedValue('mock-token-123'),
    };
    global.fetch.mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    await apiRequest('/secure');

    const [, config] = global.fetch.mock.calls[0];
    expect(auth.currentUser.getIdToken).toHaveBeenCalled();
    expect(config.headers.Authorization).toBe('Bearer mock-token-123');
  });

  test('merges custom headers and options (method, body)', async () => {
    global.fetch.mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    const payload = { name: 'Ariff' };
    await apiRequest('/post', {
      method: 'POST',
      headers: { 'X-Test': 'yes' },
      body: JSON.stringify(payload),
    });

    const [, config] = global.fetch.mock.calls[0];
    expect(config.method).toBe('POST');
    expect(config.headers['X-Test']).toBe('yes');
    expect(config.headers['Content-Type']).toBe('application/json');
    expect(config.body).toBe(JSON.stringify(payload));
  });

  test('throws with status on non-OK response', async () => {
    global.fetch.mockResolvedValueOnce(new Response('Boom', { status: 500 }));

    await expect(apiRequest('/boom')).rejects.toThrow('HTTP error! status: 500');
  });

  test('propagates fetch/network errors', async () => {
    const err = new Error('network down');
    global.fetch.mockRejectedValueOnce(err);

    await expect(apiRequest('/any')).rejects.toThrow('network down');
  });
});