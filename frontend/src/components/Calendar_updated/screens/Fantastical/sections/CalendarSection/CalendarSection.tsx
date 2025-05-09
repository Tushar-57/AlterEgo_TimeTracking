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

import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "../../../../components/ui/toggle-group";
import { CalendarEvent } from "../../Fantastical";
import { TaskPopup } from "./TaskPopup";
import { ContextMenu } from "./ContextMenu";
import { motion } from "framer-motion";

const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const hour = i % 12 || 12;
  const period = i < 12 ? "AM" : "PM";
  return `${hour} ${period}`;
});

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface CalendarSectionProps {
  events: CalendarEvent[];
  refreshEvents: () => Promise<void>;
}

export const CalendarSection = ({ events, refreshEvents }: CalendarSectionProps): JSX.Element => {
  const [view, setView] = useState<"day" | "week" | "month" | "year">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<Date | undefined>(undefined);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

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

  const getMonthData = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const totalSlots = Math.ceil((daysInMonth + startDay) / 7) * 7;

    return Array.from({ length: totalSlots }, (_, i) => {
      const day = i - startDay + 1;
      const isCurrentMonth = day > 0 && day <= daysInMonth;
      const currentDate = isCurrentMonth ? day : i < startDay ? day + lastDay.getDate() - startDay : day - daysInMonth;
      return {
        date: currentDate.toString(),
        isCurrentMonth,
        isToday: isCurrentMonth && new Date(date.getFullYear(), date.getMonth(), day).toDateString() === new Date().toDateString(),
        isWeekend: (i % 7 === 0 || i % 7 === 6) && isCurrentMonth,
        events: isCurrentMonth
          ? events.filter((e) => {
              try {
                const eventDate = new Date(e.startTime);
                return eventDate.getDate() === day && eventDate.getMonth() === date.getMonth() && eventDate.getFullYear() === date.getFullYear();
              } catch (error) {
                console.error("Error parsing event date:", e, error);
                return false;
              }
            })
          : [],
      };
    });
  };

  const getYearData = (date: Date) => {
    return monthNames.map((month, index) => {
      const lastDay = new Date(date.getFullYear(), index + 1, 0).getDate();
      return {
        month,
        days: Array.from({ length: 35 }, (_, i) => {
          const day = (i % lastDay) + 1;
          return {
            date: day.toString(),
            events: events.filter((e) => {
              try {
                const eventDate = new Date(e.startTime);
                return eventDate.getMonth() === index && eventDate.getDate() === day;
              } catch (error) {
                console.error("Error parsing event date:", e, error);
                return false;
              }
            }),
          };
        }),
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

  const handleTimeSlotClick = (hour: number, dayIndex?: number, event?: React.MouseEvent) => {
    const selectedDate = new Date(currentDate);
    if (view === "week" && dayIndex !== undefined) {
      selectedDate.setDate(currentDate.getDate() - currentDate.getDay() + dayIndex);
    }
    selectedDate.setHours(hour, 0, 0, 0);

    if (event && view === "week") {
      event.preventDefault();
      const defaultAction = localStorage.getItem("defaultCalendarAction") || "addTimeEntry";
      if (event.type === "click" && defaultAction === "addTimeEntry") {
        setSelectedTime(selectedDate);
        setIsPopupOpen(true);
      } else if (event.type === "contextmenu") {
        setContextMenu({ x: event.clientX, y: event.clientY });
      }
    } else {
      setSelectedTime(selectedDate);
      setIsPopupOpen(true);
    }
  };

  const handleSave = async () => {
    await refreshEvents();
    setIsPopupOpen(false);
    setSelectedTime(undefined);
  };

  const weekDays = getWeekDays(currentDate);
  const monthData = getMonthData(currentDate);
  const yearData = getYearData(currentDate);

  const renderDayView = () => (
    <div className="flex flex-col w-full h-full items-start" style={{ minHeight: "1728px" }}>
      <div className="flex w-full items-start pl-12 pr-0 py-0 gap-3">
        <div className="flex w-full">
          <div
            className={`flex flex-col flex-1 items-start pt-1 pb-4 px-2 shadow-[inset_-1px_-1px_0px_#e0e0e0] ${
              weekDays.find((d) => d.isToday)?.isToday ? "bg-indigo-50" : "bg-white"
            }`}
          >
            <div className="relative self-stretch mt-[-1.00px] font-bold text-gray-500 text-[10px] tracking-[0] leading-3">
              {currentDate.toLocaleString("en-US", { weekday: "short" }).toUpperCase()}
            </div>
            <div className="self-stretch font-medium text-black text-[22px] leading-8 tracking-[0]">
              {currentDate.getDate()}
            </div>
          </div>
        </div>
        <div className="w-12 mt-[-1.00px] text-xs font-medium text-gray-500">
          EST<br />GMT-5
        </div>
      </div>
      <div className="flex w-full flex-1 overflow-y-auto">
        <div className="w-12 flex flex-col">
          {timeSlots.map((time, timeIndex) => (
            <div
              key={timeIndex}
              className="w-12 h-[72px] mt-[-1.00px] text-xs font-medium text-gray-500 flex items-center"
            >
              {time}
            </div>
          ))}
        </div>
        <div className="flex flex-1 flex-col">
          {timeSlots.map((time, timeIndex) => (
            <div
              key={timeIndex}
              className="flex w-full items-start cursor-pointer hover:bg-gray-100"
              onClick={() => handleTimeSlotClick(timeIndex)}
            >
              <div className="flex flex-col flex-1 items-start shadow-[inset_-1px_-1px_0px_#e0e0e0] bg-white">
                <div className="relative self-stretch w-full h-9 shadow-[inset_0px_-1px_0px_#f7f7f7]" />
                <div className="relative self-stretch w-full h-9" />
              </div>
            </div>
          ))}
        </div>
        <div className="w-12 flex flex-col">
          {timeSlots.map((time, timeIndex) => (
            <div
              key={timeIndex}
              className="w-12 h-[72px] mt-[-1.00px] text-xs font-medium text-gray-500 flex items-center"
            >
              {time}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderWeekView = () => (
    <div className="flex flex-col w-full h-full items-start" style={{ minHeight: "1728px" }}>
      <div className="flex w-full items-start py-0 gap-3">
        <div className="w-12" />
        <div className="grid grid-cols-7 flex-1">
          {weekDays.map((dayInfo, index) => (
            <div
              key={index}
              className={`flex flex-col flex-1 items-center pt-1 pb-4 px-2 shadow-[inset_-1px_-1px_0px_#e0e0e0] ${
                dayInfo.isWeekend ? "bg-gray-50" : dayInfo.isToday ? "bg-indigo-50 border-indigo-200 border-2" : "bg-white"
              }`}
              data-today={dayInfo.isToday}
            >
              <div className="font-bold text-gray-500 text-[10px] tracking-[0] leading-3">{dayInfo.day}</div>
              <div className="font-medium text-black text-[22px] leading-8 tracking-[0]">{dayInfo.date}</div>
            </div>
          ))}
        </div>
        <div className="w-12 mt-[-1.00px] text-xs font-medium text-gray-500">
          EST<br />GMT-5
        </div>
      </div>
      <div className="flex w-full flex-1 overflow-y-auto">
        <div className="w-12 flex flex-col">
          {timeSlots.map((time, timeIndex) => (
            <div
              key={timeIndex}
              className="w-12 h-[72px] mt-[-1.00px] text-xs font-medium text-gray-500 flex items-center"
            >
              {time}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 flex-1 relative">
          {timeSlots.map((time, timeIndex) => (
            <div key={timeIndex} className="contents">
              {weekDays.map((dayInfo, dayIndex) => (
                <div
                  key={dayIndex}
                  className={`flex flex-col flex-1 items-start shadow-[inset_-1px_-1px_0px_#e0e0e0] ${
                    dayInfo.isWeekend ? "bg-gray-50" : dayInfo.isToday ? "bg-indigo-50 border-indigo-200 border-2" : "bg-white"
                  } cursor-pointer hover:bg-gray-100`}
                  onClick={(e) => handleTimeSlotClick(timeIndex, dayIndex, e)}
                  onContextMenu={(e) => handleTimeSlotClick(timeIndex, dayIndex, e)}
                >
                  <div className="relative self-stretch w-full h-9 shadow-[inset_0px_-1px_0px_#f7f7f7]" />
                  <div className="relative self-stretch w-full h-9" />
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="w-12 flex flex-col">
          {timeSlots.map((time, timeIndex) => (
            <div
              key={timeIndex}
              className="w-12 h-[72px] mt-[-1.00px] text-xs font-medium text-gray-500 flex items-center"
            >
              {time}
            </div>
          ))}
        </div>
      </div>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onAddTimeEntry={() => {
            setIsPopupOpen(true);
            setContextMenu(null);
          }}
        />
      )}
    </div>
  );

  const renderMonthView = () => (
    <div className="flex flex-col w-full h-full">
      <div className="grid grid-cols-7 border-b">
        {weekDays.map((day) => (
          <div key={day.day} className="p-2 text-center border-r last:border-r-0">
            <span className="text-xs font-bold text-gray-500">{day.day}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 flex-1">
        {monthData.map((day, index) => (
          <div
            key={index}
            className={`min-h-[100px] p-2 border-b border-r last:border-r-0 ${
              day.isCurrentMonth
                ? day.isToday
                  ? "bg-indigo-50 border-indigo-200 border-2"
                  : day.isWeekend
                    ? "bg-gray-50"
                    : "bg-white"
                : "bg-gray-100"
            }`}
          >
            <span className={`text-sm ${day.isCurrentMonth ? "text-gray-900" : "text-gray-400"}`}>{day.date}</span>
            <div className="flex gap-1 mt-1 flex-wrap">
              {day.events.map((event) => (
                <div
                  key={event.id}
                  className={`w-2 h-2 rounded-full bg-${event.color}-500`}
                  title={event.title}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderYearView = () => (
    <div className="grid grid-cols-4 gap-4 p-4">
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
              {month.days.map((day, i) => (
                <div
                  key={i}
                  className="text-[10px] text-center text-gray-900 aspect-square flex items-center justify-center"
                >
                  <div>
                    {day.date}
                    <div className="flex gap-0.5 justify-center">
                      {day.events.map((event) => (
                        <div
                          key={event.id}
                          className={`w-1 h-1 rounded-full bg-${event.color}-500`}
                          title={event.title}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <section className="flex flex-col w-full h-full gap-4 p-4 overflow-auto">
      <motion.div
        className="sticky top-0 z-10 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 pt-4 pb-2 px-6 border-b rounded-b-lg shadow-sm"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between relative self-stretch w-full">
          <div className="flex items-center gap-1">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-l-lg p-2 bg-white dark:bg-gray-700 h-10 shadow-sm hover:bg-gray-000 dark:hover:bg-gray-600"
                onClick={() => handleNavigation("prev")}
              >
                <ChevronLeftIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                className="px-6 py-2 bg-white dark:bg-gray-700 rounded-none h-10 shadow-sm hover:bg-gray-000 dark:hover:bg-gray-600"
                onClick={() => setCurrentDate(new Date())}
              >
                <span className="text-base font-medium text-gray-900 dark:text-gray-100">{getButtonText()}</span>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-r-lg p-2 bg-white dark:bg-gray-700 h-10 shadow-sm hover:bg-gray-000 dark:hover:bg-gray-600"
                onClick={() => handleNavigation("next")}
              >
                <ChevronRightIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              </Button>
            </motion.div>
          </div>

          <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as any)}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <ToggleGroupItem
                value="day"
                className="px-6 py-2 rounded-lg h-10 text-base font-medium data-[state=on]:bg-indigo-600 data-[state=on]:text-white hover:bg-gray-000 dark:hover:bg-gray-600"
              >
                Daily
              </ToggleGroupItem>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <ToggleGroupItem
                value="week"
                className="px-6 py-2 rounded-lg h-10 text-base font-medium data-[state=on]:bg-indigo-600 data-[state=on]:text-white hover:bg-gray-000 dark:hover:bg-gray-600"
              >
                Weekly
              </ToggleGroupItem>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <ToggleGroupItem
                value="month"
                className="px-6 py-2 rounded-lg h-10 text-base font-medium data-[state=on]:bg-indigo-600 data-[state=on]:text-white hover:bg-gray-000 dark:hover:bg-gray-600"
              >
                Monthly
              </ToggleGroupItem>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <ToggleGroupItem
                value="year"
                className="px-6 py-2 rounded-lg h-10 text-base font-medium data-[state=on]:bg-indigo-600 data-[state=on]:text-white hover:bg-gray-000 dark:hover:bg-gray-600"
              >
                Yearly
              </ToggleGroupItem>
            </motion.div>
          </ToggleGroup>

          <div className="w-[200px] flex items-center">
            <motion.div
              className="flex items-center gap-2 p-2 flex-1 bg-white dark:bg-gray-700 rounded-lg shadow-sm"
              whileHover={{ scale: 1.02 }}
            >
              <SearchIcon className="w-5 h-5 text-gray-500" />
              <Input
                className="flex-1 border-0 bg-transparent p-0 text-sm text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto"
                placeholder="Search tasks..."
              />
            </motion.div>
          </div>
        </div>
      </motion.div>
      <div className="flex-1 overflow-auto relative" style={{ minHeight: "1728px" }}>
        {view === "day" && renderDayView()}
        {view === "week" && renderWeekView()}
        {view === "month" && renderMonthView()}
        {view === "year" && renderYearView()}
        <TaskPopup
          isOpen={isPopupOpen}
          onClose={() => setIsPopupOpen(false)}
          defaultStartTime={selectedTime}
          onSave={handleSave}
        />
      </div>
    </section>
  );
};