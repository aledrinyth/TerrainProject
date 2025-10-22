export const TEST_USERS = {
  admin: {
    email: 'admin@gmail.com',        
    password: 'admin123',          
    displayName: 'Admin User',
  },
  regularUser: {
    email: 'test@gmail.com',         
    password: 'test123',          
    displayName: 'Test User',
  },
};

export const TEST_BOOKING = {
  date: '2026-10-30', 
  startTime: '09:00',
  endTime: '17:00',
  deskId: '1',
};

export const TEST_DESK = {
  name: 'Desk A',
  seats: 4,
  roomId: 'Room1',
  positionX: 10,
  positionY: 20,
};

// API endpoints 
export const API_BASE_URL = 'http://localhost:6969/api';
export const APP_BASE_URL = 'http://localhost:5173';