const logger = require('../../logger.js')
const express = require('express');
const { db } = require('../config/firebase');

/**
 * Summary: Handles user login requests.
 *
 * @param {express.Request} req - Express request object containing user credentials.
 * @param {express.Response} res - Express response object for sending status and data.
 * @returns {void}
 * @throws {Error} If input validation fails or database error occurs.
 * @example
 * POST /login
 * loginUser(req, res);
 */
const loginUser = async (req, res) => {
    // Do input validation, sanitisation, check database, and return ok if fine and error if not
    const { email, password } = req.body;

    try {
        // Basic null checking
        if (!email || !password) {
            return res.status(400).json({ error: "Invalid credentials." });
        }

        // Email validation
        if (!validateEmail(email)) {
            return res.status(400).json({ error: "Invalid credentials." });
        }

        // Query for user document
        const userQuery = await db.collection("users").where("email", "==", email).get();
        
        // Check if user exists
        if(userQuery.empty) {
            return res.status(400).json({ error: "User not found." });
        }

        const userDoc = userQuery.docs[0]; // Get first doc (user should be exclusive anyways)
        const userData = userDoc.data(); // Get data
        
        // Compare hashed passwords
        if (!validatePassword(password, userData.password)) {
            return res.status(400).json({ error: "Invalid credentials." });
        }

        // Login successful
        return res.status(200).json({ message: "Login successful." });

    } catch (error) {
        // TODO: logger logging
        // temporarily:
        console.error("Error fetching user: ", error);
        res.status(500).json({ error: "Internal server error." });
    }
}


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
            return res.status(400).json({ error: "Invalid credentials." });
        }

        // Email validation
        if (!validateEmail(email)) {
            return res.status(400).json({ error: "Invalid credentials." });
        }

        
    } catch (error) {
        // TODO: logger logging
        // temporarily:
        console.error("Error fetching user: ", error);
        res.status(500).json({ error: "Internal server error." });
    }
}

module.exports = {loginUser, registerUser};

/** Summary: Basic email validation.
 *
 * @param {String} email - String containing an email address.
 * @returns {boolean}
 * @example
 * validateEmail("test@example.com");
 * Credit: https://stackoverflow.com/questions/21608294/regex-for-validating-emails
 */
function validateEmail(email) {
    const emailRegex = /\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/;
    return emailRegex.test(email);
}


/** Summary: Compare password hashes.
 *
 * @param {String} password1 - String containing a hashed password.
 * @param {String} password2 - String containing another hashed password
 * @returns {boolean}
 * @example
 * validatePassword("314%312#213", "314%312#213");
 */
async function validatePassword(password1, password2) {
    return await bcrypt.compare(password1, password2);
}