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
 * POST /bookings
 * createUser(req, res);
 */
const createUser = async (req, res) => {
    const { name, email, phoneNumber } = req.body;
    // Extract the token from the header
    const token = req.headers.authorization?.split('Bearer ')[1];

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
                error: "User creation can only be done by admin"
            })
        }

        // Check if user exists
        const userSnapshot = await db.collection("users").where("email", "==", email).get();

        if (!userSnapshot.empty) {
            return res.status(400).json({
                error: "User already exists."
            });
        }

    } catch (error) {
        logger.error("Error creating user: " + error);
        return res.status(500).json({
            error: "Internal server error"
        });
    }
}

/**
 * Summary: Gets a booking by its name
 *
 * @param {express.Request} req - Express request object containing registration data.
 * @param {express.Response} res - Express response object for sending status and data.
 * @returns {void}
 * @throws {Error} If input validation fails or database error occurs.
 * @example
 * GET /bookings
 * getBookingsByName(req, res);
 */
const getUsersByName = async (req, res) => {
    const { name } = req.params;
    const authHeader = req.headers.authorization?.split('Bearer ')[1];
    
    try {
        // Validation
        if (!name) {
            return res.status(400).json({
                error: "Name is required."
            });
        }

        // Check if there is a token
        if (!authHeader) {
            return res.status(401).json({
                error: "Authorisation token required."
            });
        }

        // Check if admin
        const decodedToken = await getAuth().verifyIdToken(token);

        // Check the claim directly on the token
        if (decodedToken.admin !== true){
            return res.status(403).json({
                error: "User creation can only be done by admin"
            })
        }   

        // Check if user exists
        const usersSnapshot = await db.collection("users").where("name", "==", name).get();

        if (usersSnapshot.empty) {
            return res.status(404).json({ error: "No user(s) found." });
        }

        const users = []

        usersSnapshot.forEach(user => {
            user.push({
                id: user.id,
                ...user.data()
            });
        })

        // Success
        return res.status(200).json({
            message: users.length + " booking(s) returned successfully.",
            bookings: users
        });

    } catch (error) {
        logger.error("Error getting users by name: " + error);
        return res.status(500).json({
            error: "Internal server error"
        });
    }
}


/**
 * Summary: Gets a booking by its id
 *
 * @param {express.Request} req - Express request object containing registration data.
 * @param {express.Response} res - Express response object for sending status and data.
 * @returns {void}
 * @throws {Error} If input validation fails or database error occurs.
 * @example
 * GET /bookings
 * getBookingById(req, res);
 */
const getBookingById = async (req, res) => {
    const { id } = req.params;
    
    try {
        // Validation
        if (!id) {
            return res.status(400).json({
                error: "Id is required."
            });
        }

        // Get bookings
        const bookingsSnapshot = await db.collection("bookings").doc(id).get();

        if (!bookingsSnapshot.exists) {
            return res.status(404).json({ error: "Booking not found." });
        }

        // Success
        return res.status(200).json({
            message: "Booking returned successfully.",
            booking: {
                id: bookingsSnapshot.id,
                ...bookingsSnapshot.data()
            }
        });

    } catch (error) {
        logger.error("Error getting booking by id: " + error);
        return res.status(500).json({
            error: "Internal server error"
        });
    }
}


/**
 * Summary: Gets bookings by start timestamp
 *
 * @param {express.Request} req - Express request object containing registration data.
 * @param {express.Response} res - Express response object for sending status and data.
 * @returns {void}
 * @throws {Error} If input validation fails or database error occurs.
 * @example
 * GET /bookings
 * getBookingByStartTimestamp(req, res);
 */
