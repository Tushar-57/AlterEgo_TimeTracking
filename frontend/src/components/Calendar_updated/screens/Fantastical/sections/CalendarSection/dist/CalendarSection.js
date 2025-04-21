"use strict";
exports.__esModule = true;
exports.CalendarSection = void 0;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var button_1 = require("../../../../components/ui/button");
var input_1 = require("../../../../components/ui/input");
var toggle_group_1 = require("../../../../components/ui/toggle-group");
var timeSlots = Array.from({ length: 24 }, function (_, i) {
    var hour = i % 12 || 12;
    var period = i < 12 ? 'AM' : 'PM';
    return hour + " " + period;
});
var monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];
exports.CalendarSection = function (_a) {
    var events = _a.events;
    var _b = react_1.useState("week"), view = _b[0], setView = _b[1];
    var _c = react_1.useState(new Date()), currentDate = _c[0], setCurrentDate = _c[1];
    var getWeekDays = function (date) {
        var startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        return Array.from({ length: 7 }, function (_, i) {
            var day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            return {
                day: day.toLocaleString('en-US', { weekday: 'short' }).toUpperCase(),
                date: day.getDate().toString(),
                isWeekend: i === 0 || i === 6,
                isToday: day.toDateString() === new Date().toDateString()
            };
        });
    };
    var getMonthData = function (date) {
        var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        var startDay = firstDay.getDay();
        var daysInMonth = lastDay.getDate();
        var totalSlots = Math.ceil((daysInMonth + startDay) / 7) * 7;
        return Array.from({ length: totalSlots }, function (_, i) {
            var day = i - startDay + 1;
            var isCurrentMonth = day > 0 && day <= daysInMonth;
            var currentDate = isCurrentMonth ? day : i < startDay ? day + lastDay.getDate() - startDay : day - daysInMonth;
            return {
                date: currentDate.toString(),
                isCurrentMonth: isCurrentMonth,
                isToday: isCurrentMonth && new Date(date.getFullYear(), date.getMonth(), day).toDateString() === new Date().toDateString(),
                isWeekend: (i % 7 === 0 || i % 7 === 6) && isCurrentMonth,
                events: isCurrentMonth ? events.filter(function (e) { return new Date(e.position.top).getDate() === day; }) : []
            };
        });
    };
    var getYearData = function (date) {
        return monthNames.map(function (month, index) {
            var lastDay = new Date(date.getFullYear(), index + 1, 0).getDate();
            return {
                month: month,
                days: Array.from({ length: 35 }, function (_, i) {
                    var day = (i % lastDay) + 1;
                    return {
                        date: day.toString(),
                        events: events.filter(function (e) { return new Date(e.position.top).getMonth() === index && new Date(e.position.top).getDate() === day; })
                    };
                })
            };
        });
    };
    var handleNavigation = function (direction) {
        var newDate = new Date(currentDate);
        if (view === 'day') {
            newDate.setDate(currentDate.getDate() + (direction === 'prev' ? -1 : 1));
        }
        else if (view === 'week') {
            newDate.setDate(currentDate.getDate() + (direction === 'prev' ? -7 : 7));
        }
        else if (view === 'month') {
            newDate.setMonth(currentDate.getMonth() + (direction === 'prev' ? -1 : 1));
        }
        else if (view === 'year') {
            newDate.setFullYear(currentDate.getFullYear() + (direction === 'prev' ? -1 : 1));
        }
        setCurrentDate(newDate);
    };
    var weekDays = getWeekDays(currentDate);
    var monthData = getMonthData(currentDate);
    var yearData = getYearData(currentDate);
    var renderDayView = function () {
        var _a;
        return (React.createElement("div", { className: "flex flex-col w-full h-full items-start" },
            React.createElement("div", { className: "flex w-full items-start pl-12 pr-0 py-0 gap-3" },
                React.createElement("div", { className: "flex flex-1" },
                    React.createElement("div", { className: "flex flex-col flex-1 items-start pt-1 pb-4 px-2 shadow-[inset_-1px_-1px_0px_#e0e0e0] " + (((_a = weekDays.find(function (d) { return d.isToday; })) === null || _a === void 0 ? void 0 : _a.isToday) ? "bg-blue-50" : "bg-white") },
                        React.createElement("div", { className: "relative self-stretch mt-[-1.00px] font-bold text-gray-500 text-[10px] tracking-[0] leading-3" }, currentDate.toLocaleString('en-US', { weekday: 'short' }).toUpperCase()),
                        React.createElement("div", { className: "self-stretch font-medium text-black text-[22px] leading-8 tracking-[0]" }, currentDate.getDate()))),
                React.createElement("div", { className: "w-12 mt-[-1.00px] text-xs font-medium text-gray-500" },
                    "EST",
                    React.createElement("br", null),
                    "GMT-5")),
            timeSlots.map(function (time, timeIndex) { return (React.createElement("div", { key: timeIndex, className: "flex w-full items-start gap-3" },
                React.createElement("div", { className: "w-9 mt-[-1.00px] text-xs font-medium text-gray-500" }, time),
                React.createElement("div", { className: "flex flex-1 items-start" },
                    React.createElement("div", { className: "flex flex-col flex-1 items-start shadow-[inset_-1px_-1px_0px_#e0e0e0] bg-white" },
                        React.createElement("div", { className: "relative self-stretch w-full h-9 shadow-[inset_0px_-1px_0px_#f7f7f7]" }),
                        React.createElement("div", { className: "relative self-stretch w-full h-9" }))),
                React.createElement("div", { className: "w-9 mt-[-1.00px] text-xs font-medium text-gray-500" }, time))); })));
    };
    var renderWeekView = function () { return (React.createElement("div", { className: "flex flex-col w-full h-full items-start" },
        React.createElement("div", { className: "flex w-full items-start pl-12 pr-0 py-0 gap-3" },
            React.createElement("div", { className: "flex flex-1" }, weekDays.map(function (dayInfo, index) { return (React.createElement("div", { key: index, className: "flex flex-col flex-1 items-start pt-1 pb-4 px-2 shadow-[inset_-1px_-1px_0px_#e0e0e0] " + (dayInfo.isWeekend
                    ? "bg-gray-50"
                    : dayInfo.isToday
                        ? "bg-blue-50"
                        : "bg-white") },
                React.createElement("div", { className: "relative self-stretch mt-[-1.00px] font-bold text-gray-500 text-[10px] tracking-[0] leading-3" }, dayInfo.day),
                React.createElement("div", { className: "self-stretch font-medium text-black text-[22px] leading-8 tracking-[0]" }, dayInfo.date))); })),
            React.createElement("div", { className: "w-12 mt-[-1.00px] text-xs font-medium text-gray-500" },
                "EST",
                React.createElement("br", null),
                "GMT-5")),
        timeSlots.map(function (time, timeIndex) { return (React.createElement("div", { key: timeIndex, className: "flex w-full items-start gap-3" },
            React.createElement("div", { className: "w-9 mt-[-1.00px] text-xs font-medium text-gray-500" }, time),
            React.createElement("div", { className: "flex flex-1 items-start" }, weekDays.map(function (dayInfo, dayIndex) { return (React.createElement("div", { key: dayIndex, className: "flex flex-col flex-1 items-start shadow-[inset_-1px_-1px_0px_#e0e0e0] " + (dayInfo.isWeekend
                    ? "bg-gray-50"
                    : dayInfo.isToday
                        ? "bg-blue-50"
                        : "bg-white") },
                React.createElement("div", { className: "relative self-stretch w-full h-9 shadow-[inset_0px_-1px_0px_#f7f7f7]" }),
                React.createElement("div", { className: "relative self-stretch w-full h-9" }))); })),
            React.createElement("div", { className: "w-9 mt-[-1.00px] text-xs font-medium text-gray-500" }, time))); }))); };
    var renderMonthView = function () { return (React.createElement("div", { className: "flex flex-col w-full h-full" },
        React.createElement("div", { className: "grid grid-cols-7 border-b" }, weekDays.map(function (day) { return (React.createElement("div", { key: day.day, className: "p-2 text-center border-r last:border-r-0" },
            React.createElement("span", { className: "text-xs font-bold text-gray-500" }, day.day))); })),
        React.createElement("div", { className: "grid grid-cols-7 flex-1" }, monthData.map(function (day, index) { return (React.createElement("div", { key: index, className: "min-h-[100px] p-2 border-b border-r last:border-r-0 " + (day.isCurrentMonth
                ? day.isToday
                    ? "bg-blue-50"
                    : day.isWeekend
                        ? "bg-gray-50"
                        : "bg-white"
                : "bg-gray-100") },
            React.createElement("span", { className: "text-sm " + (day.isCurrentMonth ? "text-gray-900" : "text-gray-400") }, day.date),
            React.createElement("div", { className: "flex gap-1 mt-1" }, day.events.map(function (event) { return (React.createElement("div", { key: event.id, className: "w-2 h-2 rounded-full bg-" + event.color + "-500" })); })))); })))); };
    var renderYearView = function () { return (React.createElement("div", { className: "grid grid-cols-4 gap-4 p-4" }, yearData.map(function (month) { return (React.createElement("div", { key: month.month, className: "border rounded-lg overflow-hidden" },
        React.createElement("div", { className: "bg-gray-100 p-2 border-b" },
            React.createElement("h3", { className: "text-sm font-semibold text-gray-900" }, month.month)),
        React.createElement("div", { className: "p-2" },
            React.createElement("div", { className: "grid grid-cols-7 gap-1" },
                weekDays.map(function (day) { return (React.createElement("div", { key: day.day, className: "text-[10px] text-center text-gray-500" }, day.day[0])); }),
                month.days.map(function (day, i) { return (React.createElement("div", { key: i, className: "text-[10px] text-center text-gray-900 aspect-square flex items-center justify-center" },
                    React.createElement("div", null,
                        day.date,
                        React.createElement("div", { className: "flex gap-0.5 justify-center" }, day.events.map(function (event) { return (React.createElement("div", { key: event.id, className: "w-1 h-1 rounded-full bg-" + event.color + "-500" })); }))))); }))))); }))); };
    return (React.createElement("section", { className: "flex flex-col w-full h-full gap-4 p-4 overflow-auto" },
        React.createElement("div", { className: "sticky top-0 z-10 bg-white pt-4 pb-2 px-4 border-b" },
            React.createElement("div", { className: "flex items-start justify-between relative self-stretch w-full" },
                React.createElement("div", { className: "flex items-start gap-px" },
                    React.createElement(button_1.Button, { variant: "ghost", size: "icon", className: "rounded-[6px_0px_0px_6px] p-1 bg-gray-100 h-auto", onClick: function () { return handleNavigation('prev'); } },
                        React.createElement(lucide_react_1.ChevronLeftIcon, { className: "h-5 w-5" })),
                    React.createElement(button_1.Button, { variant: "ghost", className: "px-4 py-1.5 bg-gray-100 rounded-none h-auto", onClick: function () { return setCurrentDate(new Date()); } },
                        React.createElement("span", { className: "text-xs text-gray-900" }, "Today")),
                    React.createElement(button_1.Button, { variant: "ghost", size: "icon", className: "rounded-[0px_6px_6px_0px] p-1 bg-gray-100 h-auto", onClick: function () { return handleNavigation('next'); } },
                        React.createElement(lucide_react_1.ChevronRightIcon, { className: "h-5 w-5" }))),
                React.createElement(toggle_group_1.ToggleGroup, { type: "single", value: view, onValueChange: function (v) { return v && setView(v); } },
                    React.createElement(toggle_group_1.ToggleGroupItem, { value: "day", className: "px-4 py-1 rounded-lg h-auto data-[state=on]:bg-primary data-[state=on]:text-white" },
                        React.createElement("span", { className: "text-sm font-medium" }, "Daily")),
                    React.createElement(toggle_group_1.ToggleGroupItem, { value: "week", className: "px-4 py-1 rounded-lg h-auto data-[state=on]:bg-primary data-[state=on]:text-white" },
                        React.createElement("span", { className: "text-sm font-medium" }, "Weekly")),
                    React.createElement(toggle_group_1.ToggleGroupItem, { value: "month", className: "px-4 py-1 rounded-lg h-auto data-[state=on]:bg-primary data-[state=on]:text-white" },
                        React.createElement("span", { className: "text-sm font-medium" }, "Monthly")),
                    React.createElement(toggle_group_1.ToggleGroupItem, { value: "year", className: "px-4 py-1 rounded-lg h-auto data-[state=on]:bg-primary data-[state=on]:text-white" },
                        React.createElement("span", { className: "text-sm font-medium" }, "Yearly"))),
                React.createElement("div", { className: "w-[184px] flex items-start" },
                    React.createElement("div", { className: "flex items-center gap-2 p-1 flex-1 bg-gray-100 rounded" },
                        React.createElement(lucide_react_1.SearchIcon, { className: "w-5 h-5" }),
                        React.createElement(input_1.Input, { className: "flex-1 border-0 bg-transparent p-0 text-xs text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto", placeholder: "Search" }))))),
        React.createElement("div", { className: "flex-1 overflow-auto" },
            view === "day" && renderDayView(),
            view === "week" && renderWeekView(),
            view === "month" && renderMonthView(),
            view === "year" && renderYearView())));
};
