import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';

// Mock the AuthContext used by ProtectedRoute
jest.mock('../contexts/AuthContext.jsx', () => ({
  useAuth: jest.fn(),
}));

import { useAuth } from '../contexts/AuthContext.jsx';

describe('ProtectedRoute (JSX)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows "Loading..." initially', () => {
    // Simulate loading state
    useAuth.mockReturnValue({ user: null, loading: true });

    render(
      <MemoryRouter>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });

  it('redirects unauthenticated users to "/login"', async () => {
    useAuth.mockReturnValue({ user: null, loading: false });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/Login Page/i)).toBeInTheDocument()
    );
  });

  it('renders children when authenticated', async () => {
    useAuth.mockReturnValue({
      user: { uid: '123', email: 'test@example.com' },
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/Protected Content/i)).toBeInTheDocument()
    );
  });
});