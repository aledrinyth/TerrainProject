// tests/CustomerBookingPOV.test.jsx
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// --- Mocks ---
// NOTE: paths here must mirror how the component imports them (component is at src/CustomerBookingPOV.jsx)
jest.mock('../contexts/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: { displayName: 'alice' },
    signout: jest.fn().mockResolvedValue(),
  }),
}));

jest.mock('../src/services/bookingService', () => ({
  bookingService: {
    getBookingsByName: jest.fn(),
    cancelBooking: jest.fn(),
  },
}));

// Mock react-router-dom only for useNavigate; keep everything else real
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => jest.fn(),
  };
});

import { MemoryRouter } from 'react-router-dom';
import CustomerBookingPOV from '../src/CustomerBookingPOV';
import { bookingService } from '../src/services/bookingService';

function renderView() {
  return render(
    <MemoryRouter>
      <CustomerBookingPOV />
    </MemoryRouter>
  );
}

describe('CustomerBookingPOV', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows loading then renders bookings sorted by createdAt desc', async () => {
    bookingService.getBookingsByName.mockResolvedValue({
      bookings: [
        {
          id: 'b1',
          startTimestamp: '2025-10-21T09:00:00+11:00',
          endTimestamp: '2025-10-21T11:00:00+11:00',
          deskId: 'D-1',
          status: 'active',
          createdAt: '2025-10-20T10:00:00+11:00',
        },
        {
          id: 'b2',
          startTimestamp: '2025-10-22T13:00:00+11:00',
          endTimestamp: '2025-10-22T14:00:00+11:00',
          deskId: 'D-2',
          status: 'active',
          createdAt: '2025-10-21T10:00:00+11:00', // newer, should appear first
        },
      ],
    });

    renderView();

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();

    // Wait for table rows to render
    const rows = await screen.findAllByRole('row');
    // rows[0] = header; rows[1] should be newest (b2 with D-2)
    const firstDataRow = rows[1];
    expect(within(firstDataRow).getByText(/D-2/)).toBeInTheDocument();
  });

  test('filters out cancelled bookings', async () => {
    bookingService.getBookingsByName.mockResolvedValue({
      bookings: [
        {
          id: 'b1',
          startTimestamp: '2025-10-21T09:00:00+11:00',
          endTimestamp: '2025-10-21T10:00:00+11:00',
          deskId: 'D-1',
          status: 'active',
          createdAt: '2025-10-20T10:00:00+11:00',
        },
        {
          id: 'b2',
          startTimestamp: '2025-10-22T09:00:00+11:00',
          endTimestamp: '2025-10-22T10:00:00+11:00',
          deskId: 'D-2',
          status: 'cancelled',
          createdAt: '2025-10-19T10:00:00+11:00',
        },
      ],
    });

    renderView();

    const table = await screen.findByRole('table');
    // Cancelled booking D-2 should not be present
    expect(within(table).queryByText('D-2')).not.toBeInTheDocument();
    expect(within(table).getByText('D-1')).toBeInTheDocument();
  });

  test('empty state on 404-like error string', async () => {
    bookingService.getBookingsByName.mockRejectedValue(new Error('404 Not Found'));

    renderView();

    expect(await screen.findByText(/No bookings found/i)).toBeInTheDocument();
  });

  test('shows error message on non-404 error', async () => {
    bookingService.getBookingsByName.mockRejectedValue(new Error('500'));

    renderView();

    expect(await screen.findByText(/Failed to fetch bookings/i)).toBeInTheDocument();
  });

  test('cancel flow: opens modal, confirms, calls cancelBooking and refreshes list', async () => {
    const user = userEvent.setup();

    // Initial fetch: one active booking
    bookingService.getBookingsByName
      .mockResolvedValueOnce({
        bookings: [
          {
            id: 'b1',
            startTimestamp: '2025-10-21T09:00:00+11:00',
            endTimestamp: '2025-10-21T10:00:00+11:00',
            deskId: 'D-1',
            status: 'active',
            createdAt: '2025-10-20T10:00:00+11:00',
          },
        ],
      })
      // After cancellation, return empty list
      .mockResolvedValueOnce({ bookings: [] });

    bookingService.cancelBooking.mockResolvedValue({ ok: true });

    renderView();

    // Open confirm modal
    const cancelBtn = await screen.findByRole('button', { name: /cancel/i });
    await user.click(cancelBtn);

    // Confirm in modal
    const modalConfirm = await screen.findByRole('button', { name: /^confirm$/i });
    await user.click(modalConfirm);

    await waitFor(() =>
      expect(bookingService.cancelBooking).toHaveBeenCalledWith('b1', 'Cancelled by user')
    );

    // After refetch the list should be empty
    expect(await screen.findByText(/No bookings found/i)).toBeInTheDocument();
  });
});