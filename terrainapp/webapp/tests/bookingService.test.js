// tests/bookingService.test.js
import { bookingService } from '../src/services/bookingService';
import { apiRequest } from '../src/services/api';

// Mock the api module
jest.mock('../src/services/api');

describe('bookingService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createBooking', () => {
    test('calls apiRequest with correct endpoint and POST method', async () => {
      const bookingData = {
        name: 'John Doe',
        deskId: 5,
        startTime: '09:00',
        endTime: '17:00'
      };
      
      apiRequest.mockResolvedValue({ id: 1, ...bookingData });

      await bookingService.createBooking(bookingData);

      expect(apiRequest).toHaveBeenCalledWith('/booking', {
        method: 'POST',
        body: JSON.stringify(bookingData)
      });
      expect(apiRequest).toHaveBeenCalledTimes(1);
    });

    test('returns the response from apiRequest', async () => {
      const mockResponse = { id: 123, status: 'confirmed' };
      apiRequest.mockResolvedValue(mockResponse);

      const result = await bookingService.createBooking({});

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getBookingById', () => {
    test('calls apiRequest with correct endpoint and booking ID', async () => {
      const bookingId = 42;
      apiRequest.mockResolvedValue({ id: bookingId, name: 'Test' });

      await bookingService.getBookingById(bookingId);

      expect(apiRequest).toHaveBeenCalledWith('/booking/42');
      expect(apiRequest).toHaveBeenCalledTimes(1);
    });

    test('returns the booking data from apiRequest', async () => {
      const mockBooking = { id: 42, name: 'Jane Doe', deskId: 10 };
      apiRequest.mockResolvedValue(mockBooking);

      const result = await bookingService.getBookingById(42);

      expect(result).toEqual(mockBooking);
    });
  });

  describe('getBookingsByName', () => {
    test('calls apiRequest with correct endpoint and name parameter', async () => {
      const name = 'John Doe';
      apiRequest.mockResolvedValue([{ id: 1, name }]);

      await bookingService.getBookingsByName(name);

      expect(apiRequest).toHaveBeenCalledWith('/booking/name/John Doe');
      expect(apiRequest).toHaveBeenCalledTimes(1);
    });

    test('handles names with spaces correctly', async () => {
      apiRequest.mockResolvedValue([]);

      await bookingService.getBookingsByName('Mary Jane Watson');

      expect(apiRequest).toHaveBeenCalledWith('/booking/name/Mary Jane Watson');
    });
  });

  describe('getBookingByStartTimestamp', () => {
    test('constructs query parameters correctly', async () => {
      const startTimestamp = '2025-10-22T09:00:00Z';
      const deskId = 123;
      apiRequest.mockResolvedValue([]);

      await bookingService.getBookingByStartTimestamp(startTimestamp, deskId);

      expect(apiRequest).toHaveBeenCalledWith(
        '/booking/by-start-time?startTimestamp=2025-10-22T09%3A00%3A00Z&deskId=123'
      );
    });

    test('properly encodes special characters in timestamp', async () => {
      const startTimestamp = '2025-10-22T09:00:00+05:30';
      const deskId = 456;
      apiRequest.mockResolvedValue([]);

      await bookingService.getBookingByStartTimestamp(startTimestamp, deskId);

      expect(apiRequest).toHaveBeenCalledWith(
        '/booking/by-start-time?startTimestamp=2025-10-22T09%3A00%3A00%2B05%3A30&deskId=456'
      );
    });

    test('handles numeric deskId correctly', async () => {
      apiRequest.mockResolvedValue([]);

      await bookingService.getBookingByStartTimestamp('2025-10-22T10:00:00Z', 789);

      expect(apiRequest).toHaveBeenCalledWith(
        expect.stringContaining('deskId=789')
      );
    });
  });

  describe('getBookingByEndTimestamp', () => {
    test('constructs query parameters correctly', async () => {
      const endTimestamp = '2025-10-22T17:00:00Z';
      const deskId = 999;
      apiRequest.mockResolvedValue([]);

      await bookingService.getBookingByEndTimestamp(endTimestamp, deskId);

      expect(apiRequest).toHaveBeenCalledWith(
        '/booking/by-end-time?endTimestamp=2025-10-22T17%3A00%3A00Z&deskId=999'
      );
    });

    test('properly encodes special characters in timestamp', async () => {
      const endTimestamp = '2025-10-22T17:00:00+00:00';
      const deskId = 111;
      apiRequest.mockResolvedValue([]);

      await bookingService.getBookingByEndTimestamp(endTimestamp, deskId);

      expect(apiRequest).toHaveBeenCalledWith(
        '/booking/by-end-time?endTimestamp=2025-10-22T17%3A00%3A00%2B00%3A00&deskId=111'
      );
    });
  });

  describe('getAllBookings', () => {
    test('calls apiRequest with correct endpoint', async () => {
      apiRequest.mockResolvedValue([]);

      await bookingService.getAllBookings();

      expect(apiRequest).toHaveBeenCalledWith('/booking');
      expect(apiRequest).toHaveBeenCalledTimes(1);
    });

    test('returns array of bookings from apiRequest', async () => {
      const mockBookings = [
        { id: 1, name: 'Booking 1' },
        { id: 2, name: 'Booking 2' }
      ];
      apiRequest.mockResolvedValue(mockBookings);

      const result = await bookingService.getAllBookings();

      expect(result).toEqual(mockBookings);
    });
  });

  describe('updateBooking', () => {
    test('calls apiRequest with correct endpoint, PATCH method, and data', async () => {
      const bookingId = 50;
      const updateData = { startTime: '10:00', endTime: '18:00' };
      apiRequest.mockResolvedValue({ id: bookingId, ...updateData });

      await bookingService.updateBooking(bookingId, updateData);

      expect(apiRequest).toHaveBeenCalledWith('/booking/50', {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });
      expect(apiRequest).toHaveBeenCalledTimes(1);
    });

    test('returns updated booking data from apiRequest', async () => {
      const mockUpdated = { id: 50, name: 'Updated', status: 'modified' };
      apiRequest.mockResolvedValue(mockUpdated);

      const result = await bookingService.updateBooking(50, {});

      expect(result).toEqual(mockUpdated);
    });
  });

  describe('cancelBooking', () => {
    test('calls apiRequest with correct endpoint, PATCH method, and reason', async () => {
      const bookingId = 75;
      const reason = 'Meeting cancelled';
      apiRequest.mockResolvedValue({ id: bookingId, status: 'cancelled' });

      await bookingService.cancelBooking(bookingId, reason);

      expect(apiRequest).toHaveBeenCalledWith('/booking/cancel/75', {
        method: 'PATCH',
        body: JSON.stringify({ reason })
      });
      expect(apiRequest).toHaveBeenCalledTimes(1);
    });

    test('handles empty reason string', async () => {
      apiRequest.mockResolvedValue({});

      await bookingService.cancelBooking(100, '');

      expect(apiRequest).toHaveBeenCalledWith('/booking/cancel/100', {
        method: 'PATCH',
        body: JSON.stringify({ reason: '' })
      });
    });

    test('returns cancellation response from apiRequest', async () => {
      const mockResponse = { id: 75, status: 'cancelled', reason: 'User request' };
      apiRequest.mockResolvedValue(mockResponse);

      const result = await bookingService.cancelBooking(75, 'User request');

      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteBooking', () => {
    test('calls apiRequest with correct endpoint and DELETE method', async () => {
      const bookingId = 88;
      apiRequest.mockResolvedValue({ message: 'Deleted successfully' });

      await bookingService.deleteBooking(bookingId);

      expect(apiRequest).toHaveBeenCalledWith('/booking/88', {
        method: 'DELETE'
      });
      expect(apiRequest).toHaveBeenCalledTimes(1);
    });

    test('returns deletion response from apiRequest', async () => {
      const mockResponse = { success: true, message: 'Booking deleted' };
      apiRequest.mockResolvedValue(mockResponse);

      const result = await bookingService.deleteBooking(99);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('error handling', () => {
    test('propagates errors from apiRequest in createBooking', async () => {
      const error = new Error('Network error');
      apiRequest.mockRejectedValue(error);

      await expect(bookingService.createBooking({}))
        .rejects
        .toThrow('Network error');
    });

    test('propagates errors from apiRequest in getBookingById', async () => {
      const error = new Error('Not found');
      apiRequest.mockRejectedValue(error);

      await expect(bookingService.getBookingById(999))
        .rejects
        .toThrow('Not found');
    });

    test('propagates errors from apiRequest in updateBooking', async () => {
      const error = new Error('Validation error');
      apiRequest.mockRejectedValue(error);

      await expect(bookingService.updateBooking(1, {}))
        .rejects
        .toThrow('Validation error');
    });
  });
});