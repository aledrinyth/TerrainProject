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

// Create a new user (Admin only)
router.post("/create-user", createUser);

// Get user by email (Admin only)
router.get("/get-user-by-email/:email", getUserByEmail);

// Get user by ID (Admin only)
router.get("/get-user/:id", getUserById);

// Get user by phone number (Admin only)
router.get("/get-user-by-phone/:phoneNumber", getUserByPhoneNumber);

// Get all users (Admin only)
router.get("/get-all-users", getAllUsers);

// Update user by email (Admin only)
router.patch("/update-user/:emailQuery", updateUser);

// Delete user by email (Admin only)
router.delete("/delete-user/:email", deleteUser);

// Set admin user (Admin only)
router.post("/set-admin-role/:email", setAdmin);

module.exports = router;