const getBookingByStartTimestamp = async (req, res) => {
    const { startTimestamp, deskId } = req.query;

    try {
        // Validation
        if (!startTimestamp) {
            return res.status(400).json({
                error: "startTimestamp is required."
            });
        }

        // Also check for deskId if given
        if (deskId) {
            const bookingSnapshot = await db.collection("bookings")
                                            .where("startTimestamp", "==", startTimestamp)
                                            .where("deskId", "==", deskId)
                                            .get();
            if (bookingSnapshot.empty) {
                return res.status(404).json({ error: "Booking with deskId " + deskId + " not found." });
            }

            // Get the first (and only) booking document
            const booking = bookingSnapshot.docs[0];

            // Success
            return res.status(200).json({
                message: "Booking returned successfully.",
                booking: {
                    id: booking.id,
                    ...booking.data()
                }
            });
        }

        // Get bookings
        const bookingsSnapshot = await db.collection("bookings").where("startTimestamp", "==", startTimestamp).get();

        if (bookingsSnapshot.empty) {
            return res.status(404).json({ error: "Booking(s) not found." });
        }

        // Returning all bookings with the timestamp
        const bookings = [];
        bookingsSnapshot.forEach(booking => {
            bookings.push({
                id: booking.id,
                ...booking.data()
            });
        });

        // Success
        return res.status(200).json({
            message: "Booking(s) returned successfully.",
            bookings: bookings
        });

    } catch (error) {
        logger.error("Error getting booking(s) by startTimestamp: " + error);
        return res.status(500).json({
            error: "Internal server error"
        });
    }
}


/**
 * Summary: Gets bookings by end timestamp
 *
 * @param {express.Request} req - Express request object containing registration data.
 * @param {express.Response} res - Express response object for sending status and data.
 * @returns {void}
 * @throws {Error} If input validation fails or database error occurs.
 * @example
 * GET /bookings
 * getBookingByEndTimestamp(req, res);
 */
const getBookingByEndTimestamp = async (req, res) => {
    const { endTimestamp, deskId } = req.query;

    try {
        // Validation
        if (!endTimestamp) {
            return res.status(400).json({
                error: "endTimestamp is required."
            });
        }

        // Also check for deskId if given
        if (deskId) {
            const bookingSnapshot = await db.collection("bookings")
                                            .where("endTimestamp", "==", endTimestamp)
                                            .where("deskId", "==", deskId)
                                            .get();
            if (bookingSnapshot.empty) {
                return res.status(404).json({ error: "Booking with deskId " + deskId + " not found." });
            }

            // Get the first (and only) booking document
            const booking = bookingSnapshot.docs[0];

            // Success
            return res.status(200).json({
                message: "Booking returned successfully.",
                booking: {
                    id: booking.id,
                    ...booking.data()
                }
            });
        }


        // Get bookings
        const bookingsSnapshot = await db.collection("bookings").where("endTimestamp", "==", endTimestamp).get();

        if (bookingsSnapshot.empty) {
            return res.status(404).json({ error: "Booking(s) not found." });
        }

        // Returning all bookings with the timestamp
        const bookings = [];
        bookingsSnapshot.forEach(booking => {
            bookings.push({
                id: booking.id,
                ...booking.data()
            });
        });

        // Success
        return res.status(200).json({
            message: "Booking(s) returned successfully.",
            bookings: bookings
        });

    } catch (error) {
        logger.error("Error getting booking(s) by endTimestamp: " + error);
        return res.status(500).json({
            error: "Internal server error"
        });
    }
}


/**
 * Summary: Gets all bookings
 *
 * @param {express.Request} req - Express request object containing registration data.
 * @param {express.Response} res - Express response object for sending status and data.
 * @returns {void}
 * @throws {Error} If input validation fails or database error occurs.
 * @example
 * GET /bookings
 * getAllBookings(req, res);
 */
const getAllBookings = async (req, res) => {
    
    try {
        // Get all bookings
        const bookingsSnapshot = await db.collection("bookings").get();

        if (bookingsSnapshot.empty) {
            return res.status(404).json({ error: "No bookings in database." });
        }

        const bookings = []

        bookingsSnapshot.forEach(booking => {
            bookings.push({
                id: booking.id,
                ...booking.data()
            });
        })

        // Success
        return res.status(200).json({
            bookings: bookings
        });

    } catch (error) {
        logger.error("Error getting all bookings: " + error);
        return res.status(500).json({
            error: "Internal server error"
        });
    }
}


/**
 * Summary: Updates booking by their id
 *
 * @param {express.Request} req - Express request object containing registration data.
 * @param {express.Response} res - Express response object for sending status and data.
 * @returns {void}
 * @throws {Error} If input validation fails or database error occurs.
 * @example
 * PATCH /bookings
 * updateBooking(req, res);
 */
