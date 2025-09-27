import { apiRequest } from "./api";

export const userService = {

    // Create new user (Admin only)
    createUser: async (userData) => {
        return apiRequest('/user/create-user', {
            method: "POST",
            body: JSON.stringify(userData)
        });
    },

    // Get user by ID (Admin only)
    getUserById: async (id) => {
        return apiRequest(`/user/get-user/${id}`);
    },

    // Get user by email (Admin only)
    getUserByEmail: async (email) => {
        return apiRequest(`/user/get-user-by-email/${encodeURIComponent(email)}`);
    },

    // Get user by phone number (Admin only)
    getUserByPhoneNumber: async (phoneNumber) => {
        return apiRequest(`/user/get-user-by-phone/${encodeURIComponent(phoneNumber)}`);
    },

    // Get all users (Admin only)
    getAllUsers: async () => {
        return apiRequest('/user/get-all-users');
    },

    // Update user by email (Admin only)
    updateUser: async (emailQuery, userData) => {
        return apiRequest(`/user/update-user/${encodeURIComponent(emailQuery)}`, {
            method: "PATCH",
            body: JSON.stringify(userData)
        });
    },

    // Delete user by email (Admin only)
    deleteUser: async (email) => {
        return apiRequest(`/user/delete-user/${encodeURIComponent(email)}`, {
            method: "DELETE"
        });
    },

    // Set admin status by email
    setAdmin: async (email) => {
        return apiRequest(`/user/set-admin-role/${encodeURIComponent(email)}`, {
            method: "POST",
        });
    }
};