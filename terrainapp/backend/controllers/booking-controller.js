const logger = require("../logger.js")
const express = require("express");
const { db } = require("../config/firebase.js");

/**
 * Summary: Creates a booking.
 *
 * @param {express.Request} req - Express request object containing registration data.
 * @param {express.Response} res - Express response object for sending status and data.
 * @returns {void}
 * @throws {Error} If input validation fails or database error occurs.
 * @example
 * POST /bookings
 * createBooking(req, res);
 */
const createBooking = async (req, res) => {
    const { name, userId, deskId, startTimestamp, endTimestamp } = req.body;
    
    try {
        // Validation
        if (!name || !userId || !deskId || !startTimestamp || !endTimestamp) {
            return res.status(400).json({
                error: "Name, userId, deskId, startTimestamp, and endTimestamp are required."
            });
        }

        // In case it's passed as a string
        const startDT = new Date(startTimestamp);
        const endDT = new Date(endTimestamp)

        // Check if there is already a booking
        const bookingsSnapshot = await db.collection("bookings")
                                    .where("deskId", "==", deskId)
                                    .where("status", "==", "active")
                                    .where("startTimestamp", "<", endDT)
                                    .get();

        let hasConflict = false;
        let conflictingId = null;

        bookingsSnapshot.forEach(booking => {
            if(booking.data().endTimestamp.toDate() > startDT) {
                hasConflict = true;
                conflictingId = booking.id;
                return; // Exit foreach loop
            }
        })

        if (hasConflict) {
            return res.status(400).json({
                error: "Conflicting booking with existing booking: " + conflictingId
            });
        }

        // Add booking to "bookings" collection
        const bookingRef = await db.collection("bookings").add({
            name: name,
            userId: userId,
            deskId: deskId,
            startTimestamp: startDT,
            endTimestamp: endDT,
            status: "active",
            createdAt: new Date()
        });

        // Success
        return res.status(201).json({
            message: "Booking created successfully.",
            booking: {
                id: bookingRef.id,
                name: name,
                userId: userId,
                deskId: deskId,
                startTimestamp: startDT,
                endTimestamp: endDT,
                status: "active"
            }
        });

    } catch (error) {
        logger.error("Error creating booking: " + error);
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
const getBookingsByName = async (req, res) => {
    const { name } = req.params;
    
    try {
        // Validation
        if (!name) {
            return res.status(400).json({
                error: "Name is required."
            });
        }

        // Get bookings
        const bookingsSnapshot = await db.collection("bookings").where("name", "==", name).get();

        if (bookingsSnapshot.empty) {
            return res.status(404).json({ error: "No booking(s) found." });
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
            message: bookings.length + " booking(s) returned successfully.",
            bookings: bookings
        });

    } catch (error) {
        logger.error("Error getting booking(s) by name: " + error);
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
    const { startTimestamp, deskId } = req.body;

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
    const { endTimestamp, deskId } = req.body;

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
            message: "Successfully returned all bookings.",
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
                error: "Delete booking can only be done by admin."
            })
        }

        // Delete booking
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

module.exports = { createBooking, getBookingsByName, getBookingById, getBookingByStartTimestamp, getBookingByEndTimestamp, getAllBookings, updateBooking, cancelBooking, deleteBooking }