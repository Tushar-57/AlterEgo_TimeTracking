// import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "lucide-react";
// import { useEffect, useState } from "react";
// import { Button } from "../../../../components/ui/button";
// import { Input } from "../../../../components/ui/input";
// import {
//   ToggleGroup,
//   ToggleGroupItem,
// } from "../../../../components/ui/toggle-group";
// import { CalendarEvent } from "../../Fantastical";

// const timeSlots = Array.from({ length: 24 }, (_, i) => {
//   const hour = i % 12 || 12;
//   const period = i < 12 ? 'AM' : 'PM';
//   return `${hour} ${period}`;
// });

// const monthNames = [
//   "January", "February", "March", "April", "May", "June",
//   "July", "August", "September", "October", "November", "December"
// ];

// export const CalendarSection = ({ events }: { events: CalendarEvent[] }): JSX.Element => {
//   const [view, setView] = useState<"day" | "week" | "month" | "year">("week");
//   const [currentDate, setCurrentDate] = useState(new Date());

//   const getWeekDays = (date: Date) => {
//     const startOfWeek = new Date(date);
//     startOfWeek.setDate(date.getDate() - date.getDay());
//     return Array.from({ length: 7 }, (_, i) => {
//       const day = new Date(startOfWeek);
//       day.setDate(startOfWeek.getDate() + i);
//       return {
//         day: day.toLocaleString('en-US', { weekday: 'short' }).toUpperCase(),
//         date: day.getDate().toString(),
//         isWeekend: i === 0 || i === 6,
//         isToday: day.toDateString() === new Date().toDateString()
//       };
//     });
//   };

//   const getMonthData = (date: Date) => {
//     const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
//     const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
//     const startDay = firstDay.getDay();
//     const daysInMonth = lastDay.getDate();
//     const totalSlots = Math.ceil((daysInMonth + startDay) / 7) * 7;

//     return Array.from({ length: totalSlots }, (_, i) => {
//       const day = i - startDay + 1;
//       const isCurrentMonth = day > 0 && day <= daysInMonth;
//       const currentDate = isCurrentMonth ? day : i < startDay ? day + lastDay.getDate() - startDay : day - daysInMonth;
//       return {
//         date: currentDate.toString(),
//         isCurrentMonth,
//         isToday: isCurrentMonth && new Date(date.getFullYear(), date.getMonth(), day).toDateString() === new Date().toDateString(),
//         isWeekend: (i % 7 === 0 || i % 7 === 6) && isCurrentMonth,
//         events: isCurrentMonth ? events.filter(e => {
//           const eventDate = new Date(`${e.time} ${e.period}`);
//           return eventDate.getDate() === day && eventDate.getMonth() === date.getMonth() && eventDate.getFullYear() === date.getFullYear();
//         }) : []
//       };
//     });
//   };

//   const getYearData = (date: Date) => {
//     return monthNames.map((month, index) => {
//       const lastDay = new Date(date.getFullYear(), index + 1, 0).getDate();
//       return {
//         month,
//         days: Array.from({ length: 35 }, (_, i) => {
//           const day = (i % lastDay) + 1;
//           return {
//             date: day.toString(),
//             events: events.filter(e => {
//               const eventDate = new Date(`${e.time} ${e.period}`);
//               return eventDate.getMonth() === index && eventDate.getDate() === day;
//             })
//           };
//         })
//       };
//     });
//   };

//   const handleNavigation = (direction: 'prev' | 'next') => {
//     const newDate = new Date(currentDate);
//     if (view === 'day') {
//       newDate.setDate(currentDate.getDate() + (direction === 'prev' ? -1 : 1));
//     } else if (view === 'week') {
//       newDate.setDate(currentDate.getDate() + (direction === 'prev' ? -7 : 7));
//     } else if (view === 'month') {
//       newDate.setMonth(currentDate.getMonth() + (direction === 'prev' ? -1 : 1));
//     } else if (view === 'year') {
//       newDate.setFullYear(currentDate.getFullYear() + (direction === 'prev' ? -1 : 1));
//     }
//     setCurrentDate(newDate);
//   };

//   const weekDays = getWeekDays(currentDate);
//   const monthData = getMonthData(currentDate);
//   const yearData = getYearData(currentDate);

//   const renderDayView = () => (
//     <div className="flex flex-col w-full h-full items-start">
//       <div className="flex w-full items-start pl-12 pr-0 py-0 gap-3">
//         <div className="flex flex-1">
//           <div className={`flex flex-col flex-1 items-start pt-1 pb-4 px-2 shadow-[inset_-1px_-1px_0px_#e0e0e0] ${weekDays.find(d => d.isToday)?.isToday ? "bg-blue-100" : "bg-white"}`}>
//             <div className="relative self-stretch mt-[-1.00px] font-bold text-gray-500 text-[10px] tracking-[0] leading-3">
//               {currentDate.toLocaleString('en-US', { weekday: 'short' }).toUpperCase()}
//             </div>
//             <div className="self-stretch font-medium text-black text-[22px] leading-8 tracking-[0]">
//               {currentDate.getDate()}
//             </div>
//           </div>
//         </div>
//         <div className="w-12 mt-[-1.00px] text-xs font-medium text-gray-500">
//           EST<br />GMT-5
//         </div>
//       </div>
//       {timeSlots.map((time, timeIndex) => (
//         <div key={timeIndex} className="flex w-full items-start gap-3">
//           <div className="w-9 mt-[-1.00px] text-xs font-medium text-gray-500">
//             {time}
//           </div>
//           <div className="flex flex-1 items-start">
//             <div className="flex flex-col flex-1 items-start shadow-[inset_-1px_-1px_0px_#e0e0e0] bg-white">
//               <div className="relative self-stretch w-full h-9 shadow-[inset_0px_-1px_0px_#f7f7f7]" />
//               <div className="relative self-stretch w-full h-9" />
//             </div>
//           </div>
//           <div className="w-9 mt-[-1.00px] text-xs font-medium text-gray-500">
//             {time}
//           </div>
//         </div>
//       ))}
//     </div>
//   );

