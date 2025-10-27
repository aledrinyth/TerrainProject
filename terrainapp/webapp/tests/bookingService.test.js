// tests/bookingService.test.js

// Mock the entire bookingService module BEFORE importing
jest.mock('../src/services/bookingService', () => {
  const actualApi = jest.requireActual('../src/services/api');
  
  return {
    bookingService: {
      createBooking: jest.fn((bookingData) => {
        const apiRequest = require('../src/services/api').apiRequest;
        return apiRequest('/booking', {
          method: "POST",
          body: JSON.stringify(bookingData)
        });
      }),
      
      getBookingById: jest.fn((id) => {
        const apiRequest = require('../src/services/api').apiRequest;
        return apiRequest(`/booking/${id}`);
      }),
      
      getBookingsByName: jest.fn((name) => {
        const apiRequest = require('../src/services/api').apiRequest;
        return apiRequest(`/booking/name/${name}`);
      }),
      
      getBookingsByDate: jest.fn((dateTimestamp) => {
        const apiRequest = require('../src/services/api').apiRequest;
        const queryParams = `dateTimestamp=${encodeURIComponent(dateTimestamp)}`;
        return apiRequest(`/booking/by-date?${queryParams}`);
      }),
      
      getAllBookings: jest.fn(() => {
        const apiRequest = require('../src/services/api').apiRequest;
        return apiRequest('/booking');
      }),
      
      updateBooking: jest.fn((id, bookingData) => {
        const apiRequest = require('../src/services/api').apiRequest;
        return apiRequest(`/booking/${id}`, {
          method: "PATCH",
          body: JSON.stringify(bookingData)
        });
      }),
      
      cancelBooking: jest.fn((id, reason) => {
        const apiRequest = require('../src/services/api').apiRequest;
        return apiRequest(`/booking/cancel/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ reason })
        });
      }),
      
      deleteBooking: jest.fn((id) => {
        const apiRequest = require('../src/services/api').apiRequest;
        return apiRequest(`/booking/${id}`, {
          method: "DELETE"
        });
      }),
      
      generateICSFile: jest.fn(async (userId) => {
        const baseUrl = 'http://localhost:6969';
        const response = await fetch(`${baseUrl}/api/booking/ics/${userId}`, {
          method: "GET",
          headers: { 'Accept': 'text/calendar' }
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to generate ICS file');
        }
        return await response.text();
      })
    }
  };
});

// Mock the api module
jest.mock('../src/services/api');

// Now import this will use the mocked version
const { bookingService } = require('../src/services/bookingService');
const { apiRequest } = require('../src/services/api');

// Mock fetch for generateICSFile tests
global.fetch = jest.fn();

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

  describe('getBookingsByDate', () => {
    test('constructs query parameters correctly', async () => {
      const dateTimestamp = '2025-10-22T09:00:00Z';
      apiRequest.mockResolvedValue([]);

      await bookingService.getBookingsByDate(dateTimestamp);

      expect(apiRequest).toHaveBeenCalledWith(
        '/booking/by-date?dateTimestamp=2025-10-22T09%3A00%3A00Z'
      );
    });

    test('properly encodes special characters in timestamp', async () => {
      const dateTimestamp = '2025-10-22T09:00:00+05:30';
      apiRequest.mockResolvedValue([]);

      await bookingService.getBookingsByDate(dateTimestamp);

      expect(apiRequest).toHaveBeenCalledWith(
        '/booking/by-date?dateTimestamp=2025-10-22T09%3A00%3A00%2B05%3A30'
      );
    });

    test('returns array of bookings from apiRequest', async () => {
      const mockBookings = [
        { id: 1, date: '2025-10-22' },
        { id: 2, date: '2025-10-22' }
      ];
      apiRequest.mockResolvedValue(mockBookings);

      const result = await bookingService.getBookingsByDate('2025-10-22T00:00:00Z');

      expect(result).toEqual(mockBookings);
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
      const mockResponse = { 
        id: 75, 
        status: 'cancelled', 
        reason: 'User request' 
      };
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

  describe('generateICSFile', () => {
    beforeEach(() => {
      fetch.mockClear();
    });

    test('calls fetch with correct URL and headers', async () => {
      const userId = 123;
      const mockICSContent = 'BEGIN:VCALENDAR\nEND:VCALENDAR';
      
      fetch.mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(mockICSContent)
      });

      await bookingService.generateICSFile(userId);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:6969/api/booking/ics/123',
        {
          method: 'GET',
          headers: { 'Accept': 'text/calendar' }
        }
      );
    });

    test('returns ICS file content as text', async () => {
      const mockICSContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR';
      
      fetch.mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(mockICSContent)
      });

      const result = await bookingService.generateICSFile(456);

      expect(result).toBe(mockICSContent);
    });

    test('throws error when response is not ok', async () => {
      const errorResponse = { error: 'User not found' };
      
      fetch.mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue(errorResponse)
      });

      await expect(bookingService.generateICSFile(999))
        .rejects
        .toThrow('User not found');
    });

    test('throws default error message when error response has no error field', async () => {
      fetch.mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({})
      });

      await expect(bookingService.generateICSFile(999))
        .rejects
        .toThrow('Failed to generate ICS file');
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

    test('propagates errors from apiRequest in getBookingsByDate', async () => {
      const error = new Error('Invalid date format');
      apiRequest.mockRejectedValue(error);

      await expect(bookingService.getBookingsByDate('invalid'))
        .rejects
        .toThrow('Invalid date format');
    });
  });
});