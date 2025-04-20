import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloudIcon,
  SunIcon,
  VideoIcon,
} from "lucide-react";
import React from "react";
import { Badge } from "../../../../components/ui/badge";
import { ScrollArea } from "../../../../components/ui/scroll-area";

// Define data for days of the week
const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

// Define data for calendar dates
const calendarWeeks = [
  // Week 1: Jan 31 - Feb 6
  [
    { day: "31", isCurrentMonth: false, dots: [] },
    { day: "1", isCurrentMonth: true, dots: ["blue", "purple", "teal"] },
    { day: "2", isCurrentMonth: true, dots: ["blue", "purple", "teal"] },
    { day: "3", isCurrentMonth: true, dots: ["blue", "purple", "teal"] },
    { day: "4", isCurrentMonth: true, dots: ["blue", "purple", "teal"] },
    { day: "5", isCurrentMonth: true, dots: ["blue", "purple", "teal"] },
    { day: "6", isCurrentMonth: true, dots: [] },
  ],
  // Week 2: Feb 7 - 13
  [
    { day: "7", isCurrentMonth: true, dots: [] },
    { day: "8", isCurrentMonth: true, dots: ["blue", "purple", "teal"] },
    { day: "9", isCurrentMonth: true, dots: ["blue", "purple", "teal"] },
    { day: "10", isCurrentMonth: true, dots: ["blue", "purple", "teal"] },
    { day: "11", isCurrentMonth: true, dots: ["teal"] },
    { day: "12", isCurrentMonth: true, dots: ["blue", "purple", "teal"] },
    { day: "13", isCurrentMonth: true, dots: [] },
  ],
  // Week 3: Feb 14 - 20
  [
    { day: "14", isCurrentMonth: true, dots: ["purple", "teal"] },
    { day: "15", isCurrentMonth: true, dots: ["purple"] },
    { day: "16", isCurrentMonth: true, dots: ["blue", "purple", "teal"] },
    { day: "17", isCurrentMonth: true, dots: ["blue", "purple", "teal"] },
    { day: "18", isCurrentMonth: true, dots: ["blue", "purple", "teal"] },
    { day: "19", isCurrentMonth: true, dots: ["blue", "purple", "teal"] },
    { day: "20", isCurrentMonth: true, dots: [] },
  ],
  // Week 4: Feb 21 - 27
  [
    { day: "21", isCurrentMonth: true, dots: [] },
    { day: "22", isCurrentMonth: true, dots: ["blue", "purple", "teal"] },
    { day: "23", isCurrentMonth: true, dots: ["blue", "teal"] },
    { day: "24", isCurrentMonth: true, dots: ["blue", "purple", "teal"] },
    { day: "25", isCurrentMonth: true, dots: ["blue", "purple", "teal"] },
    { day: "26", isCurrentMonth: true, dots: ["blue", "purple", "teal"] },
    { day: "27", isCurrentMonth: true, isSelected: true, dots: ["white"] },
  ],
  // Week 5: Feb 28 - Mar 6
  [
    { day: "28", isCurrentMonth: true, dots: ["blue"] },
    { day: "1", isCurrentMonth: false, dots: ["purple", "teal"] },
    { day: "2", isCurrentMonth: false, dots: ["purple"] },
    { day: "3", isCurrentMonth: false, dots: ["blue", "purple", "teal"] },
    { day: "4", isCurrentMonth: false, dots: ["teal"] },
    { day: "5", isCurrentMonth: false, dots: ["blue", "teal"] },
    { day: "6", isCurrentMonth: false, dots: [] },
  ],
  // Week 6: Mar 7 - 13
  [
    { day: "7", isCurrentMonth: false, dots: [] },
    { day: "8", isCurrentMonth: false, dots: ["blue", "purple", "teal"] },
    { day: "9", isCurrentMonth: false, dots: ["blue", "teal"] },
    { day: "10", isCurrentMonth: false, dots: ["blue", "purple", "teal"] },
    { day: "11", isCurrentMonth: false, dots: ["blue", "purple", "teal"] },
    { day: "12", isCurrentMonth: false, dots: ["blue", "purple"] },
    { day: "13", isCurrentMonth: false, dots: [] },
  ],
];