//   useEffect(() => {
//     const todayColumn = document.querySelector('.day-column[data-today="true"]');
//     todayColumn?.scrollIntoView({ behavior: 'smooth', inline: 'center' });
//   }, [currentDate]);
  
//   const renderWeekView = () => (
//     <div className="flex flex-col w-full h-full items-start">
//       <div className="flex w-full items-start pl-12 pr-0 py-0 gap-3">
//         <div className="grid grid-cols-7 flex-1">
//           {weekDays.map((dayInfo, index) => (
//             <div
//               key={index}
//               className={`flex flex-col flex-1 items-start pt-1 pb-4 px-2 shadow-[inset_-1px_-1px_0px_#e0e0e0] ${
//                 dayInfo.isWeekend ? "bg-gray-50" : dayInfo.isToday ? "bg-blue-100" : "bg-white"
//               }`}
//               data-today={dayInfo.isToday}
//             >
//               <div className="relative self-stretch mt-[-1.00px] font-bold text-gray-500 text-[10px] tracking-[0] leading-3">
//                 {dayInfo.day}
//               </div>
//               <div className="self-stretch font-medium text-black text-[22px] leading-8 tracking-[0]">
//                 {dayInfo.date}
//               </div>
//             </div>
//           ))}
//         </div>
//         <div className="w-12 mt-[-1.00px] text-xs font-medium text-gray-500">
//           EST<br />GMT-5
//         </div>
//       </div>
//       <div className="grid grid-cols-7 flex-1 items-start">
//         {timeSlots.map((time, timeIndex) => (
//           <div key={timeIndex} className="contents">
//             <div className="w-9 mt-[-1.00px] text-xs font-medium text-gray-500">
//               {time}
//             </div>
//             {weekDays.map((dayInfo, dayIndex) => (
//               <div
//                 key={dayIndex}
//                 className={`flex flex-col flex-1 items-start shadow-[inset_-1px_-1px_0px_#e0e0e0] ${
//                   dayInfo.isWeekend ? "bg-gray-50" : dayInfo.isToday ? "bg-blue-100 border-blue-300 border-2" : "bg-white"
//                 }`}
//               >
//                 <div className="relative self-stretch w-full h-9 shadow-[inset_0px_-1px_0px_#f7f7f7]" />
//                 <div className="relative self-stretch w-full h-9" />
//               </div>
//             ))}
//           </div>
//         ))}
//         <div className="w-9 mt-[-1.00px] text-xs font-medium text-gray-500">
//           {timeSlots[timeSlots.length - 1]}
//         </div>
//       </div>
//     </div>
//   );

//   const renderMonthView = () => (
//     <div className="flex flex-col w-full h-full">
//       <div className="grid grid-cols-7 border-b">
//         {weekDays.map((day) => (
//           <div key={day.day} className="p-2 text-center border-r last:border-r-0">
//             <span className="text-xs font-bold text-gray-500">{day.day}</span>
//           </div>
//         ))}
//       </div>
//       <div className="grid grid-cols-7 flex-1">
//         {monthData.map((day, index) => (
//           <div
//             key={index}
//             className={`min-h-[100px] p-2 border-b border-r last:border-r-0 ${
//               day.isCurrentMonth
//                 ? day.isToday
//                   ? "bg-blue-100 border-blue-300 border-2"
//                   : day.isWeekend
//                     ? "bg-gray-50"
//                     : "bg-white"
//                 : "bg-gray-100"
//             }`}
//           >
//             <span className={`text-sm ${day.isCurrentMonth ? "text-gray-900" : "text-gray-400"}`}>
//               {day.date}
//             </span>
//             <div className="flex gap-1 mt-1">
//               {day.events.map(event => (
//                 <div key={event.id} className={`w-2 h-2 rounded-full bg-${event.color}-500`} />
//               ))}
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );

//   const renderYearView = () => (
//     <div className="grid grid-cols-4 gap-4 p-4">
//       {yearData.map((month) => (
//         <div key={month.month} className="border rounded-lg overflow-hidden">
//           <div className="bg-gray-100 p-2 border-b">
//             <h3 className="text-sm font-semibold text-gray-900">{month.month}</h3>
//           </div>
//           <div className="p-2">
//             <div className="grid grid-cols-7 gap-1">
//               {weekDays.map((day) => (
//                 <div key={day.day} className="text-[10px] text-center text-gray-500">
//                   {day.day[0]}
//                 </div>
//               ))}
//               {month.days.map((day, i) => (
//                 <div
//                   key={i}
//                   className="text-[10px] text-center text-gray-900 aspect-square flex items-center justify-center"
//                 >
//                   <div>
//                     {day.date}
//                     <div className="flex gap-0.5 justify-center">
//                       {day.events.map(event => (
//                         <div key={event.id} className={`w-1 h-1 rounded-full bg-${event.color}-500`} />
//                       ))}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       ))}
//     </div>
//   );

//   return (
//     <section className="flex flex-col w-full h-full gap-4 p-4 overflow-auto">
//       <div className="sticky top-0 z-10 bg-white pt-4 pb-2 px-4 border-b">
//         <div className="flex items-start justify-between relative self-stretch w-full">
//           <div className="flex items-start gap-px">
//             <Button
//               variant="ghost"
//               size="icon"
//               className="rounded-[6px_0px_0px_6px] p-1 bg-gray-100 h-auto"
//               onClick={() => handleNavigation('prev')}
//             >
//               <ChevronLeftIcon className="h-5 w-5" />
//             </Button>
//             <Button
//               variant="ghost"
//               className="px-4 py-1.5 bg-gray-100 rounded-none h-auto"
//               onClick={() => setCurrentDate(new Date())}
//             >
//               <span className="text-xs text-gray-900">Today</span>
//             </Button>
//             <Button
//               variant="ghost"
//               size="icon"
//               className="rounded-[0px_6px_6px_0px] p-1 bg-gray-100 h-auto"
//               onClick={() => handleNavigation('next')}
//             >
//               <ChevronRightIcon className="h-5 w-5" />
//             </Button>
//           </div>

