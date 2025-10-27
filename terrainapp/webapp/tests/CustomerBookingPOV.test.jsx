// tests/CustomerBookingPOV.test.jsx
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// --- Mocks (paths must mirror the component's imports) ---
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

// Mock react-router-dom only for useNavigate and keep everything else real
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => jest.fn(),
  };
});

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

  test('shows loading then renders bookings (first row is the first item returned)', async () => {
    // Put D-2 FIRST and include dateTimestamp (the component displays this)
    bookingService.getBookingsByName.mockResolvedValue({
      bookings: [
        {
          id: 'b2',
          deskId: 'D-2',
          status: 'active',
          dateTimestamp: '2025-10-22T00:00:00.000Z',
          createdAt: '2025-10-21T10:00:00+11:00',
        },
        {
          id: 'b1',
          deskId: 'D-1',
          status: 'active',
          dateTimestamp: '2025-10-21T00:00:00.000Z',
          createdAt: '2025-10-20T10:00:00+11:00',
        },
      ],
    });

    renderView();

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();

    const rows = await screen.findAllByRole('row');
    // rows[0] header; rows[1] first booking row should contain D-2
    const firstDataRow = rows[1];
    expect(within(firstDataRow).getByText('D-2')).toBeInTheDocument();
  });

  test('filters out cancelled bookings', async () => {
    bookingService.getBookingsByName.mockResolvedValue({
      bookings: [
        {
          id: 'b1',
          deskId: 'D-1',
          status: 'active',
          dateTimestamp: '2025-10-21T00:00:00.000Z',
          createdAt: '2025-10-20T10:00:00+11:00',
        },
        {
          id: 'b2',
          deskId: 'D-2',
          status: 'cancelled',
          dateTimestamp: '2025-10-22T00:00:00.000Z',
          createdAt: '2025-10-19T10:00:00+11:00',
        },
      ],
    });

    renderView();

    const table = await screen.findByRole('table');
    expect(within(table).queryByText('D-2')).not.toBeInTheDocument(); // filtered out
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

    // Initial fetch: one active booking, then after cancel to empty list
    bookingService.getBookingsByName
      .mockResolvedValueOnce({
        bookings: [
          {
            id: 'b1',
            deskId: 'D-1',
            status: 'active',
            dateTimestamp: '2025-10-21T00:00:00.000Z',
            createdAt: '2025-10-20T10:00:00+11:00',
          },
        ],
      })
      .mockResolvedValueOnce({ bookings: [] });

    bookingService.cancelBooking.mockResolvedValue({ ok: true });

    renderView();

    const cancelBtn = await screen.findByRole('button', { name: /cancel/i });
    await user.click(cancelBtn);

    const modalConfirm = await screen.findByRole('button', { name: /^confirm$/i });
    await user.click(modalConfirm);

    await waitFor(() =>
      expect(bookingService.cancelBooking).toHaveBeenCalledWith('b1', 'Cancelled by user')
    );

    expect(await screen.findByText(/No bookings found/i)).toBeInTheDocument();
  });
});