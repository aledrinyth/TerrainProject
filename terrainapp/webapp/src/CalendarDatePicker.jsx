import { useState, useEffect, useRef } from 'react';

/**
 * A visual calendar component for easier date selection
 * @param {string} selectedDate - Currently selected date in YYYY-MM-DD format
 * @param {function} onDateSelect - Callback when a date is selected
 * @param {function} onClose - Callback to close the calendar
 */
const CalendarDatePicker = ({ selectedDate, onDateSelect, onClose }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const calendarRef = useRef(null);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Get days in month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);

  // Generate calendar grid
  const calendarDays = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="h-10" />);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isSelected = dateString === selectedDate;
    const isPast = date < today;
    const isToday = date.getTime() === today.getTime();

    calendarDays.push(
      <button
        key={day}
        onClick={() => !isPast && onDateSelect(dateString)}
        disabled={isPast}
        className={`
          h-10 w-10 rounded-lg flex items-center justify-center font-medium transition-all
          ${isPast 
            ? 'text-gray-300 cursor-not-allowed' 
            : 'hover:bg-green-100 cursor-pointer'
          }
          ${isSelected 
            ? 'bg-green-500 text-white hover:bg-green-600' 
            : ''
          }
          ${isToday && !isSelected 
            ? 'border-2 border-green-500 text-green-700' 
            : ''
          }
        `}
      >
        {day}
      </button>
    );
  }

  // Navigate months
  const goToPreviousMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    
    // Don't allow going to months before current month
    const today = new Date();
    if (newMonth.getFullYear() > today.getFullYear() || 
        (newMonth.getFullYear() === today.getFullYear() && newMonth.getMonth() >= today.getMonth())) {
      setCurrentMonth(newMonth);
    }
  };

  const goToNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const canGoPrevious = () => {
    const today = new Date();
    return currentMonth.getFullYear() > today.getFullYear() || 
           (currentMonth.getFullYear() === today.getFullYear() && currentMonth.getMonth() > today.getMonth());
  };

  return (
    <div 
      ref={calendarRef}
      className="absolute left-1/2 transform -translate-x-1/2 top-full mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-lg p-4 z-20"
      style={{ minWidth: '320px' }}
    >
      {/* Month/Year Header with Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          disabled={!canGoPrevious()}
          className="p-2 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h3 className="font-bold text-lg">
          {monthNames[month]} {year}
        </h3>
        
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          aria-label="Next month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day of Week Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="h-8 flex items-center justify-center text-sm font-semibold text-gray-600">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 border-2 border-green-500 rounded"></div>
          <span>Today</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Selected</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarDatePicker;