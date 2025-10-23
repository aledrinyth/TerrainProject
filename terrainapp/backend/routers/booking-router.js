const express = require("express");
const { 
    createBooking, 
    getBookingsByName, 
    getBookingById, 
    getBookingsByDate, 
    getAllBookings, 
    updateBooking, 
    cancelBooking,
    deleteBooking
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

// Get booking by ID
router.get("/:id", getBookingById);

// Update booking by ID
router.patch("/:id", updateBooking);

// Cancel booking by ID
router.patch("/cancel/:id", cancelBooking)

// Delete booking by ID (Admin only)
router.delete("/:id", deleteBooking);

module.exports = router;
