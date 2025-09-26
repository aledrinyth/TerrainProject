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
    deleteBooking
} = require("../controllers/booking-controller");

const router = express.Router();

// Create a new booking
router.post("/", createBooking);

// Get all bookings
router.get("/", getAllBookings);

// Get booking by ID
router.get("/:id", getBookingById);

// Get booking by starting Timestamp
router.get("/by-start-time", getBookingByStartTimestamp);

// Get booking by end Timestamp
router.get("/by-end-time", getBookingByEndTimestamp);

// Get bookings by name
router.get("/name/:name", getBookingsByName);

// Update booking by ID
router.patch("/:id", updateBooking);

// Cancel booking by ID
router.patch("/cancel/:id", cancelBooking)

// Delete booking by ID (Admin only)
router.delete("/:id", deleteBooking);

module.exports = router;
