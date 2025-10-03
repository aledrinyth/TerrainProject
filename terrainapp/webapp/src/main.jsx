// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client';
import { Route, Routes, BrowserRouter } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute.jsx'
import BookingPage from './BookingPage.jsx'; // Import the BookingPage component
import Login from './Login.jsx'; // Import the Login component
import AdminPage from './AdminPage.jsx'; // Import the AdminPage component
import CustomerBookingPOV from './CustomerBookingPOV.jsx'; // Import the CustomerBookingPOV component
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminPage />} />
        <Route path="/booking" element={
            <ProtectedRoute>
              <BookingPage />
            </ProtectedRoute>
          } />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);