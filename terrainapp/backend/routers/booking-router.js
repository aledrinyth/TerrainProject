// routers/booking-router.js
const express = require("express");
const { 
    createBooking, 
    getBookingsByName, 
    getBookingById, 
    getBookingsByDate, 
    getAllBookings, 
    updateBooking, 
    cancelBooking,
    deleteBooking,
    generateICSFileforBooking
} = require("../controllers/booking-controller");

const router = express.Router();

// Create a new booking
router.post("/", createBooking);

// Get all bookings
router.get("/", getAllBookings);

// Get bookings by date Timestamp (query route)
router.get("/by-date", getBookingsByDate);

// Get bookings by name
router.get("/name/:name", getBookingsByName);

// Generate and send the ICS booking file (distinct path to avoid conflict)
router.get("/ics/:userId", generateICSFileforBooking);

// Cancel booking by ID
router.patch("/cancel/:id", cancelBooking);

// Update booking by ID
router.patch("/:id", updateBooking);

// Delete booking by ID (Admin only)
router.delete("/:id", deleteBooking);

// Get booking by ID
router.get("/:id", getBookingById);

module.exports = router;