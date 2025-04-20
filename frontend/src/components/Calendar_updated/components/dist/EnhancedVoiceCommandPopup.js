"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
function EnhancedVoiceCommandPopup() {
    var _a = react_1.useState(false), isListening = _a[0], setIsListening = _a[1];
    var _b = react_1.useState(""), transcript = _b[0], setTranscript = _b[1];
    var _c = react_1.useState(""), response = _c[0], setResponse = _c[1];
    var _d = react_1.useState([]), conversationHistory = _d[0], setConversationHistory = _d[1];
    var _e = react_1.useState(0), audioLevel = _e[0], setAudioLevel = _e[1];
    var _f = react_1.useState("font-sans"), selectedFont = _f[0], setSelectedFont = _f[1];
    var _g = react_1.useState(false), showFontSelector = _g[0], setShowFontSelector = _g[1];
    // Animation related states - add proper type definition
    var _h = react_1.useState([]), particles = _h[0], setParticles = _h[1];
    var canvasRef = react_1.useRef(null);
    var animationRef = react_1.useRef(null);
    // Available fonts
    var fonts = [
        { name: "Sans", value: "font-sans" },
        { name: "Serif", value: "font-serif" },
        { name: "Mono", value: "font-mono" },
        { name: "Cursive", value: "font-['Segoe_Script','Brush_Script_MT',cursive]" },
        { name: "Fantasy", value: "font-['Papyrus','Fantasy']" }
    ];
    // Initialize particles
    react_1.useEffect(function () {
        var particleCount = 200;
        var newParticles = [];
        for (var i = 0; i < particleCount; i++) {
            newParticles.push(createParticle());
        }
        setParticles(newParticles);
    }, []);
    // Create a single particle
    var createParticle = function () {
        var angle1 = Math.random() * Math.PI * 2;
        var angle2 = Math.random() * Math.PI * 2;
        var radius = 150 + Math.random() * 50;
        return {
            x: Math.sin(angle1) * Math.cos(angle2) * radius,
            y: Math.sin(angle1) * Math.sin(angle2) * radius,
            z: Math.cos(angle1) * radius,
            size: 1 + Math.random() * 3,
            color: "hsl(" + Math.random() * 360 + ", 80%, 60%)",
            speed: 0.2 + Math.random() * 0.8,
            offset: Math.random() * Math.PI * 2
        };
    };
    // Mock speech recognition with audio level simulation
    var startListening = function () {
        setIsListening(true);
        // Simulate microphone audio levels
        var audioLevelInterval = setInterval(function () {
            // Random fluctuation between 0.2 and 1.0 when speaking
            setAudioLevel(0.2 + Math.random() * 0.8);
        }, 100);
        // Simulate voice processing
        setTimeout(function () {
            var mockQuery = "What's on my calendar for tomorrow?";
            setTranscript(mockQuery);
            // Simulate response after brief delay
            setTimeout(function () {
                var mockResponse = "You have a design review at 10:00 AM, a team lunch at noon, and a project planning session at 3:00 PM.";
                setResponse(mockResponse);
                setConversationHistory(function (prev) { return __spreadArrays(prev, [{ type: 'user', text: mockQuery },
                    { type: 'assistant', text: mockResponse }]); });
                setIsListening(false);
                clearInterval(audioLevelInterval);
                setAudioLevel(0);
                setTranscript("");
            }, 2000);
        }, 1500);
        return function () { return clearInterval(audioLevelInterval); };
    };
    var stopListening = function () {
        setIsListening(false);
        setAudioLevel(0);
    };
    // Animation rendering
    react_1.useEffect(function () {
        var canvas = canvasRef.current;
        if (!canvas)
            return;
        var ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        var width = canvas.width;
        var height = canvas.height;
        var centerX = width / 2;
        var centerY = height / 2;
        var rotation = 0;
        var animate = function () {
            ctx.clearRect(0, 0, width, height);
            rotation += 0.005;
            // Apply audio level to animation
            var intensityFactor = 1 + (audioLevel * 5);
            var pulseFactor = 1 + Math.sin(Date.now() * 0.003) * 0.2 * audioLevel;
            // Draw connecting lines first for depth
            ctx.globalAlpha = 0.1;
            for (var i = 0; i < particles.length; i++) {
                var p1 = particles[i];
                // Only connect nearby particles to reduce visual clutter
                for (var j = i + 1; j < particles.length; j++) {
                    var p2 = particles[j];
                    var dx = p1.x - p2.x;
                    var dy = p1.y - p2.y;
                    var dz = p1.z - p2.z;
                    var distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
                    if (distance < 50) {
                        var opacity = 1 - distance / 50;
                        ctx.beginPath();
                        ctx.moveTo(centerX + p1.x, centerY + p1.y);
                        ctx.lineTo(centerX + p2.x, centerY + p2.y);
                        ctx.strokeStyle = "rgba(180, 180, 255, " + opacity * 0.3 + ")";
                        ctx.stroke();
                    }
                }
            }
            // Draw particles
            ctx.globalAlpha = 1;
            particles.forEach(function (p, i) {
                // Update position with rotation and audio-reactive movement
                var time = Date.now() * 0.001;
                var wobble = Math.sin(time * p.speed + p.offset) * 10 * intensityFactor;
                // Create a spherical orbit with some randomness
                var angle1 = (time * p.speed * 0.1) + (i * 0.01);
                var angle2 = (time * p.speed * 0.2) + (i * 0.02);
                var radius = (150 + wobble) * pulseFactor;
                p.x = Math.sin(angle1) * Math.cos(angle2) * radius;
                p.y = Math.sin(angle1) * Math.sin(angle2) * radius;
                p.z = Math.cos(angle1) * radius;
                // Calculate size based on z position for perspective
                var perspective = 600;
                var scale = perspective / (perspective + p.z);
                var size = p.size * scale * intensityFactor;
                // Calculate x, y position with perspective
                var x = centerX + p.x * scale;
                var y = centerY + p.y * scale;
                // Draw the particle
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
            });
            animationRef.current = requestAnimationFrame(animate);
        };
        // Set canvas size
        var resizeCanvas = function () {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        animate();
        return function () {
            window.removeEventListener('resize', resizeCanvas);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [particles, audioLevel]);
    return (react_1["default"].createElement("div", { className: "fixed inset-0 flex items-center justify-center bg-black bg-opacity-80" },
        react_1["default"].createElement("div", { className: "bg-gray-900 text-white w-5/6 h-5/6 rounded-xl shadow-2xl overflow-hidden flex flex-col" },
            react_1["default"].createElement("div", { className: "flex justify-between items-center px-6 py-4 border-b border-gray-700" },
                react_1["default"].createElement("div", { className: "flex items-center space-x-2" },
                    react_1["default"].createElement(lucide_react_1.Volume2, { className: "text-blue-400" }),
                    react_1["default"].createElement("h2", { className: "text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent" }, "Voice Assistant")),
                react_1["default"].createElement("div", { className: "flex items-center space-x-4" },
                    react_1["default"].createElement("button", { onClick: function () { return setShowFontSelector(!showFontSelector); }, className: "text-gray-400 hover:text-white transition-colors", title: "Change Font" },
                        react_1["default"].createElement(lucide_react_1.Settings, { size: 20 })),
                    react_1["default"].createElement("button", { className: "text-gray-400 hover:text-white transition-colors" },
                        react_1["default"].createElement(lucide_react_1.X, { size: 20 })))),
            showFontSelector && (react_1["default"].createElement("div", { className: "absolute right-8 top-16 bg-gray-800 rounded-md shadow-lg p-3 z-10" },
                react_1["default"].createElement("h4", { className: "text-sm text-gray-400 mb-2" }, "Select Font"),
                react_1["default"].createElement("div", { className: "flex flex-col space-y-1" }, fonts.map(function (font) { return (react_1["default"].createElement("button", { key: font.value, className: "px-3 py-1 text-left rounded hover:bg-gray-700 " + (selectedFont === font.value ? 'bg-blue-900' : '') + " " + font.value, onClick: function () { return setSelectedFont(font.value); } }, font.name)); })))),
            react_1["default"].createElement("div", { className: "flex-grow relative" },
                react_1["default"].createElement("canvas", { ref: canvasRef, className: "absolute inset-0 w-full h-full" }),
                react_1["default"].createElement("div", { className: "absolute inset-0 flex flex-col items-center justify-center" },
                    transcript && (react_1["default"].createElement("div", { className: "mb-8 text-center text-xl text-blue-300 max-w-lg px-4 py-2 bg-gray-800 bg-opacity-70 rounded-lg " + selectedFont },
                        "\"",
                        transcript,
                        "\"")),
                    react_1["default"].createElement("button", { onClick: isListening ? stopListening : startListening, className: "rounded-full p-6 " + (isListening
                            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                            : 'bg-blue-500 hover:bg-blue-600') + " text-white transition-all shadow-lg" }, isListening ? react_1["default"].createElement(lucide_react_1.MicOff, { size: 32 }) : react_1["default"].createElement(lucide_react_1.Mic, { size: 32 })),
                    isListening && (react_1["default"].createElement("div", { className: "mt-6 w-60 h-2 bg-gray-700 rounded-full overflow-hidden" },
                        react_1["default"].createElement("div", { className: "h-full bg-gradient-to-r from-blue-400 to-purple-600 transition-all duration-100", style: { width: audioLevel * 100 + "%" } }))))),
            react_1["default"].createElement("div", { className: "h-64 border-t border-gray-700 p-4 overflow-y-auto" },
                react_1["default"].createElement("div", { className: "space-y-4 " + selectedFont }, conversationHistory.length === 0 ? (react_1["default"].createElement("div", { className: "text-center text-gray-500 py-8" }, "Start speaking to see your conversation history here")) : (conversationHistory.map(function (item, index) { return (react_1["default"].createElement("div", { key: index, className: "flex " + (item.type === 'user' ? 'justify-end' : 'justify-start') },
                    react_1["default"].createElement("div", { className: "max-w-lg px-4 py-3 rounded-lg " + (item.type === 'user'
                            ? 'bg-blue-900 text-blue-100'
                            : 'bg-gray-800 text-gray-100') }, item.text))); })))))));
}
exports["default"] = EnhancedVoiceCommandPopup;
