// backend/server.js
const express = require('express');
const cors = require('cors');
const functions = require('firebase-functions');

// Routers
const bookingRoutes = require('./routers/booking-router');
const userRoutes = require('./routers/user-router');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
  });
});

// Mount routers
// Keep existing singular path…
app.use('/api/booking', bookingRoutes);
// add plural alias to satisfy tests/CI:
app.use('/api/bookings', bookingRoutes);

app.use('/api/user', userRoutes);

// Export for Firebase Functions
exports.app = functions.https.onRequest(app);

// Also export the Express app (handy for tests)
module.exports = app;

// Start a local server only if this file is run directly
if (require.main === module) {
  const PORT = process.env.PORT || 6969;
  app.listen(PORT, () => {
    console.log(`Node backend on port: ${PORT}`);
  });
}