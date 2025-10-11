import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

/**
 * A reusable component for the green/red seat indicators.
 * @returns {JSX.Element} The seat circle element.
 */
const SeatCircle = ({ seatNumber, isBooked, isSelected, onSelect, isLoading }) => {
  // This code block determines the colors based on state
  let bgColor, borderColor, cursor;
  if (isLoading) {
    bgColor = "bg-gray-100";
    borderColor = "border-gray-300";
    cursor = "cursor-wait";
  } else if (isBooked) {
    // Red for booked seats
    bgColor = "bg-red-400";
    borderColor = "border-red-600";
    cursor = "cursor-not-allowed";
  } else if (isSelected) {
    // Indigo for selected seats
    bgColor = "bg-indigo-600";
    borderColor = "border-indigo-800";
    cursor = "cursor-pointer";
  } else {
    // Green/Sky for available seats
    bgColor = "bg-sky-400";
    borderColor = "border-sky-700";
    cursor = "cursor-pointer";
  }

  // The seat circle with the number inside
  return (
    <div
      onClick={() => !isBooked && !isLoading && onSelect(seatNumber)}
      className={[
        "w-16 h-16 rounded-full border-2 transition-all duration-200 hover:scale-110 flex items-center justify-center",
        bgColor,
        borderColor,
        cursor,
        isBooked || isLoading ? "opacity-60" : ""
      ].join(' ')}
      title={
        isLoading ? "Loading..." : 
        isBooked ? "Seat unavailable" : 
        isSelected ? "Click to deselect" : "Click to select"
      }
    >
      {isLoading ? (
        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
      ) : (
        <span className="font-mono text-xl text-white font-bold">{seatNumber}</span>
      )}
    </div>
  );
};

/**
 * Summary: A modal dialog for booking a seat.
 * @returns {JSX.Element|null} The booking modal or null if not open.
 */
const BookingModal = ({ isOpen, onClose, selectedDate, selectedSeats, onBookingSubmit, isSubmitting, currentUser }) => {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [error, setError] = useState("");

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setStartTime("");
      setEndTime("");
      setError("");
    }
  }, [isOpen]);

  // Validate time inputs
  const validateTimes = () => {
    if (!startTime || !endTime) {
      setError("Please select both start and end times");
      return false;
    }
    
    if (endTime <= startTime) {
      setError("End time must be after start time");
      return false;
    }
    
    // Check minimum booking duration (30 minutes)
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffMinutes = (end - start) / (1000 * 60);
    
    if (diffMinutes < 30) {
      setError("Minimum booking duration is 30 minutes");
      return false;
    }
    
    setError("");
    return true;
  };

  const handleSubmit = async () => {
    if (!validateTimes()) return;
    
    const bookingData = {
      seats: selectedSeats,
      date: selectedDate,
      startTime,
      endTime,
      userId: currentUser
    };
    
    try {
      await onBookingSubmit(bookingData);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create booking");
    }
  };

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">New Booking</h2>
        
        {/* Selected seats display */}
        <div className="mb-4">
          <label className="block mb-2 font-semibold">Selected Seats</label>
          <div className="bg-gray-100 p-2 rounded border">
            {selectedSeats.length > 0 ? (
              <span className="text-indigo-600 font-semibold">
                Seats: {selectedSeats.join(', ')}
              </span>
            ) : (
              <span className="text-gray-500">No seats selected</span>
            )}
          </div>
        </div>
        
        {/* Date display (disabled, users select outside modal) */}
        <label className="block mb-2 font-semibold">
          Date
          <input
            type="text"
            className="border p-2 rounded mb-4 block w-full bg-gray-200"
            value={selectedDate || ""}
            disabled
            readOnly
          />
        </label>
        
        {/* Start Time input */}
        <label className="block mb-2 font-semibold">
          Start Time
          <input 
            type="time" 
            className="border p-2 rounded mb-4 block w-full"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </label>
        
        {/* End Time input */}
        <label className="block mb-2 font-semibold">
          End Time
          <input 
            type="time" 
            className="border p-2 rounded mb-4 block w-full"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </label>
        
        {/* Error message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4">
            {error}
          </div>
        )}
        
        <div className="flex gap-4">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            className="px-4 py-2 bg-sky-400 text-white rounded hover:bg-sky-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!startTime || !endTime || selectedSeats.length === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Booking...
              </span>
            ) : (
              "Book Seats"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// A reusable component for an entire desk section.
const Desk = ({ deskName, seatNumberOffset = 0, seatAvailability, selectedSeats, onSeatSelect, isLoading }) => {
  const seatNumbers = [1, 2, 3, 4].map(n => n + seatNumberOffset);
  
  return (
    <div className="w-full md:w-[545px] h-[459px] bg-desk-fill border-2 border-black rounded-26px flex flex-col p-6">
      <h3 className="font-mono text-3xl font-bold text-center mb-6">{deskName}</h3>
      
      <div className="flex-grow flex items-center justify-center gap-8 w-full">
        {/* Left Seats */}
        <div className="flex flex-col gap-12">
          <SeatCircle 
            seatNumber={seatNumbers[0]} 
            isBooked={seatAvailability[seatNumbers[0]] === false}
            isSelected={selectedSeats.includes(seatNumbers[0])}
            onSelect={onSeatSelect}
            isLoading={isLoading}
          />
          <SeatCircle 
            seatNumber={seatNumbers[1]} 
            isBooked={seatAvailability[seatNumbers[1]] === false}
            isSelected={selectedSeats.includes(seatNumbers[1])}
            onSelect={onSeatSelect}
            isLoading={isLoading}
          />
        </div>

        {/* Monitors */}
        <div className="flex gap-4">
          <div className="w-[100px] h-[229px] bg-monitor-fill border-2 border-black rounded-17px"></div>
          <div className="w-[100px] h-[229px] bg-monitor-fill border-2 border-black rounded-17px"></div>
        </div>

        {/* Right Seats */}
        <div className="flex flex-col gap-12">
          <SeatCircle 
            seatNumber={seatNumbers[2]} 
            isBooked={seatAvailability[seatNumbers[2]] === false}
            isSelected={selectedSeats.includes(seatNumbers[2])}
            onSelect={onSeatSelect}
            isLoading={isLoading}
          />
          <SeatCircle 
            seatNumber={seatNumbers[3]} 
            isBooked={seatAvailability[seatNumbers[3]] === false}
            isSelected={selectedSeats.includes(seatNumbers[3])}
            onSelect={onSeatSelect}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Summary: Logo component using a static asset.
 * @returns {JSX.Element} The Logo component element.
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

