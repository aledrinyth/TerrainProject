import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { API_BASE_URL } from '../src/config';
import { bookingService } from './services/bookingService';
import CalendarDatePicker from './CalendarDatePicker';

// A reusable component for the green/red seat indicators.
const SeatCircle = ({ seatNumber, isBooked, isSelected, onSelect, isLoading }) => {
  let bgColor, borderColor, cursor;
  if (isLoading) {
    bgColor = "bg-terrain-white";
    borderColor = "border-gray-300";
    cursor = "cursor-wait";
  } else if (isBooked) {
    bgColor = "bg-red-400";
    borderColor = "border-red-600";
    cursor = "cursor-not-allowed";
  } else if (isSelected) {
    bgColor = "bg-terrain-blue";
    borderColor = "border-terrain-blue";
    cursor = "cursor-pointer";
  } else {
    bgColor = "bg-terrain-green";
    borderColor = "border-terrain-green";
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
        <span className="font-gt-america text-xl text-white font-bold">{seatNumber}</span>
      )}
    </div>
  );
};

/**
 * Summary: A modal dialog for booking a seat.
 * @returns {JSX.Element|null} The booking modal or null if not open.
 */
const BookingModal = ({ isOpen, onClose, selectedDate, selectedSeats, onBookingSubmit, isSubmitting, currentUser }) => {
  const [error, setError] = useState("");

// Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (selectedSeats.length === 0) {
        setError("Please select at least one seat.");
      return;
    }

    if (!selectedDate) {
      setError("Please select a date.");
      return;
    }
    
    const bookingData = {
      seats: selectedSeats,
      date: selectedDate,
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
        <h2 className="text-2xl font-bold mb-4 font-gt-america">New Booking</h2>
        
        {/* Selected seats display */}
        <div className="mb-4">
          <label className="block mb-2 font-semibold font-gt-america">Selected Seat</label>
          <div className="bg-terrain-white p-2 rounded border">
            {selectedSeats.length > 0 ? (
              <span className="text-terrain-blue font-semibold font-gt-america">
                Seat: {selectedSeats.join(', ')}
              </span>
            ) : (
              <span className="text-gray-500 font-gt-america">No seat selected</span>
            )}
          </div>
        </div>
        
        {/* Date display (disabled, users select outside modal) */}
        <label className="block mb-2 font-semibold">
          Date
          <input
            type="text"
            className="border p-2 rounded mb-4 block w-full bg-gray-200 font-gt-america"
            value={selectedDate || ""}
            disabled
            readOnly
          />
        </label>
        
        {/* Error message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4 font-gt-america">
            {error}
          </div>
        )}
        
        <div className="flex gap-4">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors font-gt-america"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            className="px-4 py-2 bg-terrain-blue text-white rounded hover:bg-opacity-90 hover-cursor-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-gt-america"
            disabled={selectedSeats.length === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Booking...
              </span>
            ) : (
              "Book"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// A reusable component for an entire desk section.
const Desk = ({ seatNumberOffset = 0, seatAvailability, selectedSeats, onSeatSelect, isLoading }) => {
  const seatNumbers = [1, 2, 3, 4].map(n => n + seatNumberOffset);
  
  return (
    <div className="w-full md:w-[545px] h-[459px] bg-gray-200 border-2 border-black rounded-lg flex flex-col p-6">
      
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
          <div className="w-[100px] h-[229px] bg-gray-400 border-2 border-black rounded-lg"></div>
          <div className="w-[100px] h-[229px] bg-gray-400 border-2 border-black rounded-lg"></div>
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
    <div className="w-[150px] h-[459px] bg-gray-200 border-2 border-black rounded-lg flex items-center justify-center">
      <span className="font-gt-america text-3xl font-bold transform -rotate-90 whitespace-nowrap">Kitchen</span>
    </div>
  );
};

// Function to create ICS file and download it
const onAddToCalendar = async ({ userId }) => {
  try {
      console.log('Fetching ICS file for user:', userId);
      
      // Use the booking service to get ICS content
      const icsContent = await bookingService.generateICSFile(userId);
      console.log('ICS content received:', icsContent);
      
      if (!icsContent || icsContent.trim() === '') {
        alert('No booking data found. Please try again.');
        return;
      }
      
      // Create a blob from the ICS string and download it
      const file = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(file);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'terrain-booking.ics';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      console.log('Calendar file downloaded successfully');
  } catch (error) {
      console.error('Error creating calendar event:', error);
      alert('Failed to create calendar event: ' + error.message);
  }
}

// Success notification component
const SuccessNotification = ({ message, isVisible, onClose, onAddToCalendar }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 bg-terrain-green text-white px-6 py-3 rounded-lg shadow-lg z-50">
      <div className="flex items-center gap-2">
        <span>✓</span>
        <span>{message}</span>
        <button onClick={onAddToCalendar}

          className="ml-3 px-3 py-1 bg-terrain-blue hover:bg-sky-500 text-white rounded text-sm transition-colors">Add to calendar</button>
        <button onClick={onClose} className="ml-2 text-white hover:text-gray-200">×</button>
      </div>
    </div>
  );
};

/**
 * Summary: The main component for the booking page layout and functionality.
 * @returns {JSX.Element} The BookingPage component.
 */
export default function App() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [seatAvailability, setSeatAvailability] = useState({});
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();
  const { user , signout } = useAuth();
  const currentUser = user?.uid || 'unknown';
  const currentUserName = user?.displayName || user?.email?.split('@')[0] || 'User';

  const formatSelectedDate = (dateString) => {
    if (!dateString) return "Select a Date";
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return `Selected: ${date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })}`;
  };

  // Fetch seat availability for a specific date - ENHANCED to get real booking data
const fetchSeatAvailability = async (date) => {
  setIsLoadingAvailability(true);
  try {

    // Create date at midnight UTC (not local time)
    const dateObj = new Date(date + 'T00:00:00.000Z');
    const dateTimestamp = dateObj.toISOString();
    
    const response = await bookingService.getBookingsByDate(dateTimestamp);

    const availability = {};
    const totalSeats = 8;

    // Initialize all seats as available
    for (let i = 1; i <= totalSeats; i++) {
      availability[i] = true;
    }

    // Handle different response formats
    let bookingsArray = null;
    
    if (Array.isArray(response)) {
      bookingsArray = response;
    } else if (response && Array.isArray(response.bookings)) {
      bookingsArray = response.bookings;
    } else if (response && response.data && Array.isArray(response.data)) {
      bookingsArray = response.data;
    } else if (response && !response.message) {
      // Response might be a single booking object
      console.warn('Unexpected response format:', response);
    }

    // Mark booked seats as unavailable
    if (bookingsArray && bookingsArray.length > 0) {
      bookingsArray.forEach(booking => {
        if (booking.status === 'active' && booking.deskId) {
          availability[booking.deskId] = false;
          console.log(`Seat ${booking.deskId} is booked on ${date} by booking ID: ${booking.id || 'unknown'}`);
        }
      });
      console.log(`Found ${bookingsArray.length} active booking(s)`);
    } else {
      console.log('No active bookings found - response:', response);
    }
    
    setSeatAvailability(availability);
  } catch (error) {
    console.error('Error fetching seat availability:', error);
    // Show all seats as available on error (fallback)
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
      }
      
      return newSelection;
    });
  };

  // Handle booking submission - no longer sends name field
