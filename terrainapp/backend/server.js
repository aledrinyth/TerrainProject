const express = require('express');
const cors = require('cors');
const functions = require('firebase-functions');

// Import router files
const bookingRoutes = require('./routers/booking-router');
const userRoutes = require('./routers/user-router');


const app = express();

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Backend is running',
        timestamp: new Date().toISOString()
    });
});

// Middleware
app.use(cors()); // Enable CORS for frontend communication
app.use(express.json()); // Checks for JSON body in requests
app.use('/api/booking', bookingRoutes);
app.use('/api/user', userRoutes);

// Expose the Express app as a Cloud Function
exports.app = functions.https.onRequest(app);