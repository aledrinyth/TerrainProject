const express = require('express');
const cors = require('cors');

// Import router files
const registerRoutes = require('./routers/register-router');
const deskRoutes = require('./routers/desk-router');
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
app.use('/api/register', registerRoutes);
app.use('/api/desk', deskRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/user', userRoutes);

// Listen for requests
app.listen(6969, () => {
    console.log('Node backend on port: 6969');
})