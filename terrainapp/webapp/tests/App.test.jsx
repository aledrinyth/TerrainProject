import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';

// Mock config.js FIRST (it uses import.meta)
jest.mock('../src/config', () => ({
  API_BASE_URL: 'http://localhost:6969/api',
}));

// Mock only the services that use import.meta
jest.mock('../src/services/bookingService', () => ({
  bookingService: {
    getBookings: jest.fn().mockResolvedValue([]),
    createBooking: jest.fn().mockResolvedValue({ id: '1' }),
    updateBooking: jest.fn().mockResolvedValue({ id: '1' }),
    deleteBooking: jest.fn().mockResolvedValue(true),
    getBookingsByUserId: jest.fn().mockResolvedValue([]),
    downloadICS: jest.fn().mockResolvedValue(new Blob()),
  },
}));

// Mock Firebase - it's at webapp/firebase.js
jest.mock('../firebase.js', () => ({
  auth: {
    currentUser: null,
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn((callback) => {
      callback(null);
      return jest.fn(); // unsubscribe function
    }),
  },
  db: {},
}));

// Mock AuthContext
jest.mock('../contexts/AuthContext.jsx', () => ({
  useAuth: jest.fn(),
  AuthProvider: ({ children }) => <div>{children}</div>,
}));

// Import the REAL components after mocks
import App from '../src/App';
import { useAuth } from '../contexts/AuthContext.jsx';

// Mock fetch for any API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ bookings: [] }),
  })
);

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

describe('App - Testing Real Components', () => {
  it('renders real login page when no user is authenticated', () => {
    useAuth.mockReturnValue({ 
      loading: false, 
      user: null,
      login: jest.fn(),
      logout: jest.fn() 
    });

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
  });

  it('renders loading state while checking authentication', () => {
    useAuth.mockReturnValue({ 
      loading: true, 
      user: null,
      login: jest.fn(),
      logout: jest.fn() 
    });

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('navigates to booking page when user is authenticated', () => {
    useAuth.mockReturnValue({ 
      loading: false, 
      user: { uid: '123', email: 'test@test.com' },
      login: jest.fn(),
      logout: jest.fn() 
    });

    render(
      <MemoryRouter initialEntries={['/booking']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });
});