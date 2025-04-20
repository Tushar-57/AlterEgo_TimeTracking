import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "lucide-react";
import React, { useState } from "react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "../../../../components/ui/toggle-group";

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
const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const hour = i % 12 || 12; // Convert 0 to 12
  const period = i < 12 ? 'AM' : 'PM';
  return `${hour} ${period}`;
});

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

export const CalendarSection = (): JSX.Element => {
  const [view, setView] = useState<"day" | "week" | "month" | "year">("week");

  const renderDayView = () => (
    <div className="flex flex-col w-full h-full items-start">
      <div className="flex w-full items-start pl-12 pr-0 py-0 gap-3">
        <div className="flex flex-1">
          <div className={`flex flex-col flex-1 items-start pt-1 pb-4 px-2 shadow-[inset_-1px_-1px_0px_#e0e0e0] ${weekDays[4].isToday ? "bg-blue-50" : "bg-white"}`}>
            <div className="relative self-stretch mt-[-1.00px] font-bold text-gray-500 text-[10px] tracking-[0] leading-3">
              {weekDays[4].day}
            </div>
            <div className="self-stretch font-medium text-black text-[22px] leading-8 tracking-[0]">
              {weekDays[4].date}
            </div>
          </div>
        </div>
        <div className="w-12 mt-[-1.00px] text-xs font-medium text-gray-500">
          EST<br />GMT-5
        </div>
      </div>
      {timeSlots.map((time, timeIndex) => (
        <div key={timeIndex} className="flex w-full items-start gap-3">
          <div className="w-9 mt-[-1.00px] text-xs font-medium text-gray-500">
            {time}
          </div>
          <div className="flex flex-1 items-start">
            <div className="flex flex-col flex-1 items-start shadow-[inset_-1px_-1px_0px_#e0e0e0] bg-white">
              <div className="relative self-stretch w-full h-9 shadow-[inset_0px_-1px_0px_#f7f7f7]" />
              <div className="relative self-stretch w-full h-9" />
            </div>
          </div>
          <div className="w-9 mt-[-1.00px] text-xs font-medium text-gray-500">
            {time}
          </div>
        </div>
      ))}
    </div>
  );

  const renderWeekView = () => (
    <div className="flex flex-col w-full h-full items-start">
      <div className="flex w-full items-start pl-12 pr-0 py-0 gap-3">
        <div className="flex flex-1">
          {weekDays.map((dayInfo, index) => (
            <div
              key={index}
              className={`flex flex-col flex-1 items-start pt-1 pb-4 px-2 shadow-[inset_-1px_-1px_0px_#e0e0e0] ${
                dayInfo.isWeekend
                  ? "bg-gray-50"
                  : dayInfo.isToday
                    ? "bg-blue-50"
                    : "bg-white"
              }`}
            >
              <div className="relative self-stretch mt-[-1.00px] font-bold text-gray-500 text-[10px] tracking-[0] leading-3">
                {dayInfo.day}
              </div>
              <div className="self-stretch font-medium text-black text-[22px] leading-8 tracking-[0]">
                {dayInfo.date}
              </div>
            </div>
          ))}
        </div>
        <div className="w-12 mt-[-1.00px] text-xs font-medium text-gray-500">
          EST<br />GMT-5
        </div>
      </div>
      {timeSlots.map((time, timeIndex) => (
        <div key={timeIndex} className="flex w-full items-start gap-3">
          <div className="w-9 mt-[-1.00px] text-xs font-medium text-gray-500">
            {time}
          </div>
          <div className="flex flex-1 items-start">
            {weekDays.map((dayInfo, dayIndex) => (
              <div
                key={dayIndex}
                className={`flex flex-col flex-1 items-start shadow-[inset_-1px_-1px_0px_#e0e0e0] ${
                  dayInfo.isWeekend
                    ? "bg-gray-50"
                    : dayInfo.isToday
                      ? "bg-blue-50"
                      : "bg-white"
                }`}
              >
                <div className="relative self-stretch w-full h-9 shadow-[inset_0px_-1px_0px_#f7f7f7]" />
                <div className="relative self-stretch w-full h-9" />
              </div>
            ))}
          </div>
          <div className="w-9 mt-[-1.00px] text-xs font-medium text-gray-500">
            {time}
          </div>
        </div>
      ))}
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
                  ? "bg-blue-50"
                  : day.isWeekend
                    ? "bg-gray-50"
                    : "bg-white"
                : "bg-gray-100"
            }`}
          >
            <span className={`text-sm ${day.isCurrentMonth ? "text-gray-900" : "text-gray-400"}`}>
              {day.date}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderYearView = () => (
    <div className="grid grid-cols-4 gap-4 p-4">
      {monthNames.map((month, index) => (
        <div key={month} className="border rounded-lg overflow-hidden">
          <div className="bg-gray-100 p-2 border-b">
            <h3 className="text-sm font-semibold text-gray-900">{month}</h3>
          </div>
          <div className="p-2">
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day) => (
                <div key={day.day} className="text-[10px] text-center text-gray-500">
                  {day.day[0]}
                </div>
              ))}
              {Array.from({ length: 35 }, (_, i) => (
                <div
                  key={i}
                  className="text-[10px] text-center text-gray-400 aspect-square flex items-center justify-center"
                >
                  {((i % 31) + 1)}
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
      <div className="sticky top-0 z-10 bg-white pt-4 pb-2 px-4 border-b">
        <div className="flex items-start justify-between relative self-stretch w-full">
          <div className="flex items-start gap-px">
            <div className="flex items-start">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-[6px_0px_0px_6px] p-1 bg-gray-100 h-auto"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex items-start">
              <Button
                variant="ghost"
                className="px-4 py-1.5 bg-gray-100 rounded-none h-auto"
              >
                <span className="text-xs text-gray-900">Today</span>
              </Button>
            </div>
            <div className="flex items-start">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-[0px_6px_6px_0px] p-1 bg-gray-100 h-auto"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </Button>
            </div>
          </div>

        <ToggleGroup type="single" value={view} onValueChange={(v) => setView(v as any)}>
        <ToggleGroupItem value="day" className="px-4 py-1 rounded-lg h-auto data-[state=on]:bg-primary data-[state=on]:text-white">
            <span className="text-sm font-medium">Daily</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="week" className="px-4 py-1 rounded-lg h-auto data-[state=on]:bg-primary data-[state=on]:text-white">
            <span className="text-sm font-medium">Weekly</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="month" className="px-4 py-1 rounded-lg h-auto data-[state=on]:bg-primary data-[state=on]:text-white">
            <span className="text-sm font-medium">Monthly</span>
          </ToggleGroupItem>  
          <ToggleGroupItem value="year" className="px-4 py-1 rounded-lg h-auto data-[state=on]:bg-primary data-[state=on]:text-white">
            <span className="text-sm font-medium">Yearly</span>
          </ToggleGroupItem>
        </ToggleGroup>

        <div className="w-[184px] flex items-start">
          <div className="flex items-center gap-2 p-1 flex-1 bg-gray-100 rounded">
            <SearchIcon className="w-5 h-5" />
            <Input
              className="flex-1 border-0 bg-transparent p-0 text-xs text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto"
              placeholder="Search"
            />
          </div>
        </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {view === "day" && renderDayView()}
        {view === "week" && renderWeekView()}
        {view === "month" && renderMonthView()}
        {view === "year" && renderYearView()}
      </div>
    </section>
  );
};