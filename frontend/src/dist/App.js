"use strict";
exports.__esModule = true;
// App.tsx
var react_router_dom_1 = require("react-router-dom");
var react_1 = require("react");
var Sidebar_1 = require("./components/Sidebar");
var TimeTracker_1 = require("./components/TimeTracker");
var Analytics_1 = require("./components/Analytics");
var LoginFunctionality_1 = require("./components/LoginFunctionality");
var SignupFunctionality_1 = require("./components/SignupFunctionality");
var ProjectPage_1 = require("./components/Project/ProjectPage");
// import Calendar from './components/Calendar/Calendar';
var TaskManager_1 = require("./components/TaskManager");
var AuthContext_1 = require("./context/AuthContext");
var Planner_1 = require("./components/Planner/Planner");
var Dashboard_1 = require("./components/Dashboard");
var UserTags_1 = require("./components/UserTags");
// import AIComponent from './components/AIComponent/client/src/App'
// Placeholder components for other routes
// const TaskManager = () => <div className="min-h-screen bg-gray-50 pl-64 p-8">Tasks Page</div>;
var Reports = function () { return React.createElement("div", { className: "min-h-screen bg-gray-50 pl-64 p-8" }, "Reports Page"); };
var Projects = function () { return React.createElement("div", { className: "min-h-screen bg-gray-50 pl-64 p-8" }, "Projects Page"); };
var Clients = function () { return React.createElement("div", { className: "min-h-screen bg-gray-50 pl-64 p-8" }, "Clients Page"); };
var Invoices = function () { return React.createElement("div", { className: "min-h-screen bg-gray-50 pl-64 p-8" }, "Invoices Page"); };
var Tags = function () { return React.createElement("div", { className: "min-h-screen bg-gray-50 pl-64 p-8" }, "Tags Page"); };
var Settings = function () { return React.createElement("div", { className: "min-h-screen bg-gray-50 pl-64 p-8" }, "Settings Page"); };
var App = function () { return (React.createElement(react_router_dom_1.BrowserRouter, null,
    React.createElement(AuthContext_1.AuthProvider, null,
        React.createElement(react_router_dom_1.Routes, null,
            React.createElement(react_router_dom_1.Route, { path: "/login", element: React.createElement(LoginFunctionality_1["default"], null) }),
            React.createElement(react_router_dom_1.Route, { path: "/signup", element: React.createElement(SignupFunctionality_1["default"], null) }),
            React.createElement(react_router_dom_1.Route, { path: "/*", element: React.createElement(ProtectedRoutes, null) }))))); };
var ProtectedRoutes = function () {
    var _a = AuthContext_1.useAuth(), isAuthenticated = _a.isAuthenticated, loading = _a.loading;
    var navigate = react_router_dom_1.useNavigate();
    var _b = react_1.useState(false), checked = _b[0], setChecked = _b[1];
    react_1.useEffect(function () {
        if (!loading && !isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, loading]);
    if (loading)
        return React.createElement(AuthContext_1.LoadingSpinner, null);
    return isAuthenticated ? (React.createElement("div", { className: "flex" },
        React.createElement(Sidebar_1["default"], null),
        React.createElement("main", { className: "flex-1 ml-64" },
            React.createElement(react_router_dom_1.Routes, null,
                React.createElement(react_router_dom_1.Route, { index: true, element: React.createElement(TimeTracker_1["default"], null) }),
                React.createElement(react_router_dom_1.Route, { path: "/", element: React.createElement(TimeTracker_1["default"], null) }),
                React.createElement(react_router_dom_1.Route, { path: "/tasks", element: React.createElement(TaskManager_1["default"], null) }),
                React.createElement(react_router_dom_1.Route, { path: "/analytics", element: React.createElement(Analytics_1["default"], null) }),
                React.createElement(react_router_dom_1.Route, { path: "/reports", element: React.createElement(Reports, null) }),
                React.createElement(react_router_dom_1.Route, { path: "/projects", element: React.createElement(ProjectPage_1["default"], null) }),
                React.createElement(react_router_dom_1.Route, { path: "/clients", element: React.createElement(Clients, null) }),
                React.createElement(react_router_dom_1.Route, { path: "/invoices", element: React.createElement(Invoices, null) }),
                React.createElement(react_router_dom_1.Route, { path: "/tags", element: React.createElement(UserTags_1.UserTagPage, null) }),
                React.createElement(react_router_dom_1.Route, { path: "/settings", element: React.createElement(Settings, null) }),
                React.createElement(react_router_dom_1.Route, { path: "/planner", element: React.createElement(Planner_1.PlannerForm, null) }),
                React.createElement(react_router_dom_1.Route, { path: "/dashboard", element: React.createElement(Dashboard_1.Dashboard, null) }))))) : React.createElement(react_router_dom_1.Navigate, { to: "/login", replace: true });
};
exports["default"] = App;
