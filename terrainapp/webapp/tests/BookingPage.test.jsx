// tests/BookingPage.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

// Mock config
jest.mock('../src/config', () => ({
  __esModule: true,
  API_BASE_URL: 'http://test-api.local/api',
}));

// Mock CalendarDatePicker (component imports './CalendarDatePicker')
jest.mock('../src/CalendarDatePicker', () => ({
  __esModule: true,
  default: ({ selectedDate, onDateSelect }) => (
    <input
      data-testid="date-input"
      type="date"
      value={selectedDate}
      onChange={(e) => onDateSelect(e.target.value)}
    />
  ),
}));

// Mock bookingService — define fns INSIDE the factory (no out-of-scope refs)
jest.mock('../src/services/bookingService', () => {
  const mockGetBookingsByDate = jest.fn();
  const mockGenerateICSFile = jest.fn();
  return {
    __esModule: true,
    bookingService: {
      getBookingsByDate: mockGetBookingsByDate,
      generateICSFile: mockGenerateICSFile,
    },
  };
});

// Mock Firebase (Auth)
jest.mock('../firebase.js', () => ({
  auth: {
    currentUser: { uid: 'mock-user', email: 'user@example.com' },
    signOut: jest.fn(),
  },
  db: {},
}));

// Mock react-router-dom navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock AuthContext
jest.mock('../contexts/AuthContext.jsx', () => ({
  useAuth: () => ({ user: { uid: 'mock-user', email: 'user@example.com' } }),
}));

// Import the mocked bookingService so we can set returns/assert calls
import { bookingService } from '../src/services/bookingService';
// Component under test
import BookingPage from '../src/BookingPage.jsx';

// Clean DOM after each test
afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

// Mock global fetch for POST /booking
global.fetch = jest.fn();

// Quiet console during tests
let logSpy, errSpy;
beforeAll(() => {
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  logSpy.mockRestore();
  errSpy.mockRestore();
});

describe('BookingPage (booking UI flows)', () => {
  test('renders base UI with logo, logout, and select date button', () => {
    render(<BookingPage />);
    expect(screen.getByAltText(/Terrain Logo/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Select.*Date/i })).toBeInTheDocument();
  });

  test('shows date input when Select Date button is clicked', () => {
    render(<BookingPage />);
    const dateBtn = screen.getByRole('button', { name: /Select.*Date/i });
    fireEvent.click(dateBtn);
    expect(screen.getByTestId('date-input')).toBeInTheDocument();
  });

  test('requests seat availability via bookingService when a date is selected', async () => {
    bookingService.getBookingsByDate.mockResolvedValueOnce([]); // no bookings

    render(<BookingPage />);
    fireEvent.click(screen.getByRole('button', { name: /Select.*Date/i }));
    fireEvent.change(screen.getByTestId('date-input'), { target: { value: '2025-09-28' } });

    await waitFor(() => {
      expect(bookingService.getBookingsByDate).toHaveBeenCalledTimes(1);
      expect(bookingService.getBookingsByDate).toHaveBeenCalledWith('2025-09-28T00:00:00.000Z');
    });
  });

  test('clicking a seat opens the booking modal', async () => {
    bookingService.getBookingsByDate.mockResolvedValueOnce([]); // all seats available

    render(<BookingPage />);
    fireEvent.click(screen.getByRole('button', { name: /Select.*Date/i }));
    fireEvent.change(screen.getByTestId('date-input'), { target: { value: '2025-09-28' } });

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('1'));
    expect(await screen.findByText(/New Booking/i)).toBeInTheDocument();
  });

  test('closes modal when Cancel button is clicked', async () => {
    bookingService.getBookingsByDate.mockResolvedValueOnce([]);

    render(<BookingPage />);
    fireEvent.click(screen.getByRole('button', { name: /Select.*Date/i }));
    fireEvent.change(screen.getByTestId('date-input'), { target: { value: '2025-09-28' } });

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('1'));
    expect(await screen.findByText(/New Booking/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    await waitFor(() => {
      expect(screen.queryByText(/New Booking/i)).not.toBeInTheDocument();
    });
  });

  test('submits booking and shows success notification', async () => {
    // Availability call
    bookingService.getBookingsByDate.mockResolvedValueOnce([]);

    // POST /booking
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Success' }),
      text: async () => 'Success',
    });

    render(<BookingPage />);
    fireEvent.click(screen.getByRole('button', { name: /Select.*Date/i }));
    fireEvent.change(screen.getByTestId('date-input'), { target: { value: '2025-09-28' } });

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('1')); // select seat → opens modal
    expect(await screen.findByText(/New Booking/i)).toBeInTheDocument();

    // Click "Book" (no time fields in current UI)
    fireEvent.click(screen.getByRole('button', { name: /^Book$/i }));

    await waitFor(() => {
      expect(screen.getByText(/Successfully booked/i)).toBeInTheDocument();
    });

    // Ensure a single POST was made
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toMatch(/\/booking$/);
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body);
    expect(body).toEqual(
      expect.objectContaining({
        deskId: 1,
        userId: 'mock-user',
        dateTimestamp: expect.any(String),
      })
    );
  });
});