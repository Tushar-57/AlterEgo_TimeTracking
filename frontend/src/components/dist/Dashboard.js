"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.Dashboard = exports.calculatePosition = exports.getColorForProject = void 0;
var react_1 = require("react");
var button_1 = require("../components/Calendar_updated/components/ui/button"); // Add button component
var lucide_react_1 = require("lucide-react"); // Add mic icon
var Skeleton_1 = require("./ui/Skeleton");
var AuthContext_1 = require("../context/AuthContext");
var Fantastical_1 = require("./Calendar_updated/screens/Fantastical/Fantastical");
var EnhancedVoiceCommandPopup_1 = require("./Calendar_updated/components/EnhancedVoiceCommandPopup");
var react_router_dom_1 = require("react-router-dom");
var use_toast_1 = require("./Calendar_updated/components/hooks/use-toast");
exports.getColorForProject = function (projectId) {
    var colors = ['lightblue', 'violet', 'amber', 'rose', 'emerald']; // Use actual color values
    return colors[projectId ? projectId % colors.length : 0];
};
exports.calculatePosition = function (startTime, duration) {
    var start = new Date(startTime);
    var dayOfWeek = start.getDay(); // 0 = Sunday
    var minutesFromTop = (start.getHours() * 60) + start.getMinutes();
    return {
        top: minutesFromTop + "px",
        left: 209 + (dayOfWeek * 143) + "px" // 143px per day column
    };
};
exports.Dashboard = function () {
    var _a = react_1.useState(new Date()), currentDate = _a[0], setCurrentDate = _a[1];
    var _b = react_1.useState([]), calendarEvents = _b[0], setCalendarEvents = _b[1];
    var _c = react_1.useState(false), showAIOverlay = _c[0], setShowAIOverlay = _c[1];
    var isAuthenticated = AuthContext_1.useAuth().isAuthenticated;
    var _d = react_1.useState(false), loading = _d[0], setLoading = _d[1];
    var navigate = react_router_dom_1.useNavigate();
    var toast = use_toast_1.useToast().toast;
    react_1.useEffect(function () {
        if (isAuthenticated) {
            var fetchData = function () { return __awaiter(void 0, void 0, void 0, function () {
                var start, end;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            setLoading(true);
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, , 3, 4]);
                            start = new Date(currentDate);
                            start.setDate(1);
                            end = new Date(currentDate);
                            end.setMonth(end.getMonth() + 1);
                            return [4 /*yield*/, fetchTimeEntries(start, end)];
                        case 2:
                            _a.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            setLoading(false);
                            return [7 /*endfinally*/];
                        case 4: return [2 /*return*/];
                    }
                });
            }); };
            fetchData();
        }
    }, [currentDate, isAuthenticated]);
    var fetchTimeEntries = function (start, end) { return __awaiter(void 0, void 0, void 0, function () {
        var token, res, data, transformed, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    token = localStorage.getItem('jwtToken');
                    if (!token) {
                        throw new Error('No authentication token found');
                    }
                    return [4 /*yield*/, fetch("http://localhost:8080/api/time-entries?start=" + start.toISOString() + "&end=" + end.toISOString(), {
                            headers: { Authorization: "Bearer " + token }
                        })];
                case 1:
                    res = _a.sent();
                    if (res.status === 401) {
                        toast({
                            title: 'Warning',
                            description: 'Session may have expired. Please try refreshing or logging in again.',
                            variant: 'default'
                        });
                        return [2 /*return*/, []];
                    }
                    if (!res.ok) {
                        throw new Error("HTTP error! status: " + res.status);
                    }
                    return [4 /*yield*/, res.json()];
                case 2:
                    data = _a.sent();
                    transformed = data.map(function (entry) {
                        var startDate = new Date(entry.startTime);
                        var hours = startDate.getHours();
                        return {
                            id: entry.id,
                            time: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            period: hours >= 12 ? 'PM' : 'AM',
                            title: entry.taskDescription,
                            color: exports.getColorForProject(entry.projectId),
                            position: exports.calculatePosition(entry.startTime, entry.duration),
                            width: "143px",
                            height: Math.max(30, (entry.duration / 3600) * 60) + "px",
                            hasVideo: false
                        };
                    });
                    setCalendarEvents(transformed);
                    return [2 /*return*/, transformed];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error fetching entries:', error_1);
                    toast({
                        title: 'Warning',
                        description: 'Failed to fetch time entries. Displaying cached data.',
                        variant: 'default'
                    });
                    return [2 /*return*/, []];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    return (React.createElement("div", { className: "bg-white flex flex-row justify-center w-full relative" },
        loading ? (React.createElement("div", { className: "flex flex-col gap-4 p-8 w-full" },
            React.createElement(Skeleton_1.Skeleton, { className: "h-12 w-full" }),
            React.createElement(Skeleton_1.Skeleton, { className: "h-64 w-full" }),
            React.createElement(Skeleton_1.Skeleton, { className: "h-32 w-full" }))) : (React.createElement(Fantastical_1.Fantastical, { events: calendarEvents })),
        React.createElement("div", { className: "fixed bottom-8 right-8 z-50" },
            React.createElement(button_1.Button, { className: "p-6 rounded-full shadow-lg transform transition-all " + (showAIOverlay ? 'bg-primary scale-110' : 'bg-gray-900 hover:bg-gray-800'), onClick: function () { return setShowAIOverlay(!showAIOverlay); } },
                React.createElement(lucide_react_1.Mic, { className: "h-6 w-6" }),
                showAIOverlay && React.createElement("span", { className: "ml-2" }, "Close AI"))),
        showAIOverlay && (React.createElement("div", { className: "ai-overlay bg-black text-white h-screen w-screen fixed inset-0 z-50 overflow-hidden" },
            React.createElement(EnhancedVoiceCommandPopup_1["default"], null),
            React.createElement(button_1.Button, { className: "absolute top-4 right-4 z-50", onClick: function () { return setShowAIOverlay(false); } }, "Close")))));
};
