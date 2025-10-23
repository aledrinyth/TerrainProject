const express = require("express");
const { 
    createUser, 
    getUserByEmail, 
    getUserById, 
    getUserByPhoneNumber,
    getAllUsers, 
    updateUser, 
    deleteUser,
    setAdmin
} = require("../controllers/user-controller");

const router = express.Router();

// Get all users (Admin only) - specific route first
router.get("/get-all-users", getAllUsers);

// Get user by email (Admin only) - specific route before generic params
router.get("/get-user-by-email/:email", getUserByEmail);

// Get user by phone number (Admin only)
router.get("/get-user-by-phone/:phoneNumber", getUserByPhoneNumber);

// Get user by ID (Admin only) - generic param route after specific routes
router.get("/get-user/:id", getUserById);

// Create a new user (Admin only)
router.post("/create-user", createUser);

// Set admin user (Admin only)
router.post("/set-admin-role/:email", setAdmin);

// Update user by email (Admin only)
router.patch("/update-user/:emailQuery", updateUser);

// Delete user by email (Admin only)
router.delete("/delete-user/:email", deleteUser);

module.exports = router;