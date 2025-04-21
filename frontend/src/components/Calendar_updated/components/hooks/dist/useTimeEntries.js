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
exports.useTimeEntries = void 0;
var react_1 = require("react");
var use_toast_1 = require("./use-toast");
var Dashboard_1 = require("../../../Dashboard");
exports.useTimeEntries = function (currentDate, isAuthenticated) {
    var _a = react_1.useState([]), calendarEvents = _a[0], setCalendarEvents = _a[1];
    var _b = react_1.useState(false), loading = _b[0], setLoading = _b[1];
    var toast = use_toast_1.useToast().toast;
    var fetchTimeEntries = function (start, end) { return __awaiter(void 0, void 0, void 0, function () {
        var token, res, data, transformed, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    token = localStorage.getItem('jwtToken');
                    if (!token) {
                        toast({
                            title: "Authentication Error",
                            description: "Please log in to view time entries.",
                            variant: "destructive"
                        });
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, fetch("http://localhost:8080/api/time-entries?start=" + start.toISOString() + "&end=" + end.toISOString(), {
                            headers: { Authorization: "Bearer " + token }
                        })];
                case 2:
                    res = _a.sent();
                    if (res.status === 401) {
                        toast({
                            title: "Session Expired",
                            description: "Your session has expired. Please log in again.",
                            variant: "destructive"
                        });
                        localStorage.removeItem('jwtToken');
                        window.location.href = '/login';
                        return [2 /*return*/];
                    }
                    if (!res.ok) {
                        throw new Error("Failed to fetch time entries: " + res.statusText);
                    }
                    return [4 /*yield*/, res.json()];
                case 3:
                    data = _a.sent();
                    transformed = data.map(function (entry) {
                        var startDate = new Date(entry.startTime);
                        var hours = startDate.getHours();
                        return {
                            id: entry.id,
                            time: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            period: hours >= 12 ? 'PM' : 'AM',
                            title: entry.taskDescription,
                            color: Dashboard_1.getColorForProject(entry.projectId),
                            position: Dashboard_1.calculatePosition(entry.startTime, entry.duration),
                            width: "143px",
                            height: Math.max(30, (entry.duration / 3600) * 60) + "px",
                            hasVideo: false
                        };
                    });
                    setCalendarEvents(transformed);
                    return [3 /*break*/, 6];
                case 4:
                    error_1 = _a.sent();
                    console.error('Error fetching entries:', error_1);
                    toast({
                        title: "Error",
                        description: "Failed to load time entries. Please try again later.",
                        variant: "destructive"
                    });
                    return [3 /*break*/, 6];
                case 5:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    react_1.useEffect(function () {
        if (isAuthenticated) {
            var start = new Date(currentDate);
            start.setDate(1);
            var end = new Date(start);
            end.setMonth(start.getMonth() + 1);
            end.setDate(0);
            fetchTimeEntries(start, end);
        }
    }, [currentDate, isAuthenticated]);
    return { calendarEvents: calendarEvents, loading: loading, fetchTimeEntries: fetchTimeEntries };
};
