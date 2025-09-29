import React from 'react';
import { render, screen, within } from '@testing-library/react';
import AdminPage from '../src/AdminPage'; // adjust path if needed

describe('AdminPage (no source changes)', () => {
  test('renders table, sorts rows by createdAt desc, and shows correct durations', () => {
    render(<AdminPage />);

    // Title present
    expect(screen.getByText(/Admin: Current Bookings/i)).toBeInTheDocument();

    // ✅ Get only the body rows (ignore thead)
    const table = screen.getByRole('table');
    const rows = within(table)
      .getAllByRole('row')
      .filter(r => r.closest('tbody'));
    expect(rows).toHaveLength(3);

    // Column order:
    // [0] Booking ID, [1] User ID, [2] Desk, [3] Seat,
    // [4] Start, [5] End, [6] Duration, [7] Booked At

    // Assert sort order by createdAt desc -> IDs should be 2, 1, 3
    const idsInOrder = rows.map(r =>
      within(r).getAllByRole('cell')[0].textContent.trim()
    );
    expect(idsInOrder).toEqual(['2', '1', '3']);

    const getCells = (row) => within(row).getAllByRole('cell');

    // Row 0 -> id 2: 10:00–13:00 -> 3h
    const row0 = getCells(rows[0]);
    expect(row0[4]).toHaveTextContent('10:00');
    expect(row0[5]).toHaveTextContent('13:00');
    expect(row0[6]).toHaveTextContent('3h');

    // Row 1 -> id 1: 09:00–11:00 -> 2h
    const row1 = getCells(rows[1]);
    expect(row1[4]).toHaveTextContent('09:00');
    expect(row1[5]).toHaveTextContent('11:00');
    expect(row1[6]).toHaveTextContent('2h');

    // Row 2 -> id 3: 08:00–10:00 -> 2h
    const row2 = getCells(rows[2]);
    expect(row2[4]).toHaveTextContent('08:00');
    expect(row2[5]).toHaveTextContent('10:00');
    expect(row2[6]).toHaveTextContent('2h');
  });
});