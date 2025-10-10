import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import App from '../src/App';

// Clean up after each test
afterEach(cleanup);

// Create a function that returns the current mock state
const mockUseAuth = jest.fn();

jest.mock('../contexts/AuthContext.jsx', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock ProtectedRoute
jest.mock('../components/ProtectedRoute.jsx', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="protected-route">{children}</div>,
}));

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login page when no user is authenticated', () => {
    mockUseAuth.mockReturnValue({ loading: false, user: null });
    
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    // Should show login page
    expect(screen.getByPlaceholderText(/EMAIL/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/PASSWORD/i)).toBeInTheDocument();
  });

  it('renders loading state while checking authentication', () => {
    mockUseAuth.mockReturnValue({ loading: true, user: null });
    
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/EMAIL/i)).not.toBeInTheDocument();
  });

  it('allows access to protected routes when user is authenticated', () => {
    mockUseAuth.mockReturnValue({ loading: false, user: { uid: '123', email: 'test@test.com' } });
    
    // Use MemoryRouter to start at /booking route
    render(
      <MemoryRouter initialEntries={['/booking']}>
        <App />
      </MemoryRouter>
    );
    
    // Should not show login form when authenticated and on protected route
    expect(screen.queryByPlaceholderText(/EMAIL/i)).not.toBeInTheDocument();
    
    // Should have access to protected route wrapper
    expect(screen.getByTestId('protected-route')).toBeInTheDocument();
  });
});