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
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var Skeleton1_jpg_1 = require("../images/Skeleton1.jpg");
var auth_1 = require("../utils/auth");
var use_toast_1 = require("./Calendar_updated/components/hooks/use-toast");
function SignupClassic() {
    var _this = this;
    var _a = react_1.useState(''), email = _a[0], setEmail = _a[1];
    var _b = react_1.useState(''), password = _b[0], setPassword = _b[1];
    var _c = react_1.useState(''), name = _c[0], setName = _c[1];
    var _d = react_1.useState(''), confirmPassword = _d[0], setConfirmPassword = _d[1];
    var _e = react_1.useState(null), error = _e[0], setError = _e[1];
    var _f = react_1.useState(false), loading = _f[0], setLoading = _f[1];
    var _g = react_1.useState(false), success = _g[0], setSuccess = _g[1];
    var _h = react_1.useState(false), agreedToTerms = _h[0], setAgreedToTerms = _h[1];
    var navigate = react_router_dom_1.useNavigate();
    var toast = use_toast_1.useToast().toast;
    var isFormValid = name.trim() !== '' &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
        password.length >= 6 &&
        password === confirmPassword &&
        agreedToTerms;
    var validate = function () {
        var errors = [];
        if (!name.trim())
            errors.push('Full name is required');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            errors.push('Invalid email format');
        if (password.length < 6)
            errors.push('Password must be at least 6 characters');
        if (!/[0-9]/.test(password))
            errors.push('Password must contain at least one number');
        if (password !== confirmPassword)
            errors.push('Passwords do not match');
        if (!agreedToTerms)
            errors.push('You must agree to the terms and privacy policy');
        setError(errors.join('. ') || null);
        return errors.length === 0;
    };
    var handleSubmit = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var response, err_1, message;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    if (loading)
                        return [2 /*return*/];
                    setError(null);
                    if (!validate()) {
                        return [2 /*return*/];
                    }
                    setLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, auth_1.signup({ name: name, email: email, password: password })];
                case 2:
                    response = _a.sent();
                    setSuccess(true);
                    toast({
                        title: 'Success',
                        description: 'Account created successfully! Please log in.'
                    });
                    setTimeout(function () { return navigate('/login', { replace: true }); }, 1000); // Redirect after 1s to show toast
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _a.sent();
                    console.error('Signup error:', err_1);
                    message = err_1.message === 'This email is already registered'
                        ? 'This email is already registered'
                        : 'Registration failed - please try again later';
                    setError(message);
                    toast({
                        title: 'Error',
                        description: message,
                        variant: 'destructive'
                    });
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleGoogleSignup = function () {
        window.location.href = 'http://localhost:8080/oauth2/authorization/google';
    };
    return (React.createElement("div", { className: "min-h-screen flex bg-[#FFF5E9] p-8" },
        React.createElement("div", { className: "w-full max-w-7xl mx-auto bg-white rounded-3xl overflow-hidden flex shadow-xl" },
            React.createElement("div", { className: "w-1/2 p-12 bg-[#FFF5E9] relative" },
                React.createElement("div", { className: "absolute top-8 left-8 w-32 h-32 bg-[#B32C1A] rounded-full opacity-80" }),
                React.createElement("div", { className: "absolute top-24 right-24 w-8 h-8 bg-[#FFC7B4] rounded-full opacity-60" }),
                React.createElement("div", { className: "absolute bottom-24 right-12 w-24 h-24 bg-[#FFC7B4] rounded-full opacity-40" }),
                React.createElement("div", { className: "relative z-10 flex flex-col h-full" },
                    React.createElement("div", { className: "flex-grow flex flex-col justify-center" },
                        React.createElement("img", { src: Skeleton1_jpg_1["default"], alt: "Skeleton at laptop", className: "w-96 mx-auto mb-12" }),
                        React.createElement("h1", { className: "text-4xl font-bold text-[#4A154B] mb-4" }, "Ready to transform your life?"),
                        React.createElement("p", { className: "text-lg text-[#4A154B] mb-8" }, "Join thousands who are already managing their time better with AI"),
                        React.createElement("p", { className: "text-lg font-handwriting text-[#4A154B]" }, "Be Human, Ask AI.")))),
            React.createElement("div", { className: "w-1/2 p-12 flex flex-col justify-center" },
                React.createElement("div", { className: "max-w-md mx-auto w-full" },
                    React.createElement("div", { className: "text-center mb-8" },
                        React.createElement("div", { className: "w-8 h-8 mx-auto mb-6" },
                            React.createElement("svg", { viewBox: "0 0 24 24", className: "w-full h-full text-[#4A154B]" },
                                React.createElement("path", { d: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5", stroke: "currentColor", fill: "none", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }))),
                        React.createElement("h2", { className: "text-2xl font-semibold text-gray-900" }, "Create your Account"),
                        React.createElement("p", { className: "text-gray-600 mt-2 text-sm" }, "Start your journey to better time management")),
                    React.createElement("button", { onClick: handleGoogleSignup, className: "w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg px-4 py-2.5 mb-6 hover:bg-gray-50 transition-colors" },
                        React.createElement("img", { src: "https://www.google.com/favicon.ico", alt: "Google", className: "w-5 h-5" }),
                        React.createElement("span", { className: "text-gray-700" }, "Continue with Google")),
                    React.createElement("div", { className: "relative my-6" },
                        React.createElement("div", { className: "absolute inset-0 flex items-center" },
                            React.createElement("div", { className: "w-full border-t border-gray-200" })),
                        React.createElement("div", { className: "relative flex justify-center text-sm" },
                            React.createElement("span", { className: "px-2 bg-white text-gray-500" }, "or Sign up with Email"))),
                    React.createElement("form", { onSubmit: handleSubmit, className: "space-y-5" },
                        React.createElement("div", null,
                            React.createElement("label", { className: "block text-sm font-medium text-gray-700 mb-1" }, "Full Name"),
                            React.createElement("input", { type: "text", value: name, onChange: function (e) { return setName(e.target.value); }, className: "block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[#4A154B] focus:border-[#4A154B]", placeholder: "John Doe" })),
                        React.createElement("div", null,
                            React.createElement("label", { className: "block text-sm font-medium text-gray-700 mb-1" }, "Email"),
                            React.createElement("input", { type: "email", value: email, onChange: function (e) { return setEmail(e.target.value); }, className: "block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[#4A154B] focus:border-[#4A154B]", placeholder: "your.email@example.com" }),
                            email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (React.createElement("p", { className: "text-red-500 text-xs mt-1" }, "Invalid email format"))),
                        React.createElement("div", { className: "relative" },
                            React.createElement("label", { className: "block text-sm font-medium text-gray-700 mb-1" }, "Password"),
                            React.createElement("input", { type: "password", value: password, onChange: function (e) { return setPassword(e.target.value); }, className: "block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[#4A154B] focus:border-[#4A154B]", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" }),
                            React.createElement("div", { className: "mt-2 flex gap-1" }, [
                                password.length >= 8,
                                /[A-Z]/.test(password),
                                /[0-9]/.test(password),
                            ].map(function (valid, idx) { return (React.createElement("div", { key: idx, className: "h-1 w-1/3 rounded-full " + (valid ? 'bg-green-500' : 'bg-gray-200') })); })),
                            React.createElement("div", { className: "text-xs text-gray-500 mt-1" }, "Requirements: 8+ characters, 1 uppercase, 1 number")),
                        React.createElement("div", null,
                            React.createElement("label", { className: "block text-sm font-medium text-gray-700 mb-1" }, "Confirm Password"),
                            React.createElement("input", { type: "password", value: confirmPassword, onChange: function (e) { return setConfirmPassword(e.target.value); }, className: "block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-[#4A154B] focus:border-[#4A154B]", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" }),
                            confirmPassword && password !== confirmPassword && (React.createElement("p", { className: "text-red-500 text-xs mt-1" }, "Passwords do not match"))),
                        React.createElement("div", { className: "flex items-center" },
                            React.createElement("input", { type: "checkbox", className: "h-4 w-4 text-[#4A154B] focus:ring-[#4A154B] border-gray-300 rounded", checked: agreedToTerms, onChange: function (e) { return setAgreedToTerms(e.target.checked); } }),
                            React.createElement("label", { className: "ml-2 block text-sm text-gray-700" },
                                "I agree to the",
                                ' ',
                                React.createElement("a", { href: "#", className: "text-[#4A154B] hover:text-[#3D1D38]" }, "Terms of Service"),
                                ' ',
                                "and",
                                ' ',
                                React.createElement("a", { href: "#", className: "text-[#4A154B] hover:text-[#3D1D38]" }, "Privacy Policy"))),
                        React.createElement("button", { type: "submit", disabled: loading || !isFormValid, className: "w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#4A154B] hover:bg-[#3D1D38] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4A154B] disabled:opacity-50 disabled:cursor-not-allowed" }, loading ? 'Creating Account...' : 'Create Account'),
                        success && (React.createElement("div", { className: "mt-4 p-3 bg-green-100 text-green-800 rounded" }, "Signup successful! Redirecting to login...")),
                        error && (React.createElement("div", { className: "mt-4 p-3 bg-red-100 text-red-800 rounded" }, error))),
                    React.createElement("div", { className: "mt-8 text-center text-sm" },
                        React.createElement("span", { className: "text-gray-600" }, "Already have an account?"),
                        React.createElement("div", { className: "mt-1" },
                            React.createElement("span", { className: "text-gray-600 italic" }, "Welcome back!"),
                            ' → ',
                            React.createElement(react_router_dom_1.Link, { to: "/login", className: "font-medium text-[#4A154B] hover:text-[#3D1D38]" }, "Sign in to your account"))))))));
}
exports["default"] = SignupClassic;
