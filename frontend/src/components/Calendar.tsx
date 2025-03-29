import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronDown, Clock } from 'lucide-react';

type ViewMode = 'daily' | 'weekly' | 'monthly';

const Calendar = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0, time: '' });
  const [showTooltip, setShowTooltip] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!calendarRef.current) return;

    const rect = calendarRef.current.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;
    
    // Calculate time based on position
    const totalMinutes = (relativeY / rect.height) * 24 * 60;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    setTooltipPosition({
      x: relativeX,
      y: relativeY,
      time: timeString
    });
  };

  const renderCalendarContent = () => {
    switch (viewMode) {
      case 'daily':
        return (
          <div className="grid grid-cols-1 gap-1 h-full">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="calendar-cell h-8 bg-white/10 rounded-sm" />
            ))}
          </div>
        );
      case 'weekly':
        return (
          <div className="grid grid-cols-7 gap-1 h-full">
            {Array.from({ length: 7 * 24 }).map((_, i) => (
              <div key={i} className="calendar-cell h-2 bg-white/10 rounded-sm" />
            ))}
          </div>
        );
      case 'monthly':
        return (
          <div className="grid grid-cols-7 gap-1 h-full">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="calendar-cell h-12 bg-white/10 rounded-sm" />
            ))}
          </div>
        );
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-700">Calendar</h3>
        </div>
        <div className="relative">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as ViewMode)}
            className="appearance-none bg-white/20 px-4 py-2 pr-8 rounded-lg text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-black/5"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      <div
        ref={calendarRef}
        className="relative h-64 rounded-xl overflow-hidden backdrop-blur-sm transition-all duration-300"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {renderCalendarContent()}
        
        {showTooltip && (
          <div
            className="absolute pointer-events-none bg-black/75 text-white px-3 py-1.5 rounded-lg text-sm transform -translate-x-1/2 -translate-y-full flex items-center space-x-1.5"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y - 10,
            }}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{tooltipPosition.time}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;