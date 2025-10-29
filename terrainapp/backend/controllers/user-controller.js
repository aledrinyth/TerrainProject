//Added by Ariff
const { adminAuth } = require("../config/firebase");

const logger = require("../logger.js")
const express = require("express");
const { db } = require("../config/firebase.js");
const { getAuth } = require("../config/firebase");

/**
 * Summary: Creates a user. (Admin only)
 *
 * @param {express.Request} req - Express request object containing registration data.
 * @param {express.Response} res - Express response object for sending status and data.
 * @returns {void}
 * @throws {Error} If input validation fails or database error occurs.
 * @example
 * POST /user
 * createUser(req, res);
 */
const createUser = async (req, res) => {
    const { name, email, phoneNumber } = req.body;
    // Extract the token from the header
    const token = req.headers.authorization?.split("Bearer ")[1];

    try {
        // Validation
        if (!name || !phoneNumber || !email) {
            return res.status(400).json({
                error: "Name, email, and phone number are required."
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
                error: "User creation can only be done by admin."
            })
        }

        // Create user (firebase auth will check for uniqueness)
        const userRecord = await getAuth().createUser({
            email: email,
            password: "password123", // For now. Let user change pass after
        });

        // Success
        return res.status(200).json({
            message: "User created succesfully.",
            user: {
                id: userRecord.uid,
                name: userRecord.displayName,
                email: userRecord.email,
                phoneNumber: phoneNumber
            }
        });

    } catch (error) {
        logger.error("Error creating user: " + error);
        if (error.code === "auth/email-already-exists") {
            return res.status(400).json({
                error: "User already exists."
            });
        }
        return res.status(500).json({
            error: "Internal server error"
        });
    }
}

/**
 * Summary: Gets user by email
 *
 * @param {express.Request} req - Express request object containing registration data.
 * @param {express.Response} res - Express response object for sending status and data.
 * @returns {void}
 * @throws {Error} If input validation fails or database error occurs.
 * @example
 * GET /user
 * getUserByName(req, res);
 */
const getUserByEmail = async (req, res) => {
    const { email } = req.params;
    const token = req.headers.authorization?.split("Bearer ")[1];
    
    try {
        // Validation
        if (!email) {
            return res.status(400).json({
                error: "Email is required."
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
                error: "Get user by email can only be done by admin."
            })
        }   

        // Get user record
        const userRecord = await getAuth().getUserByEmail(email);

        // Success
        return res.status(200).json({
            message: "User returned successfully.",
            user: {
                id: userRecord.uid,
                name: userRecord.displayName,
                email: userRecord.email,
                phoneNumber: userRecord.phoneNumber
            }
        });

    } catch (error) {
        logger.error("Error getting users by name: " + error);
        if (error.code === "auth/user-not-found") {
            return res.status(400).json({
                error: "User not found."
            });
        }
        return res.status(500).json({
            error: "Internal server error"
        });
    }
}


/**
 * Summary: Gets a user by its id
 *
 * @param {express.Request} req - Express request object containing registration data.
 * @param {express.Response} res - Express response object for sending status and data.
 * @returns {void}
 * @throws {Error} If input validation fails or database error occurs.
 * @example
 * GET /user
 * getUserById(req, res);
 */
const getUserById = async (req, res) => {
    const { id } = req.params;
    const token = req.headers.authorization?.split("Bearer "[1]);
    
    try {
        // Validation
        if (!id) {
            return res.status(400).json({
                error: "User id is required."
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
                error: "Get user by id can only be done by admin."
            })
        }

        // Get user
        const userRecord = await getAuth().getUserById(id);

        // Success
        return res.status(200).json({
            message: "User returned successfully.",
            user: {
                id: userRecord.uid,
                name: userRecord.displayName,
                email: userRecord.email,
                phoneNumber: userRecord.phoneNumber
            }
        });

    } catch (error) {
        logger.error("Error getting user by id: " + error);
        if (error.code === "auth/user-not-found") {
            return res.status(400).json({
                error: "User not found."
            });
        }
        return res.status(500).json({
            error: "Internal server error"
        });
    }
}


/**
 * Summary: Gets a user by their phone number
 *
 * @param {express.Request} req - Express request object containing registration data.
 * @param {express.Response} res - Express response object for sending status and data.
 * @returns {void}
 * @throws {Error} If input validation fails or database error occurs.
 * @example
 * GET /user
 * getUserByPhoneNumber(req, res);
 */
const getUserByPhoneNumber = async (req, res) => {
    const { phoneNumber } = req.params;
    const token = req.headers.authorization?.split("Bearer ")[1];
    
    try {
        // Validation
        if (!id) {
            return res.status(400).json({
                error: "Phone number is required."
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
                error: "Get user by phone number can only be done by admin."
            })
        }

        // Get user
        const userRecord = getAuth().getUserByPhoneNumber(phoneNumber);
        
        // Success
        return res.status(200).json({
            message: "User returned successfully.",
            user: {
                id: userRecord.uid,
                name: userRecord.displayName,
                email: userRecord.email,
                phoneNumber: userRecord.phoneNumber
            }
        });

    } catch (error) {
        logger.error("Error getting user by id: " + error);
        if (error.code === "auth/user-not-found") {
            return res.status(400).json({
                error: "User not found."
            });
        }
        return res.status(500).json({
            error: "Internal server error"
        });
    }
}




