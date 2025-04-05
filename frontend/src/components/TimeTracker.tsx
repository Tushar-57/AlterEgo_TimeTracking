// import { useState, useRef, useEffect } from 'react';
// import {Play,Pause,RotateCcw,Timer as TimerIcon, X, Clock, Volume2, Hourglass, Sun, Laptop, Moon, Brain, Sparkles, Expand} from 'lucide-react';
// import { TimerPopup } from './TimerPopUp';

// type TimerMode = 'stopwatch' | 'countdown';
// type TimerStatus = 'stopped' | 'running' | 'paused';
// type PresetTime = { label: string; seconds: number };
// // const [taskDescription, setTaskDescription] = useState('');
// // const [category, setCategory] = useState('work');

// const presetTimes: PresetTime[] = [
//   { label: '5min', seconds: 300 },
//   { label: '10min', seconds: 600 },
//   { label: '15min', seconds: 900 },
//   { label: '25min', seconds: 1500 },
//   { label: '30min', seconds: 1800 },
//   { label: '45min', seconds: 2700 },
//   { label: '60min', seconds: 3600 },
// ];

// // V1 
// function TimeTracker() {
//   // Core timer state
//   const [timerMode, setTimerMode] = useState<TimerMode>('stopwatch');
//   const [status, setStatus] = useState<TimerStatus>('stopped');
//   const [time, setTime] = useState(0);
//   const [targetTime, setTargetTime] = useState(1500); // 25 minutes default
//   const [showPopup, setShowPopup] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [submitError, setSubmitError] = useState<string | null>(null);


//   // UI state
//   const [productivity, setProductivity] = useState(65);
//   const [mode, setMode] = useState('balanced');
//   const [aiMode, setAiMode] = useState(false);
//   const [showHistory, setShowHistory] = useState(false);
//   const [soundEnabled, setSoundEnabled] = useState(true);
  
//   // Refs
//   const timerRef = useRef<number>();
//   const audioRef = useRef<HTMLAudioElement>();

//   // Initialize audio
//   useEffect(() => {
//     audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
//   }, []);

//   // Timer logic
//   useEffect(() => {
//     if (status === 'running') {
//       timerRef.current = window.setInterval(() => {
//         setTime(prevTime => {
//           if (timerMode === 'countdown') {
//             const newTime = prevTime - 1;
//             if (newTime <= 0) {
//               handleTimerComplete();
//               return 0;
//             }
//             return newTime;
//           }
//           return prevTime + 1;
//         });
//       }, 1000);
//     }

//     return () => {
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//       }
//     };
//   }, [status, timerMode]);

//   // Keyboard shortcuts
//   useEffect(() => {
//     const handleKeyPress = (e: KeyboardEvent) => {
//       if (e.code === 'Space') {
//         e.preventDefault();
//         toggleTimer();
//       } else if (e.code === 'KeyR' && (e.ctrlKey || e.metaKey)) {
//         e.preventDefault();
//         resetTimer();
//       }
//     };

//     window.addEventListener('keydown', handleKeyPress);
//     return () => window.removeEventListener('keydown', handleKeyPress);
//   }, [status]);

//   // Productivity simulation
//   useEffect(() => {
//     const interval = setInterval(() => {
//       setProductivity(prev => {
//         const change = Math.random() * 10 - 5;
//         return Math.min(Math.max(prev + change, 0), 100);
//       });
//     }, 3000);
//     return () => clearInterval(interval);
//   }, []);

//   const formatTime = (seconds: number): string => {
//     const h = Math.floor(seconds / 3600);
//     const m = Math.floor((seconds % 3600) / 60);
//     const s = seconds % 60;
//     return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
//   };

//   const handleTimerComplete = () => {
//     setStatus('stopped');
//     if (soundEnabled && audioRef.current) {
//       audioRef.current.play();
//     }
//   };

//   const toggleTimer = () => {
//     if (status === 'stopped' || status === 'paused') {
//       if (timerMode === 'countdown' && time === 0) {
//         setTime(targetTime);
//       }
//       setStatus('running');
//     } else {
//       setStatus('paused');
//     }
//   };

//   const resetTimer = () => {
//     setStatus('stopped');
//     setTime(0);
//   };

