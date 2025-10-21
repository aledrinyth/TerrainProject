const express = require("express");
const { 
    createDesk, 
    getDesksByName, 
    getDeskById, 
    getAllDesks, 
    updateDesk, 
    deleteDesk 
} = require("../controllers/desk-controller");

const router = express.Router();

// Create a new desk
router.post("/", createDesk);

// Get all desks (must come before /:id to avoid conflicts)
router.get("/", getAllDesks);

// Get desks by name (specific routes before generic param routes)
router.get("/name/:name", getDesksByName);

// Get desk by ID (generic param route comes after specific routes)
router.get("/:id", getDeskById);

// Update desk by ID
router.patch("/:id", updateDesk);

// Delete desk by ID
router.delete("/:id", deleteDesk);

module.exports = router;