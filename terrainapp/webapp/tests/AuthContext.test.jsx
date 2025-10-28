import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { ProvideAuth, useAuth } from '../contexts/AuthContext';
import { onAuthStateChanged, getIdTokenResult } from 'firebase/auth';

// Mock your firebase singleton so `auth` exists
jest.mock('../firebase', () => ({ auth: {} }));

// Mock Firebase Auth SDK pieces used by the hook
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  getIdTokenResult: jest.fn(),
}));

// A tiny consumer to read and display context values
function AuthProbe() {
  const { user, isAdmin, loading } = useAuth();
  return (
    <div>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="isAdmin">{String(isAdmin)}</div>
      <div data-testid="user">{user ? user.email : 'null'}</div>
    </div>
  );
}

const renderWithProvider = () =>
  render(
    <ProvideAuth>
      <AuthProbe />
    </ProvideAuth>
  );

afterEach(() => {
  jest.clearAllMocks();
  cleanup();
});

test('shows loading initially (before auth callback resolves)', () => {
  // return an unsubscribe fn
  onAuthStateChanged.mockImplementation((_auth, _cb) => {
    return jest.fn(); // unsubscribe
  });

  renderWithProvider();

  expect(screen.getByTestId('loading').textContent).toBe('true');
  expect(screen.getByTestId('user').textContent).toBe('null');
  expect(screen.getByTestId('isAdmin').textContent).toBe('false');
});

test('signed-in user with admin=true', async () => {
  const fakeUser = { uid: 'u1', email: 'admin@example.com' };
  onAuthStateChanged.mockImplementation((_auth, cb) => {
    cb(fakeUser);
    return jest.fn(); // unsubscribe
  });

  getIdTokenResult.mockResolvedValue({ claims: { admin: true } });

  renderWithProvider();

  await waitFor(() => {
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  expect(screen.getByTestId('user').textContent).toBe('admin@example.com');
  expect(screen.getByTestId('isAdmin').textContent).toBe('true');
});

test('signed-in user with admin=false', async () => {
  const fakeUser = { uid: 'u2', email: 'user@example.com' };
  onAuthStateChanged.mockImplementation((_auth, cb) => {
    cb(fakeUser);
    return jest.fn();
  });

  getIdTokenResult.mockResolvedValue({ claims: { admin: false } });

  renderWithProvider();

  await waitFor(() => {
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  expect(screen.getByTestId('user').textContent).toBe('user@example.com');
  expect(screen.getByTestId('isAdmin').textContent).toBe('false');
});

test('signed-out user', async () => {
  onAuthStateChanged.mockImplementation((_auth, cb) => {
    cb(null); // signed out
    return jest.fn();
  });

  // If called, keep safe
  getIdTokenResult.mockResolvedValue({ claims: {} });

  renderWithProvider();

  await waitFor(() => {
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  expect(screen.getByTestId('user').textContent).toBe('null');
  expect(screen.getByTestId('isAdmin').textContent).toBe('false');
});

test('unsubscribes on unmount', () => {
  const unsubscribe = jest.fn();
  onAuthStateChanged.mockImplementation((_auth, _cb) => unsubscribe);

  const { unmount } = renderWithProvider();
  unmount();

  expect(unsubscribe).toHaveBeenCalledTimes(1);
});