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
router.post("/booking", createBooking);

// Get all bookings
router.get("/booking", getAllBookings);

// Get booking by ID
router.get("/booking/:id", getBookingById);

// Get booking by starting Timestamp
router.get("/booking/:id", getBookingByStartTimestamp);

// Get booking by end Timestamp
router.get("/booking/:id", getBookingByEndTimestamp);

// Get bookings by name
router.get("/booking/name/:name", getBookingsByName);

// Update booking by ID
router.patch("/booking/:id", updateBooking);

// Cancel booking
router.patch("/booking/:id", cancelBooking)

// Delete booking by ID (Admin only)
router.delete("/booking/:id", deleteBooking);

module.exports = router;
