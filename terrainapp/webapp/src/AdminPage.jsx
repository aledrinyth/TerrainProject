import React from 'react';
import { useState, useEffect } from 'react';
import { bookingService } from './services/bookingService';

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
 * Summary: Calculate duration between start and end times.
 * @param {*} start - start time in "HH:MM" format
 * @param {*} end - end time in "HH:MM" format
 * @returns {string} - duration in "Xh Ym" format
 */
function getDuration(start, end) {
  if (typeof start !== "string" || typeof end !== "string") return "";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return "";
  let startMins = sh * 60 + sm;
  let endMins = eh * 60 + em;
  if (endMins < startMins) endMins += 24 * 60; // overnight booking
  const mins = endMins - startMins;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h > 0 ? `${h}h` : ""} ${m > 0 ? `${m}m` : ""}`.trim();
}

function formatToHHMM(ts) {
  let date;
  if (!ts) return "N/A";
  if (typeof ts === "number") {
    date = new Date(ts);
  } else if (typeof ts === "object" && "_seconds" in ts) {
    date = new Date(ts._seconds * 1000);
  } else if (typeof ts === "string") {
    date = new Date(ts);
  } else {
    return "N/A";
  }
  return isNaN(date.getTime())
    ? "Invalid date"
    : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

/**
 * Summary: AdminPage component to display current bookings in a table format.
 * @returns {JSX.Element} AdminPage component displaying current bookings in a table.
 */
export default function AdminPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch bookings from the booking service
        const response = await bookingService.getAllBookings();

        // Sort bookings by createdAt (latest first)
        const sorted = (response.bookings ?? []).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setBookings(sorted);
      } catch (err) {
        console.error("Error fetching bookings:", err);
        setError("Failed to fetch bookings. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

    function formatDateTime(ts) {
    let date;
    if (!ts) return "N/A";
    if (typeof ts === "number") {
      date = new Date(ts);
    } else if (typeof ts === "object" && "_seconds" in ts) {
      date = new Date(ts._seconds * 1000);
    } else if (typeof ts === "string") {
      date = new Date(ts);
    } else {
      return "N/A";
    }
    return isNaN(date.getTime()) ? "Invalid date" : date.toLocaleString();
  }

  function formatTime(timestampObj) {
  let date;
  if (!timestampObj) return "N/A";
  if (typeof timestampObj === "number") {
    // If stored as milliseconds
    date = new Date(timestampObj);
  } else if (
    typeof timestampObj === "object" &&
    "_seconds" in timestampObj
  ) {
    date = new Date(timestampObj._seconds * 1000);
  } else if (typeof timestampObj === "string") {
    date = new Date(timestampObj);
  } else {
    return "N/A";
  }
  return isNaN(date.getTime()) ? "Invalid date" : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}
        

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen font-sans bg-gray-100 p-4 pt-24">
      {/* Logo header positioned absolutely like in BookingPage.jsx */}
      <header className="absolute top-[24px] left-[34px]">
        <Logo />
      </header>
      <h1 className="text-3xl font-bold mb-12 mt-8 font-mono">Admin: Current Bookings</h1>

      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-md border border-gray-200 p-8">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-200">
              <th className="px-4 py-3 text-left font-mono">Booking ID</th>
              <th className="px-4 py-3 text-left font-mono">Name</th>
              <th className="px-4 py-3 text-left font-mono">Desk</th>
              {/* <th className="px-4 py-3 text-left font-mono">Seat</th> */}
              <th className="px-4 py-3 text-left font-mono">Start Time</th>
              <th className="px-4 py-3 text-left font-mono">End Time</th>
              <th className="px-4 py-3 text-left font-mono">Duration</th>
              <th className="px-4 py-3 text-left font-mono">Booked At</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500 font-mono">
                  No bookings found.
                </td>
              </tr>
            ) : (
              bookings.map((b) => {
                // Use correct property names per your Firestore structure
                const startTime = formatToHHMM(b.startTimestamp);
                const endTime = formatToHHMM(b.endTimestamp);
                const duration = getDuration(startTime, endTime);
                return (
                  <tr key={b.id} className="hover:bg-sky-50 transition">
                    <td className="px-4 py-2 font-mono">{b.id}</td>
                    <td className="px-4 py-2 font-mono">{b.userId}</td>
                    <td className="px-4 py-2 font-mono">{b.deskId}</td>
                    {/* REMOVED SEAT FIELD */}
                    <td className="px-4 py-2 font-mono">{startTime}</td>
                    <td className="px-4 py-2 font-mono">{endTime}</td>
                    <td className="px-4 py-2 font-mono">{duration}</td>
                    <td className="px-4 py-2 font-mono">{formatDateTime(b.createdAt)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}