// Define data for events
const events = [
  {
    date: "TODAY 2/27/2021",
    weather: { temp: "55°", low: "40°", icon: "sun" },
    events: [
      {
        type: "special",
        color: "purple",
        title: "All-Hands Company Meeting",
      },
      {
        color: "blue",
        time: "8:30 – 9:00 AM",
        title: "Monthly catch-up",
        hasVideo: true,
      },
      {
        color: "blue",
        time: "8:30 – 9:00 AM",
        title: "Quarterly review",
        hasVideo: true,
        link: "https://zoom.us/i/1983475281",
      },
    ],
  },
  {
    date: "TOMORROW 2/28/2021",
    weather: { temp: "55°", low: "40°", icon: "sun" },
    events: [
      {
        color: "pink",
        time: "8:30 – 9:00 AM",
        title: "Visit to discuss improvements",
        hasVideo: true,
        link: "https://zoom.us/i/1983475281",
      },
      {
        color: "blue",
        time: "8:30 – 9:00 AM",
        title: "Presentation of new products and cost structure",
        hasVideo: true,
      },
    ],
  },
  {
    date: "MONDAY 3/1/2021",
    weather: { temp: "55°", low: "40°", icon: "cloud" },
    events: [
      {
        color: "pink",
        time: "8:30 – 9:00 AM",
        title: "City Sales Pitch",
        hasVideo: true,
        link: "https://zoom.us/i/1983475281",
      },
    ],
  },
  {
    date: "TUESDAY 3/2/2021",
    weather: { temp: "55°", low: "40°", icon: "cloud" },
    events: [
      {
        color: "amber",
        time: "8:30 – 9:00 AM",
        title: "Visit to discuss improvements",
        hasVideo: true,
      },
    ],
  },
  {
    date: "WEDNESDAY 3/3/2021",
    weather: { temp: "55°", low: "40°", icon: "cloud" },
    events: [
      {
        color: "blue",
        time: "8:30 – 9:00 AM",
        title: "Meeting to talk about Ross contract.",
        hasVideo: true,
      },
      {
        color: "blue",
        time: "8:30 – 9:00 AM",
        title: "Meeting to discuss the new proposal",
        hasVideo: true,
      },
    ],
  },
  {
    date: "THURSDAY 3/4/2021",
    weather: { temp: "55°", low: "40°", icon: "sun" },
    events: [
      {
        color: "pink",
        time: "8:30 – 9:00 AM",
        title: "Monthly catch-up",
        hasVideo: true,
        link: "https://zoom.us/i/1983475281",
      },
    ],
  },
  {
    date: "FRIDAY 3/5/2021",
    weather: { temp: "55°", low: "40°", icon: "sun" },
    events: [
      {
        color: "amber",
        time: "8:30 – 9:00 AM",
        title: "Follow up proposal",
        hasVideo: true,
      },
      {
        color: "blue",
        time: "8:30 – 9:00 AM",
        title: "City Sales Pitch",
        hasVideo: true,
      },
    ],
  },
  {
    date: "SATURDAY 3/6/2021",
    weather: { temp: "55°", low: "40°", icon: "sun" },
    events: [
      {
        type: "special",
        color: "green",
        title: "Spring Break 2021!",
      },
    ],
  },
  {
    date: "SUNDAY 3/7/2021",
    weather: { temp: "55°", low: "40°", icon: "sun" },
    events: [
      {
        type: "special",
        color: "green",
        title: "Spring Break 2021!",
      },
    ],
  },
  {
    date: "MONDAY 3/8/2021",
    weather: { temp: "55°", low: "40°", icon: "sun" },
    events: [
      {
        type: "special",
        color: "green",
        title: "Spring Break 2021!",
      },
      {
        color: "blue",
        time: "8:30 – 9:00 AM",
        title: "Meeting to talk about Ross contract.",
        hasVideo: true,
      },
      {
        color: "blue",
        time: "8:30 – 9:00 AM",
        title: "Meeting to talk about Ross contract.",
        hasVideo: true,
      },
    ],
  },
  {
    date: "TUESDAY 3/9/2021",
    weather: { temp: "55°", low: "40°", icon: "sun" },
    events: [
      {
        type: "special",
        color: "green",
        title: "Spring Break 2021!",
      },
      {
        color: "blue",
        time: "8:30 – 9:00 AM",
        title: "Quarterly review",
        hasVideo: true,
      },
    ],
  },
];