// Kitchen component
const Kitchen = () => {
  return (
    <div className="w-[150px] h-[459px] bg-gray-200 border-2 border-black rounded-26px flex items-center justify-center">
      <span className="font-mono text-3xl font-bold transform -rotate-90 whitespace-nowrap">Kitchen</span>
    </div>
  );
};

// Success notification component (assuming this was part of the changes on main or a merged branch)
const SuccessNotification = ({ message, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
      <div className="flex items-center gap-2">
        <span>✓</span>
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 text-white hover:text-gray-200">×</button>
      </div>
    </div>
  );
};

/**
 * Summary: The main component for the booking page layout and functionality.
 * @returns {JSX.Element} The BookingPage component.
 */
export default function BookingPage() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [seatAvailability, setSeatAvailability] = useState({});
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  // Use authentication hooks
  const navigate = useNavigate();
  const { user, signout } = useAuth();
  const currentUser = user?.uid || 'unknown';
  const currentUserName = user?.displayName || user?.email?.split('@')[0] || 'User';

  // API base URL, environment variable or hardcoded for now
  const API_BASE_URL = "http://localhost:6969/api";

  // Helper function to create proper local datetime
  const createLocalDateTime = (date, time) => {
    // Create a date object in local timezone (NOT UTC)
    const dateTime = new Date(`${date}T${time}:00`);
    return dateTime;
  };

  // Fetch seat availability for a specific date - ENHANCED to get real booking data
  const fetchSeatAvailability = async (date) => {
    setIsLoadingAvailability(true);
    try {
      const response = await fetch(`${API_BASE_URL}/booking/by-start-time?startTimestamp=${encodeURIComponent(date)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Assume all available on error if not a 404 (or handle 404 response body specifically)
        const fallbackAvailability = {};
        for (let i = 1; i <= 8; i++) {
          fallbackAvailability[i] = true;
        }
        setSeatAvailability(fallbackAvailability);
        return;
      }
      
      const bookingsData = await response.json();
      
      const availability = {};
      const totalSeats = 8;
      
      // Initialize all seats as available
      for (let i = 1; i <= totalSeats; i++) {
        availability[i] = true;
      }
      
      // Mark booked seats as unavailable
      const activeBookings = bookingsData.bookings || [];
      activeBookings.forEach(booking => {
          // Assuming deskId corresponds to the seat number (1-8)
          availability[booking.deskId] = false;
      });
      
      setSeatAvailability(availability);
      
    } catch (error) {
      // Catch network or generic errors
      const fallbackAvailability = {};
      for (let i = 1; i <= 8; i++) {
        fallbackAvailability[i] = true;
      }
      setSeatAvailability(fallbackAvailability);
    } finally {
      setIsLoadingAvailability(false);
    }
  };

  // Handle date selection from calendar input
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    setIsDatePickerOpen(false);
    setSelectedSeats([]); // Clear selected seats when date changes
    
    if (newDate) {
      fetchSeatAvailability(newDate);
    }
  };

  // Handle seat selection/deselection - automatically opens booking modal
  const handleSeatSelect = (seatNumber) => {
    setSelectedSeats(prev => {
      let newSelection;
      if (prev.includes(seatNumber)) {
        // Deselect seat
        newSelection = prev.filter(seat => seat !== seatNumber);
      } else {
        // Select seat (limit to 2 seats per booking)
        if (prev.length >= 2) {
          alert("Maximum 2 seats can be selected per booking");
          return prev;
        }
        newSelection = [...prev, seatNumber].sort((a, b) => a - b);
      }
      
      // Auto-open booking modal when seats are selected
      if (newSelection.length > 0) {
        setIsBookingModalOpen(true);
      } else {
        setIsBookingModalOpen(false);
      }
      
      return newSelection;
    });
  };

  // Handle booking submission - now uses deskId as seat number
  const handleBookingSubmit = async (bookingData) => {
    setIsSubmittingBooking(true);
    try {
      // Create separate bookings for each seat
      const bookingPromises = bookingData.seats.map(async (seatNumber) => {
        const deskId = seatNumber;
        
        // Create proper local datetime objects
        const startDateTime = createLocalDateTime(bookingData.date, bookingData.startTime);
        const endDateTime = createLocalDateTime(bookingData.date, bookingData.endTime);
        
        const requestData = {
          name: currentUserName,
          userId: bookingData.userId,
          deskId: deskId.toString(), // Sending deskId as string
          startTimestamp: startDateTime.toISOString(),
          endTimestamp: endDateTime.toISOString()
        };

        const response = await fetch(`${API_BASE_URL}/booking`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Booking failed for seat ${seatNumber}: ${errorData.error || response.statusText}`);
        }

        return await response.json();
      });

      // Wait for all bookings to complete
      const results = await Promise.all(bookingPromises);
      
      // Show success message
      setSuccessMessage(`Successfully booked ${bookingData.seats.length} seat(s) for ${bookingData.date}`);
      setShowSuccess(true);
      
      // Clear selections and refresh availability
      setSelectedSeats([]);
      if (selectedDate) {
        fetchSeatAvailability(selectedDate);
      }
      
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error; // Re-throw to be handled by modal
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  /**
   * Summary: Handles user logout and navigates to the login page.
   * @returns {void}
   */
  const handleLogout = async () => {
    try {
        await signout();
        navigate('/login');
    } catch (error) {
        console.error("Logout failed:", error);
        alert("Logout failed. Check console for details.");
    }
  };

  /**
   * Summary: Handles navigation to the user's current bookings page.
   * @returns {void}
   */
  const handleViewMyBookings = () => {
    navigate('/my-bookings');
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen font-sans bg-gray-100 p-4 pt-24">
      {/* Success Notification */}
      <SuccessNotification 
        message={successMessage}
        isVisible={showSuccess}
        onClose={() => setShowSuccess(false)}
      />

      {/* The header is positioned absolutely relative to the main container */}
      <header className="absolute top-[24px] left-[34px] flex items-center w-[calc(100vw-68px)] justify-between pr-20">
        <Logo />
        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-400 text-white rounded-lg hover:bg-red-500 transition-colors"
          style={{marginRight: '16px'}}
        >
          Logout
        </button>
      </header>
      
      {/* Date selection controls and action buttons */}
      <div className="flex flex-col items-center gap-4 mb-14">
        <div className="relative">
          <button
            onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            {selectedDate ? `Date: ${selectedDate}` : "Select Date"}
          </button>
          {isDatePickerOpen && (
            <input
              data-testid="date-input"
              type="date"
              className="absolute left-0 top-12 bg-white border p-2 rounded shadow z-10"
              value={selectedDate}
              onChange={handleDateChange}
              min={new Date().toISOString().split('T')[0]}
              autoFocus
              onBlur={() => setIsDatePickerOpen(false)}
            />
          )}
        </div>
        
        {selectedSeats.length > 0 && (
          <div className="text-sm text-gray-600">
            Selected: {selectedSeats.length} seat(s) - {selectedSeats.join(', ')}
          </div>
        )}
        
        <button 
          onClick={() => setIsBookingModalOpen(true)}
          className="px-6 py-2 bg-sky-400 text-white rounded-lg hover:bg-sky-500 transition-colors"
          disabled={!selectedDate || selectedSeats.length === 0}
        >
          New Booking
        </button>
        
        {/* Button to navigate to My Current Bookings */}
        <button 
          onClick={handleViewMyBookings}
          className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-mono font-semibold"
        >
          View My Current Bookings
        </button>
      </div>

      {/* Combined desk layout with Kitchen */}
      <div className="flex items-center justify-center gap-16">
        <Kitchen />
        {/* Container for the desks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Desk 
            deskName="Section A" 
            seatNumberOffset={0} 
            seatAvailability={seatAvailability}
            selectedSeats={selectedSeats}
            onSeatSelect={handleSeatSelect}
            isLoading={isLoadingAvailability}
          />
          <Desk 
            deskName="Section B" 
            seatNumberOffset={4} 
            seatAvailability={seatAvailability}
            selectedSeats={selectedSeats}
            onSeatSelect={handleSeatSelect}
            isLoading={isLoadingAvailability}
          />
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal 
        isOpen={isBookingModalOpen} 
        onClose={() => {
          setIsBookingModalOpen(false);
          // If the modal is closed without booking, deselect all seats
          setSelectedSeats([]);
        }}
        selectedDate={selectedDate}
        selectedSeats={selectedSeats}
        onBookingSubmit={handleBookingSubmit}
        isSubmitting={isSubmittingBooking}
        currentUser={currentUser}
      />
    </div>
  );
}