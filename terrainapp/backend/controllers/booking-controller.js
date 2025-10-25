const logger = require("../logger.js")
const express = require("express");
const { db } = require("../config/firebase.js");
const { getAuth } = require("firebase-admin/auth");
const ics = require("ics")

/**
 * Summary: Creates a booking.
 *
 * @param {express.Request} req - Express request object containing registration data.
 * @param {express.Response} res - Express response object for sending status and data.
 * @returns {void}
 * @throws {Error} If input validation fails or database error occurs.
 * @example
 * POST /booking
 * createBooking(req, res);
 */
const createBooking = async (req, res) => {
    const { name, userId, deskId, dateTimestamp } = req.body;
    
    try {
        // Validation
        if (!name || !userId || !deskId || !dateTimestamp) {
            return res.status(400).json({
                error: "Name, userId, deskId, and dateTimestamp are required."
            });
        }

        // In case it's passed as a string
        const dateDT = new Date(dateTimestamp);

        // Check if date is valid
        if (isNaN(dateDT)) {
            return res.status(400).json({
                error: "Invalid dateTimestamp."
            });
        }

        // Normalize to start of day for date-only comparison
        const startOfDay = new Date(dateDT.getFullYear(), dateDT.getMonth(), dateDT.getDate());
        const endOfDay = new Date(dateDT.getFullYear(), dateDT.getMonth(), dateDT.getDate() + 1);

        // Check if there is already a booking for this desk on this day
        const bookingsSnapshot = await db.collection("bookings")
                                    .where("deskId", "==", deskId)
                                    .where("status", "==", "active")
                                    .where("dateTimestamp", ">=", startOfDay)
                                    .where("dateTimestamp", "<", endOfDay)
                                    .get();

        let hasConflict = false;
        let conflictingId = null;

        if (!bookingsSnapshot.empty) {
            const firstDoc = bookingsSnapshot.docs[0];
            hasConflict = true;
            conflictingId = firstDoc.id;
        }

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
            dateTimestamp: dateDT,
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
                dateTimestamp: dateDT,
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
 * GET /booking
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
 * GET /booking
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
 * Summary: Gets bookings by date
 *
 * @param {express.Request} req - Express request object containing registration data.
 * @param {express.Response} res - Express response object for sending status and data.
 * @returns {void}
 * @throws {Error} If input validation fails or database error occurs.
 * @example
 * GET /booking
 * getBookingsByDate(req, res);
 */
const getBookingsByDate = async (req, res) => {
    const { dateTimestamp } = req.query;

    try {
        // Validation
        if (!dateTimestamp) {
            return res.status(400).json({
                error: "Date timestamp is required."
            });
        }

        // In case it's passed as a string
        const dateDT = new Date(dateTimestamp);

        // Check if date is valid
        if (isNaN(dateDT)) {
            return res.status(400).json({
                error: "Invalid dateTimestamp."
            });
        }

        // Normalize to start of day for date-only comparison
        const startOfDay = new Date(dateDT.getFullYear(), dateDT.getMonth(), dateDT.getDate());
        const endOfDay = new Date(dateDT.getFullYear(), dateDT.getMonth(), dateDT.getDate() + 1);

        // Get bookings for the entire day
        const bookingSnapshot = await db.collection("bookings")
                                         .where("dateTimestamp", ">=", startOfDay)
                                         .where("dateTimestamp", "<", endOfDay)
                                         .get();

        if (bookingSnapshot.empty) {
            return res.status(200).json({ message: "No bookings found." });
        }

        // Returning all bookings with the date
        const bookings = [];
        
        bookingSnapshot.forEach(booking => {
            bookings.push({
                id: booking.id,
                ...booking.data()
            });
        });

        // Success
        return res.status(200).json({
            message: "Booking(s) returned by date successfully.",
            bookings: bookings
        });


    } catch (error) {
        logger.error("Error getting bookings by date: " + error);
        return res.status(500).json({
            error: "Internal server error."
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
 * GET /booking
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
 * PATCH /booking
 * updateBooking(req, res);
 */
const updateBooking = async (req, res) => {
    const { id } = req.params;
    const { name, userId, deskId, dateTimestamp } = req.body;
    try {
        // Validation
        if (!id) {
            return res.status(400).json({ error: "id is required." });
        }

        // In case it's passed as a string
        const dateDT = new Date(dateTimestamp);

        // Check if date is valid
        if (dateTimestamp != undefined && isNaN(dateDT)) {
            return res.status(400).json({
                error: "Invalid dateTimestamp."
            });
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
        if (dateTimestamp != undefined) updateData.dateTimestamp = dateDT;
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
 * PATCH /booking
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
 * DELETE /booking
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

/**
 * Summary: Retrieves the latest booking made by the user and creates an ICS file to be downloaded
 *
 * @param {express.Request} req - Express request object, expects the 'userID' in the URL parameters
 * @param {express.Response} res - Express response object for sending status and data.
 * @returns {void}
 * @throws {Error} If input validation fails or if database returns an error.
 * @example
 * GET /booking
 * generateICSFileforBooking(req, res);
 */
const generateICSFileforBooking = async ( req, res ) => {

    try{
        const { userId } = req.params;

        // Get the users latest booking based on userID
        const latestBookingSnapshot = await db.collection("bookings")
                                    .where("userId", "==", userId)
                                    .orderBy("createdAt", "desc")
                                    .limit(1)
                                    .get();

        // Check if the query returned anything
        if (latestBookingSnapshot.empty) {
            return res.status(404).json({ error: "Failed to retrieve data for creation of ICS file, " + userId + " not found." });
        }

        // Get the first document in the result set
        const latestDoc = latestBookingSnapshot.docs[0];

        // Extract the data as key value pairs
        const latestBookingData = latestDoc.data();

        // Get the booking date
        const bookingDate = latestBookingData.dateTimestamp.toDate();

        // Extract the data needed for the creation of the ICS file
        const booking = {
            title: "Desk Booking",
            description: "Desk booking at TERRAIN",
            location: "101-103 Brunswick St, Fitzroy VIC 3065",
            start: [bookingDate.getFullYear(), bookingDate.getMonth() + 1, bookingDate.getDate()],
            status: 'CONFIRMED'
        }

        // Create ICS event string
        const { error, value } = ics.createEvent(booking);
        
        if(error){
            return res.status(500).json({ error: "Failed to create ics file."});
        }

        // Set the correct headers to trigger a file download
        res.setHeader('Content-Type', 'text/calendar');
        res.setHeader('Content-Disposition', 'attachment; filename="booking.ics"');

        // Send the generated ICS file as the response
        return res.status(200).send(value);
    }
    catch (err) {
        logger.error(err, "Error in generateICSFileforBooking");
        return res.status(500).json({error: "An internal server error occured. "})
    }
}

module.exports = { createBooking, getBookingsByName, getBookingById, getBookingsByDate, getAllBookings, updateBooking, cancelBooking, deleteBooking, generateICSFileforBooking }
