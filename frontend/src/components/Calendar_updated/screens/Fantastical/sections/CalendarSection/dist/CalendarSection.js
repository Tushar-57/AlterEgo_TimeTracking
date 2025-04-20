"use strict";
exports.__esModule = true;
exports.CalendarSection = void 0;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var button_1 = require("../../../../components/ui/button");
var input_1 = require("../../../../components/ui/input");
var toggle_group_1 = require("../../../../components/ui/toggle-group");
// Data for days of the week
var weekDays = [
    { day: "SUN", date: "21", isWeekend: true },
    { day: "MON", date: "22", isWeekend: false },
    { day: "TUE", date: "23", isWeekend: false },
    { day: "WED", date: "24", isWeekend: false },
    { day: "THU", date: "25", isWeekend: false, isToday: true },
    { day: "FRI", date: "26", isWeekend: false },
    { day: "SAT", date: "27", isWeekend: true },
];
// Time slots
var timeSlots = Array.from({ length: 24 }, function (_, i) {
    var hour = i % 12 || 12; // Convert 0 to 12
    var period = i < 12 ? 'AM' : 'PM';
    return hour + " " + period;
});
// Month data
var monthData = Array.from({ length: 35 }, function (_, i) { return ({
    date: i + 1,
    isCurrentMonth: i < 31,
    isToday: i === 24,
    isWeekend: i % 7 === 0 || i % 7 === 6
}); });
// Year data
var monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];
exports.CalendarSection = function () {
    var _a = react_1.useState("week"), view = _a[0], setView = _a[1];
    var renderDayView = function () { return (react_1["default"].createElement("div", { className: "flex flex-col w-full h-full items-start" },
        react_1["default"].createElement("div", { className: "flex w-full items-start pl-12 pr-0 py-0 gap-3" },
            react_1["default"].createElement("div", { className: "flex flex-1" },
                react_1["default"].createElement("div", { className: "flex flex-col flex-1 items-start pt-1 pb-4 px-2 shadow-[inset_-1px_-1px_0px_#e0e0e0] " + (weekDays[4].isToday ? "bg-blue-50" : "bg-white") },
                    react_1["default"].createElement("div", { className: "relative self-stretch mt-[-1.00px] font-bold text-gray-500 text-[10px] tracking-[0] leading-3" }, weekDays[4].day),
                    react_1["default"].createElement("div", { className: "self-stretch font-medium text-black text-[22px] leading-8 tracking-[0]" }, weekDays[4].date))),
            react_1["default"].createElement("div", { className: "w-12 mt-[-1.00px] text-xs font-medium text-gray-500" },
                "EST",
                react_1["default"].createElement("br", null),
                "GMT-5")),
        timeSlots.map(function (time, timeIndex) { return (react_1["default"].createElement("div", { key: timeIndex, className: "flex w-full items-start gap-3" },
            react_1["default"].createElement("div", { className: "w-9 mt-[-1.00px] text-xs font-medium text-gray-500" }, time),
            react_1["default"].createElement("div", { className: "flex flex-1 items-start" },
                react_1["default"].createElement("div", { className: "flex flex-col flex-1 items-start shadow-[inset_-1px_-1px_0px_#e0e0e0] bg-white" },
                    react_1["default"].createElement("div", { className: "relative self-stretch w-full h-9 shadow-[inset_0px_-1px_0px_#f7f7f7]" }),
                    react_1["default"].createElement("div", { className: "relative self-stretch w-full h-9" }))),
            react_1["default"].createElement("div", { className: "w-9 mt-[-1.00px] text-xs font-medium text-gray-500" }, time))); }))); };
    var renderWeekView = function () { return (react_1["default"].createElement("div", { className: "flex flex-col w-full h-full items-start" },
        react_1["default"].createElement("div", { className: "flex w-full items-start pl-12 pr-0 py-0 gap-3" },
            react_1["default"].createElement("div", { className: "flex flex-1" }, weekDays.map(function (dayInfo, index) { return (react_1["default"].createElement("div", { key: index, className: "flex flex-col flex-1 items-start pt-1 pb-4 px-2 shadow-[inset_-1px_-1px_0px_#e0e0e0] " + (dayInfo.isWeekend
                    ? "bg-gray-50"
                    : dayInfo.isToday
                        ? "bg-blue-50"
                        : "bg-white") },
                react_1["default"].createElement("div", { className: "relative self-stretch mt-[-1.00px] font-bold text-gray-500 text-[10px] tracking-[0] leading-3" }, dayInfo.day),
                react_1["default"].createElement("div", { className: "self-stretch font-medium text-black text-[22px] leading-8 tracking-[0]" }, dayInfo.date))); })),
            react_1["default"].createElement("div", { className: "w-12 mt-[-1.00px] text-xs font-medium text-gray-500" },
                "EST",
                react_1["default"].createElement("br", null),
                "GMT-5")),
        timeSlots.map(function (time, timeIndex) { return (react_1["default"].createElement("div", { key: timeIndex, className: "flex w-full items-start gap-3" },
            react_1["default"].createElement("div", { className: "w-9 mt-[-1.00px] text-xs font-medium text-gray-500" }, time),
            react_1["default"].createElement("div", { className: "flex flex-1 items-start" }, weekDays.map(function (dayInfo, dayIndex) { return (react_1["default"].createElement("div", { key: dayIndex, className: "flex flex-col flex-1 items-start shadow-[inset_-1px_-1px_0px_#e0e0e0] " + (dayInfo.isWeekend
                    ? "bg-gray-50"
                    : dayInfo.isToday
                        ? "bg-blue-50"
                        : "bg-white") },
                react_1["default"].createElement("div", { className: "relative self-stretch w-full h-9 shadow-[inset_0px_-1px_0px_#f7f7f7]" }),
                react_1["default"].createElement("div", { className: "relative self-stretch w-full h-9" }))); })),
            react_1["default"].createElement("div", { className: "w-9 mt-[-1.00px] text-xs font-medium text-gray-500" }, time))); }))); };
    var renderMonthView = function () { return (react_1["default"].createElement("div", { className: "flex flex-col w-full h-full" },
        react_1["default"].createElement("div", { className: "grid grid-cols-7 border-b" }, weekDays.map(function (day) { return (react_1["default"].createElement("div", { key: day.day, className: "p-2 text-center border-r last:border-r-0" },
            react_1["default"].createElement("span", { className: "text-xs font-bold text-gray-500" }, day.day))); })),
        react_1["default"].createElement("div", { className: "grid grid-cols-7 flex-1" }, monthData.map(function (day, index) { return (react_1["default"].createElement("div", { key: index, className: "min-h-[100px] p-2 border-b border-r last:border-r-0 " + (day.isCurrentMonth
                ? day.isToday
                    ? "bg-blue-50"
                    : day.isWeekend
                        ? "bg-gray-50"
                        : "bg-white"
                : "bg-gray-100") },
            react_1["default"].createElement("span", { className: "text-sm " + (day.isCurrentMonth ? "text-gray-900" : "text-gray-400") }, day.date))); })))); };
    var renderYearView = function () { return (react_1["default"].createElement("div", { className: "grid grid-cols-4 gap-4 p-4" }, monthNames.map(function (month, index) { return (react_1["default"].createElement("div", { key: month, className: "border rounded-lg overflow-hidden" },
        react_1["default"].createElement("div", { className: "bg-gray-100 p-2 border-b" },
            react_1["default"].createElement("h3", { className: "text-sm font-semibold text-gray-900" }, month)),
        react_1["default"].createElement("div", { className: "p-2" },
            react_1["default"].createElement("div", { className: "grid grid-cols-7 gap-1" },
                weekDays.map(function (day) { return (react_1["default"].createElement("div", { key: day.day, className: "text-[10px] text-center text-gray-500" }, day.day[0])); }),
                Array.from({ length: 35 }, function (_, i) { return (react_1["default"].createElement("div", { key: i, className: "text-[10px] text-center text-gray-400 aspect-square flex items-center justify-center" }, ((i % 31) + 1))); }))))); }))); };
    return (react_1["default"].createElement("section", { className: "flex flex-col w-full h-full gap-4 p-4 overflow-auto" },
        react_1["default"].createElement("div", { className: "sticky top-0 z-10 bg-white pt-4 pb-2 px-4 border-b" },
            react_1["default"].createElement("div", { className: "flex items-start justify-between relative self-stretch w-full" },
                react_1["default"].createElement("div", { className: "flex items-start gap-px" },
                    react_1["default"].createElement("div", { className: "flex items-start" },
                        react_1["default"].createElement(button_1.Button, { variant: "ghost", size: "icon", className: "rounded-[6px_0px_0px_6px] p-1 bg-gray-100 h-auto" },
                            react_1["default"].createElement(lucide_react_1.ChevronLeftIcon, { className: "h-5 w-5" }))),
                    react_1["default"].createElement("div", { className: "flex items-start" },
                        react_1["default"].createElement(button_1.Button, { variant: "ghost", className: "px-4 py-1.5 bg-gray-100 rounded-none h-auto" },
                            react_1["default"].createElement("span", { className: "text-xs text-gray-900" }, "Today"))),
                    react_1["default"].createElement("div", { className: "flex items-start" },
                        react_1["default"].createElement(button_1.Button, { variant: "ghost", size: "icon", className: "rounded-[0px_6px_6px_0px] p-1 bg-gray-100 h-auto" },
                            react_1["default"].createElement(lucide_react_1.ChevronRightIcon, { className: "h-5 w-5" })))),
                react_1["default"].createElement(toggle_group_1.ToggleGroup, { type: "single", value: view, onValueChange: function (v) { return setView(v); } },
                    react_1["default"].createElement(toggle_group_1.ToggleGroupItem, { value: "day", className: "px-4 py-1 rounded-lg h-auto data-[state=on]:bg-primary data-[state=on]:text-white" },
                        react_1["default"].createElement("span", { className: "text-sm font-medium" }, "Daily")),
                    react_1["default"].createElement(toggle_group_1.ToggleGroupItem, { value: "week", className: "px-4 py-1 rounded-lg h-auto data-[state=on]:bg-primary data-[state=on]:text-white" },
                        react_1["default"].createElement("span", { className: "text-sm font-medium" }, "Weekly")),
                    react_1["default"].createElement(toggle_group_1.ToggleGroupItem, { value: "month", className: "px-4 py-1 rounded-lg h-auto data-[state=on]:bg-primary data-[state=on]:text-white" },
                        react_1["default"].createElement("span", { className: "text-sm font-medium" }, "Monthly")),
                    react_1["default"].createElement(toggle_group_1.ToggleGroupItem, { value: "year", className: "px-4 py-1 rounded-lg h-auto data-[state=on]:bg-primary data-[state=on]:text-white" },
                        react_1["default"].createElement("span", { className: "text-sm font-medium" }, "Yearly"))),
                react_1["default"].createElement("div", { className: "w-[184px] flex items-start" },
                    react_1["default"].createElement("div", { className: "flex items-center gap-2 p-1 flex-1 bg-gray-100 rounded" },
                        react_1["default"].createElement(lucide_react_1.SearchIcon, { className: "w-5 h-5" }),
                        react_1["default"].createElement(input_1.Input, { className: "flex-1 border-0 bg-transparent p-0 text-xs text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto", placeholder: "Search" }))))),
        react_1["default"].createElement("div", { className: "flex-1 overflow-auto" },
            view === "day" && renderDayView(),
            view === "week" && renderWeekView(),
            view === "month" && renderMonthView(),
            view === "year" && renderYearView())));
};
