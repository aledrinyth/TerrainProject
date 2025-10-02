import { apiRequest } from "./api";

export const deskService = {

    // Create new desk
    createDesk: async (deskData) => {
        return apiRequest('/desk', {
            method: "POST",
            body: JSON.stringify(deskData)
        });
    },

    // Get desk by ID
    getDeskById: async (id) => {
        return apiRequest(`/desk/${id}`);
    },

    // Get desks by name
    getDesksByName: async (name) => {
        return apiRequest(`/desk/name/${name}`);
    },

    // Get all desks
    getAllDesks: async () => {
        return apiRequest('/desk');
    },

    // Update desk
    updateDesk: async (id, deskData) => {
        return apiRequest(`/desk/${id}`, {
            method: "PATCH",
            body: JSON.stringify(deskData)
        });
    },

    // Delete desk
    deleteDesk: async (id) => {
        return apiRequest(`/desk/${id}`, {
            method: "DELETE"
        });
    }
};