//   const handlePresetClick = (preset: PresetTime) => {
//     setTargetTime(preset.seconds);
//     if (timerMode === 'countdown') {
//       setTime(preset.seconds);
//     }
//   };

//   const handleSaveEntry = async (entry: {
//     taskDescription: string;
//     category: string;
//     startTime: Date;
//     endTime: Date;
//     duration: number;
//   }) => {
//     setIsSubmitting(true);
//     setSubmitError(null);
    
//     try {
//       const response = await fetch('/api/time-entries', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${localStorage.getItem('token')}`
//         },
//         body: JSON.stringify({
//           taskDescription: entry.taskDescription,
//           category: entry.category,
//           startTime: entry.startTime.toISOString(),
//           endTime: entry.endTime.toISOString(),
//           duration: entry.duration
//         })
//       });
  
//       if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
//       setShowPopup(false);  // Only keep this valid state update
  
//     } catch (error) {
//       console.error('Submission failed:', error);
//       setSubmitError(error instanceof Error ? error.message : 'Failed to save time entry');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };  

//   return (
//     <div className={`min-h-screen transition-all duration-500 ${
//       aiMode ? 'bg-gradient-to-br from-gray-50 to-gray-100' : 'luxury-gradient'
//     }`}>
//       <div className="max-w-4xl mx-auto p-8">
//         <div className="grid grid-cols-3 gap-8">
//           {/* Timer Section */}
//           <div className="col-span-3 lg:col-span-2">
//             <div className="glass-morphism rounded-2xl p-8 space-y-8">
//               {/* Timer Display */}
//               <button
//                 onClick={() => setShowPopup(true)}
//                 className="fixed bottom-8 right-8 p-4 rounded-full bg-black text-white shadow-xl hover:scale-105 transition-all z-40"
//               >
//                 <Expand className="w-6 h-6" />
//               </button>
//               <div className="text-center space-y-6">
//                 <div className="flex items-center justify-between mb-4">
//                   <div className="flex items-center space-x-2">
//                     <Clock className="w-6 h-6 text-gray-600" />
//                     <h2 className="text-xl font-medium text-gray-700">Timer</h2>
//                   </div>
//                   <div className="flex items-center space-x-4">
//                     <button
//                       onClick={() => setSoundEnabled(!soundEnabled)}
//                       className={`p-2 rounded-lg transition-colors ${
//                         soundEnabled ? 'text-gray-700' : 'text-gray-400'
//                       }`}
//                     >
//                       <Volume2 className="w-5 h-5" />
//                     </button>
//                     <button
//                       onClick={() => setTimerMode(timerMode === 'stopwatch' ? 'countdown' : 'stopwatch')}
//                       className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 text-sm font-medium text-gray-700"
//                     >
//                       {timerMode === 'stopwatch' ? <TimerIcon className="w-4 h-4" /> : <Hourglass className="w-4 h-4" />}
//                       <span>{timerMode === 'stopwatch' ? 'Stopwatch' : 'Countdown'}</span>
//                     </button>
//                   </div>
//                 </div>

//                 <div className="relative">
//                   <div className={`text-7xl font-light tabular-nums transition-all duration-300 ${
//                     status === 'running' ? 'text-gray-800 scale-105' : 'text-gray-600'
//                   }`}>
//                     {formatTime(time)}
//                   </div>
//                   {timerMode === 'countdown' && status !== 'running' && (
//                     <div className="absolute -bottom-6 left-0 right-0 text-sm text-gray-500">
//                       Target: {formatTime(targetTime)}
//                     </div>
//                   )}
//                 </div>

//                 {/* Timer Controls */}
//                 <div className="flex items-center justify-center space-x-4">
//                   <button
//                     onClick={resetTimer}
//                     className="p-3 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
//                   >
//                     <RotateCcw className="w-5 h-5" />
//                   </button>
//                   <button
//                     onClick={toggleTimer}
//                     className={`p-6 rounded-full transition-all ${
//                       status === 'running'
//                         ? 'bg-gray-200 text-gray-700'
//                         : 'bg-black text-white hover:bg-gray-800'
//                     }`}
//                   >
//                     {status === 'running' ? (
//                       <Pause className="w-6 h-6" />
//                     ) : (
//                       <Play className="w-6 h-6" />
//                     )}
//                   </button>
//                 </div>

