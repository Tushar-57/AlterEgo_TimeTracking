import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FocusTrap from 'focus-trap-react';
// import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Play, Pause, RotateCcw, Expand, Volume2, Hourglass, Sun, Laptop, Moon, Brain, Sparkles, TimerIcon } from 'lucide-react';
import { TimerPopup } from './TimerPopUp';
import { useAuth } from '../context/AuthContext';
import VoiceAIMode from './AIModeComponent';

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
  const {isAuthenticated} = useAuth();
  const navigate = useNavigate();
  // Core timer state
  const [timerMode, setTimerMode] = useState<TimerMode>('stopwatch');
  const [showPopup, setShowPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [timerState, setTimerState] = useState({
    time: 0,
    status: 'stopped' as TimerStatus,
    mode: 'stopwatch' as TimerMode,
    targetTime: 1500
  });

  // UI state
  const [productivity, setProductivity] = useState(65);
  const [mode, setMode] = useState('balanced');
  const [aiMode, setAiMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  // const timerRef = useRef<number>();
  const audioRef = useRef<HTMLAudioElement>();

  const [taskName, setTaskName] = useState('');
  const [tags, setTags] = useState<string[]>(['Ai','Random']);

  const [activeTimerId, setActiveTimerId] = useState<number | null>(null);
  // New state for AI interactions
  const [aiActivities, setAiActivities] = useState<string[]>([]);
  const [aiStatus, setAiStatus] = useState<'idle' | 'processing' | 'success'>('idle');

  const [currentTask, setCurrentTask] = useState({
    description: '',
    category: 'work',
    tags: tags,
    billable: false,
    projectId: null as number | null | undefined // Allow null
  });
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated]);
  
  useEffect(() => {
    // Save state on change
    localStorage.setItem('timerState', JSON.stringify(timerState));
  }, [timerState]);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  }, []);

  const handleTimerComplete = () => {
    setTimerState(prev => ({
      ...prev,
      status: 'stopped'
    }));
    if (soundEnabled) audioRef.current?.play();
  };
  // Timer logic
  useEffect(() => {
    let interval: number;
    if (timerState.status === 'running') {
      interval = window.setInterval(() => {
        setTimerState(prev => {
          const newTime = timerMode === 'countdown' 
            ? Math.max(prev.time - 1, 0)
            : prev.time + 1;
          
          if (timerMode === 'countdown' && newTime <= 0) {
            handleTimerComplete();
          }
          return { ...prev, time: newTime };
        });
      }, 1000);
    }
    return () => window.clearInterval(interval);
  }, [timerState.status, timerMode, handleTimerComplete]);

  // Keyboard shortcuts + Escape to close popup
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
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
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [status, showPopup]);

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  };

  const toggleTimer = () => {
    setTimerState(prev => {
      // Reset countdown to targetTime if starting from stopped/paused
      if (prev.status === 'stopped' && timerMode === 'countdown') {
        return { 
          ...prev, 
          status: 'running',
          time: prev.targetTime // Reset to target time
        };
      }
      return {
        ...prev,
        status: prev.status === 'running' ? 'paused' : 'running'
      };
    });
  };
  
  const resetTimer = () => {
    setTimerState(prev => ({
      ...prev,
      time: timerMode === 'countdown' ? prev.targetTime : 0,
      status: 'stopped'
    }));
  };

  const handlePresetClick = (preset: PresetTime) => {
    setTimerState(prev => ({
      ...prev,
      targetTime: preset.seconds,
      time: timerMode === 'countdown' ? preset.seconds : prev.time
    }));
  };

  const handleSaveEntry = async (entry: any) => {
    // await useAuth();
    setTaskName(entry.taskDescription);
    setIsSubmitting(true);
    setSubmitError(null);
    setTags(entry.tags)
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        setSubmitError('Not authenticated');
        setIsSubmitting(false);
        return;
      }
      const url = activeTimerId 
        ? `http://localhost:8080/api/timers/${activeTimerId}/stop`
        : 'http://localhost:8080/api/timers';
  
      const method = activeTimerId ? 'PATCH' : 'POST';
  
      const resp = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}` // Ensure header exists
        },
        body: JSON.stringify({
          taskDescription: entry.taskDescription,
          category: entry.category,
          startTime: entry.startTime.toISOString(),
          endTime: entry.endTime.toISOString(),
          projectId: entry.projectId,
          billable: entry.billable,
          tags: entry.tags
        })
      });
      
      if (resp.status === 401) {
        localStorage.removeItem('jwtToken');
        navigate('/login', { replace: true });
        return;
      }
      if (!resp.ok) {
        const errorData = await resp.json();
        const errorMessage = errorData.message || 
          (resp.status === 409 ? 'Stop current timer first!' : 'Save failed');
        throw new Error(errorMessage);
      }
  
      const result = await resp.json();
      if (result.id) setActiveTimerId(result.id);
  
      // Reset timer state
      setTimerState({
        time: 0,
        status: 'stopped',
        mode: 'stopwatch',
        targetTime: 1500
      });
      setShowPopup(false);
    } catch (e) {
      if (e instanceof Error && e.message.includes('401')) {
        localStorage.removeItem('jwtToken');
        navigate('/login', { replace: true });
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  useEffect(() => {
    if (timerState.status === 'running') {
      const interval = setInterval(() => {
        setTimerState(prev => ({
          ...prev,
          time: timerMode === 'countdown' 
            ? Math.max(prev.time - 1, 0)
            : prev.time + 1
        }));
      }, 1000);
  
      return () => clearInterval(interval);
    }
  }, [timerState.status, timerMode]);
  
  // Persist timer state
  useEffect(() => {
    if (timerState.status === 'running') {
      localStorage.setItem('timerState', JSON.stringify(timerState));
    }
  }, [timerState]);
  
  // Keyboard shortcuts update
  useEffect(() => {
    const handleKeyPress = (e: globalThis.KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        toggleTimer();
      }
    };
  
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [toggleTimer]);

  
  // Add active timer check
  useEffect(() => {
    const checkActiveTimer = async () => {
      try {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
          navigate('/login');
          return;
        }
        const resp = await fetch('http://localhost:8080/api/timers/active', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('jwtToken')}` // Add auth header
          }
        });
        if (resp.status === 404) {
          setActiveTimerId(null); // Handle no active timer
          return;
        }
        if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
        if (resp.status === 401) {
          localStorage.removeItem('jwtToken');
          navigate('/login', { replace: true }); // Use navigate instead of reload
          return;
        }
  
        if (resp.ok) {
          const data = await resp.json();
          setActiveTimerId(data.id);
          setTimerState(prev => ({
            ...prev,
            status: 'running',
            time: Math.floor(
              (Date.now() - new Date(data.startTime).getTime()) / 1000
            )
          }));
        }
      } catch (error) {
        console.error('Error checking active timer:', error);
        localStorage.removeItem('jwtToken');
        // navigate('/login', { replace: true });
      }
    };
    if (isAuthenticated) { // Only check if authenticated
      checkActiveTimer();
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen transition-all duration-500 ${aiMode ? 'bg-gradient-to-br from-gray-50 to-gray-100' : 'luxury-gradient'}">
      <div className="max-w-7xl mx-auto p-8 md:p-6 lg:p-8">
        <div className="grid grid-cols-3 gap-8 lg:grid-cols-5 gap-6">
          {/* Timer Section */}
          <div className="lg:col-span-3">
            <div className="glass-morphism rounded-2xl p-6 space-y-6">
              {/* Global Expand Button with Status Indicator */}
              
              <button
                aria-label={timerState.status === 'running' ? 'Pause timer' : 'Start timer'}
                onClick={() => setShowPopup(true)}
                className="fixed bottom-8 right-8 p-4 bg-black text-white rounded-full shadow-xl hover:scale-105 transition-transform"
              >
                <Expand className="w-6 h-6" />
                <span className={`absolute top-1 right-1 w-2 h-2 rounded-full animate-pulse ${
                  timerState.status === 'running' ? 'bg-green-400' : 
                  timerState.status === 'paused' ? 'bg-yellow-400' : 'bg-gray-400'
                }`}
                />
              </button>

              {/* Timer Display */}
              <div className="text-center space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="timer-header">
                    <span className="task-name">{taskName || 'No task'}</span>
                    <button onClick={() => setShowPopup(true)}>✏️</button>
                  </div>
                  {/* <div className="flex items-center space-x-2">
                    <Clock className="w-6 h-6 text-gray-600" aria-hidden="true" />
                    <h2 className="text-xl font-medium text-gray-700">Timer</h2>
                  </div> */}
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
                  <div className={`text-7xl font-light tabular-nums transition-all duration-300 ${
                    timerState.status === 'running' ? 'text-gray-800 scale-105' : 'text-gray-600'
                  }`}> 
                    {formatTime(timerState.time)}
                  </div>
                  {timerMode === 'countdown' && timerState.status !== 'running' && (
                    <div className="absolute -bottom-6 left-0 right-0 text-sm text-gray-500">
                      Target: {formatTime(timerState.targetTime)}
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
                    aria-label={timerState.status === 'running' ? 'Pause timer' : 'Start timer'}
                    className={`p-6 rounded-full transition-all ${
                      timerState.status === 'running' 
                        ? 'bg-gray-200 text-gray-700' 
                        : 'bg-black text-white hover:bg-gray-800'
                    }`}
                  >
                    {timerState.status === 'running' ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6" />
                    )}
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
                      style={{ width: `${(timerState.time / timerState.targetTime) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
            {showPopup && (
                  <FocusTrap focusTrapOptions={{ clickOutsideDeactivates: true }}>
                    <div onKeyDown={e => e.stopPropagation()} tabIndex={0}>
                      <TimerPopup
                        status={timerState.status}
                        // Update type annotations for setters
                        setTaskDescription={(val: string) => setCurrentTask(prev => ({...prev, description: val}))}
                        setCategory={(val: string) => setCurrentTask(prev => ({...prev, category: val}))}
                        setTags={(val: string[]) => setCurrentTask(prev => ({...prev, tags: val}))}
                        setIsBillable={(val: boolean) => setCurrentTask(prev => ({...prev, billable: val}))}
                        // setSelectedProjectId={(val: number | null) => setCurrentTask(prev => ({...prev, projectId: val}))}
                        setSelectedProjectId={(val: number | undefined) => 
                          setCurrentTask(prev => ({...prev, projectId: val}))
                        }
                        taskDescription={currentTask.description}
                        // setTaskDescription={(val) => setCurrentTask(prev => ({...prev, description: val}))}
                        category={currentTask.category}
                        // setCategory={(val) => setCurrentTask(prev => ({...prev, category: val}))}
                        tags={currentTask.tags}
                        // setTags={(val) => setCurrentTask(prev => ({...prev, tags: val}))}
                        isBillable={currentTask.billable}
                        // setIsBillable={(val) => setCurrentTask(prev => ({...prev, billable: val}))}
                        selectedProjectId={undefined}
                        // setSelectedProjectId={(val) => setCurrentTask(prev => ({...prev, projectId: val}))}
                        time={timerState.time}
                        taskName={taskName}
                        setTaskName={setTaskName}
                        timerState={timerState}
                        setTimerState={setTimerState}
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
                        submitError={submitError} />
                    </div>
                  </FocusTrap>
                )}

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
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* AI Assistant Toggle */}
            <div className="glass-morphism rounded-2xl p-6 h-fit">
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
            {/* Add Voice AI Mode Section */}
            <div className="glass-morphism rounded-2xl p-6 flex-1 flex flex-col min-h-[500px]">
              <VoiceAIMode 
                onProcessingStart={() => setAiStatus('processing')}
                onProcessingEnd={(success) => setAiStatus(success ? 'success' : 'idle')}
                onActivityLog={(transcript: string) =>  // Add type annotation
                  setAiActivities((prev: string[]) => [transcript, ...prev.slice(0, 5)])
                }
                className="mb-6"
              />

              {/* AI Activity Feed */}
              <div className="border-t pt-4 flex-1">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Recent Activities</h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {aiActivities.map((activity, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm p-2 bg-gray-50 rounded-lg">
                      <span className="text-gray-400">⌘</span>
                      {activity}
                    </div>
                  ))}
                  {aiActivities.length === 0 && (
                    <p className="text-gray-400 text-sm">No activities yet. Try giving a voice command!</p>
                  )}
                </div>
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
            <div className="glass-morphism rounded-2xl p-6 flex-1">
              {/* { CalendarOverlay placeholder } */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// export default TimeTracker;

// ---------------------------
//       VERSION 2 ABOVE
// 

