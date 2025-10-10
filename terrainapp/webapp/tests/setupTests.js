// Polyfill browser-like APIs for Jest (jsdom environment)
import 'whatwg-fetch';
import { TextEncoder, TextDecoder } from 'util';

// Provide TextEncoder / TextDecoder globally
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Silence jsdom "Not implemented: window.alert" errors
window.alert = jest.fn();

// Polyfill fetch if needed (Node 18+ already has it)
if (typeof global.fetch === 'undefined') {
  global.fetch = (...args) =>
    import('node-fetch').then(({ default: fetch }) => fetch(...args));
}

// Mock Firebase modules to prevent actual SDK initialization
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  connectAuthEmulator: jest.fn(),
  signInWithEmailAndPassword: jest.fn(() =>
    Promise.resolve({
      user: { email: 'mockuser@example.com', uid: '123' },
    })
  ),
  getIdTokenResult: jest.fn(() =>
    Promise.resolve({ claims: { admin: false } })
  ),
  onAuthStateChanged: jest.fn(),
}));

// Completely silence console output during tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Prevent unhandled promise rejection warnings
process.on('unhandledRejection', () => {
  // Silent
});