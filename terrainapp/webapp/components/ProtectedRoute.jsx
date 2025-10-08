import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    // Display a loading message while authentication status is being checked
    return <div>Loading...</div>;
  }

  // If the user is authenticated, render the child route (e.g., BookingPage).
  // Otherwise, redirect them to the login page.
  return user ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;