const logger = require("../logger.js")
const express = require("express");
const { db } = require("../config/firebase.js");
const { getAuth } = require("../config/firebase");

/**
 * Summary: Creates a desk.
 *
 * @param {express.Request} req - Express request object containing registration data.
 * @param {express.Response} res - Express response object for sending status and data.
 * @returns {void}
 * @throws {Error} If input validation fails or database error occurs.
 * @example
 * POST /desks
 * createDesk(req, res);
 */
const createDesk = async (req, res) => {
    const { name, seats, roomId, positionX, positionY } = req.body;
    // Extract the token from the header
    const token = req.headers.authorization?.split("Bearer ")[1];
    
    try {
        // Validation
        if (!name || !seats || !roomId) {
            return res.status(400).json({
                error: "Name, seats and roomId are required."
            });
        }

        // Check if there is a token
        if (!token) {
            return res.status(401).json({
                error: "Authorisation token required."
            });
        }

        // Check if admin
        const decodedToken = await getAuth().verifyIdToken(token);

        // Check the claim directly on the token
        if (decodedToken.admin !== true){
            return res.status(403).json({
                error: "Delete user can only be done by admin."
            })
        }

        // Add desk to "desks" collection
        const deskRef = await db.collection("desks").add({
            name: name,
            roomId: roomId,
            seats: seats,
            positionX: positionX || 0,
            positionY: positionY || 0,
            createdAt: new Date()
        });

        // Success
        return res.status(201).json({
            message: "Desk created successfully.",
            desk: {
                id: deskRef.id,
                name: name,
                roomId: roomId,
                seats: seats,
                positionX: positionX || 0,
                positionY: positionY || 0
            }
        });

    } catch (error) {
        logger.error("Error creating desk: " + error);
        return res.status(500).json({
            error: "Internal server error"
        });
    }
}

/**
 * Summary: Gets a desk by its name
 *
 * @param {express.Request} req - Express request object containing registration data.
 * @param {express.Response} res - Express response object for sending status and data.
 * @returns {void}
 * @throws {Error} If input validation fails or database error occurs.
 * @example
 * GET /desks
 * getDesksByName(req, res);
 */
const getDesksByName = async (req, res) => {
    const { name } = req.params;
    
    try {
        // Validation
        if (!name) {
            return res.status(400).json({
                error: "Name is required."
            });
        }

        // Get desks
        const desksSnapshot = await db.collection("desks").where("name", "==", name).get();

        if (desksSnapshot.empty) {
            return res.status(404).json({ error: "No desk(s) found." });
        }

        const desks = []

        desksSnapshot.forEach(desk => {
            desks.push({
                id: desk.id,
                ...desk.data()
            });
        })

        // Success
        return res.status(200).json({
            message: desks.length + " desk(s) returned successfully.",
            desks: desks
        });

    } catch (error) {
        logger.error("Error getting desk(s) by name: " + error);
        return res.status(500).json({
            error: "Internal server error"
        });
    }
}


/**
 * Summary: Gets a desk by its id
 *
 * @param {express.Request} req - Express request object containing registration data.
 * @param {express.Response} res - Express response object for sending status and data.
 * @returns {void}
 * @throws {Error} If input validation fails or database error occurs.
 * @example
 * GET /desks
 * getDeskById(req, res);
 */
const getDeskById = async (req, res) => {
    const { id } = req.params;
    
    try {
        // Validation
        if (!id) {
            return res.status(400).json({
                error: "Id is required."
            });
        }

        // Get desks
        const desksSnapshot = await db.collection("desks").doc(id).get();

        if (!desksSnapshot.exists) {
            return res.status(404).json({ error: "Desk not found." });
        }

        // Success
        return res.status(200).json({
            message: "Desk returned successfully.",
            desk: {
                id: desksSnapshot.id,
                ...desksSnapshot.data()
            }
        });

    } catch (error) {
        logger.error("Error getting desk by id: " + error);
        return res.status(500).json({
            error: "Internal server error"
        });
    }
}


/**
 * Summary: Gets all desks
 *
 * @param {express.Request} req - Express request object containing registration data.
 * @param {express.Response} res - Express response object for sending status and data.
 * @returns {void}
 * @throws {Error} If input validation fails or database error occurs.
 * @example
 * GET /desks
 * getAllDesks(req, res);
 */
