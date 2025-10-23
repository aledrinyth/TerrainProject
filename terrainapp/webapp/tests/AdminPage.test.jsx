import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import AdminPage from '../src/AdminPage';

// 🧩 Mock bookingService
jest.mock('../src/services/bookingService', () => ({
  bookingService: {
    getAllBookings: jest.fn(),
  },
}));

// 🧹 Silence console.error for API errors
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

describe('AdminPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ✅ Test 1: Successful fetch → table rendered and sorted
  test('renders table, sorts rows by createdAt desc, and shows correct data', async () => {
    const mockBookings = {
      bookings: [
        {
          id: '1',
          name: 'Alice',
          deskId: 'Desk 1',
          startTimestamp: '2025-09-28T09:00:00',
          endTimestamp: '2025-09-28T11:00:00',
          createdAt: '2025-09-27T09:00:00',
        },
        {
          id: '2',
          name: 'Bob',
          deskId: 'Desk 2',
          startTimestamp: '2025-09-28T10:00:00',
          endTimestamp: '2025-09-28T13:00:00',
          createdAt: '2025-09-28T12:00:00', // newest
        },
        {
          id: '3',
          name: 'Charlie',
          deskId: 'Desk 3',
          startTimestamp: '2025-09-28T08:00:00',
          endTimestamp: '2025-09-28T10:00:00',
          createdAt: '2025-09-26T08:00:00', // oldest
        },
      ],
    };

    const { bookingService } = require('../src/services/bookingService');
    bookingService.getAllBookings.mockResolvedValueOnce(mockBookings);

    render(<AdminPage />);

    // Wait for rows to render
    await waitFor(() => {
      const rows = screen
        .getAllByRole('row')
        .filter((r) => r.closest('tbody') && !r.textContent.includes('No bookings'));
      expect(rows.length).toBeGreaterThan(0);
    });

    const table = screen.getByRole('table');
    const rows = within(table)
      .getAllByRole('row')
      .filter((r) => r.closest('tbody') && !r.textContent.includes('No bookings'));

    expect(rows).toHaveLength(3);

    // Sorted by createdAt DESC → [2, 1, 3]
    const idsInOrder = rows.map((r) => within(r).getAllByRole('cell')[0].textContent.trim());
    expect(idsInOrder).toEqual(['2', '1', '3']);

    // Check start/end/date cells
    const getCells = (row) => within(row).getAllByRole('cell');
    const [row0, row1, row2] = rows.map(getCells);

    // Row 0 (Bob)
    expect(row0[3]).toHaveTextContent('10:00');
    expect(row0[4]).toHaveTextContent('13:00');
    expect(row0[5]).toHaveTextContent('28/09/2025'); // Date Of Booking

    // Row 1 (Alice)
    expect(row1[3]).toHaveTextContent('09:00');
    expect(row1[4]).toHaveTextContent('11:00');
    expect(row1[5]).toHaveTextContent('28/09/2025'); // Date Of Booking

    // Row 2 (Charlie)
    expect(row2[3]).toHaveTextContent('08:00');
    expect(row2[4]).toHaveTextContent('10:00');
    expect(row2[5]).toHaveTextContent('28/09/2025'); // Date Of Booking
  });

  // ✅ Test 2: API fails → fallback message
  test('shows "No bookings found." when API fails', async () => {
    const { bookingService } = require('../src/services/bookingService');
    bookingService.getAllBookings.mockRejectedValueOnce(new Error('API failure'));

    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText(/No bookings found/i)).toBeInTheDocument();
    });
  });

  // ✅ Test 3: No data returned → fallback message
  test('shows "No bookings found." when no data is returned', async () => {
    const { bookingService } = require('../src/services/bookingService');
    bookingService.getAllBookings.mockResolvedValueOnce({ bookings: [] });

    render(<AdminPage />);

    const noBookingsMsg = await screen.findByText(/No bookings found/i);
    expect(noBookingsMsg).toBeInTheDocument();
  });
});