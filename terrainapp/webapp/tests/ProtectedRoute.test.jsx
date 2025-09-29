import React from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

describe('ProtectedRoute (JSX)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows "Loading..." initially', () => {
    onAuthStateChanged.mockImplementation(() => () => {});
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });

  it('redirects unauthenticated users to "/"', async () => {
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null); // no user
      return () => {};
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Protected Content/i)).toBeNull();
    });
  });

  it('renders children when authenticated', async () => {
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback({ uid: '123', email: 'test@example.com' }); // mock user
      return () => {};
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Protected Content/i)).toBeInTheDocument();
    });
  });
});