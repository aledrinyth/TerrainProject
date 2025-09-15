const logger = require("../logger.js")
const express = require("express");
const { getAuth } = require("firebase-admin/auth");


/**
 * Summary: Handles user registration requests.
 *
 * @param {express.Request} req - Express request object containing registration data.
 * @param {express.Response} res - Express response object for sending status and data.
 * @returns {void}
 * @throws {Error} If input validation fails or database error occurs.
 * @example
 * POST /register
 * registerUser(req, res);
 */
const registerUser = async (req, res) => {
    // More input validation, sanitisation, and insert into firebase database
    const { email, password } = req.body;

    try {
        // Basic null checking
        if (!email || !password) {
            return res.status(400).json({ error: "Both email and password are needed." });
        }

        // Create user
        const userRecord = await getAuth().createUser({
            email: email,
            password: password,
            emailVerified: false // If client wants email verification later
        });

        return res.status(201).json({ 
            message: "User registered successfully.", 
            userId: userRecord.uid 
        });

        
    } catch (error) {
        // TODO: logger logging
        // temporarily:
        console.error("Error fetching user: ", error);
        res.status(500).json({ error: "Internal server error." });
    }
}

module.exports = {registerUser};