/**
 * Summary: Gets all users
 *
 * @param {express.Request} req - Express request object containing registration data.
 * @param {express.Response} res - Express response object for sending status and data.
 * @returns {void}
 * @throws {Error} If input validation fails or database error occurs.
 * @example
 * GET /user
 * getAllUsers(req, res);
 */
const getAllUsers = async (req, res) => {
    const token = req.headers.authorization?.split("Bearer ")[1];

    try {
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
                error: "Get all users can only be done by admin."
            })
        }

        // Get all users
        const userRecords = await getAuth().listUsers();

        const users = []
        userRecords.users.forEach(userRecord => {
            users.push({
                id: userRecord.uid,
                name: userRecord.displayName,
                email: userRecord.email,
                phoneNumber: userRecord.phoneNumber
            });
        });

        // Success
        return res.status(200).json({
            message: "Successfully returned all users.",
            users: users
        });

    } catch (error) {
        logger.error("Error getting all users: " + error);
        return res.status(500).json({
            error: "Internal server error"
        });
    }
}


/**
 * Summary: Updates a user by their email
 *
 * @param {express.Request} req - Express request object containing registration data.
 * @param {express.Response} res - Express response object for sending status and data.
 * @returns {void}
 * @throws {Error} If input validation fails or database error occurs.
 * @example
 * PATCH /user
 * updateUser(req, res);
 */
const updateUser = async (req, res) => {
    const { emailQuery } = req.params;
    const { name, password, email, phoneNumber } = req.body;
    const token = req.headers.authorization?.split("Bearer ")[1];

    try {
        // Validation
        if (!emailQuery) {
            return res.status(400).json({ error: "email is required." });
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
                error: "Update user can only be done by admin."
            })
        }

        const oldUserRecord = await getAuth().getUserByEmail(emailQuery);

        if (!oldUserRecord) {
            return res.status(404).json({ error: "No user with email " + emailQuery + " found." });
        }

        const oldModifications = {
            name: oldUserRecord.displayName,
            email: oldUserRecord.email,
            phoneNumber: oldUserRecord.phoneNumber
        }

        // Ensure only update the specified parameters
        const updateData = {};
        if (name != undefined) updateData.displayName = name;
        if (email != undefined) updateData.email = email;
        if (password != undefined) updateData.password = password;
        if (phoneNumber != undefined) updateData.phoneNumber = phoneNumber;

        // Update user with the specified information
        const newUserRecord = await getAuth().updateUser(oldUserRecord.uid, updateData);

        // Success
        return res.status(200).json({
            message: "User updated successfully.",
            user: {
                id: newUserRecord.uid,
                name: newUserRecord.displayName,
                email: newUserRecord.email,
                phoneNumber: newUserRecord.phoneNumber
            },
            old: {
                id: newUserRecord.uid,
                name: oldModifications.displayName,
                email: oldModifications.email,
                phoneNumber: oldModifications.phoneNumber
            }
        });

    } catch (error) {
        logger.error("Error updating booking: " + error);

        if (error.code === 'auth/user-not-found') {
            return res.status(404).json({ error: 'User not found.' });
        }
        if (error.code === 'auth/email-already-exists') {
            return res.status(400).json({ error: 'Email already in use.' });
        }
        return res.status(500).json({
            error: "Internal server error"
        });
    }
}


/**
 * Summary: Deletes user by their email (ONLY FOR ADMIN)
 *
 * @param {express.Request} req - Express request object containing registration data.
 * @param {express.Response} res - Express response object for sending status and data.
 * @returns {void}
 * @throws {Error} If input validation fails or database error occurs.
 * @example
 * DELETE /user
 * deleteUser(req, res);
 */
const deleteUser = async (req, res) => {
    const { email } = req.params;
    const token = req.headers.authorization?.split("Bearer ")[1];
    
    try {
        // Validation
        if (!email) {
            return res.status(400).json({ error: "Email is required." });
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

        // Delete user
        const userRecord = await getAuth().getUserByEmail(email);
        await getAuth().deleteUser(userRecord.uid);

        // Success
        return res.status(200).json({
            message: "User deleted successfully.",
        });

    } catch (error) {
        logger.error("Error deleting user: " + error);
        return res.status(500).json({
            error: "Internal server error"
        });
    }
}

/**
 * Summary: Gives a user admin priviliges (ONLY FOR ADMIN)
 *
 * @param {express.Request} req - Express request object containing registration data.
 * @param {express.Response} res - Express response object for sending status and data.
 * @returns {void}
 * @throws {Error} If input validation fails or database error occurs.
 * @example
 * POST /user
 * setAdmin(req, res);
 */
const setAdmin = async (req, res) => {
  // We identify the user to be promoted by their email in the request body
  const { email } = req.params; //changed by ariff

  if (!email) {
    return res.status(400).json({ error: 'Email is required in the request body.' });
  }

  try {
    // Find the user in Firebase Auth by their email
    const user = await getUserByEmail(email);

    // Set the custom claim. This will overwrite any existing claims.
    await setCustomUserClaims(user.uid, { admin: true });

    return res.status(200).json({ message: `Successfully promoted ${email} to admin.` });
  } catch (error) {
    console.error('Error setting admin role:', error);
    // Handle cases where the user might not be found
    if (error.code === 'auth/user-not-found') {
        return res.status(404).json({ error: 'User not found.' });
    }
    return res.status(500).json({ error: 'An internal error occurred while setting admin role.' });
  }
};

module.exports = { 
                createUser, 
                getUserByEmail, 
                getUserById, 
                getUserByPhoneNumber,
                getAllUsers, 
                updateUser, 
                deleteUser,
                setAdmin
            }
