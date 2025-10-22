// tests/BookingPage.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

// mock the config module before importing the component,
// and do it as a virtual module so Jest doesn't try to parse the real file.
jest.mock('../src/config', () => ({
  __esModule: true,
  API_BASE_URL: 'http://test-api.local/api',
}), { virtual: true });

// Mock react-router-dom navigate
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(() => jest.fn()),
}));

// Mock AuthContext
jest.mock('../contexts/AuthContext.jsx', () => ({
  useAuth: () => ({ user: { uid: 'mock-user', email: 'user@example.com' } }),
}));

// Component under test (after mocks)
import BookingPage from '../src/BookingPage.jsx';

// Clean DOM after each test
afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

// Mock global fetch
global.fetch = jest.fn();

// Silence noisy logs during test runs
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  console.log.mockRestore();
  console.error.mockRestore();
});

describe('BookingPage (booking UI flows)', () => {
  test('renders base UI with logo, logout, and select date button', () => {
    render(<BookingPage />);
    expect(screen.getByAltText(/Terrain Logo/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Select Date/i })).toBeInTheDocument();
  });

  test('shows date input when Select Date button is clicked', () => {
    render(<BookingPage />);
    const dateBtn = screen.getByRole('button', { name: /Select Date/i });
    fireEvent.click(dateBtn);
    expect(screen.getByTestId('date-input')).toBeInTheDocument();
  });

  test('fetches seat availability when a date is selected', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<BookingPage />);
    fireEvent.click(screen.getByRole('button', { name: /Select Date/i }));
    fireEvent.change(screen.getByTestId('date-input'), { target: { value: '2025-09-28' } });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/bookings?date=2025-09-28'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  test('clicking a seat opens the booking modal', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

    render(<BookingPage />);
    fireEvent.click(screen.getByRole('button', { name: /Select Date/i }));
    fireEvent.change(screen.getByTestId('date-input'), { target: { value: '2025-09-28' } });

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('1'));
    await screen.findByText(/New Booking/i);
  });

  test('shows validation error when end time is before start time', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

    render(<BookingPage />);
    fireEvent.click(screen.getByRole('button', { name: /Select Date/i }));
    fireEvent.change(screen.getByTestId('date-input'), { target: { value: '2025-09-28' } });

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('1'));
    await screen.findByText(/New Booking/i);

    fireEvent.change(screen.getByLabelText(/Start Time/i), { target: { value: '10:00' } });
    fireEvent.change(screen.getByLabelText(/End Time/i), { target: { value: '09:00' } });

    fireEvent.click(screen.getByRole('button', { name: /Book Seats/i }));
    expect(await screen.findByText(/End time must be after start time/i)).toBeInTheDocument();
  });

  test('closes modal when Cancel button is clicked', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

    render(<BookingPage />);

    fireEvent.click(screen.getByRole('button', { name: /Select Date/i }));
    fireEvent.change(screen.getByTestId('date-input'), { target: { value: '2025-09-28' } });

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('1'));
    await screen.findByText(/New Booking/i);

    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    await waitFor(() => {
      expect(screen.queryByText(/New Booking/i)).not.toBeInTheDocument();
    });
  });

  test('submits booking and shows success notification', async () => {
    // 1st call: GET /bookings → []
    // 2nd call: POST /booking → { message: 'Success' }
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ message: 'Success' }) });

    render(<BookingPage />);

    fireEvent.click(screen.getByRole('button', { name: /Select Date/i }));
    fireEvent.change(screen.getByTestId('date-input'), { target: { value: '2025-09-28' } });

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('1'));
    await screen.findByText(/New Booking/i);

    fireEvent.change(screen.getByLabelText(/Start Time/i), { target: { value: '09:00' } });
    fireEvent.change(screen.getByLabelText(/End Time/i), { target: { value: '10:00' } });

    fireEvent.click(screen.getByRole('button', { name: /Book Seats/i }));

    await waitFor(() => {
      expect(screen.getByText(/Successfully booked/i)).toBeInTheDocument();
    });
  });
});