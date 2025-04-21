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
// LoginClassic.tsx
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var AuthContext_1 = require("../context/AuthContext"); // Import the useAuth hook to access context
var Skeleton1_jpg_1 = require("../images/Skeleton1.jpg");
var use_toast_1 = require("./Calendar_updated/components/hooks/use-toast");
function LoginClassic() {
    var _this = this;
    var _a = react_1.useState('@gmail.com'), email = _a[0], setEmail = _a[1];
    var _b = react_1.useState(''), password = _b[0], setPassword = _b[1];
    var _c = react_1.useState(''), error = _c[0], setError = _c[1];
    var _d = react_1.useState(false), loading = _d[0], setLoading = _d[1];
    var navigate = react_router_dom_1.useNavigate();
    var _e = AuthContext_1.useAuth(), isAuthenticated = _e.isAuthenticated, login = _e.login; // Destructure the login function from the context
    var toast = use_toast_1.useToast().toast;
    var location = react_router_dom_1.useLocation();
    if (isAuthenticated) {
        return React.createElement(react_router_dom_1.Navigate, { to: "/", replace: true });
    }
    var handleSubmit = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var response, errorData, data, token, error_1;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    e.preventDefault();
                    setLoading(true);
                    setError('');
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                        setError('Please enter a valid email address');
                        setLoading(false);
                        return [2 /*return*/];
                    }
                    if (password.length < 6) {
                        setError('Password must be at least 6 characters');
                        setLoading(false);
                        return [2 /*return*/];
                    }
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 6, 7, 8]);
                    return [4 /*yield*/, fetch('http://localhost:8080/api/auth/login', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: email, password: password })
                        })];
                case 2:
                    response = _c.sent();
                    if (!!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json()];
                case 3:
                    errorData = _c.sent();
                    throw new Error(errorData.message || 'Login failed');
                case 4: return [4 /*yield*/, response.json()];
                case 5:
                    data = _c.sent();
                    console.info('FROM FE -> JSON Response from Backend for login ! ', data);
                    token = data.token;
                    console.log('FROM FE -> JWT Token received: ', token);
                    localStorage.setItem('jwtToken', token.trim());
                    login(token, { email: (_a = data.user) === null || _a === void 0 ? void 0 : _a.email, name: (_b = data.user) === null || _b === void 0 ? void 0 : _b.name });
                    toast({ title: 'Success', description: 'Logged in successfully!' });
                    navigate('/', { replace: true });
                    return [3 /*break*/, 8];
                case 6:
                    error_1 = _c.sent();
                    console.error('Login error:', error_1);
                    toast({
                        title: 'Error',
                        description: error_1.message || 'Failed to log in.',
                        variant: 'destructive'
                    });
                    setError(error_1.message || 'Failed to log in.');
                    return [3 /*break*/, 8];
                case 7:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    return (React.createElement("div", { className: "min-h-screen flex bg-[#FFF5E9] p-8" },
        React.createElement("div", { className: "w-full max-w-7xl mx-auto bg-white rounded-3xl overflow-hidden flex shadow-xl" },
            React.createElement("div", { className: "w-1/2 p-12 bg-[#FFF5E9] relative overflow-hidden" },
                React.createElement("div", { className: "absolute -top-16 -left-16 w-64 h-64 bg-[#B32C1A] rounded-full opacity-20" }),
                React.createElement("div", { className: "absolute top-32 -right-8 w-16 h-16 bg-[#FFC7B4] rounded-full opacity-40" }),
                React.createElement("div", { className: "absolute bottom-24 left-24 w-32 h-32 bg-[#B32C1A] rounded-full opacity-10" }),
                React.createElement("div", { className: "relative z-10 flex flex-col h-full" },
                    React.createElement("div", { className: "flex-grow flex flex-col justify-center space-y-6" },
                        React.createElement("img", { src: Skeleton1_jpg_1["default"], alt: "Skeleton at laptop", className: "w-80 mx-auto transform -rotate-6" }),
                        React.createElement("div", { className: "space-y-4 pl-12" },
                            React.createElement("h1", { className: "text-4xl font-bold text-[#4A154B] leading-tight" },
                                "Making time to do",
                                React.createElement("br", null),
                                "things you love ?"),
                            React.createElement("p", { className: "text-lg text-[#4A154B] opacity-80" },
                                "Still making changes to your schedule",
                                React.createElement("br", null),
                                "to make time for people you love ?"),
                            React.createElement("br", null),
                            React.createElement("p", { className: "text-2xl font-handwriting text-[#4A154B] mt-8" }, "Be Human, 3rd:9:0."))))),
            React.createElement("div", { className: "w-1/2 p-12 flex flex-col justify-center" },
                React.createElement("div", { className: "max-w-md mx-auto w-full" },
                    React.createElement("div", { className: "text-center mb-12" },
                        React.createElement("h2", { className: "text-3xl font-bold text-[#4A154B] mb-3" }, "Login to your Account"),
                        React.createElement("p", { className: "text-[#4A154B]/80" }, "See, how you can live and grow more, Powered with AI")),
                    React.createElement("button", { className: "w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg px-4 py-2.5 mb-6 hover:bg-gray-50 transition-colors" },
                        React.createElement("img", { src: "https://www.google.com/favicon.ico", alt: "Google", className: "w-5 h-5" }),
                        React.createElement("span", { className: "text-gray-700" }, "Continue with Google")),
                    React.createElement("div", { className: "relative my-6" },
                        React.createElement("div", { className: "absolute inset-0 flex items-center" },
                            React.createElement("div", { className: "w-full border-t border-gray-200" })),
                        React.createElement("div", { className: "relative flex justify-center text-sm" },
                            React.createElement("span", { className: "px-2 bg-white text-gray-500" }, "or Sign in with Email"))),
                    React.createElement("form", { className: "space-y-5", onSubmit: handleSubmit },
                        React.createElement("div", null,
                            React.createElement("label", { className: "block text-sm font-medium text-gray-700 mb-1" }, "Email"),
                            React.createElement("input", { type: "email", value: email, onChange: function (e) { return setEmail(e.target.value); }, className: "block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[#4A154B] focus:border-[#4A154B]", placeholder: "FutureYou@gmail.com" })),
                        React.createElement("div", null,
                            React.createElement("label", { className: "block text-sm font-medium text-gray-700 mb-1" }, "Password"),
                            React.createElement("input", { type: "password", value: password, onChange: function (e) { return setPassword(e.target.value); }, className: "block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[#4A154B] focus:border-[#4A154B]", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" })),
                        React.createElement("div", { className: "flex items-center justify-between" },
                            React.createElement("div", { className: "flex items-center" },
                                React.createElement("input", { type: "checkbox", className: "h-4 w-4 text-[#4A154B] focus:ring-[#4A154B] border-gray-300 rounded" }),
                                React.createElement("label", { className: "ml-2 block text-sm text-gray-700" }, "Remember Me")),
                            React.createElement("a", { href: "#", className: "text-sm font-medium text-[#4A154B] hover:text-[#3D1D38]" }, "Forgot Password?")),
                        error && (React.createElement("div", { className: "mb-4 p-3 bg-red-100 text-red-800 rounded text-sm" }, error === 'Invalid credentials' ? (React.createElement("div", { className: "space-y-2" },
                            React.createElement("p", null, "Invalid email or password"),
                            React.createElement("div", { className: "text-xs" },
                                React.createElement(react_router_dom_1.Link, { to: "/forgot-password", className: "text-red-800 hover:text-red-900" }, "Forgot your password?")))) : error)),
                        React.createElement("button", { type: "submit", disabled: loading, className: "w-full flex justify-center py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-[#4A154B] " + (loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#3D1D38]') }, loading ? 'Logging in...' : 'Login')),
                    React.createElement("div", { className: "mt-8 text-center text-sm" },
                        React.createElement("span", { className: "text-gray-600" }, "Still Planning Life By Yourself ?"),
                        React.createElement("div", { className: "mt-1" },
                            React.createElement("span", { className: "text-gray-600 italic" }, "We would love you Onboard you"),
                            ' → ',
                            React.createElement(react_router_dom_1.Link, { to: "/signup", className: "font-medium text-[#4A154B] hover:text-[#3D1D38]" }, "Create an account"))))))));
}
exports["default"] = LoginClassic;
// LoginClassic.tsx
// import React, { useState } from 'react';
// import { Button } from '../components/Calendar_updated/components/ui/button';
// import { Input } from '../components/Calendar_updated/components/ui/input';
// import { useToast } from '../components/Calendar_updated/components/hooks/use-toast';
// import { useAuth } from '../context/AuthContext';
// import { useNavigate, Link } from 'react-router-dom';
// export default function LoginClassic() {
//   const [formData, setFormData] = useState({ email: '', password: '' });
//   const [loading, setLoading] = useState(false);
//   const { login } = useAuth();
//   const { toast } = useToast();
//   const navigate = useNavigate();
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       const response = await fetch('http://localhost:8080/api/auth/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(formData),
//       });
//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || 'Login failed');
//       }
//       const data = await response.json();
//       login(data.token, { email: formData.email, name: data.user?.name });
//       toast({ title: 'Success', description: 'Logged in successfully!' });
//       navigate('/', { replace: true });
//     } catch (error: any) {
//       toast({
//         title: 'Error',
//         description: error.message || 'Failed to log in.',
//         variant: 'destructive',
//       });
//     } finally {
//       setLoading(false);
//     }
//   };
//   return (
//     <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
//       <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
//         <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100">Log In</h2>
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div>
//             <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
//               Email
//             </label>
//             <Input
//               id="email"
//               type="email"
//               value={formData.email}
//               onChange={e => setFormData({ ...formData, email: e.target.value })}
//               required
//               className="mt-1"
//             />
//           </div>
//           <div>
//             <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
//               Password
//             </label>
//             <Input
//               id="password"
//               type="password"
//               value={formData.password}
//               onChange={e => setFormData({ ...formData, password: e.target.value })}
//               required
//               className="mt-1"
//             />
//           </div>
//           <Button type="submit" disabled={loading} className="w-full">
//             {loading ? 'Logging in...' : 'Log In'}
//           </Button>
//         </form>
//         <p className="text-center text-sm text-gray-600 dark:text-gray-400">
//           Don't have an account?{' '}
//           <Link to="/signup" className="text-indigo-600 dark:text-indigo-400 hover:underline">
//             Sign up
//           </Link>
//         </p>
//       </div>
//     </div>
//   );
// }
