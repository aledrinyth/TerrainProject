// tests/deskService.test.js
import { deskService } from '../src/services/deskService';
import { apiRequest } from '../src/services/api';

jest.mock('../src/services/api');

describe('deskService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createDesk', () => {
    test('calls apiRequest with correct endpoint and POST method', async () => {
      const deskData = {
        name: 'Desk A1',
        location: 'Floor 2',
        amenities: ['monitor', 'keyboard']
      };
      
      apiRequest.mockResolvedValue({ id: 1, ...deskData });

      await deskService.createDesk(deskData);

      expect(apiRequest).toHaveBeenCalledWith('/desk', {
        method: 'POST',
        body: JSON.stringify(deskData)
      });
      expect(apiRequest).toHaveBeenCalledTimes(1);
    });

    test('returns the response from apiRequest', async () => {
      const mockResponse = { id: 123, status: 'created' };
      apiRequest.mockResolvedValue(mockResponse);

      const result = await deskService.createDesk({});

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getDeskById', () => {
    test('calls apiRequest with correct endpoint and desk ID', async () => {
      const deskId = 42;
      apiRequest.mockResolvedValue({ id: deskId, name: 'Desk B5' });

      await deskService.getDeskById(deskId);

      expect(apiRequest).toHaveBeenCalledWith('/desk/42');
      expect(apiRequest).toHaveBeenCalledTimes(1);
    });

    test('returns the desk data from apiRequest', async () => {
      const mockDesk = { id: 42, name: 'Conference Desk', location: 'Floor 3' };
      apiRequest.mockResolvedValue(mockDesk);

      const result = await deskService.getDeskById(42);

      expect(result).toEqual(mockDesk);
    });
  });

  describe('getDesksByName', () => {
    test('calls apiRequest with correct endpoint and name parameter', async () => {
      const name = 'Standing Desk';
      apiRequest.mockResolvedValue([{ id: 1, name }]);

      await deskService.getDesksByName(name);

      expect(apiRequest).toHaveBeenCalledWith('/desk/name/Standing Desk');
      expect(apiRequest).toHaveBeenCalledTimes(1);
    });

    test('handles names with spaces correctly', async () => {
      apiRequest.mockResolvedValue([]);

      await deskService.getDesksByName('Executive Corner Desk');

      expect(apiRequest).toHaveBeenCalledWith('/desk/name/Executive Corner Desk');
    });

    test('handles names with special characters', async () => {
      apiRequest.mockResolvedValue([]);

      await deskService.getDesksByName('Desk A-1 (Window)');

      expect(apiRequest).toHaveBeenCalledWith('/desk/name/Desk A-1 (Window)');
    });
  });

  describe('getAllDesks', () => {
    test('calls apiRequest with correct endpoint', async () => {
      apiRequest.mockResolvedValue([]);

      await deskService.getAllDesks();

      expect(apiRequest).toHaveBeenCalledWith('/desk');
      expect(apiRequest).toHaveBeenCalledTimes(1);
    });

    test('returns array of desks from apiRequest', async () => {
      const mockDesks = [
        { id: 1, name: 'Desk 1' },
        { id: 2, name: 'Desk 2' },
        { id: 3, name: 'Desk 3' }
      ];
      apiRequest.mockResolvedValue(mockDesks);

      const result = await deskService.getAllDesks();

      expect(result).toEqual(mockDesks);
      expect(result).toHaveLength(3);
    });
  });

  describe('updateDesk', () => {
    test('calls apiRequest with correct endpoint, PATCH method, and data', async () => {
      const deskId = 50;
      const updateData = { name: 'Updated Desk', location: 'Floor 5' };
      apiRequest.mockResolvedValue({ id: deskId, ...updateData });

      await deskService.updateDesk(deskId, updateData);

      expect(apiRequest).toHaveBeenCalledWith('/desk/50', {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });
      expect(apiRequest).toHaveBeenCalledTimes(1);
    });

    test('handles partial updates', async () => {
      const partialUpdate = { location: 'Floor 1' };
      apiRequest.mockResolvedValue({ id: 10, ...partialUpdate });

      await deskService.updateDesk(10, partialUpdate);

      expect(apiRequest).toHaveBeenCalledWith('/desk/10', {
        method: 'PATCH',
        body: JSON.stringify(partialUpdate)
      });
    });

    test('returns updated desk data from apiRequest', async () => {
      const mockUpdated = { id: 50, name: 'Updated', status: 'modified' };
      apiRequest.mockResolvedValue(mockUpdated);

      const result = await deskService.updateDesk(50, {});

      expect(result).toEqual(mockUpdated);
    });
  });

  describe('deleteDesk', () => {
    test('calls apiRequest with correct endpoint and DELETE method', async () => {
      const deskId = 88;
      apiRequest.mockResolvedValue({ message: 'Deleted successfully' });

      await deskService.deleteDesk(deskId);

      expect(apiRequest).toHaveBeenCalledWith('/desk/88', {
        method: 'DELETE'
      });
      expect(apiRequest).toHaveBeenCalledTimes(1);
    });

    test('returns deletion response from apiRequest', async () => {
      const mockResponse = { success: true, message: 'Desk deleted' };
      apiRequest.mockResolvedValue(mockResponse);

      const result = await deskService.deleteDesk(99);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('error handling', () => {
    test('propagates errors from apiRequest in createDesk', async () => {
      const error = new Error('Network error');
      apiRequest.mockRejectedValue(error);

      await expect(deskService.createDesk({}))
        .rejects
        .toThrow('Network error');
    });

    test('propagates errors from apiRequest in getDeskById', async () => {
      const error = new Error('Desk not found');
      apiRequest.mockRejectedValue(error);

      await expect(deskService.getDeskById(999))
        .rejects
        .toThrow('Desk not found');
    });

    test('propagates errors from apiRequest in updateDesk', async () => {
      const error = new Error('Validation error');
      apiRequest.mockRejectedValue(error);

      await expect(deskService.updateDesk(1, {}))
        .rejects
        .toThrow('Validation error');
    });

    test('propagates errors from apiRequest in deleteDesk', async () => {
      const error = new Error('Cannot delete desk with active bookings');
      apiRequest.mockRejectedValue(error);

      await expect(deskService.deleteDesk(5))
        .rejects
        .toThrow('Cannot delete desk with active bookings');
    });
  });
});