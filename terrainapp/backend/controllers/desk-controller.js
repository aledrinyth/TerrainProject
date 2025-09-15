const logger = require('../../../logger.js')
const express = require('express');
const { db } = require('../config/firebase.js');
const { getAuth } = require('firebase-admin/auth');

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
    const { name, seats } = req.body;
    
    try {
        // Validation
        if (!name || !seats) {
            return res.status(400).json({
                error: "Name and seats are required."
            });
        }

        // Add desk to "desks" collection
        const deskRef = await db.collection("desks").add({
            name: name,
            seats: seats,
            createdAt: new Date()
        });

        // Success
        return res.status(200).json({
            message: "Desk created successfully.",
            deskId: deskRef.id,
            desk: {
                id: deskRef.id,
                name: name,
                seats: seats
            }
        });

    } catch (error) {
        // TODO: logger
        console.log("error: " + error);
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
 * getDeskByName(req, res);
 */
const getDeskByName = async (req, res) => {
    const { name } = req.body;
    
    try {
        // Validation
        if (!name) {
            return res.status(400).json({
                error: "Name is required."
            });
        }

        // Add desk to "desks" collection
        const desksSnapshot = await db.collection("desks").where("name", "==", name).get();

        if (desksSnapshot.empty) {
            return res.status(404).json({ error: "Desk not found." });
        }

        const desks = []

        desksSnapshot.forEach(doc => {
            desks.push({
                id: doc.id,
                name: doc.name,
                seats: doc.seats
            });
        })

        // Success
        return res.status(200).json({
            desks: desks
        });

    } catch (error) {
        // TODO: logger
        console.log("error: " + error);
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
 * getDeskByName(req, res);
 */
const getAllDesks = async (req, res) => {
    
    try {
        // Add desk to "desks" collection
        const desksSnapshot = await db.collection("desks").get();

        if (desksSnapshot.empty) {
            return res.status(404).json({ error: "No desks in database." });
        }

        const desks = []

        desksSnapshot.forEach(doc => {
            desks.push({
                id: doc.id,
                name: doc.name,
                seats: doc.seats
            });
        })

        // Success
        return res.status(200).json({
            desks: desks
        });

    } catch (error) {
        // TODO: logger
        console.log("error: " + error);
        return res.status(500).json({
            error: "Internal server error"
        });
    }
}