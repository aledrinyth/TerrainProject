import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { bookingService } from './services/bookingService';

const Logo = () => (
  <img width="557" height="104" src="/terrain.svg" alt="Terrain Logo" />
);

function fireTimestampToDate(ts) {
  if (!ts) return new Date();
  if (typeof ts === "object" && "_seconds" in ts) {
    return new Date(ts._seconds * 1000);
  }
  return new Date(ts);
}

function formatDate(dateInput) {
  const date = fireTimestampToDate(dateInput);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = days[date.getDay()];
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${dayName}, ${day}/${month}`;
}

export default function CustomerBookingPOV() {
  const [bookings, setBookings] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const { user, signout } = useAuth();

  const currentUserName = user?.displayName || user?.email?.split('@')[0] || 'User';

  async function fetchBookings() {
    setLoading(true);
    setError(null);
    try {
      if (!currentUserName) {
        setBookings([]);
        setError("No user found.");
        setLoading(false);
        return;
      }
      const res = await bookingService.getBookingsByName(currentUserName);
      const data = res.bookings || [];
      const sorted = [...data].sort(
        (a, b) => fireTimestampToDate(b.dateTimestamp) - fireTimestampToDate(b.dateTimestamp)
      );
      setBookings(sorted);
    } catch (err) {
      // If 404, treat as no bookings, not as error.
      if (err?.message?.includes('404')) {
        setBookings([]);
      } else {
        setError("Failed to fetch bookings.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line
  }, [currentUserName]);

  const handleDeleteClick = (booking) => setDeleteConfirm(booking);

  // Use cancelBooking for customers
  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    setError(null);
    try {
      await bookingService.cancelBooking(deleteConfirm.id, "Cancelled by user");
      setDeleteConfirm(null);
      await fetchBookings();
    } catch (err) {
      setError("Failed to cancel booking.");
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => setDeleteConfirm(null);

  const handleNavigateToBooking = () => navigate('/booking');

  const handleLogout = async () => {
    try {
      await signout();
      navigate('/login');
    } catch (err) {
      alert("Logout failed. Please try again.");
    }
  };

  // Only show active (not cancelled) bookings
  const activeBookings = bookings.filter(b => b.status !== "cancelled");

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen font-gt-america bg-terrain-white p-4 pt-24">
      <header className="absolute top-[24px] left-[34px] flex items-center w-[calc(100vw-68px)] justify-between pr-20">
        <Logo />
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-terrain-blue text-white rounded-lg hover:bg-opacity-90 hover-cursor-green transition-colors font-gt-america"
          style={{marginRight: '16px'}}
        >
          Logout
        </button>
      </header>
      <h1 className="text-3xl font-bold mb-12 mt-8 font-gt-america">My Bookings</h1>
      <button
        onClick={handleNavigateToBooking}
        className="px-6 py-3 bg-terrain-blue text-white rounded-lg hover:bg-opacity-90 hover-cursor-green transition-colors font-semibold mb-8 font-gt-america" 
      >
        Create New Booking
      </button>
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-md border border-gray-200 p-8">
        {loading ? (
          <div className="text-center text-gray-500 py-8 font-gt-america">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-8 font-gt-america">{error}</div>
        ) : (
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-200">
                <th className="px-4 py-3 text-left font-gt-america">Date</th>
                <th className="px-4 py-3 text-left font-gt-america">Desk</th>
                <th className="px-4 py-3 text-left font-gt-america">Action</th>
              </tr>
            </thead>
            <tbody>
              {activeBookings.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-8 text-gray-500 font-gt-america">
                    No bookings found.
                  </td>
                </tr>
              ) : (
                activeBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-terrain-green hover:bg-opacity-20 transition">
                    <td className="px-4 py-2 font-gt-america">{formatDate(b.dateTimestamp)}</td>
                    <td className="px-4 py-2 font-gt-america">{b.deskId || b.desk || b.seatNumber}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleDeleteClick(b)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition font-gt-america"
                        disabled={deleting}
                      >
                        {deleting && deleteConfirm?.id === b.id ? "Cancelling..." : "Cancel"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4 text-center font-gt-america">
              Cancel booking for {formatDate(deleteConfirm.dateTimestamp)}?
            </h3>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleConfirmDelete}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded transition font-gt-america"
                disabled={deleting}
              >
                {deleting ? "Cancelling..." : "Confirm"}
              </button>
              <button
                onClick={handleCancelDelete}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded transition font-gt-america"
                disabled={deleting}
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