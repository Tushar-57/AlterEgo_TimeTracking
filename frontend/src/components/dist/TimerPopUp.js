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
exports.TimerPopup = void 0;
// timerPopUp.tsx
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var react_beautiful_dnd_1 = require("react-beautiful-dnd");
exports.TimerPopup = function (_a) {
    var isSubmitting = _a.isSubmitting, submitError = _a.submitError, time = _a.time, soundEnabled = _a.soundEnabled, aiMode = _a.aiMode, timerMode = _a.timerMode, presetTimes = _a.presetTimes, formatTime = _a.formatTime, toggleTimer = _a.toggleTimer, resetTimer = _a.resetTimer, handlePresetClick = _a.handlePresetClick, setSoundEnabled = _a.setSoundEnabled, setAiMode = _a.setAiMode, onClose = _a.onClose, onSave = _a.onSave, taskName = _a.taskName, setTaskName = _a.setTaskName;
    var _b = react_1.useState(taskName), taskDescription = _b[0], setTaskDescription = _b[1];
    var _c = react_1.useState('work'), category = _c[0], setCategory = _c[1];
    var _d = react_1.useState([]), tags = _d[0], setTags = _d[1];
    var _e = react_1.useState(''), newTag = _e[0], setNewTag = _e[1];
    var startTime = react_1.useState(new Date())[0];
    var _f = react_1.useState(null), endTime = _f[0], setEndTime = _f[1];
    var _g = react_1.useState(null), validationError = _g[0], setValidationError = _g[1];
    // const [submitError, setSubmitError] = useState<string | null>(null);
    // Manual mode state
    var _h = react_1.useState(false), manualMode = _h[0], setManualMode = _h[1];
    var _j = react_1.useState(''), manualStart = _j[0], setManualStart = _j[1];
    var _k = react_1.useState(''), manualEnd = _k[0], setManualEnd = _k[1];
    var _l = react_1.useState(false), isBillable = _l[0], setIsBillable = _l[1];
    // Chat window state
    var _m = react_1.useState(false), chatOpen = _m[0], setChatOpen = _m[1];
    var _o = react_1.useState([]), messages = _o[0], setMessages = _o[1];
    var _p = react_1.useState(''), draftMessage = _p[0], setDraftMessage = _p[1];
    var _q = react_1.useState([]), projects = _q[0], setProjects = _q[1];
    var _r = react_1.useState(null), selectedProjectId = _r[0], setSelectedProjectId = _r[1];
    var _s = react_1.useState(false), isLoadingProjects = _s[0], setIsLoadingProjects = _s[1];
    var fetchProjects = function () { return __awaiter(void 0, void 0, void 0, function () {
        var token, res, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoadingProjects(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    token = localStorage.getItem('jwtToken');
                    if (!token) {
                        window.location.href = '/login';
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, fetch('http://localhost:8080/api/projects', {
                            headers: { Authorization: "Bearer " + token }
                        })];
                case 2:
                    res = _a.sent();
                    if (res.status === 401) {
                        localStorage.removeItem('jwtToken');
                        window.location.href = '/login';
                        return [2 /*return*/];
                    }
                    if (!res.ok)
                        throw new Error('Failed to fetch projects');
                    return [4 /*yield*/, res.json()];
                case 3:
                    data = _a.sent();
                    setProjects(data);
                    return [3 /*break*/, 6];
                case 4:
                    error_1 = _a.sent();
                    console.error('Error fetching projects:', error_1);
                    if (error_1 instanceof Error && error_1.message.includes('401')) {
                        localStorage.removeItem('jwtToken');
                        window.location.href = '/login';
                    }
                    return [3 /*break*/, 6];
                case 5:
                    setIsLoadingProjects(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var handleComplete = function () {
        console.log('Token:', localStorage.getItem('jwtToken'));
        var sTime = startTime;
        var eTime = new Date();
        if (manualMode) {
            if (!manualStart || !manualEnd) {
                setValidationError('Please fill both start and end times in manual mode');
                return;
            }
            var s = new Date(manualStart);
            var e = new Date(manualEnd);
            if (e <= s) {
                setValidationError('End time must be after start time');
                return;
            }
            sTime = s;
            eTime = e;
        }
        else {
            if (status === 'running') {
                setValidationError('Please stop the timer before saving');
                return;
            }
            eTime = new Date();
        }
        if (!taskDescription.trim()) {
            setValidationError('Task description is required');
            return;
        }
        setValidationError(null);
        console.log("Saving entry:", {
            taskDescription: taskDescription.trim(),
            category: category,
            tags: tags,
            startTime: sTime,
            endTime: eTime,
            projectId: selectedProjectId !== null && selectedProjectId !== void 0 ? selectedProjectId : undefined,
            billable: isBillable
        });
        onSave({
            taskDescription: taskDescription.trim(),
            category: category,
            tags: tags,
            startTime: manualMode ? new Date(manualStart) : startTime,
            endTime: manualMode ? new Date(manualEnd) : new Date(),
            projectId: selectedProjectId !== null && selectedProjectId !== void 0 ? selectedProjectId : undefined,
            billable: isBillable
        });
    };
    var sendMessage = function () {
        if (!draftMessage.trim())
            return;
        setMessages(function (prev) { return __spreadArrays(prev, [draftMessage.trim()]); });
        setDraftMessage('');
    };
    var addTag = function () {
        var tag = newTag.trim();
        if (tag && !tags.includes(tag)) {
            setTags(function (prev) { return __spreadArrays(prev, [tag]); });
        }
        setNewTag('');
    };
    var removeTag = function (tag) {
        setTags(function (prev) { return prev.filter(function (t) { return t !== tag; }); });
    };
    var onDragEnd = function (result) {
        if (!result.destination)
            return;
        var reordered = Array.from(tags);
        var moved = reordered.splice(result.source.index, 1)[0];
        reordered.splice(result.destination.index, 0, moved);
        setTags(reordered);
    };
    return (React.createElement("div", { className: "fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4", onKeyDown: function (e) { return e.stopPropagation(); }, tabIndex: 0 },
        React.createElement("div", { className: "bg-white rounded-2xl w-[600px] max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" },
            React.createElement("div", { className: "flex justify-between items-center px-6 py-4 border-b" },
                React.createElement("h2", { className: "text-lg font-semibold text-gray-800" }, "Time Entry"),
                React.createElement("div", { className: "flex space-x-2" },
                    React.createElement("button", { onClick: function () { return setManualMode(!manualMode); }, title: manualMode ? 'Auto Mode' : 'Manual Mode', className: "p-2 hover:bg-gray-100 rounded" },
                        React.createElement(lucide_react_1.Edit2, { className: "w-5 h-5 text-gray-600" })),
                    React.createElement("button", { onClick: function () { return setChatOpen(!chatOpen); }, title: "AI Assistant", className: "p-2 hover:bg-gray-100 rounded" },
                        React.createElement(lucide_react_1.MessageCircle, { className: "w-5 h-5 text-gray-600" })),
                    React.createElement("button", { onClick: onClose, className: "p-2 hover:bg-gray-100 rounded" },
                        React.createElement(lucide_react_1.X, { className: "w-5 h-5 text-gray-600" })))),
            React.createElement("div", { className: "p-6 flex-1 overflow-auto grid grid-cols-1 gap-6" },
                React.createElement("div", { className: "space-y-4" },
                    React.createElement("input", { type: "text", value: taskDescription, onChange: function (e) { return setTaskDescription(e.target.value); }, placeholder: "What are you working on?", className: "w-full text-lg font-medium px-4 py-2 border rounded focus:ring-2 focus:ring-indigo-500" }),
                    React.createElement("div", { className: "flex space-x-4" },
                        React.createElement("select", { value: category, onChange: function (e) { return setCategory(e.target.value); }, className: "flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500" },
                            React.createElement("option", { value: "work" }, "Work"),
                            React.createElement("option", { value: "meeting" }, "Meeting"),
                            React.createElement("option", { value: "personal" }, "Personal"),
                            React.createElement("option", { value: "learning" }, "Learning")),
                        React.createElement("div", { className: "flex-1 flex space-x-2" },
                            React.createElement("input", { type: "text", value: newTag, onChange: function (e) { return setNewTag(e.target.value); }, onKeyDown: function (e) { return e.key === 'Enter' && addTag(); }, placeholder: "Add tag and press Enter", className: "flex-1 px-3 py-2 border rounded-l focus:ring-2 focus:ring-indigo-500" }),
                            React.createElement("button", { onClick: addTag, className: "px-3 bg-indigo-600 text-white rounded-r hover:bg-indigo-700" },
                                React.createElement(lucide_react_1.Plus, { className: "w-5 h-5" })))),
                    React.createElement(react_beautiful_dnd_1.DragDropContext, { onDragEnd: onDragEnd }, tags.length > 0 ? (React.createElement(react_beautiful_dnd_1.Droppable, { droppableId: "tags", direction: "horizontal" }, function (provided) { return (React.createElement("div", __assign({ ref: provided.innerRef }, provided.droppableProps, { className: "flex space-x-2 overflow-auto" }),
                        tags.map(function (tag, idx) { return (React.createElement(react_beautiful_dnd_1.Draggable, { key: tag, draggableId: tag, index: idx }, function (prov) { return (React.createElement("div", __assign({ ref: prov.innerRef }, prov.draggableProps, prov.dragHandleProps, { className: "flex items-center bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full shadow-sm" }),
                            React.createElement("span", null, tag),
                            React.createElement("button", { onClick: function () { return removeTag(tag); }, className: "ml-2 focus:outline-none" },
                                React.createElement(lucide_react_1.X, { className: "w-4 h-4" })))); })); }),
                        provided.placeholder)); })) : (React.createElement("div", { className: "h-8" }) /* Empty spacer */))),
                React.createElement("div", { className: "grid grid-cols-2 gap-4" },
                    React.createElement("div", { className: "space-y-2" },
                        React.createElement("label", { className: "block text-sm text-gray-600" }, "Project"),
                        React.createElement("select", { value: selectedProjectId !== null && selectedProjectId !== void 0 ? selectedProjectId : '', onChange: function (e) { return setSelectedProjectId(e.target.value ? Number(e.target.value) : null); }, className: "w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500" },
                            React.createElement("option", { value: "" }, "No project"),
                            isLoadingProjects ? (React.createElement("option", { disabled: true }, "Loading projects...")) : (projects.map(function (project) { return (React.createElement("option", { key: project.id, value: project.id }, project.name)); })))),
                    React.createElement("div", { className: "space-y-2" },
                        React.createElement("label", { className: "block text-sm text-gray-600" }, "Billable"),
                        React.createElement("button", { onClick: function () { return setIsBillable(!isBillable); }, className: "p-2 w-full rounded " + (isBillable
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600') }, isBillable ? '✓ Billable' : 'Mark as Billable'))),
                !manualMode && (React.createElement("div", { className: "flex flex-col items-center space-y-4" },
                    React.createElement("div", { className: "text-4xl font-mono text-gray-800" }, formatTime(time)),
                    React.createElement("div", { className: "flex space-x-4" },
                        React.createElement("button", { onClick: toggleTimer, className: "p-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition" }, status === 'running' ? React.createElement(lucide_react_1.Pause, { className: "w-5 h-5" }) : React.createElement(lucide_react_1.Play, { className: "w-5 h-5" })),
                        React.createElement("button", { onClick: resetTimer, className: "p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition" },
                            React.createElement(lucide_react_1.RotateCcw, { className: "w-4 h-4" }))))),
                manualMode && (React.createElement("div", { className: "grid grid-cols-2 gap-4" },
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-sm text-gray-600" }, "Start"),
                        React.createElement("input", { type: "datetime-local", value: manualStart, onChange: function (e) { return setManualStart(e.target.value); }, className: "w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500" })),
                    React.createElement("div", null,
                        React.createElement("label", { className: "block text-sm text-gray-600" }, "End"),
                        React.createElement("input", { type: "datetime-local", value: manualEnd, onChange: function (e) { return setManualEnd(e.target.value); }, className: "w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500" })))),
                validationError && React.createElement("p", { className: "text-sm text-red-600" }, validationError),
                submitError && (React.createElement("div", { className: "mt-2 text-sm text-red-600" }, submitError.includes("Conflict")
                    ? "Stop current timer first!"
                    : submitError))),
            React.createElement("div", { className: "px-6 py-4 border-t flex justify-end space-x-4 bg-gray-50" },
                React.createElement("button", { onClick: onClose, className: "px-4 py-2 text-gray-700 rounded hover:bg-gray-200 transition" }, "Cancel"),
                React.createElement("button", { onClick: handleComplete, disabled: isSubmitting, className: "px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded shadow hover:from-indigo-600 hover:to-purple-600 transition" }, isSubmitting ? "Saving..." : "Save")),
            React.createElement("div", { className: "absolute bottom-0 left-0 right-0 bg-white shadow-lg transition-max-h duration-300 overflow-hidden " + (chatOpen ? 'max-h-60' : 'max-h-0') },
                React.createElement("div", { className: "p-4 flex flex-col h-full" },
                    React.createElement("div", { className: "flex-1 overflow-auto space-y-2 mb-2 text-sm" }, messages.map(function (msg, i) { return (React.createElement("div", { key: i, className: "p-2 bg-gray-100 rounded" }, msg)); })),
                    React.createElement("div", { className: "flex" },
                        validationError && (React.createElement("div", { className: "p-3 bg-red-50 text-red-700 rounded-md flex items-center" },
                            React.createElement(lucide_react_1.X, { className: "w-5 h-5 mr-2" }),
                            validationError)),
                        submitError && (React.createElement("div", { className: "p-3 bg-red-50 text-red-700 rounded-md flex items-center" },
                            React.createElement(lucide_react_1.X, { className: "w-5 h-5 mr-2" }),
                            submitError.includes("Conflict")
                                ? "You have an active timer - stop it first!"
                                : submitError)),
                        React.createElement("button", { className: "p-2 bg-gray-200 rounded-l hover:bg-gray-300 transition" },
                            React.createElement(lucide_react_1.Mic, { className: "w-5 h-5 text-gray-600" })),
                        React.createElement("input", { type: "text", value: draftMessage, onChange: function (e) { return setDraftMessage(e.target.value); }, className: "flex-1 px-3 py-2 border-t border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500", placeholder: "Ask AI or type..." }),
                        React.createElement("button", { onClick: sendMessage, className: "p-2 bg-indigo-600 text-white rounded-r hover:bg-indigo-700 transition" }, "Send")))))));
};
// PlannerForm.tsx
