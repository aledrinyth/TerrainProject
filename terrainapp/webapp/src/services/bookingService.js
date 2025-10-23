import { apiRequest } from "./api";

export const bookingService = {

    // Create new booking
    createBooking: async (bookingData) => {
        return apiRequest('/booking', {
            method: "POST",
            body: JSON.stringify(bookingData)
        });
    },

    // Get booking by ID
    getBookingById: async (id) => {
        return apiRequest(`/booking/${id}`);
    },

    // Get bookings by name
    getBookingsByName: async (name) => {
        return apiRequest(`/booking/name/${name}`);
    },

    // Get bookings by start timestamp (uses query parameters)
    getBookingByStartTimestamp: async (startTimestamp, deskId) => {
        const queryParams = `startTimestamp=${encodeURIComponent(startTimestamp)}&deskId=${encodeURIComponent(deskId)}`;
        
        return apiRequest(`/booking/by-start-time?${queryParams}`);
    },

    // Get bookings by end timestamp (uses query parameters)
    getBookingByEndTimestamp: async (endTimestamp, deskId) => {
        const queryParams = `endTimestamp=${encodeURIComponent(endTimestamp)}&deskId=${encodeURIComponent(deskId)}`;
        
        return apiRequest(`/booking/by-end-time?${queryParams}`);
    },

    // Get all bookings
    getAllBookings: async () => {
        return apiRequest('/booking');
    },

    // Update booking
    updateBooking: async (id, bookingData) => {
        return apiRequest(`/booking/${id}`, {
            method: "PATCH",
            body: JSON.stringify(bookingData)
        });
    },

    // Cancel booking
    cancelBooking: async (id, reason) => {
        return apiRequest(`/booking/cancel/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ reason })
        });
    },

    // Delete booking
    deleteBooking: async (id) => {
        return apiRequest(`/booking/${id}`, {
            method: "DELETE"
        });
    },

    // Generate an ICS file for a user to add to their calendar
    generateICSFile: async (id) => {
        return apiRequest(`booking/ics/${id}`, {
            method: "GET"
        });
    }
};