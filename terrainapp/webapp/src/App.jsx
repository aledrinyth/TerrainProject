// webapp/src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

// Page Components
import Login from './Login.jsx';
import BookingPage from './BookingPage.jsx';
import AdminPage from './AdminPage.jsx';
import CustomerBookingPOV from './CustomerBookingPOV.jsx'; // Import the new page

// Protected Route Component
import ProtectedRoute from '../components/ProtectedRoute.jsx';

export default function App() {
  const { loading } = useAuth();

  // Prevents a flicker of the login page if the user is already logged in
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/my-bookings" element={<CustomerBookingPOV />} /> {/* New route added */}
        <Route path="/admin" element={<AdminPage />} />
      </Route>
    </Routes>
  );
}