//                 {/* Preset Times */}
//                 {timerMode === 'countdown' && (
//                   <div className="flex flex-wrap justify-center gap-2 mt-6">
//                     {presetTimes.map(preset => (
//                       <button
//                         key={preset.seconds}
//                         onClick={() => handlePresetClick(preset)}
//                         className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
//                       >
//                         {preset.label}
//                       </button>
//                     ))}
//                   </div>
//                 )}

//                 {/* Progress Bar */}
//                 {timerMode === 'countdown' && (
//                   <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
//                     <div
//                       className="h-full bg-black transition-all duration-300"
//                       style={{
//                         width: `${(time / targetTime) * 100}%`,
//                       }}
//                     />
//                   </div>
//                 )}
//               </div>
//             </div>

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
//                     className={`p-4 rounded-xl flex flex-col items-center space-y-2 transition-all ${
//                       mode === value 
//                         ? 'bg-black text-white' 
//                         : 'bg-white/50 hover:bg-white/80'
//                     }`}
//                   >
//                     <Icon className="w-6 h-6" />
//                     <span className="text-sm font-medium">{label}</span>
//                   </button>
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* Right Sidebar */}
//           <div className="col-span-3 lg:col-span-1 space-y-6">
//             {/* AI Assistant Toggle */}
//             <div className="glass-morphism rounded-2xl p-6">
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center space-x-3">
//                   <Brain className="w-6 h-6 text-gray-600" />
//                   <div>
//                     <h3 className="font-medium text-gray-700">AI Assistant</h3>
//                     <p className="text-sm text-gray-500">Get intelligent suggestions</p>
//                   </div>
//                 </div>
//                 <button
//                   onClick={() => setAiMode(!aiMode)}
//                   className={`w-12 h-6 rounded-full transition-all flex items-center ${
//                     aiMode ? 'bg-black justify-end' : 'bg-gray-200 justify-start'
//                   }`}
//                 >
//                   <div className="w-5 h-5 rounded-full bg-white shadow-sm transform translate-x-0.5"></div>
//                 </button>
//               </div>
//             </div>

//             {/* Productivity Meter */}
//             <div className="glass-morphism rounded-2xl p-6">
//               <div className="flex items-center justify-between mb-4">
//                 <div className="flex items-center space-x-2">
//                   <Sparkles className="w-5 h-5 text-gray-600" />
//                   <h3 className="font-medium text-gray-700">Productivity</h3>
//                 </div>
//                 <span className="text-sm text-gray-500">{productivity.toFixed(1)}%</span>
//               </div>
//               <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
//                 <div 
//                   className="h-full bg-black transition-all duration-300"
//                   style={{ width: `${productivity}%` }}
//                 />
//               </div>
//             </div>

//             {/* Calendar Integration */}
//             <div className="glass-morphism rounded-2xl p-6">
//               {/* <CalendarOverlay /> */}
//             </div>
//           </div>
//         </div>
//       </div>
//       {showPopup && (
//         <TimerPopup
//           isSubmitting={isSubmitting}
//           submitError={submitError}
//           // Keep existing props
//           time={time}
//           status={status}
//           soundEnabled={soundEnabled}
//           aiMode={aiMode}
//           timerMode={timerMode}
//           presetTimes={presetTimes}
//           formatTime={formatTime}
//           toggleTimer={toggleTimer}
//           resetTimer={resetTimer}
//           handlePresetClick={handlePresetClick}
//           setSoundEnabled={setSoundEnabled}
//           setAiMode={setAiMode}
//           onClose={() => setShowPopup(false)} onSave={handleSaveEntry}/>
//       )}
//     </div>
//   );
// }

// export default TimeTracker;

// // ---------------------------
// //       VERSION 1 ABOVE
// // 

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import FocusTrap from 'focus-trap-react';
import { Play, Pause, RotateCcw, Expand, Clock, Volume2, Hourglass, Sun, Laptop, Moon, Brain, Sparkles, X, TimerIcon } from 'lucide-react';
import { TimerPopup } from './TimerPopUp';

type TimerMode = 'stopwatch' | 'countdown';
type TimerStatus = 'stopped' | 'running' | 'paused';
type PresetTime = { label: string; seconds: number };

