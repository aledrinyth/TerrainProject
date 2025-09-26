const express = require("express");
const { 
    createUser, 
    getUserByEmail, 
    getUserById, 
    getAllUsers, 
    updateUser, 
    deleteUser,
    setAdmin
} = require("../controllers/user-controller");

const router = express.Router();

// Create a new user (Admin only)
router.post("/create-user", createUser);

// Get user by email (Admin only)
router.get("/get-user-by-email", getUserByEmail);

// Get user by ID (Admin only)
router.get("/get-user/:id", getUserById);

// Get all users (Admin only)
router.get("/get-all-users", getAllUsers);

// Update user by email (Admin only)
router.patch("/update-user/:emailQuery", updateUser);

// Delete user by email (Admin only)
router.delete("/delete-user/:email", deleteUser);

// Set admin user (Admin only)
router.post('/set-admin-role', setAdmin);

module.exports = router;
