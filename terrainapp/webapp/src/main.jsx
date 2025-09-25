// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client';
import { Route, Routes, BrowserRouter } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute.jsx'
import BookingPage from './BookingPage.jsx'; // Import the BookingPage component
import Login from './Login.jsx'; // Import the Login component
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/booking" element={
            <ProtectedRoute>
              <BookingPage />
            </ProtectedRoute>
          } />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);