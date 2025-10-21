const express = require("express");
const { 
    createBooking, 
    getBookingsByName, 
    getBookingById, 
    getBookingByStartTimestamp, 
    getBookingByEndTimestamp, 
    getAllBookings, 
    updateBooking, 
    cancelBooking,
    deleteBooking,
    generateICSFileforBooking
} = require("../controllers/booking-controller");

const router = express.Router();

// Create a new booking
router.post("/", createBooking);

// Get all bookings (must come before /:id to avoid conflicts)
router.get("/", getAllBookings);

// Get booking by starting Timestamp (specific routes before generic param routes)
router.get("/by-start-time", getBookingByStartTimestamp);

// Get booking by end Timestamp
router.get("/by-end-time", getBookingByEndTimestamp);

// Get bookings by name
router.get("/name/:name", getBookingsByName);

// Generate and send the ICS booking file
router.get("/ics/:userId", generateICSFileforBooking);

// Get booking by ID (generic param route comes after specific routes)
router.get("/:id", getBookingById);

// Update booking by ID
router.patch("/:id", updateBooking);

// Cancel booking by ID
router.patch("/cancel/:id", cancelBooking);

// Delete booking by ID (Admin only)
router.delete("/:id", deleteBooking);

module.exports = router;