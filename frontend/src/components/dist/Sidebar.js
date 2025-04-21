"use strict";
exports.__esModule = true;
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var lucide_react_1 = require("lucide-react");
var AuthContext_1 = require("../context/AuthContext");
var NavItem = function (_a) {
    var Icon = _a.icon, label = _a.label, to = _a.to;
    var location = react_router_dom_1.useLocation();
    var isActive = location.pathname === to;
    return (react_1["default"].createElement(react_router_dom_1.Link, { to: to, className: "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 " + (isActive
            ? 'bg-black text-white shadow-md'
            : 'text-gray-500 hover:bg-gray-100 hover:shadow-sm') },
        react_1["default"].createElement(Icon, { className: "w-5 h-5 transition-transform duration-300 group-hover:rotate-12" }),
        react_1["default"].createElement("span", { className: "font-light group-hover:font-medium" }, label)));
};
var Sidebar = function () {
    var logout = AuthContext_1.useAuth().logout;
    return (react_1["default"].createElement("div", { className: "w-64 h-screen fixed left-0 top-0 bg-white border-r border-gray-100 p-6" },
        react_1["default"].createElement("div", { className: "flex items-center space-x-3 mb-8" },
            react_1["default"].createElement(lucide_react_1.WatchIcon, { className: "w-8 h-8" }),
            react_1["default"].createElement("span", { className: "text-xl font-light" }, "Alter Ego")),
        react_1["default"].createElement("div", { className: "space-y-1" },
            react_1["default"].createElement("div", { className: "mb-6" },
                react_1["default"].createElement("div", { className: "text-xs font-medium text-gray-400 mb-3 px-4" }, "OVERVIEW"),
                react_1["default"].createElement(NavItem, { icon: lucide_react_1.Timer, label: "Timer", to: "/" }),
                react_1["default"].createElement(NavItem, { icon: lucide_react_1.LayoutDashboard, label: "Dashboard", to: "/dashboard" }),
                react_1["default"].createElement("div", { className: "mb-6" })),
            react_1["default"].createElement("div", { className: "mb-6" },
                react_1["default"].createElement("div", { className: "text-xs font-medium text-gray-400 mb-3 px-4" }, "PLANNER"),
                react_1["default"].createElement(NavItem, { icon: lucide_react_1.LucideCalendarCheck2, label: "Tasks", to: "/tasks" }),
                react_1["default"].createElement(NavItem, { icon: lucide_react_1.CalendarRangeIcon, label: "AI Planner", to: "/planner" }),
                react_1["default"].createElement("br", null)),
            react_1["default"].createElement("div", { className: "mb-6" },
                react_1["default"].createElement("div", { className: "text-xs font-medium text-gray-400 mb-3 px-4" }, "ANALYZE"),
                react_1["default"].createElement(NavItem, { icon: lucide_react_1.BarChart2, label: "Analytics", to: "/analytics" }),
                react_1["default"].createElement(NavItem, { icon: lucide_react_1.PieChart, label: "Reports", to: "/reports" })),
            react_1["default"].createElement("div", { className: "mb-6" },
                react_1["default"].createElement("div", { className: "text-xs font-medium text-gray-400 mb-3 px-4" }, "MANAGE"),
                react_1["default"].createElement(NavItem, { icon: lucide_react_1.Users, label: "Projects", to: "/projects" }),
                react_1["default"].createElement(NavItem, { icon: lucide_react_1.UserPlus, label: "Clients", to: "/clients" }),
                react_1["default"].createElement(NavItem, { icon: lucide_react_1.FileText, label: "Invoices", to: "/invoices" }),
                react_1["default"].createElement(NavItem, { icon: lucide_react_1.Tag, label: "Tags", to: "/tags" })),
            react_1["default"].createElement("div", { className: "absolute bottom-4 left-6 right-6 space-y-1" },
                react_1["default"].createElement(NavItem, { icon: lucide_react_1.Settings, label: "Settings", to: "/settings" }),
                react_1["default"].createElement("div", { onClick: logout, className: "flex items-center space-x-3 px-4 py-3 text-gray-500 hover:bg-gray-100 rounded-lg transition-all duration-200 cursor-pointer" },
                    react_1["default"].createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", viewBox: "0 0 24 24", fill: "currentColor" },
                        react_1["default"].createElement("path", { d: "M5 22q-.825 0-1.413-.588T3 20V4q0-.825.588-1.413T5 2h7v2H5v16h7v2H5Zm11-4l-1.375-1.45l2.55-2.55H9v-2h8.175l-2.55-2.55L16 7l5 5l-5 5Z" })),
                    react_1["default"].createElement("span", { className: "font-light" }, "Log Out"))))));
};
exports["default"] = Sidebar;
