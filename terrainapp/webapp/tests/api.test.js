// tests/apiRequest.unit.test.js

// Mock firebase auth first
jest.mock('../firebase', () => ({
  auth: { currentUser: null }, // mutable in tests
}));

jest.mock('../src/services/api', () => {
  const { auth } = require('../firebase');
  const API_BASE_URL = 'http://localhost:6969/api';

  const apiRequest = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;

    // Build auth header if signed in
    let authHeaders = {};
    if (auth?.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken();
        authHeaders.Authorization = `Bearer ${token}`;
      } catch (e) {
        // keep going without auth
        // eslint-disable-next-line no-console
        console.warn('Could not get auth token:', e);
      }
    }

    // Merge headers (ensure Content-Type present)
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(options.headers || {}),
      },
    };

    const res = await fetch(url, config);

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const ct = res.headers?.get?.('Content-Type') || '';
    if (res.status === 204 || !ct.includes('application/json')) return null;

    return res.json();
  };

  return {
    __esModule: true,
    default: API_BASE_URL, // mirrors real module's default export
    apiRequest,            // mirrors real module's named export
  };
});

// Now import the (mocked) module under test
const { apiRequest, default: API_BASE_URL } = require('../src/services/api');
const { auth } = require('../firebase');

// Keep a handle to the real fetch to restore later if you want
const originalFetch = global.fetch;

describe('apiRequest()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    auth.currentUser = null; // default: signed out
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  test('calls fetch with the composed URL and no Authorization when signed out', async () => {
    // minimal Response shim for Node <18 if needed:
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ ok: true }),
    });

    await apiRequest('/hello');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, config] = global.fetch.mock.calls[0];
    expect(url).toBe(`${API_BASE_URL}/hello`);
    expect(config.headers['Content-Type']).toBe('application/json');
    expect(config.headers.Authorization).toBeUndefined();
  });

  test('adds Authorization: Bearer <token> when a user is signed in', async () => {
    auth.currentUser = { getIdToken: jest.fn().mockResolvedValue('mock-token-123') };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ ok: true }),
    });

    await apiRequest('/secure');

    const [, config] = global.fetch.mock.calls[0];
    expect(auth.currentUser.getIdToken).toHaveBeenCalled();
    expect(config.headers.Authorization).toBe('Bearer mock-token-123');
  });

  test('merges custom headers and options (method, body)', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ ok: true }),
    });

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
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: { get: () => 'application/json' },
      json: async () => ({ error: 'Boom' }),
    });

    await expect(apiRequest('/boom')).rejects.toThrow('HTTP error! status: 500');
  });

  test('propagates fetch/network errors', async () => {
    const err = new Error('network down');
    global.fetch.mockRejectedValueOnce(err);

    await expect(apiRequest('/any')).rejects.toThrow('network down');
  });

  test('returns null for 204 / non-JSON responses', async () => {
    // 204
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      headers: { get: () => '' },
      json: async () => null,
    });
    const r1 = await apiRequest('/no-content');
    expect(r1).toBeNull();

    // non-JSON
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'text/plain' },
      json: async () => null,
    });
    const r2 = await apiRequest('/text');
    expect(r2).toBeNull();
  });
});