const presetTimes: PresetTime[] = [
  { label: '5min', seconds: 300 },
  { label: '10min', seconds: 600 },
  { label: '15min', seconds: 900 },
  { label: '25min', seconds: 1500 },
  { label: '30min', seconds: 1800 },
  { label: '45min', seconds: 2700 },
  { label: '60min', seconds: 3600 },
];

export default function TimeTracker() {
  // Core timer state
  const [timerMode, setTimerMode] = useState<TimerMode>('stopwatch');
  const [status, setStatus] = useState<TimerStatus>('stopped');
  const [time, setTime] = useState(0);
  const [targetTime, setTargetTime] = useState(1500);
  const [showPopup, setShowPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // UI state
  const [productivity, setProductivity] = useState(65);
  const [mode, setMode] = useState('balanced');
  const [aiMode, setAiMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const timerRef = useRef<number>();
  const audioRef = useRef<HTMLAudioElement>();

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  }, []);

  // Timer logic
  useEffect(() => {
    if (status === 'running') {
      timerRef.current = window.setInterval(() => {
        setTime(prev => {
          if (timerMode === 'countdown') {
            const next = prev - 1;
            if (next <= 0) {
              handleTimerComplete();
              return 0;
            }
            return next;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [status, timerMode]);

  // Keyboard shortcuts + Escape to close popup
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showPopup) {
        if (e.key === 'Escape') {
          setShowPopup(false);
        }
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        toggleTimer();
      } else if (e.code === 'KeyR' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        resetTimer();
      }
    };
    window.addEventListener('keydown', handler as any);
    return () => window.removeEventListener('keydown', handler as any);
  }, [status, showPopup]);

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  };

  const handleTimerComplete = () => {
    setStatus('stopped');
    if (soundEnabled) audioRef.current?.play();
  };

  const toggleTimer = () => {
    if (status === 'stopped' || status === 'paused') {
      if (timerMode === 'countdown' && time === 0) setTime(targetTime);
      setStatus('running');
    } else {
      setStatus('paused');
    }
  };

  const resetTimer = () => {
    setStatus('stopped');
    setTime(0);
  };

  const handlePresetClick = (preset: PresetTime) => {
    setTargetTime(preset.seconds);
    if (timerMode === 'countdown') setTime(preset.seconds);
  };

  const handleSaveEntry = async (entry: any) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const resp = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({
          ...entry,
          startTime: entry.startTime.toISOString(),
          endTime: entry.endTime.toISOString()
        })
      });
      if (!resp.ok) throw new Error(`Status ${resp.status}`);
      setShowPopup(false);
    } catch (e) {
      setSubmitError((e as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen transition-all duration-500 ${aiMode ? 'bg-gradient-to-br from-gray-50 to-gray-100' : 'luxury-gradient'}">
      <div className="max-w-4xl mx-auto p-8">
        <div className="grid grid-cols-3 gap-8">
          {/* Timer Section */}
          <div className="col-span-3 lg:col-span-2">
            <div className="glass-morphism rounded-2xl p-8 space-y-8">
              {/* Global Expand Button with Status Indicator */}
              <button
                aria-label={status === 'running' ? 'Pause timer' : 'Start timer'}
                onClick={() => setShowPopup(true)}
                className="fixed bottom-8 right-8 p-4 bg-black text-white rounded-full shadow-xl hover:scale-105 transition-transform"
              >
                <Expand className="w-6 h-6" />
                <span
                  aria-hidden="true"
                  className={`absolute top-1 right-1 w-2 h-2 rounded-full animate-pulse ${status === 'running' ? 'bg-green-400' : 'bg-gray-400'}`}
                />
              </button>

              {/* Timer Display */}
              <div className="text-center space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-6 h-6 text-gray-600" aria-hidden="true" />
                    <h2 className="text-xl font-medium text-gray-700">Timer</h2>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
                      className="p-2 rounded-lg transition-colors"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setTimerMode(timerMode === 'stopwatch' ? 'countdown' : 'stopwatch')}
                      aria-label="Toggle timer mode"
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 text-sm font-medium text-gray-700"
                    >
                      {timerMode === 'stopwatch' ? <TimerIcon className="w-4 h-4" /> : <Hourglass className="w-4 h-4" />}
                      <span>{timerMode === 'stopwatch' ? 'Stopwatch' : 'Countdown'}</span>
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <div className={`text-7xl font-light tabular-nums transition-all duration-300 ${status === 'running' ? 'text-gray-800 scale-105' : 'text-gray-600'}`}> 
                    {formatTime(time)}
                  </div>
                  {timerMode === 'countdown' && status !== 'running' && (
                    <div className="absolute -bottom-6 left-0 right-0 text-sm text-gray-500">
                      Target: {formatTime(targetTime)}
                    </div>
                  )}
                </div>

                {/* Timer Controls */}
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={resetTimer}
                    aria-label="Reset timer"
                    className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                  <button
                    onClick={toggleTimer}
                    aria-label={status === 'running' ? 'Pause timer' : 'Start timer'}
                    className={`p-6 rounded-full transition-all ${status === 'running' ? 'bg-gray-200 text-gray-700' : 'bg-black text-white hover:bg-gray-800'}`}
                  >
                    {status === 'running' ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </button>
                </div>

                {/* Preset Times */}
                {timerMode === 'countdown' && (
                  <div className="flex flex-wrap justify-center gap-2 mt-6">
                    {presetTimes.map(p => (
                      <button
                        key={p.seconds}
                        onClick={() => handlePresetClick(p)}
                        aria-label={`Set timer to ${p.label}`}
                        className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Progress Bar */}
                {timerMode === 'countdown' && (
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-black transition-all duration-300"
                      style={{ width: `${(time / targetTime) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Mode Selection */}
            <div className="glass-morphism rounded-2xl p-6 mt-6">
              <h2 className="text-lg font-medium text-gray-700 mb-4">Mode</h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: Sun, label: 'Focus', value: 'focus' },
                  { icon: Laptop, label: 'Balanced', value: 'balanced' },
                  { icon: Moon, label: 'Relax', value: 'relax' }
                ].map(({ icon: Icon, label, value }) => (
                  <button
                    key={value}
                    onClick={() => setMode(value)}
                    aria-label={`Set mode to ${label}`}
                    className={`p-4 rounded-xl flex flex-col items-center space-y-2 transition-all ${mode === value ? 'bg-black text-white' : 'bg-white/50 hover:bg-white/80'}`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-span-3 lg:col-span-1 space-y-6">
            {/* AI Assistant Toggle */}
            <div className="glass-morphism rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Brain className="w-6 h-6 text-gray-600" aria-hidden="true" />
                  <div>
                    <h3 className="font-medium text-gray-700">AI Assistant</h3>
                    <p className="text-sm text-gray-500">Get intelligent suggestions</p>
                  </div>
                </div>
                <button
                  onClick={() => setAiMode(!aiMode)}
                  aria-label="Toggle AI assistant"
                  className={`w-12 h-6 rounded-full transition-all flex items-center ${aiMode ? 'bg-black justify-end' : 'bg-gray-200 justify-start'}`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-sm transform translate-x-0.5"></div>
                </button>
              </div>
            </div>

            {/* Productivity Meter */}
            <div className="glass-morphism rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-gray-600" aria-hidden="true" />
                  <h3 className="font-medium text-gray-700">Productivity</h3>
                </div>
                <span className="text-sm text-gray-500">{productivity.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-black transition-all duration-300" style={{ width: `${productivity}%` }} />
              </div>
            </div>

            {/* Calendar Integration */}
            <div className="glass-morphism rounded-2xl p-6">
              {/* CalendarOverlay placeholder */}
            </div>
          </div>
        </div>
      </div>

      {showPopup && (
        <FocusTrap focusTrapOptions={{ clickOutsideDeactivates: true }}>
          <div onKeyDown={e => e.stopPropagation()} tabIndex={0}>
            <TimerPopup
              time={time}
              status={status}
              soundEnabled={soundEnabled}
              aiMode={aiMode}
              timerMode={timerMode}
              presetTimes={presetTimes}
              formatTime={formatTime}
              toggleTimer={toggleTimer}
              resetTimer={resetTimer}
              handlePresetClick={handlePresetClick}
              setSoundEnabled={setSoundEnabled}
              setAiMode={setAiMode}
              onClose={() => setShowPopup(false)}
              onSave={handleSaveEntry}
              isSubmitting={isSubmitting}
              submitError={submitError}
            />
          </div>
        </FocusTrap>
      )}
    </div>
  );
}

// export default TimeTracker;

// ---------------------------
//       VERSION 2 ABOVE
// 

