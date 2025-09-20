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
router.post("/desk", createDesk);

// Get all desks
router.get("/desk", getAllDesks);

// Get desk by ID
router.get("/desk/:id", getDeskById);

// Get desks by name
router.get("/desk/name/:name", getDesksByName);

// Update desk by ID
router.patch("/desk/:id", updateDesk);

// Delete desk by ID
router.delete("/desk/:id", deleteDesk);

module.exports = router;