export const NavigationMenuSection = (): JSX.Element => {
  return (
    <aside className="flex flex-col w-[300px] h-[900px] bg-gray-900 p-4 gap-4">
      {/* Window Controls */}
      <div className="flex items-center gap-2.5 w-full">
        <div className="flex items-start gap-2 flex-1">
          <div className="bg-[#ed6b60] border border-solid border-[#d05147] w-3 h-3 rounded-md" />
          <div className="bg-[#f5c250] border border-solid border-[#d6a343] w-3 h-3 rounded-md" />
          <div className="bg-[#62c656] border border-solid border-[#52a842] w-3 h-3 rounded-md" />
        </div>
        <div className="inline-flex">
          <div className="items-center justify-center px-1.5 py-1 bg-[#ffffff1a] rounded-lg shadow-shadow-base inline-flex">
            <img className="w-5 h-5" alt="Icon" src="/icon-3.svg" />
          </div>
        </div>
      </div>

      {/* Month Header */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-1">
          <div className="font-text-3xl-medium text-white text-[length:var(--text-3xl-medium-font-size)] tracking-[var(--text-3xl-medium-letter-spacing)] leading-[var(--text-3xl-medium-line-height)]">
            February
          </div>
          <div className="font-text-3xl-regular text-red-500 text-[length:var(--text-3xl-regular-font-size)] leading-[var(--text-3xl-regular-line-height)] tracking-[var(--text-3xl-regular-letter-spacing)]">
            2021
          </div>
        </div>
        <div className="flex">
          <button className="p-0">
            <ChevronLeftIcon className="w-6 h-6 text-white" />
          </button>
          <button className="p-0">
            <ChevronRightIcon className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex flex-col">
        {/* Days of week */}
        <div className="flex w-full">
          {daysOfWeek.map((day) => (
            <div key={day} className="flex p-1 flex-1">
              <div className="flex-1 font-semibold text-gray-500 text-[10px] text-center leading-4">
                {day}
              </div>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {calendarWeeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex w-full">
            {week.map((day, dayIndex) => (
              <div
                key={`${weekIndex}-${dayIndex}`}
                className="flex flex-col items-center flex-1"
              >
                {day.isSelected ? (
                  <div className="flex flex-col items-center p-1 bg-blue-500 rounded-[100px]">
                    <div className="w-5 font-semibold text-white text-[11px] text-center leading-4">
                      {day.day}
                    </div>
                    <div className="flex items-start gap-0.5">
                      {day.dots.map((dot, dotIndex) => (
                        <div
                          key={dotIndex}
                          className={`bg-white w-1 h-1 rounded-sm`}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center p-1 flex-1">
                    <div
                      className={`self-stretch font-semibold text-[11px] text-center leading-4 ${
                        day.isCurrentMonth ? "text-white" : "text-gray-500"
                      }`}
                    >
                      {day.day}
                    </div>
                    <div
                      className={`flex items-start gap-0.5 ${
                        day.dots.length === 0 ? "opacity-0" : ""
                      }`}
                    >
                      {day.dots.map((dot, dotIndex) => (
                        <div
                          key={dotIndex}
                          className={`bg-${dot}-500 w-1 h-1 rounded-sm`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Events List */}
      <ScrollArea className="w-[268px] h-[552px]">
        <div className="flex flex-col w-[268px] gap-2">
          {events.map((day, dayIndex) => (
            <React.Fragment key={dayIndex}>
              {/* Day Header */}
              <div className="flex items-start justify-between w-full">
                <div className="flex items-start gap-1">
                  <div
                    className={`font-bold text-[13px] leading-5 ${day.date.startsWith("TODAY") ? "text-blue-500" : "text-[#ffffffb2]"}`}
                  >
                    {day.date.split(" ")[0]}
                  </div>
                  <div
                    className={`font-normal text-[13px] leading-5 ${day.date.startsWith("TODAY") ? "text-blue-500" : "text-[#ffffffb2]"}`}
                  >
                    {day.date.split(" ")[1]}
                  </div>
                </div>
                <div className="flex items-start gap-1">
                  <div className="flex">
                    <div className="font-bold text-[#ffffffb2] text-[13px] leading-5">
                      {day.weather.temp}
                    </div>
                    <div className="font-normal text-[#ffffffb2] text-[13px] leading-5">
                      /{day.weather.low}
                    </div>
                  </div>
                  {day.weather.icon === "sun" ? (
                    <SunIcon className="w-5 h-5 text-[#ffffffb2]" />
                  ) : (
                    <CloudIcon className="w-5 h-5 text-[#ffffffb2]" />
                  )}
                </div>
              </div>

              {/* Events */}
              {day.events.map((event, eventIndex) => (
                <React.Fragment key={eventIndex}>
                  {event.type === "special" ? (
                    <Badge
                      className={`inline-flex px-1.5 py-0 bg-${event.color}-500 rounded-md`}
                    >
                      <div className="font-text-sm-medium text-white text-[length:var(--text-sm-medium-font-size)] tracking-[var(--text-sm-medium-letter-spacing)] leading-[var(--text-sm-medium-line-height)]">
                        {event.title}
                      </div>
                    </Badge>
                  ) : (
                    <div className="flex flex-col w-full">
                      <div className="flex items-center gap-2 w-full">
                        <div
                          className={`bg-${event.color}-500 w-3 h-3 rounded-md`}
                        />
                        <div className="flex items-center gap-1">
                          <div className="font-semibold text-gray-400 text-[11px] leading-4">
                            {event.time}
                          </div>
                          {event.hasVideo && (
                            <div className="flex items-start p-0.5 bg-gray-400 rounded-[100px]">
                              <VideoIcon className="w-2 h-2 text-gray-900" />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex pl-5 w-full">
                        <div className="flex-1 font-text-xs-medium text-white text-[length:var(--text-xs-medium-font-size)] tracking-[var(--text-xs-medium-letter-spacing)] leading-[var(--text-xs-medium-line-height)]">
                          {event.title}
                        </div>
                      </div>
                      {event.link && (
                        <div className="flex pl-5 w-full">
                          <div className="font-normal text-gray-400 text-[11px] leading-4">
                            {event.link}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </React.Fragment>
              ))}
            </React.Fragment>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
};