const getAllDesks = async (req, res) => {
    
    try {
        // Get all desks
        const desksSnapshot = await db.collection("desks").get();

        if (desksSnapshot.empty) {
            return res.status(404).json({ error: "No desks in database." });
        }

        const desks = []

        desksSnapshot.forEach(desk => {
            desks.push({
                id: desk.id,
                ...desk.data()
            });
        })

        // Success
        return res.status(200).json({
            message: "Successfully returned all desks.",
            desks: desks
        });

    } catch (error) {
        logger.error("Error getting all desks: " + error);
        return res.status(500).json({
            error: "Internal server error"
        });
    }
}


/**
 * Summary: Updates desk by their id
 *
 * @param {express.Request} req - Express request object containing registration data.
 * @param {express.Response} res - Express response object for sending status and data.
 * @returns {void}
 * @throws {Error} If input validation fails or database error occurs.
 * @example
 * PATCH /desks
 * updateDesk(req, res);
 */
const updateDesk = async (req, res) => {
    const { id } = req.params;
    const { name, seats, roomId, positionX, positionY } = req.body;
    // Extract the token from the header
    const token = req.headers.authorization?.split("Bearer ")[1];

    try {
        // Validation
        if (!id) {
            return res.status(400).json({ error: "id is required." });
        }

        // Check if there is a token
        if (!token) {
            return res.status(401).json({
                error: "Authorisation token required."
            });
        }

        // Check if admin
        const decodedToken = await getAuth().verifyIdToken(token);

        // Check the claim directly on the token
        if (decodedToken.admin !== true){
            return res.status(403).json({
                error: "Delete user can only be done by admin."
            })
        }

        // Ensure only update the specified parameters
        const updateData = {};
        if (name != undefined) updateData.name = name;
        if (seats != undefined) updateData.seats = seats;
        if (roomId != undefined) updateData.roomId = roomId;
        if (positionX != undefined) updateData.positionX = positionX;
        if (positionY != undefined) updateData.positionY = positionY;
        updateData.updatedAt = new Date();

        // Update desk with the specified information
        const deskRef = db.collection("desks").doc(id);
        await deskRef.update(updateData);

        const deskSnapshot = await deskRef.get(); // Get for validation and return

        if (!deskSnapshot.exists) {
            return res.status(404).json({ error: "No desk with id " + id + " found." });
        }

        // Success
        return res.status(200).json({
            message: "Desk updated successfully.",
            desk: {
                id: deskSnapshot.id,
                ...deskSnapshot.data()
            }
        });

    } catch (error) {
        logger.error("Error updating desk: " + error);
        return res.status(500).json({
            error: "Internal server error"
        });
    }
}


/**
 * Summary: Deletes desk by their id
 *
 * @param {express.Request} req - Express request object containing registration data.
 * @param {express.Response} res - Express response object for sending status and data.
 * @returns {void}
 * @throws {Error} If input validation fails or database error occurs.
 * @example
 * DELETE /desks
 * deleteDesk(req, res);
 */
const deleteDesk = async (req, res) => {
    const { id } = req.params;
    // Extract the token from the header
    const token = req.headers.authorization?.split("Bearer ")[1];
    
    try {
        // Validation
        if (!id) {
            return res.status(400).json({ error: "id is required." });
        }

        // Check if there is a token
        if (!token) {
            return res.status(401).json({
                error: "Authorisation token required."
            });
        }

        // Check if admin
        const decodedToken = await getAuth().verifyIdToken(token);

        // Check the claim directly on the token
        if (decodedToken.admin !== true){
            return res.status(403).json({
                error: "Delete user can only be done by admin."
            })
        }

        // Update desk with the specified information
        const deskRef = db.collection("desks").doc(id);

        const deskSnapshot = await deskRef.get(); // Get for validation
        if (!deskSnapshot.exists) {
            return res.status(404).json({ error: "No desk with id " + id + " found." });
        }

        deskRef.delete();

        // Success
        return res.status(200).json({
            message: "Desk deleted successfully.",
        });

    } catch (error) {
        logger.error("Error deleting desk: " + error);
        return res.status(500).json({
            error: "Internal server error"
        });
    }
}

module.exports = { createDesk, getDesksByName, getDeskById, getAllDesks, updateDesk, deleteDesk }