import { useState } from 'react';

// A reusable component for the green/red seat indicators.
const SeatCircle = ({ seatNumber, isBooked }) => {
  const [isSelected, setIsSelected] = useState(false);

  // This code block determines the colors based on state (to be implemented later with the booking).
  let bgColor, borderColor;
  if (isBooked) {
    bgColor = "bg-gray-300";
    borderColor = "border-gray-500";
  } else if (isSelected) {
    bgColor = "bg-indigo-600";
    borderColor = "border-indigo-800";
  } else {
    bgColor = "bg-sky-400";
    borderColor = "border-sky-700";
  }

  // The seat circle and number
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        onClick={() => !isBooked && setIsSelected(!isSelected)}
        className={[
          "w-[69px] h-[69px] rounded-full border-2 cursor-pointer transition-all duration-200 hover:scale-110",
          bgColor,
          borderColor,
          isBooked ? "cursor-not-allowed opacity-60" : ""
        ].join(' ')}
      ></div>
      <span className="font-mono text-lg">{seatNumber}</span>
    </div>
  );
};

/**
 * Summary: A modal dialog for booking a seat.
 * @returns {JSX.Element|null} The booking modal or null if not open.
 */
const BookingModal = ({ isOpen, onClose, selectedDate }) => {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");


  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">New Booking</h2>
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
        <div className="flex gap-4">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            Cancel
          </button>
          <button 
            className="px-4 py-2 bg-sky-400 text-white rounded"
            disabled={!startTime || !endTime}
          >
            Book
          </button>
        </div>
      </div>
    </div>
  );
};  

// A reusable component for an entire desk section.
const Desk = ({ deskName }) => {
  return (
    <div className="w-full md:w-[545px] h-[459px] bg-desk-fill border-2 border-black rounded-26px flex flex-col items-center p-6 pt-8">
      <h3 className="font-mono text-3xl font-bold mb-auto">{deskName}</h3>
      
      <div className="flex flex-col items-center gap-4 w-full">
        <div className="flex justify-center gap-[101px] w-full">
          <div className="w-[164px] h-[229px] bg-monitor-fill border-2 border-black rounded-17px -rotate-90"></div>
          <div className="w-[164px] h-[229px] bg-monitor-fill border-2 border-black rounded-17px -rotate-90"></div>
        </div>

        <div className="flex justify-between w-full max-w-md px-4">
          <div className="flex items-center gap-8">
            <SeatCircle seatNumber={1} />
            <SeatCircle seatNumber={2} />
          </div>
          <div className="flex items-center gap-8">
            <SeatCircle seatNumber={3} />
            <SeatCircle seatNumber={4} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Using a standard <img> tag pointing to a static asset in the 'public' folder.
const Logo = () => {
  return (
    <img
      width="557"
      height="104"
      // The space in the filename has been URL-encoded to %20 for reliability.
      src="/terrain.svg"
      alt="Terrain Logo"
    />
  );
};

/**
 * Summary: The main App component that lays out the page.
 * @returns {JSX.Element} The main App component.
 */
// The main App component that lays out the page.
export default function App() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");

  // Handles date selection from calendar input
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setIsDatePickerOpen(false);
  };

  // Dummy logout function
  const handleLogout = () => {
    // Implement actual logout logic here, e.g., clearing tokens and redirecting
    alert("Logged out!");
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen font-sans bg-gray-100 p-4 pt-24">
      {/* The header is positioned absolutely relative to the main container */}
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
      
      {/* Select Date button/modal above New Booking */}
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
              type="date"
              className="absolute left-0 top-12 bg-white border p-2 rounded shadow"
              value={selectedDate}
              onChange={handleDateChange}
              min={new Date().toISOString().split('T')[0]}
              autoFocus
              onBlur={() => setIsDatePickerOpen(false)}
            />
          )}
        </div>
        <button 
          onClick={() => setIsBookingModalOpen(true)}
          className="px-6 py-2 bg-sky-400 text-white rounded-lg hover:bg-sky-500 transition-colors"
          disabled={!selectedDate}
        >
          New Booking
        </button>
      </div>
      {/* Existing desk layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Desk deskName="DESK 1" />
        <Desk deskName="DESK 2" />
      </div>
      {/* Booking Modal */}
      <BookingModal 
        isOpen={isBookingModalOpen} 
        onClose={() => setIsBookingModalOpen(false)}
        selectedDate={selectedDate}
      />
    </div>
  );
}