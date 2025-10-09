import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import BookingPage from '../src/BookingPage';

// Clean DOM after each test
afterEach(cleanup);

// Mock dependencies
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(() => jest.fn()),
}));
jest.mock('../contexts/AuthContext.jsx', () => ({
  useAuth: () => ({ user: { uid: 'mock-user' } }),
}));

// Mock global fetch
global.fetch = jest.fn();

describe('BookingPage (booking UI flows)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Silence noisy console.log and console.error
  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterAll(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  // 1. Base rendering
  test('renders base UI with logo, logout, and select date button', () => {
    render(<BookingPage />);
    expect(screen.getByAltText(/Terrain Logo/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Select Date/i })).toBeInTheDocument();
  });

  // 2. Date picker toggles open
  test('shows date input when Select Date button is clicked', () => {
    render(<BookingPage />);
    const dateBtn = screen.getByRole('button', { name: /Select Date/i });
    fireEvent.click(dateBtn);
    expect(screen.getByTestId('date-input')).toBeInTheDocument();
  });

  // 3. Fetches seat availability
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
        expect.any(Object)
      );
    });
  });

  // 4. Clicking a seat opens booking modal
  test('clicking a seat opens the booking modal', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<BookingPage />);

    // Select date → triggers loading
    fireEvent.click(screen.getByRole('button', { name: /Select Date/i }));
    fireEvent.change(screen.getByTestId('date-input'), { target: { value: '2025-09-28' } });

    // Wait for seat numbers to appear
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    // Click seat → open modal
    const seat1 = screen.getByText('1');
    fireEvent.click(seat1);

    // Verify modal open
    await screen.findByText(/New Booking/i);
  });

  // 5. Modal validation test - end time before start time
  test('shows validation error when end time is before start time', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<BookingPage />);

    // Select date
    fireEvent.click(screen.getByRole('button', { name: /Select Date/i }));
    fireEvent.change(screen.getByTestId('date-input'), { target: { value: '2025-09-28' } });

    // Wait for seats to appear
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    // Click seat → open modal
    const seat1 = screen.getByText('1');
    fireEvent.click(seat1);
    await screen.findByText(/New Booking/i);

    // Fill times with end before start
    fireEvent.change(screen.getByLabelText(/Start Time/i), { target: { value: '10:00' } });
    fireEvent.change(screen.getByLabelText(/End Time/i), { target: { value: '09:00' } });

    // Try submit
    const bookBtn = screen.getByRole('button', { name: /Book Seats/i });
    fireEvent.click(bookBtn);

    // Expect validation error
    expect(await screen.findByText(/End time must be after start time/i)).toBeInTheDocument();
  });

  // 6. Modal cancel button closes modal
  test('closes modal when Cancel button is clicked', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<BookingPage />);

    // Select date
    fireEvent.click(screen.getByRole('button', { name: /Select Date/i }));
    fireEvent.change(screen.getByTestId('date-input'), { target: { value: '2025-09-28' } });

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('1'));
    await screen.findByText(/New Booking/i);

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByText(/New Booking/i)).not.toBeInTheDocument();
    });
  });

  // 7. Successful booking flow
  test('submits booking and shows success notification', async () => {
    // 1st call: GET /bookings → []
    // 2nd call: POST /booking → { message: 'Success' }
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ message: 'Success' }) });

    render(<BookingPage />);

    // Select date
    fireEvent.click(screen.getByRole('button', { name: /Select Date/i }));
    fireEvent.change(screen.getByTestId('date-input'), { target: { value: '2025-09-28' } });

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    // Click seat → open modal
    fireEvent.click(screen.getByText('1'));
    await screen.findByText(/New Booking/i);

    // Fill times
    fireEvent.change(screen.getByLabelText(/Start Time/i), { target: { value: '09:00' } });
    fireEvent.change(screen.getByLabelText(/End Time/i), { target: { value: '10:00' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Book Seats/i }));

    // Expect success notification
    await waitFor(() => {
      expect(screen.getByText(/Successfully booked/i)).toBeInTheDocument();
    });
  });
});