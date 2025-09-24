// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import BookingPage from './BookingPage.jsx'; // Import the BookingPage component
import Login from './Login.jsx'; // Import the Login component
import AdminPage from './AdminPage.jsx'; // Import the AdminPage component
import './index.css';


// Change BookingPage to login to view the login page and vice versa 
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Login />
  </StrictMode>,
);