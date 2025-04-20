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
exports.__esModule = true;
exports.UserTagPage = void 0;
// ProjectPage.tsx
var react_1 = require("react");
var AuthContext_1 = require("../context/AuthContext");
var ui_1 = require("../components/ui");
var lucide_react_1 = require("lucide-react");
exports.UserTagPage = function () {
    var isAuthenticated = AuthContext_1.useAuth().isAuthenticated;
    var COLORS = [
        '#4f46e5', '#10b981', '#ef4444', '#f59e0b',
        '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'
    ];
    var _a = react_1.useState([]), tags = _a[0], setTags = _a[1];
    var _b = react_1.useState({
        name: '',
        color: '#4f46e5'
    }), newTags = _b[0], setNewTags = _b[1];
    var _c = react_1.useState(null), editingTags = _c[0], setEditingTags = _c[1];
    var _d = react_1.useState(false), loading = _d[0], setLoading = _d[1];
    var fetchTags = function () { return __awaiter(void 0, void 0, void 0, function () {
        var res, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    console.log(localStorage.getItem('jwtToken'));
                    return [4 /*yield*/, fetch('http://localhost:8080/api/tags', {
                            headers: {
                                Authorization: "Bearer " + localStorage.getItem('jwtToken')
                            }
                        })];
                case 2:
                    res = _a.sent();
                    console.log(res.statusText);
                    // if (res.status === 401) {
                    //   localStorage.removeItem('jwtToken');
                    //   window.location.href = '/login';
                    //   return;
                    // }
                    if (!res.ok)
                        throw new Error('Failed to fetch tags');
                    return [4 /*yield*/, res.json()];
                case 3:
                    data = _a.sent();
                    setTags(data);
                    return [3 /*break*/, 6];
                case 4:
                    error_1 = _a.sent();
                    console.error('Error fetching tags:', error_1);
                    return [3 /*break*/, 6];
                case 5:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var handleSubmit = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var url, method, res, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    url = editingTags
                        ? "http://localhost:8080/api/tags/" + editingTags.id
                        : 'http://localhost:8080/api/tags';
                    method = editingTags ? 'PUT' : 'POST';
                    return [4 /*yield*/, fetch(url, {
                            method: method,
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': "Bearer " + localStorage.getItem('jwtToken')
                            },
                            body: JSON.stringify(editingTags || newTags)
                        })];
                case 2:
                    res = _a.sent();
                    if (!res.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, fetchTags()];
                case 3:
                    _a.sent();
                    setNewTags({ name: '', color: '#4f46e5' });
                    if (editingTags)
                        setEditingTags(null);
                    _a.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    error_2 = _a.sent();
                    console.error('Error saving project:', error_2);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var deleteProject = function (id) { return __awaiter(void 0, void 0, void 0, function () {
        var res, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!window.confirm('Are you sure you want to delete this Tag?'))
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, fetch("http://localhost:8080/api/tags/" + id, {
                            method: 'DELETE',
                            headers: { Authorization: "Bearer " + localStorage.getItem('jwtToken') }
                        })];
                case 2:
                    res = _a.sent();
                    if (!res.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, fetchTags()];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    error_3 = _a.sent();
                    console.error('Error deleting project:', error_3);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    react_1.useEffect(function () {
        if (isAuthenticated)
            fetchTags();
    }, [isAuthenticated]);
    return (react_1["default"].createElement("div", { className: "max-w-4xl mx-auto p-6" },
        react_1["default"].createElement("h1", { className: "text-2xl font-bold mb-6 text-gray-800" }, "Tags Management \uD83C\uDFF7\uFE0F"),
        react_1["default"].createElement("form", { onSubmit: handleSubmit, className: "bg-white p-6 rounded-lg shadow-md mb-8" },
            react_1["default"].createElement("div", { className: "grid grid-cols-3 gap-4 mb-4" },
                react_1["default"].createElement(ui_1.Input, { label: "Tag Name", value: (editingTags === null || editingTags === void 0 ? void 0 : editingTags.name) || newTags.name, onChange: function (e) { return editingTags
                        ? setEditingTags(__assign(__assign({}, editingTags), { name: e.target.value }))
                        : setNewTags(__assign(__assign({}, newTags), { name: e.target.value })); }, required: true }),
                react_1["default"].createElement("div", { className: "flex flex-col gap-1" },
                    react_1["default"].createElement("label", { className: "text-sm text-gray-600" }, "Color"),
                    react_1["default"].createElement("div", { className: "flex gap-2 flex-wrap" },
                        COLORS.map(function (color) { return (react_1["default"].createElement("button", { key: color, type: "button", onClick: function () {
                                return editingTags
                                    ? setEditingTags(__assign(__assign({}, editingTags), { color: color }))
                                    : setNewTags(__assign(__assign({}, newTags), { color: color }));
                            }, className: "w-8 h-8 rounded-full border-2 " + (((editingTags === null || editingTags === void 0 ? void 0 : editingTags.color) === color || newTags.color === color)
                                ? 'border-black'
                                : 'border-transparent'), style: { backgroundColor: color } })); }),
                        react_1["default"].createElement("label", { className: "relative cursor-pointer" },
                            react_1["default"].createElement("div", { className: "w-8 h-8 rounded-full border-2 border-dashed flex items-center justify-center", style: {
                                    borderColor: (editingTags === null || editingTags === void 0 ? void 0 : editingTags.color) || newTags.color,
                                    backgroundColor: ((editingTags === null || editingTags === void 0 ? void 0 : editingTags.color) === 'custom' || newTags.color === 'custom')
                                        ? 'transparent'
                                        : 'white'
                                } },
                                react_1["default"].createElement(lucide_react_1.Plus, { className: "w-4 h-4", style: {
                                        color: (editingTags === null || editingTags === void 0 ? void 0 : editingTags.color) || newTags.color
                                    } })),
                            react_1["default"].createElement("input", { type: "color", value: (editingTags === null || editingTags === void 0 ? void 0 : editingTags.color) || newTags.color, onChange: function (e) {
                                    var color = e.target.value;
                                    if (editingTags) {
                                        setEditingTags(__assign(__assign({}, editingTags), { color: color }));
                                    }
                                    else {
                                        setNewTags(__assign(__assign({}, newTags), { color: color }));
                                    }
                                }, className: "absolute opacity-0 w-0 h-0" }))))),
            react_1["default"].createElement("div", { className: "flex gap-2" },
                react_1["default"].createElement(ui_1.Button, { type: "submit", variant: "primary", className: "flex items-center gap-2" }, editingTags ? (react_1["default"].createElement(react_1["default"].Fragment, null,
                    react_1["default"].createElement(lucide_react_1.Pencil, { className: "w-4 h-4" }),
                    "Update Tag")) : (react_1["default"].createElement(react_1["default"].Fragment, null,
                    react_1["default"].createElement(lucide_react_1.Plus, { className: "w-4 h-4" }),
                    "Create Tag"))),
                editingTags && (react_1["default"].createElement(ui_1.Button, { variant: "ghost", onClick: function () { return setEditingTags(null); }, className: "hover:bg-red-50 hover:text-red-600" }, "Cancel")))),
        loading ? (react_1["default"].createElement("div", { className: "text-center py-8" },
            react_1["default"].createElement("div", { className: "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto" }))) : (react_1["default"].createElement(ui_1.Table, { className: "bg-white rounded-lg shadow-md" },
            react_1["default"].createElement(ui_1.Table.Header, null,
                react_1["default"].createElement(ui_1.Table.Row, null,
                    react_1["default"].createElement(ui_1.Table.Head, null, "Name"),
                    react_1["default"].createElement(ui_1.Table.Head, null, "Color"),
                    react_1["default"].createElement(ui_1.Table.Head, null, "Actions"))),
            react_1["default"].createElement(ui_1.Table.Body, null, tags.map(function (project) { return (react_1["default"].createElement(ui_1.Table.Row, { key: project.id, className: "hover:bg-gray-50" },
                react_1["default"].createElement(ui_1.Table.Cell, { className: "font-medium" }, project.name),
                react_1["default"].createElement(ui_1.Table.Cell, null,
                    react_1["default"].createElement("div", { className: "w-6 h-6 rounded-full shadow-sm border", style: { backgroundColor: project.color || '#4f46e5' } })),
                react_1["default"].createElement(ui_1.Table.Cell, null,
                    react_1["default"].createElement("div", { className: "flex gap-2" },
                        react_1["default"].createElement(ui_1.Button, { variant: "ghost", size: "icon", onClick: function () { return setEditingTags(project); } },
                            react_1["default"].createElement(lucide_react_1.Pencil, { className: "w-4 h-4" })),
                        react_1["default"].createElement(ui_1.Button, { variant: "ghost", size: "icon", className: "text-red-600 hover:text-red-700", onClick: function () { return deleteProject(project.id); } },
                            react_1["default"].createElement(lucide_react_1.Trash2, { className: "w-4 h-4" })))))); }))))));
};
