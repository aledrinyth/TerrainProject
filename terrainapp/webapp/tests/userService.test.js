// userService.test.js
import { userService } from '../src/services/userService';
import { apiRequest } from '../src/services/api';

jest.mock('../src/services/api', () => ({ apiRequest: jest.fn() }));

describe('userService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('createUser POSTs /user/create-user with JSON body', async () => {
    const payload = { email: 'a@b.com', name: 'Alice' };
    apiRequest.mockResolvedValue({ id: 'u1' });

    const res = await userService.createUser(payload);

    expect(apiRequest).toHaveBeenCalledWith('/user/create-user', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    expect(res).toEqual({ id: 'u1' });
  });

  it('getUserById GETs /user/get-user/:id', async () => {
    await userService.getUserById('u123');
    expect(apiRequest).toHaveBeenCalledWith('/user/get-user/u123');
  });

  it('getUserByEmail GETs /user/get-user-by-email/:email (encoded)', async () => {
    const email = 'alice+admin@ex ample.com';
    await userService.getUserByEmail(email);
    expect(apiRequest).toHaveBeenCalledWith(
      `/user/get-user-by-email/${encodeURIComponent(email)}`
    );
  });

  it('getUserByPhoneNumber GETs /user/get-user-by-phone/:phone (encoded)', async () => {
    const phone = '+61 400 123 456';
    await userService.getUserByPhoneNumber(phone);
    expect(apiRequest).toHaveBeenCalledWith(
      `/user/get-user-by-phone/${encodeURIComponent(phone)}`
    );
  });

  it('getAllUsers GETs /user/get-all-users', async () => {
    await userService.getAllUsers();
    expect(apiRequest).toHaveBeenCalledWith('/user/get-all-users');
  });

  it('updateUser PATCHes /user/update-user/:email (encoded) with JSON body', async () => {
    const emailQuery = 'bob.smith@domain.com';
    const patch = { name: 'Bob Smith' };
    await userService.updateUser(emailQuery, patch);
    expect(apiRequest).toHaveBeenCalledWith(
      `/user/update-user/${encodeURIComponent(emailQuery)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }
    );
  });

  it('deleteUser DELETEs /user/delete-user/:email (encoded)', async () => {
    const email = 'carol%admin@domain.com';
    await userService.deleteUser(email);
    expect(apiRequest).toHaveBeenCalledWith(
      `/user/delete-user/${encodeURIComponent(email)}`,
      { method: 'DELETE' }
    );
  });

  it('setAdmin POSTs /user/set-admin-role/:email (encoded)', async () => {
    const email = 'dave@corp.com';
    await userService.setAdmin(email);
    expect(apiRequest).toHaveBeenCalledWith(
      `/user/set-admin-role/${encodeURIComponent(email)}`,
      { method: 'POST' }
    );
  });

  it('propagates errors from apiRequest', async () => {
    apiRequest.mockRejectedValue(new Error('Network down'));
    await expect(userService.getAllUsers()).rejects.toThrow('Network down');
  });
});