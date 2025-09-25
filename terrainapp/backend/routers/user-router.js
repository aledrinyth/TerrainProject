const express = require("express");
const { 
    createUser, 
    getUsersByName, 
    getBookingById, 
    getBookingByStartTimestamp, 
    getBookingByEndTimestamp, 
    getAllBookings, 
    updateBooking, 
    cancelBooking, 
    deleteBooking,
    setAdmin
} = require("../controllers/user-controller");

const { checkIfAdmin } = require('../middleware/auth')

const router = express.Router();

// Create a new user
router.post("/create-user", createUser);

// Get users by name
router.get("/get-users/:name", getUsersByName);

// Get booking by id
router.get("/get-booking/:id", getBookingById);

// Get booking by time start stamp
router.get("/get-booking/start", getBookingByStartTimestamp);

// Get booking by time start stamp
router.get("/get-booking/end", getBookingByEndTimestamp);

// Get all bookings
router.get("/get-booking/all", getAllBookings);

// Update booking
router.patch("/update-booking/:id", updateBooking);

// Cancel booking
router.patch("/cancel-booking/:id", cancelBooking);

// Delete booking
router.delete("/delete-booking/:id", deleteBooking);

// Set admin user
router.post('/set-admin-role', checkIfAdmin, setAdmin);

module.exports = router;
