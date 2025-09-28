import React from 'react';
import { useState, useEffect } from 'react';

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
 * Summary: Calculate duration between start and end times.
 * @param {*} start - start time in "HH:MM" format
 * @param {*} end - end time in "HH:MM" format
 * @returns {string} - duration in "Xh Ym" format
 */
function getDuration(start, end) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let startMins = sh * 60 + sm;
  let endMins = eh * 60 + em;
  if (endMins < startMins) endMins += 24 * 60; // overnight booking
  const mins = endMins - startMins;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h > 0 ? `${h}h` : ""} ${m > 0 ? `${m}m` : ""}`.trim();
}

/**
 * Summary: AdminPage component to display current bookings in a table format.
 * @returns {JSX.Element} AdminPage component displaying current bookings in a table.
 */
export default function AdminPage() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    // In real app, fetch bookings from API here
    // For now, use mock data sorted by createdAt (latest first)
    const sorted = [...mockBookings].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    setBookings(sorted);
  }, []);

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
              <th className="px-4 py-3 text-left font-mono">User ID</th>
              <th className="px-4 py-3 text-left font-mono">Desk</th>
              <th className="px-4 py-3 text-left font-mono">Seat</th>
              <th className="px-4 py-3 text-left font-mono">Start Time</th>
              <th className="px-4 py-3 text-left font-mono">End Time</th>
              <th className="px-4 py-3 text-left font-mono">Duration</th>
              <th className="px-4 py-3 text-left font-mono">Booked At</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500 font-mono">
                  No bookings found.
                </td>
              </tr>
            ) : (
              bookings.map((b) => (
                <tr key={b.id} className="hover:bg-sky-50 transition">
                  <td className="px-4 py-2 font-mono">{b.id}</td>
                  <td className="px-4 py-2 font-mono">{b.userId}</td>
                  <td className="px-4 py-2 font-mono">{b.desk}</td>
                  <td className="px-4 py-2 font-mono">{b.seatNumber}</td>
                  <td className="px-4 py-2 font-mono">{b.startTime}</td>
                  <td className="px-4 py-2 font-mono">{b.endTime}</td>
                  <td className="px-4 py-2 font-mono">{getDuration(b.startTime, b.endTime)}</td>
                  <td className="px-4 py-2 font-mono">{new Date(b.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}