const { render, screen, cleanup } = require('@testing-library/react');
const React = require('react');
const { BrowserRouter, MemoryRouter } = require('react-router-dom');

// Mock BookingPage to stop Jest from importing config.js
jest.mock('../src/BookingPage.jsx', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-booking-page">Booking Page</div>,
}));

// Mock config BEFORE loading anything that imports it
jest.mock('../config', () => ({
  __esModule: true,
  API_BASE_URL: 'http://test-api.local/api',
}), { virtual: true });

// Mock AuthContext
jest.mock('../contexts/AuthContext.jsx', () => ({
  useAuth: jest.fn(),
}));

// Mock ProtectedRoute
jest.mock('../components/ProtectedRoute.jsx', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="protected-route">{children}</div>,
}));

// ✅ Now safely require App after mocks are applied
const App = require('../src/App').default;

// Setup
afterEach(cleanup);
const { useAuth } = require('../contexts/AuthContext.jsx');

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login page when no user is authenticated', () => {
    useAuth.mockReturnValue({ loading: false, user: null });

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText(/EMAIL/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/PASSWORD/i)).toBeInTheDocument();
  });

  it('renders loading state while checking authentication', () => {
    useAuth.mockReturnValue({ loading: true, user: null });

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });

  it('allows access to protected routes when user is authenticated', () => {
    useAuth.mockReturnValue({ loading: false, user: { uid: '123', email: 'test@test.com' } });

    render(
      <MemoryRouter initialEntries={['/booking']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.queryByPlaceholderText(/EMAIL/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('protected-route')).toBeInTheDocument();
  });
});