import { useState } from 'react';

// A reusable component for the green/red seat indicators.
const SeatCircle = ({ seatNumber }) => {
  const isBooked = false;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`w-[69px] h-[69px] rounded-full border-2 ${
          isBooked
            ? 'bg-red-400 border-red-700'
            : 'bg-seat-green-fill border-seat-green-border'
        }`}
      ></div>
      <span className="font-mono text-lg">{seatNumber}</span>
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


// The main App component that lays out the page.
export default function App() {
  return (
    // Add `relative` to this container to act as the positioning anchor for the logo
    <div className="relative flex flex-col items-center justify-center min-h-screen font-sans bg-gray-100 p-4 pt-24">
      
      {/* The header is positioned absolutely relative to the main container */}
      <header className="absolute top-[24px] left-[34px]">
        <Logo />
      </header>
      
      {/* Outer booking rectangle - This content remains centered as before */}
      <div className="absolute top-[160px] left-[115px] right-[115px] min-h-[600px] border-2 border-black rounded-26px flex flex-col lg:flex-row items-center transform scale-75 justify-center pt-20 pb-10 gap-4">
        
        {/* We render the two Desk components here */}
        <Desk deskName="DESK 1" />
        <Desk deskName="DESK 2" />

      </div>
    </div>
  );
}