//           <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as any)}>
//             <ToggleGroupItem value="day" className="px-4 py-1 rounded-lg h-auto data-[state=on]:bg-primary data-[state=on]:text-white">
//               <span className="text-sm font-medium">Daily</span>
//             </ToggleGroupItem>
//             <ToggleGroupItem value="week" className="px-4 py-1 rounded-lg h-auto data-[state=on]:bg-primary data-[state=on]:text-white">
//               <span className="text-sm font-medium">Weekly</span>
//             </ToggleGroupItem>
//             <ToggleGroupItem value="month" className="px-4 py-1 rounded-lg h-auto data-[state=on]:bg-primary data-[state=on]:text-white">
//               <span className="text-sm font-medium">Monthly</span>
//             </ToggleGroupItem>  
//             <ToggleGroupItem value="year" className="px-4 py-1 rounded-lg h-auto data-[state=on]:bg-primary data-[state=on]:text-white">
//               <span className="text-sm font-medium">Yearly</span>
//             </ToggleGroupItem>
//           </ToggleGroup>

//           <div className="w-[184px] flex items-start">
//             <div className="flex items-center gap-2 p-1 flex-1 bg-gray-100 rounded">
//               <SearchIcon className="w-5 h-5" />
//               <Input
//                 className="flex-1 border-0 bg-transparent p-0 text-xs text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto"
//                 placeholder="Search"
//               />
//             </div>
//           </div>
//         </div>
//       </div>
//       <div className="flex-1 overflow-auto">
//         {view === "day" && renderDayView()}
//         {view === "week" && renderWeekView()}
//         {view === "month" && renderMonthView()}
//         {view === "year" && renderYearView()}
//       </div>
//     </section>
//   );
// }

import { ChevronLeftIcon, ChevronRightIcon, Clock3, Copy, Plus, SearchIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "../../../../components/ui/toggle-group";
import { CalendarEvent } from "../../Fantastical";
import { TaskPopup } from "./TaskPopup";
import { ContextMenu } from "./ContextMenu";
import { motion } from "framer-motion";
import Draggable, { DraggableData, DraggableEvent } from "react-draggable";

const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const hour = i % 12 || 12;
  const period = i < 12 ? "AM" : "PM";
  return `${hour} ${period}`;
});

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const HOUR_ROW_HEIGHT = 72;

