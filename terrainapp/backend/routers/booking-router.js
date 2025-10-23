// routers/booking-router.js
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

// Get all bookings
router.get("/", getAllBookings);

// ---- Place specific/static routes BEFORE any "/:id" style routes ----

// Get booking by starting Timestamp
router.get("/by-start-time", getBookingByStartTimestamp);

// Get booking by end Timestamp
router.get("/by-end-time", getBookingByEndTimestamp);

// Get bookings by name
router.get("/name/:name", getBookingsByName);

// Generate and send the ICS booking file (distinct path to avoid conflict)
router.get("/ics/:userId", generateICSFileforBooking);

// Update booking by ID
router.patch("/cancel/:id", cancelBooking); // more specific path still before generic
router.patch("/:id", updateBooking);

// Delete booking by ID (Admin only)
router.delete("/:id", deleteBooking);

// Get booking by ID (generic catch-all should be LAST among GETs)
router.get("/:id", getBookingById);

module.exports = router;