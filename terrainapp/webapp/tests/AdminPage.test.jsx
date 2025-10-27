// tests/AdminPage.test.jsx
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock bookingService (functions defined inside factory)
jest.mock('../src/services/bookingService', () => {
  const mockGetAllBookings = jest.fn();
  const mockCancelBooking = jest.fn();
  return {
    __esModule: true,
    bookingService: {
      getAllBookings: mockGetAllBookings,
      cancelBooking: mockCancelBooking,
    },
  };
});

// mock the SAME module ID used by AdminPage.jsx
// AdminPage imports: ../contexts/AuthContext.jsx (one level above src)
jest.mock('../contexts/AuthContext.jsx', () => ({
  useAuth: () => ({ signout: jest.fn() }),
}));

// Keep test output clean
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Error fetching bookings')) return;
    originalError(...args);
  };
});
afterAll(() => {
  console.error = originalError;
});

// Import after mocks
import AdminPage from '../src/AdminPage.jsx';
import { bookingService } from '../src/services/bookingService';

const renderWithRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('AdminPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders table, sorts by dateTimestamp desc, and shows correct data', async () => {
    // Sorted newest to oldest by dateTimestamp
    const mockBookings = {
      bookings: [
        {
          id: '2',
          name: 'Bob',
          deskId: 2,
          dateTimestamp: '2025-09-30T00:00:00.000Z', // newest
          createdAt: '2025-09-28T12:00:00.000Z',
          status: 'active',
        },
        {
          id: '1',
          name: 'Alice',
          deskId: 1,
          dateTimestamp: '2025-09-29T00:00:00.000Z',
          createdAt: '2025-09-27T09:00:00.000Z',
          status: 'active',
        },
        {
          id: '3',
          name: 'Charlie',
          deskId: 3,
          dateTimestamp: '2025-09-28T00:00:00.000Z', // oldest
          createdAt: '2025-09-26T08:00:00.000Z',
          status: 'cancelled',
        },
      ],
    };
    bookingService.getAllBookings.mockResolvedValueOnce(mockBookings);

    renderWithRouter(<AdminPage />);

    // Wait for tbody rows to appear
    await waitFor(() => {
      const bodyRows = screen
        .getAllByRole('row')
        .filter((r) => r.closest('tbody') && !r.textContent.includes('No bookings'));
      expect(bodyRows.length).toBe(3);
    });

    const table = screen.getByRole('table');
    const rows = within(table)
      .getAllByRole('row')
      .filter((r) => r.closest('tbody') && !r.textContent.includes('No bookings'));

    // Order by dateTimestamp DESC → Bob, Alice, Charlie
    const namesInOrder = rows.map((r) => within(r).getAllByRole('cell')[0].textContent.trim());
    expect(namesInOrder).toEqual(['Bob', 'Alice', 'Charlie']);

    // Columns: [0] Name, [1] Seat, [2] Date Of Booking, [3] Booked At, [4] Status, [5] Action
    const bobCells = within(rows[0]).getAllByRole('cell');
    expect(bobCells[0]).toHaveTextContent('Bob');
    expect(bobCells[1]).toHaveTextContent('2');
    expect(bobCells[4]).toHaveTextContent(/active/i);

    const charlieCells = within(rows[2]).getAllByRole('cell');
    expect(charlieCells[4]).toHaveTextContent(/cancelled/i);
  });

  test('shows an error banner when API fails', async () => {
    bookingService.getAllBookings.mockRejectedValueOnce(new Error('API failure'));
    renderWithRouter(<AdminPage />);

    const err = await screen.findByText(/Failed to fetch bookings\. Please try again later\./i);
    expect(err).toBeInTheDocument();
  });

  test('shows "No bookings found." when API succeeds with empty list', async () => {
    bookingService.getAllBookings.mockResolvedValueOnce({ bookings: [] });
    renderWithRouter(<AdminPage />);

    const msg = await screen.findByText(/No bookings found\./i);
    expect(msg).toBeInTheDocument();
  });
});