const eventColorClasses: Record<string, string> = {
  lightblue: "border-blue-200 bg-blue-50 text-blue-700",
  violet: "border-violet-200 bg-violet-50 text-violet-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  rose: "border-rose-200 bg-rose-50 text-rose-700",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const getEventColorClasses = (color: string) => eventColorClasses[color] ?? "border-slate-200 bg-slate-50 text-slate-700";

const isSameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const formatEventTimeLabel = (event: CalendarEvent) => {
  const parsed = new Date(event.startTime);
  if (Number.isNaN(parsed.getTime())) {
    return `${event.time} ${event.period}`;
  }

  return parsed.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

interface PositionedEvent {
  event: CalendarEvent;
  top: number;
  height: number;
  lane: number;
  laneCount: number;
  startMinutes: number;
  endMinutes: number;
}

interface CalendarSectionProps {
  events: CalendarEvent[];
  refreshEvents: (range?: { start: Date; end: Date }) => Promise<void>;
  onUpdateEventPosition?: (eventId: number, newPosition: { top: string; left: string }) => Promise<void> | void;
  onDuplicateEvent?: (eventId: number) => Promise<void> | void;
}

interface CalendarContextMenuState {
  x: number;
  y: number;
  selectedTime: Date;
}

export const CalendarSection = ({
  events,
  refreshEvents,
  onUpdateEventPosition,
  onDuplicateEvent,
}: CalendarSectionProps): JSX.Element => {
  const [view, setView] = useState<"day" | "week" | "month" | "year">(
    () => (window.innerWidth < 1024 ? "month" : "day")
  );
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mobileViewMode, setMobileViewMode] = useState<"calendar" | "agenda">("calendar");
  const [mobileSelectedDate, setMobileSelectedDate] = useState(new Date());
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<Date | undefined>(undefined);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [contextMenu, setContextMenu] = useState<CalendarContextMenuState | null>(null);
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const [now, setNow] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [dragPreview, setDragPreview] = useState<Record<number, { top: number; left: number }>>({});
  const [weekGridWidth, setWeekGridWidth] = useState(0);
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const didAutoScrollDailyRef = useRef(false);
  const weekGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      const nextIsMobile = window.innerWidth < 1024;
      setIsMobileLayout(nextIsMobile);

      if (nextIsMobile) {
        setView("month");
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (
      mobileSelectedDate.getMonth() !== currentDate.getMonth() ||
      mobileSelectedDate.getFullYear() !== currentDate.getFullYear()
    ) {
      const nextSelectedDate = new Date(currentDate);
      const maxDayInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      nextSelectedDate.setDate(Math.min(mobileSelectedDate.getDate(), maxDayInMonth));
      setMobileSelectedDate(nextSelectedDate);
    }
  }, [currentDate, mobileSelectedDate]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(interval);
  }, []);

  const getVisibleRange = (date: Date, currentView: "day" | "week" | "month" | "year") => {
    if (currentView === "day") {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    if (currentView === "week") {
      const start = new Date(date);
      start.setDate(date.getDate() - date.getDay());
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    if (currentView === "month") {
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    const start = new Date(date.getFullYear(), 0, 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date.getFullYear(), 11, 31);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  useEffect(() => {
    void refreshEvents(getVisibleRange(currentDate, view));
  }, [currentDate, view, refreshEvents]);

  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return {
        day: day.toLocaleString("en-US", { weekday: "short" }).toUpperCase(),
        date: day.getDate().toString(),
        isWeekend: i === 0 || i === 6,
        isToday: day.toDateString() === new Date().toDateString(),
      };
    });
  };

  const getMonthData = (date: Date, scopedEvents: CalendarEvent[]) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const start = new Date(firstDay);
    start.setDate(firstDay.getDate() - firstDay.getDay());

    return Array.from({ length: 42 }, (_, index) => {
      const cellDate = new Date(start);
      cellDate.setDate(start.getDate() + index);

      return {
        date: cellDate.getDate().toString(),
        fullDate: cellDate,
        isCurrentMonth: cellDate.getMonth() === date.getMonth(),
        isToday: isSameDay(cellDate, new Date()),
        isWeekend: cellDate.getDay() === 0 || cellDate.getDay() === 6,
        events: scopedEvents.filter((event) => {
          const eventDate = new Date(event.startTime);
          return !Number.isNaN(eventDate.getTime()) && isSameDay(eventDate, cellDate);
        }),
      };
    });
  };

  const getYearData = (date: Date) => {
    return monthNames.map((month, index) => {
      const firstDay = new Date(date.getFullYear(), index, 1);
      const daysInMonth = new Date(date.getFullYear(), index + 1, 0).getDate();
      return {
        month,
        firstWeekday: firstDay.getDay(),
        daysInMonth,
      };
    });
  };

  const handleNavigation = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (view === "day") {
      newDate.setDate(currentDate.getDate() + (direction === "prev" ? -1 : 1));
    } else if (view === "week") {
      newDate.setDate(currentDate.getDate() + (direction === "prev" ? -7 : 7));
    } else if (view === "month") {
      newDate.setMonth(currentDate.getMonth() + (direction === "prev" ? -1 : 1));
    } else if (view === "year") {
      newDate.setFullYear(currentDate.getFullYear() + (direction === "prev" ? -1 : 1));
    }
    setCurrentDate(newDate);
  };

  const getButtonText = () => {
    if (view === "day") {
      return currentDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } else if (view === "week") {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    } else if (view === "month") {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else {
      return currentDate.getFullYear().toString();
    }
  };

  const openCreatePopupAt = (targetDate: Date) => {
    setSelectedEvent(null);
    setSelectedTime(new Date(targetDate));
    setIsPopupOpen(true);
  };

  const openEditPopup = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setSelectedTime(new Date(event.startTime));
    setIsPopupOpen(true);
    setContextMenu(null);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    setSelectedTime(undefined);
    setSelectedEvent(null);
  };

  const handleTimeSlotClick = (hour: number, dayIndex?: number, event?: React.MouseEvent) => {
    const selectedDate = new Date(currentDate);
    if (view === "week" && dayIndex !== undefined) {
      selectedDate.setDate(currentDate.getDate() - currentDate.getDay() + dayIndex);
    }
    selectedDate.setHours(hour, 0, 0, 0);

    if (event) {
      const defaultAction = localStorage.getItem("defaultCalendarAction") || "addTimeEntry";
      const isContextMenuEvent = event.type === "contextmenu";

      if (isContextMenuEvent) {
        event.preventDefault();
        setContextMenu({ x: event.clientX, y: event.clientY, selectedTime: selectedDate });
        return;
      }

      if (view === "week" && defaultAction !== "addTimeEntry") {
        return;
      }
    }

    openCreatePopupAt(selectedDate);
  };

  const handleSave = async () => {
    await refreshEvents(getVisibleRange(currentDate, view));
    closePopup();
  };

  const handleViewChange = (value: string) => {
    if (value === "day" || value === "week" || value === "month" || value === "year") {
      setView(value);
    }
  };

  const searchableEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return events;
    }

    return events.filter((event) => {
      const text = `${event.title} ${event.time} ${event.period}`.toLowerCase();
      return text.includes(query);
    });
  }, [events, searchQuery]);

  const getEventsForDate = (targetDate: Date) =>
    searchableEvents
      .filter((event) => {
        const eventDate = new Date(event.startTime);
        return !Number.isNaN(eventDate.getTime()) && isSameDay(eventDate, targetDate);
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const getPositionedEvents = (dayEvents: CalendarEvent[]): PositionedEvent[] => {
    const laneEndTimes: number[] = [];

    const items = dayEvents.map((event) => {
      const eventDate = new Date(event.startTime);
      const startMinutes = eventDate.getHours() * 60 + eventDate.getMinutes();
      const top = (startMinutes / 60) * HOUR_ROW_HEIGHT;

      const parsedHeight = Number.parseFloat(event.height);
      const height = Number.isFinite(parsedHeight) ? Math.max(24, parsedHeight) : HOUR_ROW_HEIGHT;
      const durationMinutes = Math.max(15, (height / HOUR_ROW_HEIGHT) * 60);
      const endMinutes = Math.min(24 * 60, startMinutes + durationMinutes);

      let lane = laneEndTimes.findIndex((end) => end <= startMinutes);
      if (lane === -1) {
        lane = laneEndTimes.length;
      }
      laneEndTimes[lane] = endMinutes;

      return { event, top, height, lane, startMinutes, endMinutes };
    });

    return items.map((item) => {
      const overlapping = items.filter(
        (other) => other.startMinutes < item.endMinutes && other.endMinutes > item.startMinutes
      );
      const laneCount = Math.max(1, ...overlapping.map((other) => other.lane + 1));
      return { ...item, laneCount };
    });
  };

  useEffect(() => {
    setDragPreview({});
  }, [events]);

  useEffect(() => {
    if (view !== "week") {
      return;
    }

    const updateWeekGridWidth = () => {
      setWeekGridWidth(weekGridRef.current?.clientWidth ?? 0);
    };

    updateWeekGridWidth();
    window.addEventListener("resize", updateWeekGridWidth);

    return () => window.removeEventListener("resize", updateWeekGridWidth);
  }, [view, isMobileLayout]);

  const weekColumnWidth = weekGridWidth > 0 ? weekGridWidth / 7 : 140;

  const parsePixelValue = (value: string | undefined, fallback: number) => {
    const parsed = Number.parseFloat(value ?? "");
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const getEventHeightPx = (event: CalendarEvent) => {
    const parsed = Number.parseFloat(event.height);
    return Number.isFinite(parsed) ? Math.max(24, parsed) : 36;
  };

  const getWeeklyEventPosition = (event: CalendarEvent) => {
    if (dragPreview[event.id]) {
      return dragPreview[event.id];
    }

    const startDate = new Date(event.startTime);
    const fallbackTop = startDate.getHours() * HOUR_ROW_HEIGHT + (startDate.getMinutes() / 60) * HOUR_ROW_HEIGHT;
    const fallbackLeft = startDate.getDay() * weekColumnWidth;
    const parsedTop = parsePixelValue(event.position?.top, fallbackTop);
    const parsedLeft = parsePixelValue(event.position?.left, fallbackLeft);
    const eventHeight = getEventHeightPx(event);
    const maxTop = Math.max(0, 24 * HOUR_ROW_HEIGHT - eventHeight);
    const maxLeft = Math.max(0, weekColumnWidth * 6);

    const outOfBoundsTop = parsedTop < -HOUR_ROW_HEIGHT || parsedTop > 24 * HOUR_ROW_HEIGHT + HOUR_ROW_HEIGHT;
    const outOfBoundsLeft =
      weekGridWidth > 0 && (parsedLeft < -weekColumnWidth || parsedLeft > weekGridWidth + weekColumnWidth);

    const normalizedTop = outOfBoundsTop ? fallbackTop : parsedTop;
    const normalizedLeft = outOfBoundsLeft ? fallbackLeft : parsedLeft;

    const slotHeight = HOUR_ROW_HEIGHT / 4;

    return {
      top: Math.min(maxTop, Math.max(0, Math.round(normalizedTop / slotHeight) * slotHeight)),
      left: Math.min(maxLeft, Math.max(0, Math.round(normalizedLeft / weekColumnWidth) * weekColumnWidth)),
    };
  };

  const handleWeeklyDrag = (eventId: number, data: DraggableData) => {
    setDragPreview((previous) => ({
      ...previous,
      [eventId]: { top: data.y, left: data.x },
    }));
  };

  const handleWeeklyDragStop = (
    eventId: number,
    sourceEvent: CalendarEvent,
    _event: DraggableEvent,
    data: DraggableData
  ) => {
    const dayIndex = Math.min(6, Math.max(0, Math.round(data.x / weekColumnWidth)));
    const snappedLeft = Math.round(dayIndex * weekColumnWidth);
    const slotHeight = HOUR_ROW_HEIGHT / 4;
    const eventHeight = getEventHeightPx(sourceEvent);
    const maxTop = Math.max(0, 24 * HOUR_ROW_HEIGHT - eventHeight);
    const snappedTop = Math.min(maxTop, Math.max(0, Math.round(data.y / slotHeight) * slotHeight));

    setDragPreview((previous) => ({
      ...previous,
      [eventId]: { top: snappedTop, left: snappedLeft },
    }));

    if (onUpdateEventPosition) {
      void onUpdateEventPosition(eventId, {
        top: `${snappedTop}px`,
        left: `${snappedLeft}px`,
      });
    }
  };

  const weekRangeEvents = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(currentDate.getDate() - currentDate.getDay());
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    return searchableEvents.filter((event) => {
      const eventDate = new Date(event.startTime);
      return !Number.isNaN(eventDate.getTime()) && eventDate >= start && eventDate < end;
    });
  }, [currentDate, searchableEvents]);

  useEffect(() => {
    if (isMobileLayout || view !== "day") {
      return;
    }

    const scrollContainer = timelineScrollRef.current;
    if (!scrollContainer) {
      return;
    }

    const nowDate = new Date();
    const focusPosition =
      nowDate.getHours() * HOUR_ROW_HEIGHT + (nowDate.getMinutes() / 60) * HOUR_ROW_HEIGHT;
    const targetTop = Math.max(0, focusPosition - scrollContainer.clientHeight * 0.35);

    scrollContainer.scrollTo({
      top: targetTop,
      behavior: didAutoScrollDailyRef.current ? "smooth" : "auto",
    });

    didAutoScrollDailyRef.current = true;
  }, [currentDate, isMobileLayout, view]);

  const currentTimePosition = now.getHours() * HOUR_ROW_HEIGHT + (now.getMinutes() / 60) * HOUR_ROW_HEIGHT;

  const weekDays = getWeekDays(currentDate);
  const monthData = getMonthData(currentDate, searchableEvents);
  const yearData = getYearData(currentDate);
  const todayWeekIndex = weekDays.findIndex((day) => day.isToday);

  const openTaskForDate = (baseDate: Date) => {
    const entryDate = new Date(baseDate);
    entryDate.setHours(now.getHours(), 0, 0, 0);
    openCreatePopupAt(entryDate);
  };

  const renderMobileCalendar = () => {
    const selectedDayEvents = getEventsForDate(mobileSelectedDate);

    return (
      <div className="space-y-4 p-1">
        <div className="rounded-2xl border border-[#D8BFD8]/40 bg-white/95 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/95">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A88B2] dark:text-slate-400">Selected Day</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {mobileSelectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
            <Button
              size="sm"
              className="h-8 gap-1 bg-gradient-to-r from-[#D8BFD8] to-[#B0C4DE] px-3 text-slate-900 hover:from-[#CFAEE4] hover:to-[#9DB7D8] dark:from-slate-700 dark:to-slate-600 dark:text-slate-100"
              onClick={() => openTaskForDate(mobileSelectedDate)}
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>

          <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayLabel) => (
              <span key={dayLabel} className="py-1">
                {dayLabel}
              </span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {monthData.map((day, index) => {
              const isSelected = isSameDay(day.fullDate, mobileSelectedDate);

              return (
                <button
                  key={`${day.fullDate.toISOString()}-${index}`}
                  type="button"
                  onClick={() => setMobileSelectedDate(new Date(day.fullDate))}
                  className={`relative flex h-10 items-center justify-center rounded-lg text-xs font-medium transition ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#D8BFD8] to-[#B0C4DE] text-slate-900 shadow-sm dark:from-slate-700 dark:to-slate-600 dark:text-slate-100'
                      : day.isCurrentMonth
                      ? 'bg-white text-slate-700 hover:bg-[#F3EEFF] dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-900 dark:text-slate-500'
                  }`}
                >
                  <span>{day.date}</span>
                  {day.events.length > 0 && (
                    <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-[#7C7AA6] dark:bg-[#B0C4DE]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-[#D8BFD8]/40 bg-white/95 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/95">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Entries For Day</p>
            <span className="rounded-full bg-[#F3EEFF] px-2 py-1 text-[11px] font-medium text-[#7C7AA6] dark:bg-slate-800 dark:text-slate-300">
              {selectedDayEvents.length}
            </span>
          </div>

          {selectedDayEvents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#D8BFD8]/50 bg-[#FBFAFF] p-4 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              No entries for this day yet.
            </div>
          ) : (
            <div className="space-y-2">
              {selectedDayEvents.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  className="w-full rounded-xl border border-[#D8BFD8]/40 bg-[#FBFAFF] p-3 text-left transition hover:bg-[#F3EEFF] dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                  onClick={() => openEditPopup(event)}
                  onContextMenu={(mouseEvent) => {
                    mouseEvent.preventDefault();
                    if (onDuplicateEvent) {
                      void onDuplicateEvent(event.id);
                    }
                  }}
                >
                  <div className="text-xs font-semibold text-[#7C7AA6] dark:text-[#B0C4DE]">
                    {formatEventTimeLabel(event)}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{event.title}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMobileAgenda = () => {
    const range = getVisibleRange(currentDate, view);
    const visibleEvents = searchableEvents
      .filter((event) => {
        const eventDate = new Date(event.startTime);
        return eventDate >= range.start && eventDate <= range.end;
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const groupedEvents = visibleEvents.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
      const eventDate = new Date(event.startTime);
      const key = `${eventDate.getFullYear()}-${(eventDate.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${eventDate.getDate().toString().padStart(2, "0")}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(event);
      return acc;
    }, {});

    const groupedEntries = Object.entries(groupedEvents);

    return (
      <div className="space-y-4 p-1">
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="text-sm font-semibold text-gray-800">Mobile Agenda</div>
            <Button
              size="sm"
              className="h-8 gap-1 bg-indigo-600 px-3 text-white hover:bg-indigo-700"
              onClick={() => {
                openTaskForDate(new Date());
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>
          <p className="text-xs text-gray-500">Optimized timeline for phone screens while keeping full add-entry functionality.</p>
        </div>

        {groupedEntries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
            No entries in this range yet.
          </div>
        ) : (
          groupedEntries.map(([dayKey, dayEvents]) => {
            const dayDate = new Date(`${dayKey}T00:00:00`);
            return (
              <div key={dayKey} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <Clock3 className="h-3.5 w-3.5" />
                  {dayDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                <div className="space-y-2">
                  {dayEvents.map((event) => (
                    <button
                      type="button"
                      key={event.id}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-left transition hover:bg-indigo-50"
                      onClick={() => openEditPopup(event)}
                      onContextMenu={(mouseEvent) => {
                        mouseEvent.preventDefault();
                        if (onDuplicateEvent) {
                          void onDuplicateEvent(event.id);
                        }
                      }}
                    >
                      <div className="text-xs font-medium text-indigo-600">
                        {event.time} {event.period}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-gray-800">{event.title}</div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = getPositionedEvents(getEventsForDate(currentDate));

    return (
      <div className="flex h-full w-full min-w-0 flex-col">
        <div className="grid grid-cols-[56px_minmax(0,1fr)] border-b">
          <div className="border-r bg-gray-50" />
          <div
            className={`px-3 py-2 ${currentDate.toDateString() === now.toDateString() ? "bg-indigo-50" : "bg-white"}`}
          >
            <div className="text-[11px] font-semibold tracking-wide text-gray-500">
              {currentDate.toLocaleString("en-US", { weekday: "long" }).toUpperCase()}
            </div>
            <div className="text-2xl font-semibold text-gray-900">{currentDate.getDate()}</div>
          </div>
        </div>

        <div className="grid min-h-[1728px] grid-cols-[56px_minmax(0,1fr)]">
          <div className="border-r bg-gray-50">
            {timeSlots.map((time, timeIndex) => (
              <div
                key={timeIndex}
                className="flex h-[72px] items-start px-2 pt-1 text-[11px] font-medium text-gray-500"
              >
                {time}
              </div>
            ))}
          </div>

          <div className="relative overflow-hidden bg-white">
            {timeSlots.map((_, timeIndex) => (
              <button
                key={timeIndex}
                type="button"
                className="absolute left-0 right-0 border-b border-gray-100 text-transparent transition hover:bg-indigo-50/40"
                style={{
                  top: `${timeIndex * HOUR_ROW_HEIGHT}px`,
                  height: `${HOUR_ROW_HEIGHT}px`,
                }}
                onClick={(event) => handleTimeSlotClick(timeIndex, undefined, event)}
                onContextMenu={(event) => handleTimeSlotClick(timeIndex, undefined, event)}
              >
                Add entry
              </button>
            ))}

            {dayEvents.map((item) => {
              const laneWidth = 100 / item.laneCount;
              const leftPercent = item.lane * laneWidth;

              return (
                <button
                  key={item.event.id}
                  type="button"
                  className={`absolute z-10 rounded-md border px-2 py-1 text-left text-xs shadow-sm ${getEventColorClasses(item.event.color)}`}
                  style={{
                    top: `${item.top + 2}px`,
                    left: `calc(${leftPercent}% + 6px)`,
                    width: `calc(${laneWidth}% - 12px)`,
                    height: `${Math.max(20, item.height - 4)}px`,
                  }}
                  onClick={() => openEditPopup(item.event)}
                  onContextMenu={(mouseEvent) => {
                    mouseEvent.preventDefault();
                    if (onDuplicateEvent) {
                      void onDuplicateEvent(item.event.id);
                    }
                  }}
                >
                  <div className="truncate font-semibold">{item.event.title}</div>
                  <div className="truncate text-[10px] opacity-80">{formatEventTimeLabel(item.event)}</div>
                </button>
              );
            })}

            {currentDate.toDateString() === now.toDateString() && (
              <div
                className="pointer-events-none absolute inset-x-0 z-20"
                style={{ top: `${currentTimePosition}px` }}
              >
                <div className="relative flex items-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-sm" />
                  <div className="h-[2px] flex-1 bg-rose-500/90" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const renderedWeekEvents = [...weekRangeEvents].sort(
      (left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime()
    );

    return (
      <div className="flex h-full w-full min-w-0 flex-col">
        <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b">
          <div className="border-r bg-gray-50" />
          {weekDays.map((dayInfo, index) => (
            <div
              key={index}
              className={`border-r px-2 py-2 text-center last:border-r-0 ${
                dayInfo.isWeekend ? "bg-gray-50" : dayInfo.isToday ? "bg-indigo-50" : "bg-white"
              }`}
            >
              <div className="text-[11px] font-semibold text-gray-500">{dayInfo.day}</div>
              <div className="text-xl font-semibold text-gray-900">{dayInfo.date}</div>
            </div>
          ))}
        </div>

        <div className="grid min-h-[1728px] grid-cols-[56px_minmax(0,1fr)]">
          <div className="border-r bg-gray-50">
            {timeSlots.map((time, timeIndex) => (
              <div
                key={timeIndex}
                className="flex h-[72px] items-start px-2 pt-1 text-[11px] font-medium text-gray-500"
              >
                {time}
              </div>
            ))}
          </div>

          <div ref={weekGridRef} className="relative overflow-hidden bg-white">
            <div className="absolute inset-0 grid grid-cols-7">
              {weekDays.map((dayInfo, dayIndex) => (
                <div
                  key={dayIndex}
                  className={`relative border-r last:border-r-0 ${dayInfo.isWeekend ? "bg-gray-50" : "bg-white"}`}
                >
                  {timeSlots.map((_, timeIndex) => (
                    <button
                      key={timeIndex}
                      type="button"
                      className="absolute left-0 right-0 border-b border-gray-100 text-transparent transition hover:bg-indigo-50/40"
                      style={{
                        top: `${timeIndex * HOUR_ROW_HEIGHT}px`,
                        height: `${HOUR_ROW_HEIGHT}px`,
                      }}
                      onClick={(event) => handleTimeSlotClick(timeIndex, dayIndex, event)}
                      onContextMenu={(event) => handleTimeSlotClick(timeIndex, dayIndex, event)}
                    >
                      Add entry
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {renderedWeekEvents.map((event) => {
              const eventPosition = getWeeklyEventPosition(event);
              const eventHeight = getEventHeightPx(event);

              return (
                <Draggable
                  key={event.id}
                  bounds="parent"
                  grid={[Math.max(1, weekColumnWidth), HOUR_ROW_HEIGHT / 4]}
                  position={{ x: eventPosition.left, y: eventPosition.top }}
                  onDrag={(_, data) => handleWeeklyDrag(event.id, data)}
                  onStop={(dragEvent, data) => handleWeeklyDragStop(event.id, event, dragEvent, data)}
                  cancel=".event-actions"
                >
                  <div
                    className={`absolute z-20 cursor-move rounded-md border px-2 py-1 text-xs shadow-sm ${getEventColorClasses(event.color)}`}
                    style={{
                      width: `${Math.max(88, weekColumnWidth - 8)}px`,
                      height: `${eventHeight}px`,
                    }}
                    onClick={() => openEditPopup(event)}
                    onContextMenu={(mouseEvent) => {
                      mouseEvent.preventDefault();
                      mouseEvent.stopPropagation();
                      if (onDuplicateEvent) {
                        void onDuplicateEvent(event.id);
                      }
                    }}
                    title="Drag to move in weekly view"
                  >
                    <button
                      type="button"
                      className="event-actions absolute right-1 top-1 rounded p-0.5 text-current/70 transition hover:bg-white/60 hover:text-current"
                      onMouseDown={(mouseEvent) => mouseEvent.stopPropagation()}
                      onClick={(mouseEvent) => {
                        mouseEvent.stopPropagation();
                        if (onDuplicateEvent) {
                          void onDuplicateEvent(event.id);
                        }
                      }}
                      title="Duplicate entry"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    <div className="truncate pr-5 font-semibold">{event.title}</div>
                    <div className="truncate text-[10px] opacity-80">{formatEventTimeLabel(event)}</div>
                  </div>
                </Draggable>
              );
            })}

            {todayWeekIndex !== -1 && (
              <div
                className="pointer-events-none absolute z-20"
                style={{
                  top: `${currentTimePosition}px`,
                  left: `calc(${todayWeekIndex} * (100% / 7))`,
                  width: "calc(100% / 7)",
                }}
              >
                <div className="relative flex items-center">
                  <div className="absolute -left-1.5 h-3 w-3 rounded-full bg-rose-500 shadow-sm" />
                  <div className="h-[2px] w-full bg-rose-500/90" />
                </div>
              </div>
            )}
          </div>
        </div>

        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            onAddTimeEntry={() => {
              openCreatePopupAt(contextMenu.selectedTime);
              setContextMenu(null);
            }}
          />
        )}
      </div>
    );
  };

  const renderMonthView = () => (
    <div className="flex flex-col w-full h-full">
      <div className="grid grid-cols-7 border-b bg-gray-50">
        {weekDays.map((day) => (
          <div key={day.day} className="border-r p-2 text-center last:border-r-0">
            <span className="text-xs font-bold text-gray-500">{day.day}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 auto-rows-[minmax(120px,1fr)]">
        {monthData.map((day, index) => (
          <div
            key={index}
            className={`border-b border-r p-2 last:border-r-0 ${
              day.isCurrentMonth
                ? day.isToday
                  ? "bg-indigo-50"
                  : day.isWeekend
                    ? "bg-gray-50"
                    : "bg-white"
                : "bg-gray-100"
            }`}
          >
            <span className={`text-sm font-medium ${day.isCurrentMonth ? "text-gray-900" : "text-gray-400"}`}>
              {day.date}
            </span>
            <div className="mt-2 space-y-1 overflow-hidden">
              {day.events.slice(0, 3).map((event) => (
                <button
                  key={event.id}
                  type="button"
                  className={`w-full truncate rounded-md border px-1.5 py-1 text-left text-[11px] ${getEventColorClasses(event.color)}`}
                  title={`${formatEventTimeLabel(event)} ${event.title}`}
                  onClick={() => openEditPopup(event)}
                  onContextMenu={(mouseEvent) => {
                    mouseEvent.preventDefault();
                    if (onDuplicateEvent) {
                      void onDuplicateEvent(event.id);
                    }
                  }}
                >
                  <span className="font-medium">{formatEventTimeLabel(event)}</span> {event.title}
                </button>
              ))}
              {day.events.length > 3 && (
                <div className="px-1 text-[11px] font-medium text-gray-500">+{day.events.length - 3} more</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderYearView = () => (
    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-4">
      {yearData.map((month) => (
        <div key={month.month} className="border rounded-lg overflow-hidden">
          <div className="bg-gray-100 p-2 border-b">
            <h3 className="text-sm font-semibold text-gray-900">{month.month}</h3>
          </div>
          <div className="p-2">
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day) => (
                <div key={day.day} className="text-[10px] text-center text-gray-500">
                  {day.day[0]}
                </div>
              ))}
              {Array.from({
                length: Math.ceil((month.firstWeekday + month.daysInMonth) / 7) * 7,
              }).map((_, i) => {
                const day = i - month.firstWeekday + 1;
                const isInMonth = day > 0 && day <= month.daysInMonth;

                return (
                <div
                  key={i}
                  className={`aspect-square flex items-center justify-center text-[10px] ${
                    isInMonth ? "text-gray-900" : "text-transparent"
                  }`}
                >
                  {isInMonth ? day : ""}
                </div>
              );
            })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <section className="flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden p-2 sm:gap-4 sm:p-4">
      <motion.div
        className="sticky top-0 z-10 rounded-b-lg border-b bg-gradient-to-r from-[#ECFEFF] via-[#F0F9FF] to-[#FFF7ED] px-3 pb-2 pt-3 shadow-sm dark:from-gray-800 dark:to-gray-900 sm:px-6 sm:pt-4"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-1">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 rounded-l-lg bg-white p-2 shadow-sm hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 sm:h-10"
                onClick={() => handleNavigation("prev")}
              >
                <ChevronLeftIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                className="h-9 rounded-none bg-white px-4 py-2 shadow-sm hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 sm:h-10 sm:px-6"
                onClick={() => setCurrentDate(new Date())}
              >
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 sm:text-base">{getButtonText()}</span>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 rounded-r-lg bg-white p-2 shadow-sm hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 sm:h-10"
                onClick={() => handleNavigation("next")}
              >
                <ChevronRightIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              </Button>
            </motion.div>
          </div>

          {isMobileLayout ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileViewMode("calendar")}
                className={`h-9 rounded-lg px-4 text-sm font-medium transition ${
                  mobileViewMode === "calendar"
                    ? "bg-gradient-to-r from-[#D8BFD8] to-[#B0C4DE] text-slate-900 shadow-sm dark:from-slate-700 dark:to-slate-600 dark:text-slate-100"
                    : "bg-white text-slate-600 hover:bg-[#F3EEFF] dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                Calendar
              </button>
              <button
                type="button"
                onClick={() => setMobileViewMode("agenda")}
                className={`h-9 rounded-lg px-4 text-sm font-medium transition ${
                  mobileViewMode === "agenda"
                    ? "bg-gradient-to-r from-[#D8BFD8] to-[#B0C4DE] text-slate-900 shadow-sm dark:from-slate-700 dark:to-slate-600 dark:text-slate-100"
                    : "bg-white text-slate-600 hover:bg-[#F3EEFF] dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                Agenda
              </button>
            </div>
          ) : (
            <ToggleGroup type="single" value={view} onValueChange={handleViewChange} className="flex overflow-x-auto pb-1">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <ToggleGroupItem
                  value="day"
                  className="h-9 rounded-lg px-4 py-2 text-sm font-medium data-[state=on]:bg-indigo-600 data-[state=on]:text-white hover:bg-gray-100 dark:hover:bg-gray-600 sm:h-10 sm:px-6 sm:text-base"
                >
                  Daily
                </ToggleGroupItem>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <ToggleGroupItem
                  value="week"
                  className="h-9 rounded-lg px-4 py-2 text-sm font-medium data-[state=on]:bg-indigo-600 data-[state=on]:text-white hover:bg-gray-100 dark:hover:bg-gray-600 sm:h-10 sm:px-6 sm:text-base"
                >
                  Weekly
                </ToggleGroupItem>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <ToggleGroupItem
                  value="month"
                  className="h-9 rounded-lg px-4 py-2 text-sm font-medium data-[state=on]:bg-indigo-600 data-[state=on]:text-white hover:bg-gray-100 dark:hover:bg-gray-600 sm:h-10 sm:px-6 sm:text-base"
                >
                  Monthly
                </ToggleGroupItem>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <ToggleGroupItem
                  value="year"
                  className="h-9 rounded-lg px-4 py-2 text-sm font-medium data-[state=on]:bg-indigo-600 data-[state=on]:text-white hover:bg-gray-100 dark:hover:bg-gray-600 sm:h-10 sm:px-6 sm:text-base"
                >
                  Yearly
                </ToggleGroupItem>
              </motion.div>
            </ToggleGroup>
          )}

          <div className="flex w-full items-center lg:w-[200px]">
            <motion.div
              className="flex items-center gap-2 p-2 flex-1 bg-white dark:bg-gray-700 rounded-lg shadow-sm"
              whileHover={{ scale: 1.02 }}
            >
              <SearchIcon className="w-5 h-5 text-gray-500" />
              <Input
                className="flex-1 border-0 bg-transparent p-0 text-sm text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </motion.div>
          </div>
        </div>
      </motion.div>
      <div ref={timelineScrollRef} className="relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        {isMobileLayout ? (
          mobileViewMode === "agenda" ? renderMobileAgenda() : renderMobileCalendar()
        ) : (
          <>
            {view === "day" && renderDayView()}
            {view === "week" && renderWeekView()}
            {view === "month" && renderMonthView()}
            {view === "year" && renderYearView()}
          </>
        )}
        <TaskPopup
          isOpen={isPopupOpen}
          onClose={closePopup}
          defaultStartTime={selectedTime}
          initialEntry={selectedEvent}
          onSave={handleSave}
        />
      </div>
    </section>
  );
};