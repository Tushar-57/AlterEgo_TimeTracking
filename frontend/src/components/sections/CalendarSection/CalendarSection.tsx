import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "lucide-react";
import { useState } from "react";
import { DraggableEvent } from "../../ui/DraggableEvent";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "../../ui/toggle-group";

// Data for days of the week
const weekDays = [
  { day: "SUN", date: "21", isWeekend: true },
  { day: "MON", date: "22", isWeekend: false },
  { day: "TUE", date: "23", isWeekend: false },
  { day: "WED", date: "24", isWeekend: false },
  { day: "THU", date: "25", isWeekend: false, isToday: true },
  { day: "FRI", date: "26", isWeekend: false },
  { day: "SAT", date: "27", isWeekend: true },
];

// Time slots
const timeSlots = [
  "7 AM",
  "8 AM",
  "9 AM",
  "10 AM",
  "11 AM",
  "12 PM",
  "1 PM",
  "2 PM",
  "3 PM",
  "4 PM",
  "5 PM",
];

// Month data
const monthData = Array.from({ length: 35 }, (_, i) => ({
  date: i + 1,
  isCurrentMonth: i < 31,
  isToday: i === 24,
  isWeekend: i % 7 === 0 || i % 7 === 6,
}));

// Year data
const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

type CalendarEvent = {
  id: number;
  startTime: string;
  duration: number;
  projectId?: number;
  taskDescription: string;
};

const getWeekDays = (date: Date): Date[] => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  start.setDate(diff);
  return Array.from({ length: 7 }).map((_, i) => {
    const dayDate = new Date(start);
    dayDate.setDate(start.getDate() + i);
    return dayDate;
  });
};

export const CalendarSection = ({ 
  currentDate, 
  onDateChange,
  events 
}: { 
  currentDate: Date;
  onDateChange: (date: Date) => void;
  events: any[];
}) => {
  // Add state for view mode
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');

  // Update render methods to use real data
  const renderWeekView = () => (
    <div className="flex flex-col w-full h-full items-start">
      {/* Header with dynamic dates */}
      <div className="flex w-full items-start pl-12 pr-0 py-0 gap-3">
        {getWeekDays(currentDate).map((day, index) => (
          <div key={index} className="flex flex-col flex-1 items-start pt-1 pb-4 px-2">
            <div className="text-sm font-medium">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
            <div className="text-xl">{day.getDate()}</div>
          </div>
        ))}
      </div>
      
      {/* Time slots with events */}
      {timeSlots.map((time, timeIndex) => (
        <div key={timeIndex} className="relative" style={{ height: '60px' }}>
          {events.filter(event => 
            new Date(event.startTime).getHours() === timeIndex + 7
          ).map(event => (
            <DraggableEvent key={event.id} event={event} getColorClasses={undefined} />
          ))}
        </div>
      ))}
    </div>
  );

  // Add date navigation
  const handleDateChange = (days: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    onDateChange(newDate);
  };

  return (
    <section className="flex flex-col w-full h-full gap-4 p-4 overflow-hidden">
      {/* Add date navigation controls */}
      <div className="flex items-center gap-4">
        <button onClick={() => handleDateChange(-1)}>
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <div className="text-xl font-medium">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
        <button onClick={() => handleDateChange(1)}>
          <ChevronRightIcon className="w-6 h-6" />
        </button>
      </div>
      
      {/* Rest of the calendar rendering */}
    </section>
  );
};