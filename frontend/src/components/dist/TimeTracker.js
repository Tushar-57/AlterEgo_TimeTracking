"use strict";
// import { useState, useRef, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import FocusTrap from 'focus-trap-react';
// // import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
// import { Play, Pause, RotateCcw, Expand, Volume2, Hourglass, Sun, Laptop, Moon, Brain, Sparkles, TimerIcon } from 'lucide-react';
// import { TimerPopup } from './TimerPopUp';
// import { useAuth } from '../context/AuthContext';
// import VoiceAIMode from './AIModeComponent';
// import { TimeEntry } from './TimerPopUp';
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
// type TimerMode = 'stopwatch' | 'countdown';
// type TimerStatus = 'stopped' | 'running' | 'paused';
// type PresetTime = { label: string; seconds: number };
// const presetTimes: PresetTime[] = [
//   { label: '5min', seconds: 300 },
//   { label: '10min', seconds: 600 },
//   { label: '15min', seconds: 900 },
//   { label: '25min', seconds: 1500 },
//   { label: '30min', seconds: 1800 },
//   { label: '45min', seconds: 2700 },
//   { label: '60min', seconds: 3600 },
// ];
// export default function TimeTracker() {
//   const {isAuthenticated} = useAuth();
//   const navigate = useNavigate();
//   // Core timer state
//   const [timerMode, setTimerMode] = useState<TimerMode>('stopwatch');
//   const [showPopup, setShowPopup] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [submitError, setSubmitError] = useState<string | null>(null);
//   // UI state
//   // const [productivity, setProductivity] = useState(65);
//   const [mode, setMode] = useState('balanced');
//   const [aiMode, setAiMode] = useState(false);
//   const [soundEnabled, setSoundEnabled] = useState(true);
//   // const timerRef = useRef<number>();
//   const audioRef = useRef<HTMLAudioElement>();
//   const [taskName, setTaskName] = useState('');
//   const [tags, setTags] = useState<string[]>(['Ai','Random']);
//   const [activeTimerId, setActiveTimerId] = useState<number | null>(null);
//   // New state for AI interactions
//   const [aiActivities, setAiActivities] = useState<string[]>([]);
//   const [aiStatus, setAiStatus] = useState<'idle' | 'processing' | 'success'>('idle');
//   const [timerState, setTimerState] = useState({
//     time: 0,
//     status: 'stopped' as TimerStatus,
//     mode: 'stopwatch' as TimerMode,
//     targetTime: 15000
//   });
//   //Initial Setting up for Task
//   const [currentTask, setCurrentTask] = useState({
//     description: 'Add A Task !',
//     category: 'work',
//     tags: tags,
//     billable: false,
//     projectId: null as number | null | undefined // Allow null
//   });
//   useEffect(() => {
//     if (!isAuthenticated) {
//       navigate('/login', { replace: true });
//     }
//   }, [isAuthenticated]);
//   useEffect(() => {
//     // Save state on change
//     localStorage.setItem('timerState', JSON.stringify(timerState));
//   }, [timerState]);
//   // Initialize audio
//   useEffect(() => {
//     audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
//   }, []);
//   const handleTimerComplete = () => {
//     setTimerState(prev => ({
//       ...prev,
//       status: 'stopped'
//     }));
//     if (soundEnabled) audioRef.current?.play();
//   };
//   // Timer logic
//   useEffect(() => {
//     let interval: number;
//     if (timerState.status === 'running') {
//       interval = window.setInterval(() => {
//         setTimerState(prev => {
//           const newTime = timerMode === 'countdown' 
//             ? Math.max(prev.time - 1, 0)
//             : prev.time + 1;
//           if (timerMode === 'countdown' && newTime <= 0) {
//             handleTimerComplete();
//           }
//           return { ...prev, time: newTime };
//         });
//       }, 1000);
//     }
//     return () => window.clearInterval(interval);
//   }, [timerState.status, timerMode, handleTimerComplete]);
//   // Keyboard shortcuts + Escape to close popup
//   useEffect(() => {
//     const handler = (e: globalThis.KeyboardEvent) => {
//       if (showPopup) {
//         if (e.key === 'Escape') {
//           setShowPopup(false);
//         }
//         return;
//       }
//       if (e.code === 'Space') {
//         e.preventDefault();
//         toggleTimer();
//       } else if (e.code === 'KeyR' && (e.ctrlKey || e.metaKey)) {
//         e.preventDefault();
//         resetTimer();
//       }
//     };
//     window.addEventListener('keydown', handler);
//     return () => window.removeEventListener('keydown', handler);
//   }, [status, showPopup]);
//   const formatTime = (seconds: number): string => {
//     const h = Math.floor(seconds / 3600);
//     const m = Math.floor((seconds % 3600) / 60);
//     const s = seconds % 60;
//     return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
//   };
//   const toggleTimer = () => {
//     setTimerState(prev => {
//       // Reset countdown to targetTime if starting from stopped/paused
//       if (prev.status === 'stopped' && timerMode === 'countdown') {
//         return { 
//           ...prev, 
//           status: 'running',
//           time: prev.targetTime // Reset to target time
//         };
//       }
//       return {
//         ...prev,
//         status: prev.status === 'running' ? 'paused' : 'running'
//       };
//     });
//   };
//   const resetTimer = () => {
//     setTimerState(prev => ({
//       ...prev,
//       time: timerMode === 'countdown' ? prev.targetTime : 0,
//       status: 'stopped'
//     }));
//   };
//   const handlePresetClick = (preset: PresetTime) => {
//     setTimerState(prev => ({
//       ...prev,
//       targetTime: preset.seconds,
//       time: timerMode === 'countdown' ? preset.seconds : prev.time
//     }));
//   };
//   const handleSaveEntry = async (entryData: TimeEntry) => {
//     try {
//       const token = localStorage.getItem('jwtToken');
//       if (!token) throw new Error('No authentication token');
//       const res = await fetch('/api/time-entries', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`
//         },
//         body: JSON.stringify(entryData)
//       });
//       if (!res.ok) throw new Error('Save failed');
//       const result = await res.json();
//       if (result.id) setActiveTimerId(result.id);
//       // Reset timer state
//       setTimerState({
//         time: 0,
//         status: 'stopped',
//         mode: 'stopwatch',
//         targetTime: 1500
//       });
//       setShowPopup(false);
//     } catch (e) {
//       if (e instanceof Error && e.message.includes('401')) {
//         // localStorage.removeItem('jwtToken');
//         navigate('/login', { replace: true });
//       }
//     } finally {
//       setIsSubmitting(false);
//     }
//   };
//   useEffect(() => {
//     if (timerState.status === 'running') {
//       const interval = setInterval(() => {
//         setTimerState(prev => ({
//           ...prev,
//           time: timerMode === 'countdown' 
//             ? Math.max(prev.time - 1, 0)
//             : prev.time + 1
//         }));
//       }, 1000);
//       return () => clearInterval(interval);
//     }
//   }, [timerState.status, timerMode]);
//   // Persist timer state
//   useEffect(() => {
//     if (timerState.status === 'running') {
//       localStorage.setItem('timerState', JSON.stringify(timerState));
//     }
//   }, [timerState]);
//   // Keyboard shortcuts update
//   useEffect(() => {
//     const handleKeyPress = (e: globalThis.KeyboardEvent) => {
//       if (e.code === 'Space') {
//         e.preventDefault();
//         toggleTimer();
//       }
//     };
//     window.addEventListener('keydown', handleKeyPress);
//     return () => window.removeEventListener('keydown', handleKeyPress);
//   }, [toggleTimer]);
//   // Add active timer check
//   useEffect(() => {
//     const checkActiveTimer = async () => {
//       try {
//         const token = localStorage.getItem('jwtToken');
//         if (!token) {
//           return;
//         }
//         const resp = await fetch('http://localhost:8080/api/timers/active', {
//           headers: {
//             'Authorization': `Bearer ${localStorage.getItem('jwtToken')}` // Add auth header
//           }
//         });
//         if (resp.status === 404) {
//           setActiveTimerId(null); // Handle no active timer
//           return;
//         }
//         if (!resp.ok) {
//           const errorText = await resp.text();
//           throw new Error(`HTTP ${resp.status}: ${errorText}`);
//         }
//         if (resp.status === 401) {
//           // localStorage.removeItem('jwtToken');
//           navigate('/login', { replace: true }); // Use navigate instead of reload
//           return;
//         }
//         const contentType = resp.headers.get('content-type');
//         if (contentType?.includes('application/json')) {
//           const data = await resp.json();
//           setActiveTimerId(data);
//         }
//         if (resp.ok) {
//           const data = await resp.json();
//           setActiveTimerId(data.id);
//           setTimerState(prev => ({
//             ...prev,
//             status: 'running',
//             time: Math.floor(
//               (Date.now() - new Date(data.startTime).getTime()) / 1000
//             )
//           }));
//         }
//       } catch (error) {
//         console.error('Error checking active timer:', error);
//         // localStorage.removeItem('jwtToken');
//         // navigate('/login', { replace: true });
//       }
//     };
//     if (isAuthenticated) { // Only check if authenticated
//       checkActiveTimer();
//     }
//   }, [isAuthenticated, navigate]);
//   return (
//     <div className="min-h-screen transition-all duration-500 ${aiMode ? 'bg-gradient-to-br from-gray-50 to-gray-100' : 'luxury-gradient'}">
//       <div className="max-w-7xl mx-auto p-8 md:p-6 lg:p-8">
//         <div className="grid grid-cols-3 gap-8 lg:grid-cols-5 gap-6">
//           {/* Timer Section */}
//           <div className="lg:col-span-3">
//             <div className="glass-morphism rounded-2xl p-6 space-y-6">
//               {/* Global Expand Button with Status Indicator */}
//               <button
//                 aria-label={timerState.status === 'running' ? 'Pause timer' : 'Start timer'}
//                 onClick={() => setShowPopup(true)}
//                 className="fixed bottom-8 right-8 p-4 bg-black text-white rounded-full shadow-xl hover:scale-105 transition-transform"
//               >
//                 <Expand className="w-6 h-6" />
//                 <span className={`absolute top-1 right-1 w-2 h-2 rounded-full animate-pulse ${
//                   timerState.status === 'running' ? 'bg-green-400' : 
//                   timerState.status === 'paused' ? 'bg-yellow-400' : 'bg-gray-400'
//                 }`}
//                 />
//               </button>
//               {/* Timer Display */}
//               <div className="text-center space-y-6">
//                 <div className="flex items-center justify-between mb-4">
//                   <div className="timer-header">
//                     <span className="task-name">{taskName || 'No task'}</span>
//                     <button onClick={() => setShowPopup(true)}>✏️</button>
//                   </div>
//                   {/* <div className="flex items-center space-x-2">
//                     <Clock className="w-6 h-6 text-gray-600" aria-hidden="true" />
//                     <h2 className="text-xl font-medium text-gray-700">Timer</h2>
//                   </div> */}
//                   <div className="flex items-center space-x-4">
//                     <button
//                       onClick={() => setSoundEnabled(!soundEnabled)}
//                       aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
//                       className="p-2 rounded-lg transition-colors"
//                     >
//                       <Volume2 className="w-5 h-5" />
//                     </button>
//                     <button
//                       onClick={() => setTimerMode(timerMode === 'stopwatch' ? 'countdown' : 'stopwatch')}
//                       aria-label="Toggle timer mode"
//                       className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 text-sm font-medium text-gray-700"
//                     >
//                       {timerMode === 'stopwatch' ? <TimerIcon className="w-4 h-4" /> : <Hourglass className="w-4 h-4" />}
//                       <span>{timerMode === 'stopwatch' ? 'Stopwatch' : 'Countdown'}</span>
//                     </button>
//                   </div>
//                 </div>
//                 <div className="relative">
//                   <div className={`text-7xl font-light tabular-nums transition-all duration-300 ${
//                     timerState.status === 'running' ? 'text-gray-800 scale-105' : 'text-gray-600'
//                   }`}> 
//                     {formatTime(timerState.time)}
//                   </div>
//                   {timerMode === 'countdown' && timerState.status !== 'running' && (
//                     <div className="absolute -bottom-6 left-0 right-0 text-sm text-gray-500">
//                       Target: {formatTime(timerState.targetTime)}
//                     </div>
//                   )}
//                 </div>
//                 {/* Timer Controls */}
//                 <div className="flex items-center justify-center space-x-4">
//                   <button
//                     onClick={resetTimer}
//                     aria-label="Reset timer"
//                     className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
//                   >
//                     <RotateCcw className="w-5 h-5" />
//                   </button>
//                   <button
//                     onClick={toggleTimer}
//                     aria-label={timerState.status === 'running' ? 'Pause timer' : 'Start timer'}
//                     className={`p-6 rounded-full transition-all ${
//                       timerState.status === 'running' 
//                         ? 'bg-gray-200 text-gray-700' 
//                         : 'bg-black text-white hover:bg-gray-800'
//                     }`}
//                   >
//                     {timerState.status === 'running' ? (
//                       <Pause className="w-6 h-6" />
//                     ) : (
//                       <Play className="w-6 h-6" />
//                     )}
//                   </button>
//                 </div>
//                 {/* Preset Times */}
//                 {timerMode === 'countdown' && (
//                   <div className="flex flex-wrap justify-center gap-2 mt-6">
//                     {presetTimes.map(p => (
//                       <button
//                         key={p.seconds}
//                         onClick={() => handlePresetClick(p)}
//                         aria-label={`Set timer to ${p.label}`}
//                         className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
//                       >
//                         {p.label}
//                       </button>
//                     ))}
//                   </div>
//                 )}
//                 {/* Progress Bar */}
//                 {timerMode === 'countdown' && (
//                   <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
//                     <div
//                       className="h-full bg-black transition-all duration-300"
//                       style={{ width: `${(timerState.time / timerState.targetTime) * 100}%` }}
//                     />
//                   </div>
//                 )}
//               </div>
//             </div>
//             {showPopup && (
//                   <FocusTrap focusTrapOptions={{ clickOutsideDeactivates: true }}>
//                     <div onKeyDown={e => e.stopPropagation()} tabIndex={0}>
//                       <TimerPopup
//                         status={timerState.status}
//                         // Update type annotations for setters
//                         setTaskDescription={(val: string) => setCurrentTask(prev => ({...prev, description: val}))}
//                         setCategory={(val: string) => setCurrentTask(prev => ({...prev, category: val}))}
//                         setTags={(val: string[]) => setCurrentTask(prev => ({...prev, tags: val}))}
//                         setIsBillable={(val: boolean) => setCurrentTask(prev => ({...prev, billable: val}))}
//                         // setSelectedProjectId={(val: number | null) => setCurrentTask(prev => ({...prev, projectId: val}))}
//                         setSelectedProjectId={(val: number | undefined) => 
//                           setCurrentTask(prev => ({...prev, projectId: val}))
//                         }
//                         taskDescription={currentTask.description}
//                         // setTaskDescription={(val) => setCurrentTask(prev => ({...prev, description: val}))}
//                         category={currentTask.category}
//                         // setCategory={(val) => setCurrentTask(prev => ({...prev, category: val}))}
//                         tags={currentTask.tags}
//                         // setTags={(val) => setCurrentTask(prev => ({...prev, tags: val}))}
//                         isBillable={currentTask.billable}
//                         // setIsBillable={(val) => setCurrentTask(prev => ({...prev, billable: val}))}
//                         selectedProjectId={undefined}
//                         // setSelectedProjectId={(val) => setCurrentTask(prev => ({...prev, projectId: val}))}
//                         time={timerState.time}
//                         taskName={taskName}
//                         setTaskName={setTaskName}
//                         timerState={timerState}
//                         setTimerState={setTimerState}
//                         soundEnabled={soundEnabled}
//                         aiMode={aiMode}
//                         timerMode={timerMode}
//                         presetTimes={presetTimes}
//                         formatTime={formatTime}
//                         toggleTimer={toggleTimer}
//                         resetTimer={resetTimer}
//                         handlePresetClick={handlePresetClick}
//                         setSoundEnabled={setSoundEnabled}
//                         setAiMode={setAiMode}
//                         onClose={() => setShowPopup(false)}
//                         onSave={handleSaveEntry}
//                         isSubmitting={isSubmitting}
//                         submitError={submitError} />
//                     </div>
//                   </FocusTrap>
//                 )}
//             {/* Mode Selection */}
//             <div className="glass-morphism rounded-2xl p-6 mt-6">
//               <h2 className="text-lg font-medium text-gray-700 mb-4">Mode</h2>
//               <div className="grid grid-cols-3 gap-4">
//                 {[
//                   { icon: Sun, label: 'Focus', value: 'focus' },
//                   { icon: Laptop, label: 'Balanced', value: 'balanced' },
//                   { icon: Moon, label: 'Relax', value: 'relax' }
//                 ].map(({ icon: Icon, label, value }) => (
//                   <button
//                     key={value}
//                     onClick={() => setMode(value)}
//                     aria-label={`Set mode to ${label}`}
//                     className={`p-4 rounded-xl flex flex-col items-center space-y-2 transition-all ${mode === value ? 'bg-black text-white' : 'bg-white/50 hover:bg-white/80'}`}
//                   >
//                     <Icon className="w-6 h-6" />
//                     <span className="text-sm font-medium">{label}</span>
//                   </button>
//                 ))}
//               </div>
//             </div>
//           </div>
//           {/* Sidebar */}
//           <div className="lg:col-span-2 flex flex-col gap-6">
//             {/* AI Assistant Toggle */}
//             <div className="glass-morphism rounded-2xl p-6 h-fit">
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center space-x-3">
//                   <Brain className="w-6 h-6 text-gray-600" aria-hidden="true" />
//                   <div>
//                     <h3 className="font-medium text-gray-700">AI Assistant</h3>
//                     <p className="text-sm text-gray-500">Get intelligent suggestions</p>
//                   </div>
//                 </div>
//                 <button
//                   onClick={() => setAiMode(!aiMode)}
//                   aria-label="Toggle AI assistant"
//                   className={`w-12 h-6 rounded-full transition-all flex items-center ${aiMode ? 'bg-black justify-end' : 'bg-gray-200 justify-start'}`}
//                 >
//                   <div className="w-5 h-5 rounded-full bg-white shadow-sm transform translate-x-0.5"></div>
//                 </button>
//               </div>
//             </div>
//             {/* Add Voice AI Mode Section */}
//             <div className="glass-morphism rounded-2xl p-6 flex-1 flex flex-col min-h-[500px]">
//               <VoiceAIMode 
//                 onProcessingStart={() => setAiStatus('processing')}
//                 onProcessingEnd={(success) => setAiStatus(success ? 'success' : 'idle')}
//                 onActivityLog={(transcript: string) =>  // Add type annotation
//                   setAiActivities((prev: string[]) => [transcript, ...prev.slice(0, 5)])
//                 }
//                 className="mb-6"
//               />
//               {/* AI Activity Feed */}
//               <div className="border-t pt-4 flex-1">
//                 <h4 className="text-sm font-medium text-gray-600 mb-2">Recent Activities</h4>
//                 <div className="space-y-2 max-h-[200px] overflow-y-auto">
//                   {aiActivities.map((activity, i) => (
//                     <div key={i} className="flex items-start gap-2 text-sm p-2 bg-gray-50 rounded-lg">
//                       <span className="text-gray-400">⌘</span>
//                       {activity}
//                     </div>
//                   ))}
//                   {aiActivities.length === 0 && (
//                     <p className="text-gray-400 text-sm">No activities yet. Try giving a voice command!</p>
//                   )}
//                 </div>
//               </div>
//             </div>
//             {/* Productivity Meter
//             <div className="glass-morphism rounded-2xl p-6">
//               <div className="flex items-center justify-between mb-4">
//                 <div className="flex items-center space-x-2">
//                   <Sparkles className="w-5 h-5 text-gray-600" aria-hidden="true" />
//                   <h3 className="font-medium text-gray-700">Productivity</h3>
//                 </div>
//                 <span className="text-sm text-gray-500">{productivity.toFixed(1)}%</span>
//               </div>
//               <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
//                 <div className="h-full bg-black transition-all duration-300" style={{ width: `${productivity}%` }} />
//               </div>
//             </div> */}
//             {/* Calendar Integration */}
//             <div className="glass-morphism rounded-2xl p-6 flex-1">
//               {/* { CalendarOverlay placeholder } */}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
// // export default TimeTracker;
// // ---------------------------
// //       VERSION 2 ABOVE
// // 
// --------------------------------------------------------__VER BELOW
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var lucide_react_1 = require("lucide-react");
var AuthContext_1 = require("../context/AuthContext");
var presetTimes = [
    { label: '5min', seconds: 300 },
    { label: '10min', seconds: 600 },
    { label: '15min', seconds: 900 },
    { label: '25min', seconds: 1500 },
    { label: '30min', seconds: 1800 },
    { label: '45min', seconds: 2700 },
    { label: '60min', seconds: 3600 },
];
function TimeTracker() {
    var _this = this;
    var isAuthenticated = AuthContext_1.useAuth().isAuthenticated;
    var navigate = react_router_dom_1.useNavigate();
    // Timer state
    var _a = react_1.useState('stopwatch'), timerMode = _a[0], setTimerMode = _a[1];
    var _b = react_1.useState({
        time: 0,
        status: 'stopped',
        targetTime: 1500
    }), timerState = _b[0], setTimerState = _b[1];
    // Task details state
    var _c = react_1.useState({
        description: '',
        project: '',
        tags: [],
        billable: false,
        newTag: ''
    }), currentTask = _c[0], setCurrentTask = _c[1];
    // Refs and audio
    var intervalRef = react_1.useRef();
    var audioRef = react_1.useRef();
    react_1.useEffect(function () {
        if (!isAuthenticated)
            navigate('/login', { replace: true });
    }, [isAuthenticated]);
    // Timer core logic
    react_1.useEffect(function () {
        if (timerState.status === 'running') {
            intervalRef.current = window.setInterval(function () {
                setTimerState(function (prev) { return (__assign(__assign({}, prev), { time: timerMode === 'countdown'
                        ? Math.max(prev.time - 1, 0)
                        : prev.time + 1 })); });
            }, 1000);
        }
        return function () { return window.clearInterval(intervalRef.current); };
    }, [timerState.status, timerMode]);
    // NLP parsing
    // const parseNlpInput = (text: string) => {
    //   const results = chrono.parse(text);
    //   const parsed = results[0]?.start.date();
    //   const duration = results[0]?.end?.date().getTime() - results[0]?.start.date().getTime();
    //   // Extract project/tags using regex
    //   const projectMatch = text.match(/@(\w+)/);
    //   const tagMatches = text.match(/#(\w+)/g);
    //   setCurrentTask(prev => ({
    //     ...prev,
    //     description: text.replace(/@\w+|#\w+/g, '').trim(),
    //     project: projectMatch?.[1] || prev.project,
    //     tags: tagMatches?.map(t => t.replace('#', '')) || prev.tags
    //   }));
    //   if (duration) {
    //     setTimerState(prev => ({
    //       ...prev,
    //       targetTime: Math.floor(duration/1000),
    //       time: timerMode === 'countdown' ? Math.floor(duration/1000) : prev.time
    //     }));
    //   }
    // };
    // Timer controls
    var toggleTimer = function () {
        setTimerState(function (prev) {
            if (prev.status === 'stopped' && timerMode === 'countdown') {
                return __assign(__assign({}, prev), { status: 'running', time: prev.targetTime });
            }
            return __assign(__assign({}, prev), { status: prev.status === 'running' ? 'paused' : 'running' });
        });
    };
    var resetTimer = function () {
        setTimerState(function (prev) { return (__assign(__assign({}, prev), { time: timerMode === 'countdown' ? prev.targetTime : 0, status: 'stopped' })); });
    };
    // Task detail handlers
    var handleAddTag = function () {
        if (currentTask.newTag.trim()) {
            setCurrentTask(function (prev) { return (__assign(__assign({}, prev), { tags: __spreadArrays(prev.tags, [prev.newTag.trim()]), newTag: '' })); });
        }
    };
    // Time formatting
    var formatTime = function (seconds) {
        var h = Math.floor(seconds / 3600);
        var m = Math.floor((seconds % 3600) / 60);
        var s = seconds % 60;
        return h.toString().padStart(2, '0') + ":" + m.toString().padStart(2, '0') + ":" + s.toString().padStart(2, '0');
    };
    // Save entry handler
    var handleSaveEntry = function () { return __awaiter(_this, void 0, void 0, function () {
        var res, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fetch('/api/time-entries', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: "Bearer " + localStorage.getItem('jwtToken')
                            },
                            body: JSON.stringify(__assign(__assign({}, currentTask), { duration: timerState.time, startTime: new Date().toISOString() }))
                        })];
                case 1:
                    res = _a.sent();
                    if (!res.ok)
                        throw new Error('Save failed');
                    resetTimer();
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error('Save error:', error_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    return (React.createElement("div", { className: "min-h-screen bg-gray-50 p-8" },
        React.createElement("div", { className: "max-w-4xl mx-auto space-y-6" },
            React.createElement("div", { className: "bg-white rounded-2xl p-6 shadow-sm" },
                React.createElement("div", { className: "mb-6" },
                    React.createElement("input", { type: "text", placeholder: "e.g. 'Client meeting @ProjectX #urgent for 1h'", className: "w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent", value: currentTask.description, onChange: function (e) {
                            setCurrentTask(function (prev) { return (__assign(__assign({}, prev), { description: e.target.value })); });
                            // parseNlpInput(e.target.value);
                        } })),
                React.createElement("div", { className: "flex gap-4 mb-6" },
                    React.createElement("div", { className: "flex-1" },
                        React.createElement("label", { className: "block text-sm font-medium mb-2 flex items-center gap-2" },
                            React.createElement(lucide_react_1.Briefcase, { size: 16 }),
                            " Project"),
                        React.createElement("input", { type: "text", className: "w-full px-3 py-2 border rounded-lg", value: currentTask.project, onChange: function (e) { return setCurrentTask(function (prev) { return (__assign(__assign({}, prev), { project: e.target.value })); }); } })),
                    React.createElement("div", { className: "flex-1" },
                        React.createElement("label", { className: "block text-sm font-medium mb-2 flex items-center gap-2" },
                            React.createElement(lucide_react_1.Tag, { size: 16 }),
                            " Tags"),
                        React.createElement("div", { className: "flex gap-2" },
                            React.createElement("input", { type: "text", className: "flex-1 px-3 py-2 border rounded-lg", value: currentTask.newTag, onChange: function (e) { return setCurrentTask(function (prev) { return (__assign(__assign({}, prev), { newTag: e.target.value })); }); }, placeholder: "Add tag" }),
                            React.createElement("button", { onClick: handleAddTag, className: "px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600" }, "Add")),
                        React.createElement("div", { className: "flex flex-wrap gap-2 mt-2" }, currentTask.tags.map(function (tag) { return (React.createElement("span", { key: tag, className: "bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm" }, tag)); })))),
                React.createElement("div", { className: "flex items-center gap-2 mb-6" },
                    React.createElement(lucide_react_1.DollarSign, { size: 16 }),
                    React.createElement("label", { className: "flex items-center gap-2" },
                        React.createElement("input", { type: "checkbox", checked: currentTask.billable, onChange: function (e) { return setCurrentTask(function (prev) { return (__assign(__assign({}, prev), { billable: e.target.checked })); }); }, className: "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" }),
                        "Billable")),
                React.createElement("div", { className: "text-center mb-6" },
                    React.createElement("div", { className: "text-6xl font-mono font-light mb-4" }, formatTime(timerState.time)),
                    React.createElement("div", { className: "flex items-center justify-center gap-4" },
                        React.createElement("button", { onClick: resetTimer, className: "p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors" },
                            React.createElement(lucide_react_1.RotateCcw, { size: 24 })),
                        React.createElement("button", { onClick: toggleTimer, className: "p-6 rounded-full text-white " + (timerState.status === 'running'
                                ? 'bg-red-500 hover:bg-red-600'
                                : 'bg-green-500 hover:bg-green-600') }, timerState.status === 'running' ? React.createElement(lucide_react_1.Pause, { size: 32 }) : React.createElement(lucide_react_1.Play, { size: 32 })))),
                React.createElement("div", { className: "flex justify-center gap-2" }, presetTimes.map(function (preset) { return (React.createElement("button", { key: preset.seconds, onClick: function () { return setTimerState(function (prev) { return (__assign(__assign({}, prev), { targetTime: preset.seconds, time: timerMode === 'countdown' ? preset.seconds : prev.time })); }); }, className: "px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg" }, preset.label)); }))),
            React.createElement("button", { onClick: handleSaveEntry, className: "w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors" }, "Save Time Entry"))));
}
exports["default"] = TimeTracker;
