import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { bookingService } from './services/bookingService';

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

function fireTimestampToDate(ts) {
  if (!ts) return new Date();
  if (typeof ts === "object" && "_seconds" in ts) {
    return new Date(ts._seconds * 1000);
  }
  return new Date(ts);
}

function formatDate(dateTimestamp) {
  const date = fireTimestampToDate(dateTimestamp);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayName = days[date.getDay()];
  const monthName = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return `${dayName}, ${day} ${monthName} ${year}`;
}

function formatDateTime(ts) {
  const date = fireTimestampToDate(ts)
  if (isNaN(date.getTime())) return "Invalid date";
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthName = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${monthName} ${year}, ${hours}:${minutes}`;
  ;
}

export default function AdminPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();
  const { signout } = useAuth();

  // Handler for logging out and redirecting to the login page
  const handleLogout = async () => {
    try {
      await signout();
      navigate('/login');
    } catch (err) {
      alert("Logout failed. Please try again.");
    }
  };

  // Fetch all bookings
  async function fetchBookings() {
    try {
      setLoading(true);
      setError(null);

      // Fetch bookings from the booking service
      const response = await bookingService.getAllBookings();

      // Sort bookings by dateTimestamp (latest first)
      const sorted = (response.bookings ?? []).sort(
        (a, b) => fireTimestampToDate(b.dateTimestamp) - fireTimestampToDate(a.dateTimestamp)
      );
      setBookings(sorted);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError("Failed to fetch bookings. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Admin cancel handlers (mirroring CustomerBookingPOV behavior)
  const handleDeleteClick = (booking) => setDeleteConfirm(booking);

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    setError(null);
    try {
      await bookingService.cancelBooking(deleteConfirm.id, "Cancelled by admin");
      setDeleteConfirm(null);
      await fetchBookings();
    } catch (err) {
      console.error("Error cancelling booking:", err);
      setError("Failed to cancel booking.");
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => setDeleteConfirm(null);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen font-sans bg-gray-100 p-4 pt-24">
      <header className="absolute top-[24px] left-[34px] flex items-center w-[calc(100vw-68px)] justify-between pr-20">
        <Logo />
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-400 text-white rounded-lg hover:bg-red-500 transition-colors font-sans font-semibold"
        >
          Logout
        </button>
      </header>

      {/* Reserve space for header and center content in the remaining viewport */}
      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-144px)] pt-[144px] p-4">
        <h1 className="text-3xl font-bold mb-8 mt-0 font-mono">
          Admin: Current Bookings
        </h1>

        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-md border border-gray-200 p-8 overflow-x-auto">
          {loading ? (
            <div className="text-center text-gray-500 py-8">Loading...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">{error}</div>
          ) : (
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-200">
                  {/* Booking ID removed */}
                  <th className="px-4 py-3 text-left font-mono">Customer Name</th>
                  <th className="px-4 py-3 text-left font-mono">Seat</th>
                  <th className="px-4 py-3 text-left font-mono">Date Of Booking</th>
                  <th className="px-4 py-3 text-left font-mono">Booked At</th>
                  <th className="px-4 py-3 text-left font-mono">Status</th>
                  <th className="px-4 py-3 text-left font-mono">Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500 font-mono">
                      No bookings found.
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => {
                    const dateOfBooking = formatDate(b.startTimestamp);
                    const isCancelled = (b.status || "").toLowerCase() === "cancelled";
                    return (
                      <tr key={b.id} className={`hover:bg-sky-50 transition ${isCancelled ? 'opacity-60' : ''}`}>
                        <td className="px-4 py-2 font-mono">{b.name}</td>
                        <td className="px-4 py-2 font-mono">{b.deskId}</td>
                        <td className="px-4 py-2 font-mono">{dateOfBooking}</td>
                        <td className="px-4 py-2 font-mono">{formatDateTime(b.createdAt)}</td>
                        <td className="px-4 py-2 font-mono">{b.status || "active"}</td>
                        <td className="px-4 py-2 font-mono">
                          <button
                            onClick={() => handleDeleteClick(b)}
                            className={`px-3 py-1 rounded text-sm transition ${
                              isCancelled
                                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                                : "bg-red-500 hover:bg-red-600 text-white"
                            }`}
                            disabled={deleting || isCancelled}
                          >
                            {deleting && deleteConfirm?.id === b.id ? "Cancelling..." : "Cancel"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4 text-center">
              Cancel booking for {formatDate(deleteConfirm.dateTimestamp)}?
            </h3>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleConfirmDelete}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded transition"
                disabled={deleting}
              >
                {deleting ? "Cancelling..." : "Confirm"}
              </button>
              <button
                onClick={handleCancelDelete}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded transition"
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