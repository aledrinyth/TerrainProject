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

// Get all desks
router.get("/", getAllDesks);

// Get desk by ID
router.get("/:id", getDeskById);

// Get desks by name
router.get("/name/:name", getDesksByName);

// Update desk by ID
router.patch("/:id", updateDesk);

// Delete desk by ID
router.delete("/:id", deleteDesk);

module.exports = router;
