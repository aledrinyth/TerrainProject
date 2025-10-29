import { apiRequest } from "./api";
import API_BASE_URL from './api';

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

    getBookingsByDate: async (dateTimestamp) => {
        const queryParams = `dateTimestamp=${encodeURIComponent(dateTimestamp)}`;

        return apiRequest(`/booking/by-date?${queryParams}`);
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
    generateICSFile: async (userId) => {
        const response = await fetch(`${API_BASE_URL}/booking/ics/${userId}`, {
            method: "GET",
            headers: {
                'Accept': 'text/calendar'
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate ICS file');
        }
        
        return await response.text();
    }
};