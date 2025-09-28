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

  // The seat circle with the number inside
  return (
    <div
      onClick={() => !isBooked && setIsSelected(!isSelected)}
      className={[
        "w-16 h-16 rounded-full border-2 cursor-pointer transition-all duration-200 hover:scale-110 flex items-center justify-center",
        bgColor,
        borderColor,
        isBooked ? "cursor-not-allowed opacity-60" : ""
      ].join(' ')}
    >
      <span className="font-mono text-xl text-white font-bold">{seatNumber}</span>
    </div>
  );
};

/**
 * Summary: A modal dialog for booking a seat.
 * @returns {JSX.Element|null} The booking modal or null if not open.
 */
const BookingModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">New Booking</h2>
        {/* Start Time input */}
        <label className="block mb-2 font-semibold">
          Start Time
          <input 
            type="time" 
            className="border p-2 rounded mb-4 block w-full"
          />
        </label>
        {/* End Time input */}
        <label className="block mb-2 font-semibold">
          End Time
          <input 
            type="time" 
            className="border p-2 rounded mb-4 block w-full"
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
          >
            Book
          </button>
        </div>
      </div>
    </div>
  );
};  

// A reusable component for an entire desk section.
const Desk = ({ deskName, seatNumberOffset = 0 }) => {
  return (
    <div className="w-full md:w-[545px] h-[459px] bg-desk-fill border-2 border-black rounded-26px flex flex-col p-6">
      <h3 className="font-mono text-3xl font-bold text-center mb-6">{deskName}</h3>
      
      <div className="flex-grow flex items-center justify-center gap-8 w-full">
        {/* Left Seats with continuous numbering */}
        <div className="flex flex-col gap-12">
          <SeatCircle seatNumber={1 + seatNumberOffset} />
          <SeatCircle seatNumber={2 + seatNumberOffset} />
        </div>

        {/* Monitors */}
        <div className="flex gap-4">
          <div className="w-[100px] h-[229px] bg-monitor-fill border-2 border-black rounded-17px"></div>
          <div className="w-[100px] h-[229px] bg-monitor-fill border-2 border-black rounded-17px"></div>
        </div>

        {/* Right Seats with continuous numbering */}
        <div className="flex flex-col gap-12">
          <SeatCircle seatNumber={3 + seatNumberOffset} />
          <SeatCircle seatNumber={4 + seatNumberOffset} />
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
  return (
    // Add `relative` to this container to act as the positioning anchor for the logo
    <div className="relative flex flex-col items-center justify-center min-h-screen font-sans bg-gray-100 p-4 pt-24">
      
      {/* The header is positioned absolutely relative to the main container */}
      <header className="absolute top-[24px] left-[34px]">
        <Logo />
      </header>
      
      {/* Add new Booking Button */}
      <button 
        onClick={() => setIsBookingModalOpen(true)}
        className="mb-14 px-6 py-2 bg-sky-400 text-white rounded-lg hover:bg-sky-500 transition-colors"
      >
        New Booking
      </button>
      {/*Existing desk layout*/}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Desk deskName="DESK 1" seatNumberOffset={0} />
      <Desk deskName="DESK 2" seatNumberOffset={4} />
    </div>
      {/* Booking Modal */}
      <BookingModal 
        isOpen={isBookingModalOpen} 
        onClose={() => setIsBookingModalOpen(false)} 
      />
    </div>
  );
}