const handleBookingSubmit = async (bookingData) => {
  setIsSubmittingBooking(true);
  try {
    // Create separate bookings for each seat
    const bookingPromises = bookingData.seats.map(async (seatNumber) => {
      const deskId = seatNumber;
      
      // Create date at midnight UTC
      const dateObj = new Date(bookingData.date + 'T00:00:00.000Z');
                    
      const requestData = {
        name: currentUserName,
        userId: bookingData.userId,
        deskId: deskId,
        dateTimestamp: dateObj.toISOString()
      };

      console.log('Booking request data:', requestData);

      const response = await fetch(`${API_BASE_URL}/booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`Booking failed for seat ${seatNumber}:`, errorData);
        throw new Error(`Booking failed for seat ${seatNumber}: ${response.status} - ${errorData}`);
      }

      const result = await response.json();
      console.log(`Booking successful for seat ${seatNumber}:`, result);
      return result;
    });

    // Wait for all bookings to complete
    const results = await Promise.all(bookingPromises);
    console.log('All bookings successful:', results);
    
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
  
  // **START: Retained Changes for Navigation**
  /**
   * Summary: Handles navigation to the user's current bookings page.
   * @returns {void}
   */
  const handleViewMyBookings = () => {
    navigate('/my-bookings');
  }
  // **END: Retained Changes for Navigation**

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen font-gt-america bg-terrain-white p-4 pt-24">
      {/* Success Notification */}
      <SuccessNotification 
        message={successMessage}
        isVisible={showSuccess}
        onClose={() => setShowSuccess(false)}
        onAddToCalendar={() => onAddToCalendar({ userId: currentUser })}
      />

      {/* The header is positioned absolutely relative to the main container */}
      <header className="absolute top-[24px] left-[34px] flex items-center w-[calc(100vw-68px)] justify-between pr-20">
        <Logo />
        {/* Container for My bookings and Logout buttons */}
        <div className="flex items-center space-x-4">
          {/* My bookings button (Moved here and renamed) */}
          <button 
            onClick={handleViewMyBookings}
            // Adjusted padding to match Logout button size
            className="px-4 py-2 bg-terrain-blue text-white rounded-lg hover:bg-terrain-blue transition-colors font-gt-america font-semibold"
          >
            My Bookings
          </button>
          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-terrain-blue text-white rounded-lg hover:bg-opacity-90 hover-cursor-green transition-colors font-gt-america font-semibold"
          >
            Logout
          </button>
        </div>
      </header>
      
      {/* Date selection controls */}
      <div className="flex flex-col items-center gap-4 mb-14">
        <div className="relative">
          <button
            onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
            className="px-6 py-3 bg-terrain-green text-white rounded-lg hover:bg-opacity-90 hover-cursor-green transition-colors font-gt-america font-semibold text-lg shadow-md hover:shadow-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatSelectedDate(selectedDate)}
            {/* Dropdown Arrow */}
            <svg className={`w-4 h-4 transition-transform ${isDatePickerOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isDatePickerOpen && (
            <CalendarDatePicker
              selectedDate={selectedDate}
              onDateSelect={(date) => {
                setSelectedDate(date);
                setIsDatePickerOpen(false);
                setSelectedSeats([]); // Clear selected seats when date changes
                fetchSeatAvailability(date);
              }}
              onClose={() => setIsDatePickerOpen(false)}
            />  
          )}
        </div>
        
        {selectedSeats.length > 0 && (
          <div className="text-sm text-gray-600 font-gt-america">
            Selected: {selectedSeats.length} seat(s) - {selectedSeats.join(', ')}
          </div>
        )}
        
        {/* Removed My Bookings button from here */}
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
        onClose={() => setIsBookingModalOpen(false)}
        selectedDate={selectedDate}
        selectedSeats={selectedSeats}
        onBookingSubmit={handleBookingSubmit}
        isSubmitting={isSubmittingBooking}
        currentUser={currentUser}
      />
    </div>
  );
}

