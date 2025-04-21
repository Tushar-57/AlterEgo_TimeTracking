"use strict";
exports.__esModule = true;
exports.Fantastical = void 0;
var react_1 = require("react");
var CalendarSection_1 = require("./sections/CalendarSection/CalendarSection");
var DraggableEvent_1 = require("../../components/DraggableEvent");
exports.Fantastical = function (_a) {
    var events = _a.events;
    var colorClasses = react_1.useState({
        lightblue: {
            bg: "bg-blue-100",
            accent: "bg-blue-500",
            text: "text-blue-900",
            icon: "bg-blue-200 text-blue-900"
        },
        violet: {
            bg: "bg-violet-100",
            accent: "bg-violet-500",
            text: "text-violet-900",
            icon: "bg-violet-200 text-violet-900"
        },
        amber: {
            bg: "bg-amber-100",
            accent: "bg-amber-500",
            text: "text-amber-900",
            icon: "bg-amber-200 text-amber-900"
        },
        rose: {
            bg: "bg-rose-100",
            accent: "bg-rose-500",
            text: "text-rose-900",
            icon: "bg-rose-200 text-rose-900"
        },
        emerald: {
            bg: "bg-emerald-100",
            accent: "bg-emerald-500",
            text: "text-emerald-900",
            icon: "bg-emerald-200 text-emerald-900"
        }
    })[0];
    var getColorClasses = function (color) {
        return colorClasses[color] || colorClasses.lightblue;
    };
    return (React.createElement("div", { className: "flex flex-col w-full h-screen overflow-hidden" },
        React.createElement(CalendarSection_1.CalendarSection, { events: events }),
        events.map(function (event) { return (React.createElement(DraggableEvent_1.DraggableEvent, { key: event.id, event: event, getColorClasses: getColorClasses })); })));
};
