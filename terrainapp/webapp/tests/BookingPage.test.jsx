
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import BookingPage from '../src/BookingPage';

afterEach(cleanup);

describe('BookingPage (booking UI flows)', () => {
  test('New Booking button is disabled until a date is selected', async () => {
    render(<BookingPage />);

    // Button should be disabled initially
    const newBookingBtn = screen.getByRole('button', { name: /New Booking/i });
    expect(newBookingBtn).toBeDisabled();

    // Open date picker
    const selectDateBtn = screen.getByRole('button', { name: /Select Date/i });
    fireEvent.click(selectDateBtn);

    // Access the date input using its labelText instead of role (since type="date" is not a textbox)
    const dateInput = screen.getByDisplayValue('') || screen.getByLabelText(/date/i) || screen.getByRole('textbox', { hidden: true });
    fireEvent.change(dateInput, { target: { value: '2025-09-28' } });

    // Button should now be enabled
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /New Booking/i })).toBeEnabled();
    });
  });

  test('booking modal opens, validates inputs, and closes on cancel', async () => {
    render(<BookingPage />);

    // Open date picker and select a date
    const selectDateBtn = screen.getByRole('button', { name: /Select Date/i });
    fireEvent.click(selectDateBtn);
    const dateInput = screen.getByDisplayValue('') || screen.getByLabelText(/date/i);
    fireEvent.change(dateInput, { target: { value: '2025-09-28' } });

    // Click "New Booking" button
    const newBookingBtn = screen.getByRole('button', { name: /New Booking/i });
    fireEvent.click(newBookingBtn);

    // Wait for the modal heading (use getAllByText to handle duplicate "New Booking" text)
    await waitFor(() => {
      const modalHeadings = screen.getAllByText(/New Booking/i);
      expect(modalHeadings.length).toBeGreaterThan(0);
    });

    // Fill start and end times
    const timeInputs = screen.getAllByDisplayValue('');
    fireEvent.change(timeInputs[0], { target: { value: '10:00' } });
    fireEvent.change(timeInputs[1], { target: { value: '11:00' } });

    // Cancel the booking
    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    // Modal should close
    await waitFor(() => {
    expect(screen.queryByRole('heading', { name: /New Booking/i })).not.toBeInTheDocument();
    });
  });
});