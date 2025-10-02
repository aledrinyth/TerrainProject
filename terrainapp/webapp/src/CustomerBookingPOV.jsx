import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Summary: Reused Logo component to display the Terrain logo.
 * @returns {JSX.Element}
 */
const Logo = () => {
  return (
    <img
      width="557"
      height="104"
      src="/terrain.svg"
      alt="Terrain Logo"
    />
  );
};

/**
 * Mock bookings data for demonstration purposes.
 */
const mockBookings = [
  {
    id: 1,
    userId: "user_0101",
    desk: "DESK 1",
    seatNumber: 2,
    startTime: "09:00",
    endTime: "11:00",
    createdAt: "2025-09-24T01:30:00Z",
  },
  {
    id: 2,
    userId: "user_0202",
    desk: "DESK 2",
    seatNumber: 3,
    startTime: "10:00",
    endTime: "13:00",
    createdAt: "2025-09-24T03:00:00Z",
  },
  {
    id: 3,
    userId: "user_333",
    desk: "DESK 1",
    seatNumber: 1,
    startTime: "08:00",
    endTime: "10:00",
    createdAt: "2025-09-24T00:50:00Z",
  },
];

/**
 * Summary: Format date to "Day, MM/DD" format.
 * @param {string} dateString - ISO date string
 * @returns {string} - formatted date string
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = days[date.getDay()];
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${dayName}, ${month}/${day}`;
}

/**
 * Summary: CustomerBookingPOV component to display customer bookings with delete functionality.
 * @returns {JSX.Element} CustomerBookingPOV component displaying bookings in a table.
 */
export default function CustomerBookingPOV() {
  const [bookings, setBookings] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // In real app, fetch bookings from API here
    // For now, use mock data sorted by createdAt (latest first)
    const sorted = [...mockBookings].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    setBookings(sorted);
  }, []);

  const handleDeleteClick = (booking) => {
    setDeleteConfirm(booking);
  };

  const handleConfirmDelete = () => {
    setBookings(bookings.filter(b => b.id !== deleteConfirm.id));
    setDeleteConfirm(null);
  };

  const handleCancelDelete = () => {
    setDeleteConfirm(null);
  };
  
  // Dummy logout function
  const handleLogout = () => {
    // Implement actual logout logic here, e.g., clearing tokens and redirecting
    alert("Logged out!");
  };
  // Navigate to booking page (no routing yet)
  const handleNavigateToBooking = () => {
    navigate('/booking');
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen font-sans bg-gray-100 p-4 pt-24">
      <header className="absolute top-[24px] left-[34px] flex items-center w-[calc(100vw-68px)] justify-between pr-20">
        <Logo />
        {/* Logout button moved left, within boundaries */}
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-400 text-white rounded-lg hover:bg-red-500 transition-colors"
          style={{marginRight: '16px'}}
        >
          Logout
        </button>
      </header>      
      <h1 className="text-3xl font-bold mb-12 mt-8 font-mono">My Bookings</h1>
      <button onClick={handleNavigateToBooking} 
      className="px-6 py-3 bg-sky-400 text-white rounded-lg hover:bg-sky-500 transition-colors font-mono font-semibold mb-8">
        Create New Booking
      </button>
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-md border border-gray-200 p-8">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-200">
              <th className="px-4 py-3 text-left font-mono">Date</th>
              <th className="px-4 py-3 text-left font-mono">Chair</th>
              <th className="px-4 py-3 text-left font-mono">Action</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-8 text-gray-500 font-mono">
                  No bookings found.
                </td>
              </tr>
            ) : (
              bookings.map((b) => (
                <tr key={b.id} className="hover:bg-sky-50 transition">
                  <td className="px-4 py-2 font-mono">{formatDate(b.createdAt)}</td>
                  <td className="px-4 py-2 font-mono">{b.seatNumber}</td>
                  <td className="px-4 py-2 font-mono">
                    <button
                      onClick={() => handleDeleteClick(b)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-mono transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Popup */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4 font-mono text-center">
              Delete booking for {formatDate(deleteConfirm.createdAt)}?
            </h3>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleConfirmDelete}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded font-mono transition"
              >
                Confirm
              </button>
              <button
                onClick={handleCancelDelete}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded font-mono transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}