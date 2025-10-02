import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../src/Login';
import { signInWithEmailAndPassword, getIdTokenResult } from 'firebase/auth';

jest.mock('../firebase', () => ({
  auth: {},
}));

// Mock Firebase auth methods
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  getIdTokenResult: jest.fn(),
}));

// Mock navigate function from react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

afterEach(() => {
  jest.clearAllMocks();
  cleanup();
});

describe('Login Page UI & Logic', () => {
  test('renders logo, input fields, and button', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(screen.getByAltText(/Terrain Logo/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/EMAIL/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/PASSWORD/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ENTER/i })).toBeInTheDocument();
  });

  test('submits login form and navigates to admin if claim is true', async () => {
    // Mock Firebase return values
    signInWithEmailAndPassword.mockResolvedValue({
      user: { email: 'admin@test.com' },
    });
    getIdTokenResult.mockResolvedValue({
      claims: { admin: true },
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/EMAIL/i), {
      target: { value: 'admin@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/PASSWORD/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /ENTER/i }));

    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'admin@test.com',
        'password123'
      );
      expect(getIdTokenResult).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });
  });

  test('submits login form and navigates to booking if not admin', async () => {
    signInWithEmailAndPassword.mockResolvedValue({
      user: { email: 'user@test.com' },
    });
    getIdTokenResult.mockResolvedValue({
      claims: { admin: false },
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/EMAIL/i), {
      target: { value: 'user@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/PASSWORD/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /ENTER/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/booking');
    });
  });

  test('handles login errors gracefully', async () => {
    signInWithEmailAndPassword.mockRejectedValue(new Error('Invalid credentials'));

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/EMAIL/i), {
      target: { value: 'wrong@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/PASSWORD/i), {
      target: { value: 'wrongpass' },
    });

    fireEvent.click(screen.getByRole('button', { name: /ENTER/i }));

    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});