const updateBooking = async (req, res) => {
    const { id } = req.params;
    const { name, userId, deskId, startTimestamp, endTimestamp } = req.body;
    try {
        // Validation
        if (!id) {
            return res.status(400).json({ error: "id is required." });
        }

        // Save old data
        const oldBookingSnapshot = await db.collection("bookings").doc(id).get();

        if (!oldBookingSnapshot.exists) {
            return res.status(400).json({
                error: "Booking does not exist."
            })
        }

        const oldData = oldBookingSnapshot.data();

        // Ensure only update the specified parameters
        const updateData = {};
        if (name != undefined) updateData.name = name;
        if (userId != undefined) updateData.userId = userId;
        if (deskId != undefined) updateData.deskId = deskId;
        if (startTimestamp != undefined) updateData.startTimestamp = startTimestamp;
        if (endTimestamp != undefined) updateData.endTimestamp = endTimestamp;
        if (oldData) updateData.oldModifications = oldData;
        updateData.updatedAt = new Date();

        // Update booking with the specified information
        const bookingRef = db.collection("bookings").doc(id);
        await bookingRef.update(updateData);

        const bookingSnapshot = await bookingRef.get(); // Get for validation and return

        if (!bookingSnapshot.exists) {
            return res.status(404).json({ error: "No booking with id " + id + " found." });
        }

        // Success
        return res.status(200).json({
            message: "Booking updated successfully.",
            booking: {
                id: bookingSnapshot.id,
                ...bookingSnapshot.data()
            }
        });

    } catch (error) {
        logger.error("Error updating booking: " + error);
        return res.status(500).json({
            error: "Internal server error"
        });
    }
}


/**
 * Summary: Cancels booking but keeps it in the database
 *
 * @param {express.Request} req - Express request object containing registration data.
 * @param {express.Response} res - Express response object for sending status and data.
 * @returns {void}
 * @throws {Error} If input validation fails or database error occurs.
 * @example
 * PATCH /bookings
 * cancelBooking(req, res);
 */
const cancelBooking = async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    try {
        // Validation
        if (!id) {
            return res.status(400).json({ error: "id is required." });
        }

        // Ensure only update the specified parameters
        const updateData = {};
        updateData.status = "cancelled";
        if (reason) updateData.cancellationReason = reason;
        updateData.cancelledAt = new Date();

        // Update booking with the specified information
        const bookingRef = db.collection("bookings").doc(id);
        await bookingRef.update(updateData);

        const bookingSnapshot = await bookingRef.get(); // Get for validation and return

        if (!bookingSnapshot.exists) {
            return res.status(404).json({ error: "No booking with id " + id + " found." });
        }

        // Success
        return res.status(200).json({
            message: "Booking cancelled successfully.",
            booking: {
                id: bookingSnapshot.id,
                ...bookingSnapshot.data()
            }
        });

    } catch (error) {
        logger.error("Error cancelling booking: " + error);
        return res.status(500).json({
            error: "Internal server error"
        });
    }
}


/**
 * Summary: Deletes booking by their id (ONLY FOR ADMIN)
 *
 * @param {express.Request} req - Express request object containing registration data.
 * @param {express.Response} res - Express response object for sending status and data.
 * @returns {void}
 * @throws {Error} If input validation fails or database error occurs.
 * @example
 * DELETE /bookings
 * deleteBooking(req, res);
 */
const deleteBooking = async (req, res) => {
    const { id } = req.params;
    try {
        // Validation
        if (!id) {
            return res.status(400).json({ error: "id is required." });
        }

        // Update bookings with the specified information
        const bookingRef = db.collection("bookings").doc(id);

        const bookingSnapshot = await bookingRef.get(); // Get for validation
        if (!bookingSnapshot.exists) {
            return res.status(404).json({ error: "No booking with id " + id + " found." });
        }

        bookingRef.delete();

        // Success
        return res.status(200).json({
            message: "Booking deleted successfully.",
        });

    } catch (error) {
        logger.error("Error deleting booking: " + error);
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
 * POST /controller
 * setAdmin(req, res);
 */
const setAdmin = async (req, res) => {
  // We identify the user to be promoted by their email in the request body
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required in the request body.' });
  }

  try {
    // Find the user in Firebase Auth by their email
    const user = await adminAuth.getUserByEmail(email);

    // Set the custom claim. This will overwrite any existing claims.
    await adminAuth.setCustomUserClaims(user.uid, { admin: true });

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
                getUsersByName, 
                getBookingById, 
                getBookingByStartTimestamp, 
                getBookingByEndTimestamp, 
                getAllBookings, 
                updateBooking, 
                cancelBooking, 
                deleteBooking,
                setAdmin
            }