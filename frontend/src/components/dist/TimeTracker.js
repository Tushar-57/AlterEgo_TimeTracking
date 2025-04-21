"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var lucide_react_1 = require("lucide-react");
var use_toast_1 = require("../components/Calendar_updated/components/hooks/use-toast");
var button_1 = require("../components/Calendar_updated/components/ui/button");
var input_1 = require("../components/Calendar_updated/components/ui/input");
var select_1 = require("../components/ui/select");
var dialog_1 = require("./Calendar_updated/components/ui/dialog");
var tabs_1 = require("./Calendar_updated/components/ui/tabs");
var tooltip_1 = require("./Calendar_updated/components/ui/tooltip");
var framer_motion_1 = require("framer-motion");
var slider_1 = require("./Calendar_updated/components/ui/slider");
var switch_1 = require("./Calendar_updated/components/ui/switch");
var badge_1 = require("./Calendar_updated/components/ui/badge");
var AuthContext_1 = require("../context/AuthContext");
function TimeTracker() {
    var _this = this;
    var _a = AuthContext_1.useAuth(), isAuthenticated = _a.isAuthenticated, user = _a.user, logout = _a.logout;
    var navigate = react_router_dom_1.useNavigate();
    var toast = use_toast_1.useToast().toast;
    // Timer states
    var _b = react_1.useState({
        time: 0,
        status: 'stopped',
        activeTimerId: null
    }), timerState = _b[0], setTimerState = _b[1];
    // Mode-related states
    var _c = react_1.useState('stopwatch'), timerMode = _c[0], setTimerMode = _c[1];
    var _d = react_1.useState({
        currentSession: 0,
        isBreak: false,
        totalSessions: 0
    }), pomodoroState = _d[0], setPomodoroState = _d[1];
    var _e = react_1.useState(1500), countdownTime = _e[0], setCountdownTime = _e[1];
    // Task details state
    var _f = react_1.useState({
        description: '',
        projectId: 'noproject',
        tags: [],
        billable: false,
        newTag: ''
    }), currentTask = _f[0], setCurrentTask = _f[1];
    // Data states
    var _g = react_1.useState([]), projects = _g[0], setProjects = _g[1];
    var _h = react_1.useState([]), tags = _h[0], setTags = _h[1];
    var _j = react_1.useState([]), timeEntries = _j[0], setTimeEntries = _j[1];
    var _k = react_1.useState(false), loading = _k[0], setLoading = _k[1];
    var _l = react_1.useState(null), fetchError = _l[0], setFetchError = _l[1];
    // UI states
    var _m = react_1.useState(false), showTagInput = _m[0], setShowTagInput = _m[1];
    var _o = react_1.useState(false), showProjectSelect = _o[0], setShowProjectSelect = _o[1];
    var _p = react_1.useState(false), showSettingsDialog = _p[0], setShowSettingsDialog = _p[1];
    var _q = react_1.useState(false), showKeyboardShortcutsDialog = _q[0], setShowKeyboardShortcutsDialog = _q[1];
    // User preferences
    var _r = react_1.useState({
        timerMode: 'stopwatch',
        darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
        soundEnabled: true,
        notificationsEnabled: true,
        pomodoroSettings: {
            workDuration: 25,
            shortBreakDuration: 5,
            longBreakDuration: 15,
            sessionsUntilLongBreak: 4
        },
        countdownPresets: [300, 600, 900, 1500, 2700, 3600]
    }), preferences = _r[0], setPreferences = _r[1];
    // Audio elements
    var timerCompleteSound = react_1.useRef(null);
    var tickSound = react_1.useRef(null);
    var breakStartSound = react_1.useRef(null);
    var workStartSound = react_1.useRef(null);
    // Refs
    var intervalRef = react_1.useRef();
    var tagInputRef = react_1.useRef(null);
    // Load user preferences
    react_1.useEffect(function () {
        var savedPreferences = localStorage.getItem('timeTracker_preferences');
        if (savedPreferences) {
            try {
                var parsedPreferences_1 = JSON.parse(savedPreferences);
                setPreferences(function (prev) { return (__assign(__assign({}, prev), parsedPreferences_1)); });
                setTimerMode(parsedPreferences_1.timerMode || 'stopwatch');
                if (parsedPreferences_1.darkMode) {
                    document.documentElement.classList.add('dark');
                }
                else {
                    document.documentElement.classList.remove('dark');
                }
            }
            catch (error) {
                console.error('Error parsing saved preferences:', error);
            }
        }
    }, []);
    // Save preferences
    react_1.useEffect(function () {
        localStorage.setItem('timeTracker_preferences', JSON.stringify(preferences));
        if (preferences.darkMode) {
            document.documentElement.classList.add('dark');
        }
        else {
            document.documentElement.classList.remove('dark');
        }
    }, [preferences]);
    // Set up audio elements
    react_1.useEffect(function () {
        timerCompleteSound.current = new Audio('/sounds/complete.mp3');
        tickSound.current = new Audio('/sounds/tick.mp3');
        breakStartSound.current = new Audio('/sounds/break.mp3');
        workStartSound.current = new Audio('/sounds/work.mp3');
        timerCompleteSound.current.src = 'https://soundbible.com/mp3/service-bell_daniel_simion.mp3';
        tickSound.current.src = 'https://soundbible.com/mp3/clock-ticking-2.mp3';
        breakStartSound.current.src = 'https://soundbible.com/mp3/digital-quick-tone.mp3';
        workStartSound.current.src = 'https://soundbible.com/mp3/analog-watch-alarm.mp3';
        return function () {
            if (timerCompleteSound.current)
                timerCompleteSound.current.pause();
            if (tickSound.current)
                tickSound.current.pause();
            if (breakStartSound.current)
                breakStartSound.current.pause();
            if (workStartSound.current)
                workStartSound.current.pause();
        };
    }, []);
    // Fetch projects, tags, and time entries
    // TimeTracker.tsx
    react_1.useEffect(function () {
        var fetchData = function () { return __awaiter(_this, void 0, void 0, function () {
            var token_1, fetchWithAuth, _a, projectData, tagData, entryData, error_1;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        setLoading(true);
                        setFetchError(null);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, 4, 5]);
                        token_1 = localStorage.getItem('jwtToken');
                        if (!token_1) {
                            throw new Error('No authentication token found');
                        }
                        fetchWithAuth = function (url) { return __awaiter(_this, void 0, void 0, function () {
                            var res;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, fetch(url, {
                                            headers: { Authorization: "Bearer " + token_1 }
                                        })];
                                    case 1:
                                        res = _a.sent();
                                        if (res.status === 401) {
                                            setFetchError('Authentication failed. Please try refreshing or logging in again.');
                                            throw new Error('Authentication token expired');
                                        }
                                        if (!res.ok) {
                                            throw new Error("Failed to fetch data from " + url + ": " + res.status);
                                        }
                                        return [2 /*return*/, res.json()];
                                }
                            });
                        }); };
                        return [4 /*yield*/, Promise.all([
                                fetchWithAuth('http://localhost:8080/api/projects'),
                                fetchWithAuth('http://localhost:8080/api/tags'),
                                fetchWithAuth('http://localhost:8080/api/time-entries?limit=5'),
                            ])];
                    case 2:
                        _a = _b.sent(), projectData = _a[0], tagData = _a[1], entryData = _a[2];
                        setProjects(projectData || []);
                        setTags(tagData || []);
                        setTimeEntries(entryData || []);
                        // Cache data
                        localStorage.setItem('cached_projects', JSON.stringify(projectData || []));
                        localStorage.setItem('cached_tags', JSON.stringify(tagData || []));
                        localStorage.setItem('cached_time_entries', JSON.stringify(entryData || []));
                        return [3 /*break*/, 5];
                    case 3:
                        error_1 = _b.sent();
                        setFetchError(error_1.message);
                        toast({
                            title: 'Warning',
                            description: 'Failed to load some data. Using cached data.',
                            variant: 'default'
                        });
                        // Load cached data
                        setProjects(JSON.parse(localStorage.getItem('cached_projects') || '[]'));
                        setTags(JSON.parse(localStorage.getItem('cached_tags') || '[]'));
                        setTimeEntries(JSON.parse(localStorage.getItem('cached_time_entries') || '[]'));
                        return [3 /*break*/, 5];
                    case 4:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        }); };
        if (isAuthenticated)
            fetchData();
    }, [isAuthenticated, toast]);
    // Check for active timer
    react_1.useEffect(function () {
        var checkActiveTimer = function () { return __awaiter(_this, void 0, void 0, function () {
            var token, resp, response_1, startTime, currentTime, elapsed_1, error_2;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        token = localStorage.getItem('jwtToken');
                        if (!token)
                            return [2 /*return*/];
                        return [4 /*yield*/, fetch('http://localhost:8080/api/timers/active', {
                                headers: { Authorization: "Bearer " + token }
                            })];
                    case 1:
                        resp = _b.sent();
                        if (resp.status === 204) {
                            setTimerState(function (prev) { return (__assign(__assign({}, prev), { activeTimerId: null })); });
                            return [2 /*return*/];
                        }
                        if (resp.status === 401) {
                            localStorage.removeItem('jwtToken');
                            logout();
                            toast({
                                title: 'Session Expired',
                                description: 'Please log in again.',
                                variant: 'destructive'
                            });
                            return [2 /*return*/];
                        }
                        if (!resp.ok)
                            throw new Error("HTTP " + resp.status);
                        return [4 /*yield*/, resp.json()];
                    case 2:
                        response_1 = _b.sent();
                        if (response_1.success && response_1.data) {
                            startTime = new Date(response_1.data.startTime).getTime();
                            currentTime = Date.now();
                            elapsed_1 = Math.floor((currentTime - startTime) / 1000);
                            setTimerState(function (prev) { return (__assign(__assign({}, prev), { activeTimerId: response_1.data.id, status: 'running', time: elapsed_1 })); });
                            setCurrentTask({
                                description: response_1.data.taskDescription,
                                projectId: ((_a = response_1.data.projectId) === null || _a === void 0 ? void 0 : _a.toString()) || 'noproject',
                                tags: response_1.data.tags || [],
                                billable: response_1.data.billable,
                                newTag: ''
                            });
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _b.sent();
                        console.error('Error checking active timer:', error_2);
                        toast({
                            title: 'Error',
                            description: 'Failed to check active timer.',
                            variant: 'destructive'
                        });
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        if (isAuthenticated)
            checkActiveTimer();
    }, [isAuthenticated, toast, logout]);
    // Keyboard shortcuts
    react_1.useEffect(function () {
        var handleKeyDown = function (e) {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }
            if (e.code === 'Space') {
                e.preventDefault();
                toggleTimer();
            }
            if (e.code === 'KeyS' && !e.ctrlKey && !e.metaKey) {
                if (timerState.status !== 'stopped') {
                    e.preventDefault();
                    stopTimer();
                }
            }
            if (e.code === 'KeyR' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                resetTimer();
            }
            if (e.code === 'Digit1') {
                e.preventDefault();
                handleTimerModeChange('stopwatch');
            }
            if (e.code === 'Digit2') {
                e.preventDefault();
                handleTimerModeChange('countdown');
            }
            if (e.code === 'Digit3') {
                e.preventDefault();
                handleTimerModeChange('pomodoro');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return function () { return window.removeEventListener('keydown', handleKeyDown); };
    }, [timerState.status]);
    // Timer logic
    react_1.useEffect(function () {
        if (timerState.status === 'running') {
            intervalRef.current = window.setInterval(function () {
                var _a;
                if (timerMode === 'stopwatch' || (timerMode === 'pomodoro' && !pomodoroState.isBreak)) {
                    setTimerState(function (prev) { return (__assign(__assign({}, prev), { time: prev.time + 1 })); });
                    if (preferences.soundEnabled && timerState.time > 0 && timerState.time % 60 === 0) {
                        (_a = tickSound.current) === null || _a === void 0 ? void 0 : _a.play()["catch"](function (e) { return console.error('Error playing sound:', e); });
                    }
                    if (timerMode === 'pomodoro') {
                        var workSeconds = preferences.pomodoroSettings.workDuration * 60;
                        if (timerState.time >= workSeconds) {
                            handlePomodoroSessionComplete();
                        }
                    }
                }
                else if (timerMode === 'countdown' || (timerMode === 'pomodoro' && pomodoroState.isBreak)) {
                    setTimerState(function (prev) {
                        var _a, _b, _c;
                        var newTime = prev.time - 1;
                        if (newTime <= 0) {
                            clearInterval(intervalRef.current);
                            if (preferences.soundEnabled) {
                                (_a = timerCompleteSound.current) === null || _a === void 0 ? void 0 : _a.play()["catch"](function (e) { return console.error('Error playing sound:', e); });
                            }
                            if (preferences.notificationsEnabled) {
                                showNotification(timerMode === 'pomodoro' && pomodoroState.isBreak
                                    ? 'Break complete! Ready to work?'
                                    : 'Timer complete!');
                            }
                            if (timerMode === 'pomodoro') {
                                setTimeout(function () { return handlePomodoroBreakComplete(); }, 1000);
                                return __assign(__assign({}, prev), { time: 0, status: 'paused' });
                            }
                            return __assign(__assign({}, prev), { time: 0, status: 'stopped' });
                        }
                        if (preferences.soundEnabled) {
                            if (newTime <= 5) {
                                (_b = tickSound.current) === null || _b === void 0 ? void 0 : _b.play()["catch"](function (e) { return console.error('Error playing sound:', e); });
                            }
                            else if (newTime % 60 === 0) {
                                (_c = tickSound.current) === null || _c === void 0 ? void 0 : _c.play()["catch"](function (e) { return console.error('Error playing sound:', e); });
                            }
                        }
                        return __assign(__assign({}, prev), { time: newTime });
                    });
                }
            }, 1000);
        }
        return function () { return window.clearInterval(intervalRef.current); };
    }, [timerState.status, timerMode, pomodoroState.isBreak, preferences]);
    var showNotification = function (message) {
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
            return;
        }
        if (Notification.permission === 'granted') {
            new Notification('TimeTracker', { body: message });
        }
        else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(function (permission) {
                if (permission === 'granted') {
                    new Notification('TimeTracker', { body: message });
                }
            });
        }
    };
    var handleTimerModeChange = function (mode) {
        resetTimer();
        setTimerMode(mode);
        setPreferences(function (prev) { return (__assign(__assign({}, prev), { timerMode: mode })); });
        if (mode === 'countdown') {
            setTimerState(function (prev) { return (__assign(__assign({}, prev), { time: countdownTime })); });
        }
        else if (mode === 'pomodoro') {
            setTimerState(function (prev) { return (__assign(__assign({}, prev), { time: preferences.pomodoroSettings.workDuration * 60 })); });
            setPomodoroState({
                currentSession: 1,
                isBreak: false,
                totalSessions: 0
            });
        }
        toast({
            title: mode.charAt(0).toUpperCase() + mode.slice(1) + " Mode",
            description: "Switched to " + mode + " timer mode"
        });
    };
    var handlePomodoroSessionComplete = function () {
        var _a;
        var _b = preferences.pomodoroSettings, shortBreakDuration = _b.shortBreakDuration, longBreakDuration = _b.longBreakDuration, sessionsUntilLongBreak = _b.sessionsUntilLongBreak;
        var isLongBreak = pomodoroState.currentSession % sessionsUntilLongBreak === 0;
        var breakDuration = isLongBreak ? longBreakDuration : shortBreakDuration;
        if (preferences.soundEnabled) {
            (_a = breakStartSound.current) === null || _a === void 0 ? void 0 : _a.play()["catch"](function (e) { return console.error('Error playing sound:', e); });
        }
        if (preferences.notificationsEnabled) {
            showNotification("Work session complete! Time for a " + (isLongBreak ? 'long' : 'short') + " break.");
        }
        setPomodoroState(function (prev) { return (__assign(__assign({}, prev), { isBreak: true, totalSessions: prev.totalSessions + 1 })); });
        setTimerState(function (prev) { return (__assign(__assign({}, prev), { time: breakDuration * 60 })); });
        toast({
            title: 'Pomodoro Break',
            description: "Time for a " + (isLongBreak ? 'long' : 'short') + " break (" + breakDuration + " minutes)"
        });
    };
    var handlePomodoroBreakComplete = function () {
        var _a;
        if (preferences.soundEnabled) {
            (_a = workStartSound.current) === null || _a === void 0 ? void 0 : _a.play()["catch"](function (e) { return console.error('Error playing sound:', e); });
        }
        if (preferences.notificationsEnabled) {
            showNotification('Break complete! Ready to start working again?');
        }
        setPomodoroState(function (prev) { return (__assign(__assign({}, prev), { currentSession: prev.currentSession + 1, isBreak: false })); });
        setTimerState(function (prev) { return (__assign(__assign({}, prev), { time: preferences.pomodoroSettings.workDuration * 60, status: 'paused' })); });
        toast({
            title: 'Pomodoro Work',
            description: "Ready for work session " + (pomodoroState.currentSession + 1)
        });
    };
    var skipPomodoroSession = function () {
        if (pomodoroState.isBreak) {
            handlePomodoroBreakComplete();
        }
        else {
            handlePomodoroSessionComplete();
        }
    };
    var startTimer = function () { return __awaiter(_this, void 0, void 0, function () {
        var token, projectId, res, response_2, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if ((timerMode === 'countdown') || (timerMode === 'pomodoro' && pomodoroState.isBreak)) {
                        setTimerState(function (prev) { return (__assign(__assign({}, prev), { status: 'running' })); });
                        return [2 /*return*/];
                    }
                    if (!currentTask.description.trim()) {
                        toast({
                            title: 'Validation Error',
                            description: 'Task description is required.',
                            variant: 'destructive'
                        });
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    token = localStorage.getItem('jwtToken');
                    if (!token) {
                        toast({
                            title: 'Authentication Error',
                            description: 'Please log in to start the timer.',
                            variant: 'destructive'
                        });
                        logout();
                        return [2 /*return*/];
                    }
                    projectId = currentTask.projectId === 'noproject' ? null : parseInt(currentTask.projectId);
                    return [4 /*yield*/, fetch('http://localhost:8080/api/timers/start', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: "Bearer " + token
                            },
                            body: JSON.stringify({
                                taskDescription: currentTask.description,
                                startTime: new Date().toISOString(),
                                category: null,
                                tags: currentTask.tags.map(function (tag) { return tag.name; }),
                                projectId: projectId,
                                billable: currentTask.billable
                            })
                        })];
                case 2:
                    res = _a.sent();
                    if (res.status === 401) {
                        localStorage.removeItem('jwtToken');
                        logout();
                        toast({
                            title: 'Authentication Error',
                            description: 'Your session has expired. Please log in again.',
                            variant: 'destructive'
                        });
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, res.json()];
                case 3:
                    response_2 = _a.sent();
                    if (!response_2.success) {
                        toast({
                            title: 'Server Error',
                            description: response_2.message || 'Failed to start timer.',
                            variant: 'destructive'
                        });
                        throw new Error('Start failed');
                    }
                    setTimerState(function (prev) { return (__assign(__assign({}, prev), { status: 'running', activeTimerId: response_2.data.id })); });
                    toast({
                        title: 'Success',
                        description: 'Timer started successfully!'
                    });
                    return [3 /*break*/, 5];
                case 4:
                    error_3 = _a.sent();
                    console.error('Start timer error:', error_3);
                    toast({
                        title: 'Network Error',
                        description: 'Could not connect to the server.',
                        variant: 'destructive'
                    });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var stopTimer = function () { return __awaiter(_this, void 0, void 0, function () {
        var token, res, response, entryRes, entryData, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if ((timerMode === 'countdown') || (timerMode === 'pomodoro' && pomodoroState.isBreak)) {
                        setTimerState(function (prev) { return (__assign(__assign({}, prev), { status: 'stopped' })); });
                        return [2 /*return*/];
                    }
                    if (!timerState.activeTimerId || timerState.time < 60) {
                        toast({
                            title: 'Validation Error',
                            description: 'Timer duration must be at least 60 seconds to save.',
                            variant: 'destructive'
                        });
                        resetTimer();
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 7, , 8]);
                    token = localStorage.getItem('jwtToken');
                    if (!token) {
                        toast({
                            title: 'Authentication Error',
                            description: 'Please log in to stop the timer.',
                            variant: 'destructive'
                        });
                        logout();
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, fetch("http://localhost:8080/api/timers/" + timerState.activeTimerId + "/stop", {
                            method: 'POST',
                            headers: {
                                Authorization: "Bearer " + token
                            }
                        })];
                case 2:
                    res = _a.sent();
                    if (res.status === 401) {
                        localStorage.removeItem('jwtToken');
                        logout();
                        toast({
                            title: 'Authentication Error',
                            description: 'Your session has expired. Please log in again.',
                            variant: 'destructive'
                        });
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, res.json()];
                case 3:
                    response = _a.sent();
                    if (!response.success) {
                        toast({
                            title: 'Server Error',
                            description: response.message || 'Failed to stop timer.',
                            variant: 'destructive'
                        });
                        throw new Error('Stop failed');
                    }
                    return [4 /*yield*/, fetch('http://localhost:8080/api/time-entries?limit=5', {
                            headers: { Authorization: "Bearer " + token }
                        })];
                case 4:
                    entryRes = _a.sent();
                    if (!entryRes.ok) return [3 /*break*/, 6];
                    return [4 /*yield*/, entryRes.json()];
                case 5:
                    entryData = _a.sent();
                    setTimeEntries(entryData);
                    _a.label = 6;
                case 6:
                    resetTimer();
                    toast({
                        title: 'Success',
                        description: 'Time entry saved successfully!'
                    });
                    return [3 /*break*/, 8];
                case 7:
                    error_4 = _a.sent();
                    console.error('Stop timer error:', error_4);
                    toast({
                        title: 'Network Error',
                        description: 'Could not connect to the server.',
                        variant: 'destructive'
                    });
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    var resetTimer = function () {
        setTimerState({
            time: timerMode === 'countdown' ? countdownTime : 0,
            status: 'stopped',
            activeTimerId: null
        });
        setCurrentTask({
            description: '',
            projectId: 'noproject',
            tags: [],
            billable: false,
            newTag: ''
        });
        if (timerMode === 'pomodoro') {
            setPomodoroState({
                currentSession: 1,
                isBreak: false,
                totalSessions: 0
            });
            setTimerState(function (prev) { return (__assign(__assign({}, prev), { time: preferences.pomodoroSettings.workDuration * 60 })); });
        }
    };
    var toggleTimer = function () {
        if (timerState.status === 'stopped') {
            startTimer();
        }
        else if (timerState.status === 'running') {
            setTimerState(function (prev) { return (__assign(__assign({}, prev), { status: 'paused' })); });
        }
        else {
            setTimerState(function (prev) { return (__assign(__assign({}, prev), { status: 'running' })); });
        }
    };
    var handleSelectCountdownPreset = function (seconds) {
        setCountdownTime(seconds);
        setTimerState(function (prev) { return (__assign(__assign({}, prev), { time: seconds })); });
    };
    var handleSetCustomCountdown = function (minutes) {
        var seconds = minutes * 60;
        setCountdownTime(seconds);
        setTimerState(function (prev) { return (__assign(__assign({}, prev), { time: seconds })); });
    };
    var handleAddTag = function () { return __awaiter(_this, void 0, void 0, function () {
        var token, res, newTag_1, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!currentTask.newTag.trim())
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    token = localStorage.getItem('jwtToken');
                    if (!token)
                        return [2 /*return*/];
                    return [4 /*yield*/, fetch('http://localhost:8080/api/tags', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: "Bearer " + token
                            },
                            body: JSON.stringify({
                                name: currentTask.newTag.trim(),
                                color: getRandomColor()
                            })
                        })];
                case 2:
                    res = _a.sent();
                    if (res.status === 401) {
                        localStorage.removeItem('jwtToken');
                        logout();
                        toast({
                            title: 'Authentication Error',
                            description: 'Your session has expired. Please log in again.',
                            variant: 'destructive'
                        });
                        return [2 /*return*/];
                    }
                    if (!res.ok)
                        throw new Error('Failed to create tag');
                    return [4 /*yield*/, res.json()];
                case 3:
                    newTag_1 = _a.sent();
                    setCurrentTask(function (prev) { return (__assign(__assign({}, prev), { tags: __spreadArrays(prev.tags, [newTag_1]), newTag: '' })); });
                    setTags(function (prev) { return __spreadArrays(prev, [newTag_1]); });
                    setShowTagInput(false);
                    toast({
                        title: 'Tag Created',
                        description: "Tag \"" + newTag_1.name + "\" created successfully!"
                    });
                    return [3 /*break*/, 5];
                case 4:
                    error_5 = _a.sent();
                    console.error('Error creating tag:', error_5);
                    toast({
                        title: 'Error',
                        description: 'Failed to create tag.',
                        variant: 'destructive'
                    });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleSelectTag = function (tag) {
        if (!currentTask.tags.find(function (t) { return t.id === tag.id; })) {
            setCurrentTask(function (prev) { return (__assign(__assign({}, prev), { tags: __spreadArrays(prev.tags, [tag]) })); });
        }
    };
    var formatTime = function (seconds) {
        var h = Math.floor(seconds / 3600);
        var m = Math.floor((seconds % 3600) / 60);
        var s = seconds % 60;
        return h.toString().padStart(2, '0') + ":" + m.toString().padStart(2, '0') + ":" + s.toString().padStart(2, '0');
    };
    var getRandomColor = function () {
        var colors = [
            '#4f46e5', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#6366f1',
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    };
    var getProjectNameById = function (id) {
        if (!id)
            return 'No Project';
        var project = projects.find(function (p) { return p.id === id; });
        return project ? project.name : 'No Project';
    };
    var renderTimer = function () {
        var formattedTime = formatTime(timerState.time);
        return (React.createElement(framer_motion_1.motion.div, { className: "text-4xl lg:text-5xl font-mono font-bold text-center my-4", initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { duration: 0.3 } }, formattedTime));
    };
    return (React.createElement("div", { className: "bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100 transition-colors duration-200" },
        React.createElement("header", { className: "bg-white dark:bg-gray-800 shadow-sm py-4 px-6" },
            React.createElement("div", { className: "max-w-7xl mx-auto flex justify-between items-center" },
                React.createElement("div", { className: "flex items-center space-x-2" },
                    React.createElement(lucide_react_1.Clock, { className: "text-indigo-600 dark:text-indigo-400", size: 28 }),
                    React.createElement("h1", { className: "text-2xl font-bold" }, "AE - Timer")),
                React.createElement("div", { className: "flex items-center gap-4" },
                    React.createElement(tooltip_1.TooltipProvider, null,
                        React.createElement(tooltip_1.Tooltip, null,
                            React.createElement(tooltip_1.TooltipTrigger, { asChild: true },
                                React.createElement(button_1.Button, { variant: "ghost", size: "icon", className: "rounded-full", onClick: function () { return setPreferences(function (prev) { return (__assign(__assign({}, prev), { darkMode: !prev.darkMode })); }); } }, preferences.darkMode ? (React.createElement(framer_motion_1.motion.div, { initial: { rotate: -30 }, animate: { rotate: 0 }, transition: { duration: 0.2 } },
                                    React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
                                        React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" })))) : (React.createElement(framer_motion_1.motion.div, { initial: { rotate: 30 }, animate: { rotate: 0 }, transition: { duration: 0.2 } },
                                    React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
                                        React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" })))))),
                            React.createElement(tooltip_1.TooltipContent, null, "Toggle dark mode"))),
                    React.createElement(tooltip_1.TooltipProvider, null,
                        React.createElement(tooltip_1.Tooltip, null,
                            React.createElement(tooltip_1.TooltipTrigger, { asChild: true },
                                React.createElement(button_1.Button, { variant: "ghost", size: "icon", className: "rounded-full", onClick: function () { return setShowSettingsDialog(true); } },
                                    React.createElement(lucide_react_1.Settings, { className: "h-5 w-5" }))),
                            React.createElement(tooltip_1.TooltipContent, null, "Settings"))),
                    React.createElement(tooltip_1.TooltipProvider, null,
                        React.createElement(tooltip_1.Tooltip, null,
                            React.createElement(tooltip_1.TooltipTrigger, { asChild: true },
                                React.createElement(button_1.Button, { variant: "ghost", size: "icon", className: "rounded-full", onClick: function () { return setShowKeyboardShortcutsDialog(true); } },
                                    React.createElement(lucide_react_1.HelpCircle, { className: "h-5 w-5" }))),
                            React.createElement(tooltip_1.TooltipContent, null, "Keyboard shortcuts"))),
                    user && (React.createElement("div", { className: "flex items-center" },
                        React.createElement("div", { className: "bg-indigo-600 rounded-full h-8 w-8 flex items-center justify-center text-white font-medium" }, user.name ? user.name[0] : user.email[0])))))),
        React.createElement("main", { className: "max-w-7xl mx-auto py-6 sm:px-6 lg:px-8" },
            fetchError && (React.createElement(framer_motion_1.motion.div, { className: "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-lg mb-6", initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 } },
                React.createElement("div", { className: "flex items-center" },
                    React.createElement("svg", { className: "h-5 w-5 mr-2", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
                        React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" })),
                    React.createElement("span", null, fetchError)))),
            React.createElement("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6 overflow-hidden" },
                React.createElement(tabs_1.Tabs, { defaultValue: "stopwatch", value: timerMode, onValueChange: function (value) { return handleTimerModeChange(value); }, className: "w-full" },
                    React.createElement(tabs_1.TabsList, { className: "grid grid-cols-3 w-full" },
                        React.createElement(tabs_1.TabsTrigger, { value: "stopwatch", className: "py-3" },
                            React.createElement(lucide_react_1.Timer, { className: "h-4 w-4 mr-2" }),
                            "Stopwatch"),
                        React.createElement(tabs_1.TabsTrigger, { value: "countdown", className: "py-3" },
                            React.createElement(lucide_react_1.AlarmClock, { className: "h-4 w-4 mr-2" }),
                            "Countdown"),
                        React.createElement(tabs_1.TabsTrigger, { value: "pomodoro", className: "py-3" },
                            React.createElement(lucide_react_1.Coffee, { className: "h-4 w-4 mr-2" }),
                            "Pomodoro")),
                    React.createElement(tabs_1.TabsContent, { value: "stopwatch", className: "p-4" },
                        React.createElement("div", { className: "text-center text-gray-500 dark:text-gray-400" }, "Track your work time without limits")),
                    React.createElement(tabs_1.TabsContent, { value: "countdown", className: "p-4" },
                        React.createElement("div", { className: "flex flex-wrap gap-2 justify-center mb-4" },
                            preferences.countdownPresets.map(function (seconds) { return (React.createElement(button_1.Button, { key: seconds, variant: countdownTime === seconds ? 'default' : 'outline', size: "sm", onClick: function () { return handleSelectCountdownPreset(seconds); }, className: "min-w-[4rem]" },
                                Math.floor(seconds / 60),
                                "m")); }),
                            React.createElement(dialog_1.Dialog, null,
                                React.createElement(dialog_1.DialogTrigger, { asChild: true },
                                    React.createElement(button_1.Button, { variant: "outline", size: "sm" },
                                        React.createElement(lucide_react_1.Plus, { className: "h-4 w-4 mr-1" }),
                                        "Custom")),
                                React.createElement(dialog_1.DialogContent, null,
                                    React.createElement(dialog_1.DialogHeader, null,
                                        React.createElement(dialog_1.DialogTitle, null, "Set Custom Time"),
                                        React.createElement(dialog_1.DialogDescription, null, "Enter the number of minutes for your timer.")),
                                    React.createElement("div", { className: "flex items-center space-x-4 py-4" },
                                        React.createElement(input_1.Input, { type: "number", min: "1", max: "180", placeholder: "Minutes", defaultValue: "25", className: "flex-1", id: "custom-minutes" })),
                                    React.createElement(dialog_1.DialogFooter, null,
                                        React.createElement(button_1.Button, { onClick: function () {
                                                var input = document.getElementById('custom-minutes');
                                                var minutes = parseInt(input.value || '25');
                                                handleSetCustomCountdown(minutes);
                                            } }, "Set Timer")))))),
                    React.createElement(tabs_1.TabsContent, { value: "pomodoro", className: "p-4" },
                        React.createElement("div", { className: "flex justify-center items-center gap-4 mb-4" },
                            React.createElement("div", { className: "text-center" },
                                React.createElement("div", { className: "text-sm text-gray-500 dark:text-gray-400" }, "Session"),
                                React.createElement("div", { className: "font-medium" },
                                    pomodoroState.currentSession,
                                    "/",
                                    preferences.pomodoroSettings.sessionsUntilLongBreak)),
                            React.createElement(badge_1.Badge, { variant: pomodoroState.isBreak ? 'secondary' : 'default', className: "px-3 py-1" }, pomodoroState.isBreak ? 'Break' : 'Work'),
                            React.createElement("div", { className: "text-center" },
                                React.createElement("div", { className: "text-sm text-gray-500 dark:text-gray-400" }, "Completed"),
                                React.createElement("div", { className: "font-medium" }, pomodoroState.totalSessions))),
                        timerState.status === 'running' && (React.createElement(button_1.Button, { variant: "outline", size: "sm", onClick: skipPomodoroSession, className: "flex items-center mx-auto" },
                            React.createElement(lucide_react_1.SkipForward, { className: "h-4 w-4 mr-1" }),
                            "Skip ",
                            pomodoroState.isBreak ? 'Break' : 'Session'))))),
            React.createElement("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6 p-6" },
                renderTimer(),
                (timerMode === 'countdown' || timerMode === 'pomodoro') && (React.createElement("div", { className: "w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-6" },
                    React.createElement(framer_motion_1.motion.div, { className: "h-2 rounded-full " + (timerMode === 'pomodoro' && pomodoroState.isBreak ? 'bg-blue-500 dark:bg-blue-600' : 'bg-indigo-600 dark:bg-indigo-500'), style: {
                            width: (timerMode === 'countdown'
                                ? (timerState.time / countdownTime) * 100
                                : pomodoroState.isBreak
                                    ? (timerState.time / (preferences.pomodoroSettings[pomodoroState.currentSession % preferences.pomodoroSettings.sessionsUntilLongBreak === 0 ? 'longBreakDuration' : 'shortBreakDuration'] * 60)) * 100
                                    : (timerState.time / (preferences.pomodoroSettings.workDuration * 60)) * 100) + "%"
                        }, initial: { width: '0%' }, animate: {
                            width: (timerMode === 'countdown'
                                ? (timerState.time / countdownTime) * 100
                                : pomodoroState.isBreak
                                    ? (timerState.time / (preferences.pomodoroSettings[pomodoroState.currentSession % preferences.pomodoroSettings.sessionsUntilLongBreak === 0 ? 'longBreakDuration' : 'shortBreakDuration'] * 60)) * 100
                                    : (timerState.time / (preferences.pomodoroSettings.workDuration * 60)) * 100) + "%"
                        }, transition: { duration: 0.5 } }))),
                (timerMode !== 'countdown' && !(timerMode === 'pomodoro' && pomodoroState.isBreak)) && (React.createElement("div", { className: "mb-4" },
                    React.createElement(input_1.Input, { type: "text", placeholder: "What are you working on?", value: currentTask.description, onChange: function (e) { return setCurrentTask(function (prev) { return (__assign(__assign({}, prev), { description: e.target.value })); }); }, disabled: timerState.status === 'running', className: "w-full text-lg" }))),
                (timerMode !== 'countdown' && !(timerMode === 'pomodoro' && pomodoroState.isBreak)) && (React.createElement("div", { className: "flex flex-wrap gap-3 mb-6" },
                    React.createElement("div", { className: "relative" },
                        React.createElement(button_1.Button, { variant: "outline", size: "sm", onClick: function () { return setShowProjectSelect(!showProjectSelect); }, disabled: timerState.status === 'running', className: "flex items-center gap-2" },
                            React.createElement(lucide_react_1.Briefcase, { className: "h-4 w-4" }),
                            currentTask.projectId === 'noproject' ? 'No Project' : getProjectNameById(parseInt(currentTask.projectId)),
                            React.createElement(lucide_react_1.ChevronDown, { className: "h-4 w-4" })),
                        showProjectSelect && (React.createElement(framer_motion_1.motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 10 }, transition: { duration: 0.2 }, className: "absolute z-50 mt-1 w-56 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none" },
                            React.createElement("div", { className: "py-1 max-h-60 overflow-auto" },
                                React.createElement("button", { onClick: function () {
                                        setCurrentTask(function (prev) { return (__assign(__assign({}, prev), { projectId: 'noproject' })); });
                                        setShowProjectSelect(false);
                                    }, className: "w-full text-left px-4 py-2 text-sm " + (currentTask.projectId === 'noproject'
                                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-300'
                                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700') }, "No Project"),
                                projects.map(function (project) { return (React.createElement("button", { key: project.id, onClick: function () {
                                        setCurrentTask(function (prev) { return (__assign(__assign({}, prev), { projectId: project.id.toString() })); });
                                        setShowProjectSelect(false);
                                    }, className: "w-full text-left px-4 py-2 text-sm " + (currentTask.projectId === project.id.toString()
                                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-300'
                                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700') }, project.name)); }))))),
                    React.createElement("div", { className: "relative" },
                        React.createElement(button_1.Button, { variant: "outline", size: "sm", onClick: function () { return setShowTagInput(!showTagInput); }, disabled: timerState.status === 'running', className: "flex items-center gap-2" },
                            React.createElement(lucide_react_1.Tag, { className: "h-4 w-4" }),
                            "Tags",
                            React.createElement(lucide_react_1.ChevronDown, { className: "h-4 w-4" })),
                        showTagInput && (React.createElement(framer_motion_1.motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 10 }, transition: { duration: 0.2 }, className: "absolute z-50 mt-1 w-64 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none" },
                            React.createElement("div", { className: "p-3" },
                                React.createElement("div", { className: "flex gap-2 mb-3" },
                                    React.createElement(input_1.Input, { ref: tagInputRef, placeholder: "Add new tag", value: currentTask.newTag, onChange: function (e) { return setCurrentTask(function (prev) { return (__assign(__assign({}, prev), { newTag: e.target.value })); }); }, onKeyDown: function (e) {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddTag();
                                            }
                                        }, className: "flex-1" }),
                                    React.createElement(button_1.Button, { size: "sm", onClick: handleAddTag }, "Add")),
                                React.createElement("div", { className: "max-h-40 overflow-y-auto py-1" },
                                    tags.map(function (tag) { return (React.createElement("div", { key: tag.id, onClick: function () { return handleSelectTag(tag); }, className: "flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" },
                                        React.createElement("div", { className: "flex items-center" },
                                            React.createElement("div", { className: "w-3 h-3 rounded-full mr-2", style: { backgroundColor: tag.color } }),
                                            React.createElement("span", { className: "text-sm" }, tag.name)),
                                        currentTask.tags.some(function (t) { return t.id === tag.id; }) && React.createElement(lucide_react_1.CheckCircle, { className: "h-4 w-4 text-green-500" }))); }),
                                    tags.length === 0 && (React.createElement("div", { className: "text-sm text-gray-500 dark:text-gray-400 text-center py-2" }, "No tags yet. Create one above."))))))),
                    React.createElement("div", { className: "flex flex-wrap gap-2" }, currentTask.tags.map(function (tag) { return (React.createElement(badge_1.Badge, { key: tag.id, variant: "secondary", className: "flex items-center gap-1 pl-1 pr-2 py-1", style: { backgroundColor: tag.color + "20" } },
                        React.createElement("div", { className: "w-2 h-2 rounded-full", style: { backgroundColor: tag.color } }),
                        React.createElement("span", null, tag.name),
                        React.createElement("button", { onClick: function () { return setCurrentTask(function (prev) { return (__assign(__assign({}, prev), { tags: prev.tags.filter(function (t) { return t.id !== tag.id; }) })); }); }, disabled: timerState.status === 'running', className: "ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" },
                            React.createElement(lucide_react_1.X, { size: 12 })))); })),
                    React.createElement("div", { className: "flex items-center gap-2 ml-auto" },
                        React.createElement(lucide_react_1.DollarSign, { className: "h-4 w-4 " + (currentTask.billable ? 'text-green-500' : 'text-gray-400') }),
                        React.createElement("span", { className: "text-sm" }, "Billable"),
                        React.createElement(switch_1.Switch, { checked: currentTask.billable, onCheckedChange: function (checked) { return setCurrentTask(function (prev) { return (__assign(__assign({}, prev), { billable: checked })); }); }, disabled: timerState.status === 'running' })))),
                React.createElement("div", { className: "flex justify-center gap-4" },
                    React.createElement(tooltip_1.TooltipProvider, null,
                        React.createElement(tooltip_1.Tooltip, null,
                            React.createElement(tooltip_1.TooltipTrigger, { asChild: true },
                                React.createElement(button_1.Button, { variant: "outline", size: "icon", onClick: resetTimer, disabled: timerState.status === 'running', className: "rounded-full h-12 w-12" },
                                    React.createElement(lucide_react_1.RotateCcw, { className: "h-5 w-5" }))),
                            React.createElement(tooltip_1.TooltipContent, null, "Reset timer (R)"))),
                    React.createElement(tooltip_1.TooltipProvider, null,
                        React.createElement(tooltip_1.Tooltip, null,
                            React.createElement(tooltip_1.TooltipTrigger, { asChild: true },
                                React.createElement(button_1.Button, { onClick: toggleTimer, className: "rounded-full h-14 w-14 flex items-center justify-center", variant: timerState.status === 'running' ? 'secondary' : 'default' }, timerState.status === 'running' ? React.createElement(lucide_react_1.Pause, { className: "h-6 w-6" }) : React.createElement(lucide_react_1.Play, { className: "h-6 w-6 ml-1" }))),
                            React.createElement(tooltip_1.TooltipContent, null, timerState.status === 'running' ? 'Pause timer (Space)' : 'Start timer (Space)'))),
                    React.createElement(tooltip_1.TooltipProvider, null,
                        React.createElement(tooltip_1.Tooltip, null,
                            React.createElement(tooltip_1.TooltipTrigger, { asChild: true },
                                React.createElement(button_1.Button, { variant: "outline", size: "icon", onClick: stopTimer, disabled: timerState.status === 'stopped' || timerState.time < 60, className: "rounded-full h-12 w-12" },
                                    React.createElement(lucide_react_1.Save, { className: "h-5 w-5" }))),
                            React.createElement(tooltip_1.TooltipContent, null, "Stop and save (S)"))))),
            React.createElement("div", { className: "bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6" },
                React.createElement("h2", { className: "text-xl font-semibold mb-4 flex items-center" },
                    React.createElement(lucide_react_1.Calendar, { className: "mr-2 h-5 w-5 text-indigo-600 dark:text-indigo-400" }),
                    "Recent Time Entries"),
                loading ? (React.createElement("div", { className: "py-10 text-center text-gray-500 dark:text-gray-400" }, "Loading time entries...")) : timeEntries.length === 0 ? (React.createElement("div", { className: "py-10 text-center text-gray-500 dark:text-gray-400" },
                    React.createElement(lucide_react_1.Clock, { className: "h-12 w-12 mx-auto mb-4 opacity-30" }),
                    React.createElement("p", null, "No time entries yet. Start tracking your time!"))) : (React.createElement("div", { className: "space-y-4" },
                    React.createElement(framer_motion_1.AnimatePresence, null, timeEntries.map(function (entry, index) { return (React.createElement(framer_motion_1.motion.div, { key: entry.id, initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, delay: index * 0.1 }, className: "border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors" },
                        React.createElement("div", { className: "flex items-start justify-between" },
                            React.createElement("div", null,
                                React.createElement("h3", { className: "font-medium" }, entry.taskDescription || 'Untitled Task'),
                                React.createElement("div", { className: "flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1" },
                                    entry.projectId && (React.createElement("span", { className: "flex items-center mr-3" },
                                        React.createElement(lucide_react_1.Briefcase, { className: "h-3 w-3 mr-1" }),
                                        getProjectNameById(entry.projectId))),
                                    React.createElement("span", { className: "flex items-center" },
                                        React.createElement(lucide_react_1.Calendar, { className: "h-3 w-3 mr-1" }),
                                        new Date(entry.startTime).toLocaleDateString())),
                                entry.tags.length > 0 && (React.createElement("div", { className: "flex flex-wrap gap-1 mt-2" }, entry.tags.map(function (tag) { return (React.createElement("div", { key: tag.id, className: "px-2 py-0.5 text-xs rounded-full", style: { backgroundColor: tag.color + "20", color: tag.color } }, tag.name)); })))),
                            React.createElement("div", { className: "flex items-center" },
                                entry.billable && React.createElement(lucide_react_1.DollarSign, { className: "h-4 w-4 text-green-500 mr-2" }),
                                React.createElement("span", { className: "font-mono" }, formatTime(entry.duration)))))); })))),
                React.createElement("div", { className: "mt-6 text-center" },
                    React.createElement(button_1.Button, { variant: "link", asChild: true },
                        React.createElement("a", { href: "/reports", className: "flex items-center justify-center" },
                            "View all time entries",
                            React.createElement(lucide_react_1.ArrowRight, { className: "ml-1 h-4 w-4" })))))),
        React.createElement(dialog_1.Dialog, { open: showSettingsDialog, onOpenChange: setShowSettingsDialog },
            React.createElement(dialog_1.DialogContent, { className: "sm:max-w-lg" },
                React.createElement(dialog_1.DialogHeader, null,
                    React.createElement(dialog_1.DialogTitle, null, "Settings"),
                    React.createElement(dialog_1.DialogDescription, null, "Customize your timer preferences")),
                React.createElement(tabs_1.Tabs, { defaultValue: "general" },
                    React.createElement(tabs_1.TabsList, { className: "grid grid-cols-3" },
                        React.createElement(tabs_1.TabsTrigger, { value: "general" }, "General"),
                        React.createElement(tabs_1.TabsTrigger, { value: "pomodoro" }, "Pomodoro"),
                        React.createElement(tabs_1.TabsTrigger, { value: "notifications" }, "Notifications")),
                    React.createElement(tabs_1.TabsContent, { value: "general", className: "space-y-4 pt-4" },
                        React.createElement("div", { className: "flex items-center justify-between" },
                            React.createElement("div", null,
                                React.createElement("h3", { className: "font-medium" }, "Dark Mode"),
                                React.createElement("p", { className: "text-sm text-gray-500 dark:text-gray-400" }, "Switch between light and dark themes")),
                            React.createElement(switch_1.Switch, { checked: preferences.darkMode, onCheckedChange: function (checked) { return setPreferences(function (prev) { return (__assign(__assign({}, prev), { darkMode: checked })); }); } })),
                        React.createElement("div", { className: "flex items-center justify-between" },
                            React.createElement("div", null,
                                React.createElement("h3", { className: "font-medium" }, "Default Timer Mode"),
                                React.createElement("p", { className: "text-sm text-gray-500 dark:text-gray-400" }, "Select the default timer type")),
                            React.createElement(select_1.Select, { value: preferences.timerMode, onValueChange: function (value) { return setPreferences(function (prev) { return (__assign(__assign({}, prev), { timerMode: value })); }); } },
                                React.createElement(select_1.SelectTrigger, { className: "w-32" },
                                    React.createElement(select_1.SelectValue, { placeholder: "Timer Mode" })),
                                React.createElement(select_1.SelectContent, null,
                                    React.createElement(select_1.SelectItem, { value: "stopwatch" }, "Stopwatch"),
                                    React.createElement(select_1.SelectItem, { value: "countdown" }, "Countdown"),
                                    React.createElement(select_1.SelectItem, { value: "pomodoro" }, "Pomodoro")))),
                        React.createElement("div", null,
                            React.createElement("h3", { className: "font-medium mb-2" }, "Countdown Presets (minutes)"),
                            React.createElement("div", { className: "flex flex-wrap gap-2" },
                                preferences.countdownPresets.map(function (seconds, index) { return (React.createElement("div", { key: index, className: "flex items-center" },
                                    React.createElement(input_1.Input, { type: "number", min: "1", max: "180", value: seconds / 60, onChange: function (e) {
                                            var newValue = parseInt(e.target.value) * 60;
                                            var newPresets = __spreadArrays(preferences.countdownPresets);
                                            newPresets[index] = newValue;
                                            setPreferences(function (prev) { return (__assign(__assign({}, prev), { countdownPresets: newPresets })); });
                                        }, className: "w-16 text-center" }),
                                    index > 2 && (React.createElement(button_1.Button, { variant: "ghost", size: "icon", className: "h-6 w-6 ml-1", onClick: function () {
                                            var newPresets = preferences.countdownPresets.filter(function (_, i) { return i !== index; });
                                            setPreferences(function (prev) { return (__assign(__assign({}, prev), { countdownPresets: newPresets })); });
                                        } },
                                        React.createElement(lucide_react_1.X, { className: "h-3 w-3" }))))); }),
                                preferences.countdownPresets.length < 8 && (React.createElement(button_1.Button, { variant: "outline", size: "sm", onClick: function () {
                                        setPreferences(function (prev) { return (__assign(__assign({}, prev), { countdownPresets: __spreadArrays(prev.countdownPresets, [1800]) })); });
                                    } },
                                    React.createElement(lucide_react_1.Plus, { className: "h-4 w-4 mr-1" }),
                                    "Add"))))),
                    React.createElement(tabs_1.TabsContent, { value: "pomodoro", className: "space-y-4 pt-4" },
                        React.createElement("div", null,
                            React.createElement("h3", { className: "font-medium mb-2" }, "Work Session"),
                            React.createElement("div", { className: "flex items-center" },
                                React.createElement("span", { className: "w-24 text-sm text-gray-500 dark:text-gray-400" }, "Duration"),
                                React.createElement("div", { className: "flex-1" },
                                    React.createElement(slider_1.Slider, { min: 5, max: 60, step: 5, value: [preferences.pomodoroSettings.workDuration], onValueChange: function (value) {
                                            return setPreferences(function (prev) { return (__assign(__assign({}, prev), { pomodoroSettings: __assign(__assign({}, prev.pomodoroSettings), { workDuration: value[0] }) })); });
                                        } })),
                                React.createElement("span", { className: "w-16 text-right" },
                                    preferences.pomodoroSettings.workDuration,
                                    " min"))),
                        React.createElement("div", null,
                            React.createElement("h3", { className: "font-medium mb-2" }, "Short Break"),
                            React.createElement("div", { className: "flex items-center" },
                                React.createElement("span", { className: "w-24 text-sm text-gray-500 dark:text-gray-400" }, "Duration"),
                                React.createElement("div", { className: "flex-1" },
                                    React.createElement(slider_1.Slider, { min: 1, max: 15, step: 1, value: [preferences.pomodoroSettings.shortBreakDuration], onValueChange: function (value) {
                                            return setPreferences(function (prev) { return (__assign(__assign({}, prev), { pomodoroSettings: __assign(__assign({}, prev.pomodoroSettings), { shortBreakDuration: value[0] }) })); });
                                        } })),
                                React.createElement("span", { className: "w-16 text-right" },
                                    preferences.pomodoroSettings.shortBreakDuration,
                                    " min"))),
                        React.createElement("div", null,
                            React.createElement("h3", { className: "font-medium mb-2" }, "Long Break"),
                            React.createElement("div", { className: "flex items-center" },
                                React.createElement("span", { className: "w-24 text-sm text-gray-500 dark:text-gray-400" }, "Duration"),
                                React.createElement("div", { className: "flex-1" },
                                    React.createElement(slider_1.Slider, { min: 5, max: 30, step: 5, value: [preferences.pomodoroSettings.longBreakDuration], onValueChange: function (value) {
                                            return setPreferences(function (prev) { return (__assign(__assign({}, prev), { pomodoroSettings: __assign(__assign({}, prev.pomodoroSettings), { longBreakDuration: value[0] }) })); });
                                        } })),
                                React.createElement("span", { className: "w-16 text-right" },
                                    preferences.pomodoroSettings.longBreakDuration,
                                    " min"))),
                        React.createElement("div", null,
                            React.createElement("h3", { className: "font-medium mb-2" }, "Sessions Until Long Break"),
                            React.createElement("div", { className: "flex items-center" },
                                React.createElement("span", { className: "w-24 text-sm text-gray-500 dark:text-gray-400" }, "Sessions"),
                                React.createElement("div", { className: "flex-1" },
                                    React.createElement(slider_1.Slider, { min: 2, max: 8, step: 1, value: [preferences.pomodoroSettings.sessionsUntilLongBreak], onValueChange: function (value) {
                                            return setPreferences(function (prev) { return (__assign(__assign({}, prev), { pomodoroSettings: __assign(__assign({}, prev.pomodoroSettings), { sessionsUntilLongBreak: value[0] }) })); });
                                        } })),
                                React.createElement("span", { className: "w-16 text-right" }, preferences.pomodoroSettings.sessionsUntilLongBreak)))),
                    React.createElement(tabs_1.TabsContent, { value: "notifications", className: "space-y-4 pt-4" },
                        React.createElement("div", { className: "flex items-center justify-between" },
                            React.createElement("div", null,
                                React.createElement("h3", { className: "font-medium" }, "Sound Effects"),
                                React.createElement("p", { className: "text-sm text-gray-500 dark:text-gray-400" }, "Play sounds for timer events")),
                            React.createElement("div", { className: "flex items-center" },
                                React.createElement(button_1.Button, { variant: "ghost", size: "icon", className: "mr-2", onClick: function () {
                                        if (preferences.soundEnabled && timerCompleteSound.current) {
                                            timerCompleteSound.current.play()["catch"](function (e) { return console.error('Error playing sound:', e); });
                                        }
                                    } },
                                    React.createElement(lucide_react_1.Volume2, { className: "h-4 w-4" })),
                                React.createElement(switch_1.Switch, { checked: preferences.soundEnabled, onCheckedChange: function (checked) { return setPreferences(function (prev) { return (__assign(__assign({}, prev), { soundEnabled: checked })); }); } }))),
                        React.createElement("div", { className: "flex items-center justify-between" },
                            React.createElement("div", null,
                                React.createElement("h3", { className: "font-medium" }, "Browser Notifications"),
                                React.createElement("p", { className: "text-sm text-gray-500 dark:text-gray-400" }, "Show notifications when timer completes")),
                            React.createElement("div", { className: "flex items-center" },
                                React.createElement(button_1.Button, { variant: "ghost", size: "icon", className: "mr-2", onClick: function () {
                                        if (preferences.notificationsEnabled && 'Notification' in window) {
                                            Notification.requestPermission().then(function (permission) {
                                                if (permission === 'granted') {
                                                    new Notification('TimeTracker', { body: 'Notifications are now enabled!' });
                                                }
                                            });
                                        }
                                    } },
                                    React.createElement(lucide_react_1.Bell, { className: "h-4 w-4" })),
                                React.createElement(switch_1.Switch, { checked: preferences.notificationsEnabled, onCheckedChange: function (checked) {
                                        if (checked && 'Notification' in window && Notification.permission !== 'granted') {
                                            Notification.requestPermission();
                                        }
                                        setPreferences(function (prev) { return (__assign(__assign({}, prev), { notificationsEnabled: checked })); });
                                    } }))))),
                React.createElement(dialog_1.DialogFooter, null,
                    React.createElement(button_1.Button, { onClick: function () { return setShowSettingsDialog(false); } }, "Save Changes")))),
        React.createElement(dialog_1.Dialog, { open: showKeyboardShortcutsDialog, onOpenChange: setShowKeyboardShortcutsDialog },
            React.createElement(dialog_1.DialogContent, { className: "sm:max-w-md" },
                React.createElement(dialog_1.DialogHeader, null,
                    React.createElement(dialog_1.DialogTitle, null, "Keyboard Shortcuts"),
                    React.createElement(dialog_1.DialogDescription, null, "Use theseshortcuts to navigate and control the TimeTracker efficiently.")),
                React.createElement("div", { className: "space-y-4 py-4" },
                    " ",
                    React.createElement("div", { className: "flex justify-between" },
                        " ",
                        React.createElement("span", { className: "text-sm font-medium" }, "Start/Pause Timer"),
                        " ",
                        React.createElement("kbd", { className: "px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" }, "Space"),
                        " "),
                    " ",
                    React.createElement("div", { className: "flex justify-between" },
                        " ",
                        React.createElement("span", { className: "text-sm font-medium" }, "Stop and Save Timer"),
                        " ",
                        React.createElement("kbd", { className: "px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" }, "S"),
                        " "),
                    " ",
                    React.createElement("div", { className: "flex justify-between" },
                        " ",
                        React.createElement("span", { className: "text-sm font-medium" }, "Reset Timer"),
                        " ",
                        React.createElement("kbd", { className: "px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" }, "R"),
                        " "),
                    " ",
                    React.createElement("div", { className: "flex justify-between" },
                        " ",
                        React.createElement("span", { className: "text-sm font-medium" }, "Switch to Stopwatch"),
                        " ",
                        React.createElement("kbd", { className: "px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" }, "1"),
                        " "),
                    " ",
                    React.createElement("div", { className: "flex justify-between" },
                        " ",
                        React.createElement("span", { className: "text-sm font-medium" }, "Switch to Countdown"),
                        " ",
                        React.createElement("kbd", { className: "px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" }, "2"),
                        " "),
                    " ",
                    React.createElement("div", { className: "flex justify-between" },
                        " ",
                        React.createElement("span", { className: "text-sm font-medium" }, "Switch to Pomodoro"),
                        " ",
                        React.createElement("kbd", { className: "px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600" }, "3"),
                        " "),
                    " "),
                " ",
                React.createElement(dialog_1.DialogFooter, null,
                    " ",
                    React.createElement(button_1.Button, { onClick: function () { return setShowKeyboardShortcutsDialog(false); } }, "Close"),
                    " "),
                " "),
            " "),
        " "));
}
exports["default"] = TimeTracker;
