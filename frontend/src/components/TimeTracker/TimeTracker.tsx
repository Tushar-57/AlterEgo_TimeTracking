import { useState, useRef, useEffect } from 'react';
import { useToast } from '../Calendar_updated/components/hooks/use-toast';
import { useAuth } from '../../context/AuthContext';
import { fetchWithToken } from '../../utils/auth';
import { TimerHeader } from './TimerHeader';
import { PomodoroStatus } from './PomodoroStatus';
import { ProjectTagSelectors } from './ProjectTagSelectors';
import { TimerControls } from './TimerControls';
import { TimeEntriesList } from './TimeEntriesList';
import { SettingsDialog } from './SettingsDialog';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import { QuoteComponent } from './QuoteComponent';
import { TimerProgressIndicator } from './TImerProgress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../Calendar_updated/components/ui/tabs';
import { Button } from '../Calendar_updated/components/ui/button';
import { Input } from '../Calendar_updated/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '../Calendar_updated/components/ui/dialog';
import { Timer, AlarmClock, Coffee, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Project, Tag, TimeEntry, UserPreferences, TimerStatus, TimerMode, PomodoroState } from './types';
import { formatTime, getRandomColor } from './utility';
import 'react-circular-progressbar/dist/styles.css';
import { CircularProgressbar } from 'react-circular-progressbar';

export default function TimeTracker() {
  const { isAuthenticated, user, logout } = useAuth();
  const { toast } = useToast();

  // Timer states
  const [timerState, setTimerState] = useState<{
    time: number;
    status: TimerStatus;
    activeTimerId: number | null;
  }>({
    time: 0,
    status: 'stopped',
    activeTimerId: null,
  });

  // Mode-related states
  const [timerMode, setTimerMode] = useState<TimerMode>('stopwatch');
  const [pomodoroState, setPomodoroState] = useState<PomodoroState>({
    currentSession: 0,
    isBreak: false,
    totalSessions: 0,
  });
  const [countdownTime, setCountdownTime] = useState(1500);
  const [customMinutes, setCustomMinutes] = useState<number>(25);

  // Data states
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [currentTask, setCurrentTask] = useState<{
    description: string;
    projectId: string;
    tags: Tag[];
    billable: boolean;
    newTag: string;
  }>({
    description: '',
    projectId: 'noproject',
    billable: false,
    newTag: '',
    tags: [],
  });

  // UI states
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showKeyboardShortcutsDialog, setShowKeyboardShortcutsDialog] = useState(false);
  const [currentQuote, setCurrentQuote] = useState<{ text: string; author: string }>({
    text: 'Productivity is being able to do things that you were never able to do before.',
    author: 'Franz Kafka',
  });
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'duration'>('newest');

  // User preferences
  const [preferences, setPreferences] = useState<UserPreferences>({
    timerMode: 'stopwatch',
    darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
    soundEnabled: true,
    notificationsEnabled: true,
    pomodoroSettings: {
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      sessionsUntilLongBreak: 4,
    },
    countdownPresets: [300, 600, 900, 1500, 2700, 3600],
  });

  // Audio elements
  const timerCompleteSound = useRef<HTMLAudioElement | null>(null);
  const tickSound = useRef<HTMLAudioElement | null>(null);
  const breakStartSound = useRef<HTMLAudioElement | null>(null);
  const workStartSound = useRef<HTMLAudioElement | null>(null);

  // Refs
  const intervalRef = useRef<number>();

  const quotes = [
    { text: 'Productivity is being able to do things that you were never able to do before.', author: 'Franz Kafka' },
    { text: 'The key is not to prioritize what\'s on your schedule, but to schedule your priorities.', author: 'Stephen Covey' },
    { text: 'Time management is life management.', author: 'Robin Sharma' },
    { text: 'Focus on being productive instead of busy.', author: 'Tim Ferriss' },
    { text: 'Your time is limited, so don\'t waste it living someone else\'s life.', author: 'Steve Jobs' },
  ];

  // Quote rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Load user preferences
  useEffect(() => {
    const savedPreferences = localStorage.getItem('timeTracker_preferences');
    if (savedPreferences) {
      try {
        const parsedPreferences = JSON.parse(savedPreferences);
        setPreferences(prev => ({ ...prev, ...parsedPreferences }));
        setTimerMode(parsedPreferences.timerMode || 'stopwatch');
        document.documentElement.classList.toggle('dark', parsedPreferences.darkMode);
      } catch (error) {
        console.error('Error parsing saved preferences:', error);
      }
    }
  }, []);

  // Save preferences
  useEffect(() => {
    localStorage.setItem('timeTracker_preferences', JSON.stringify(preferences));
    document.documentElement.classList.toggle('dark', preferences.darkMode);
  }, [preferences]);

  // Set up audio elements
  useEffect(() => {
    timerCompleteSound.current = new Audio('https://soundbible.com/mp3/service-bell_daniel_simion.mp3');
    tickSound.current = new Audio('https://soundbible.com/mp3/clock-ticking-2.mp3');
    breakStartSound.current = new Audio('https://soundbible.com/mp3/digital-quick-tone.mp3');
    workStartSound.current = new Audio('https://soundbible.com/mp3/analog-watch-alarm.mp3');
    return () => {
      timerCompleteSound.current?.pause();
      tickSound.current?.pause();
      breakStartSound.current?.pause();
      workStartSound.current?.pause();
    };
  }, []);

  // Fetch projects, tags, and time entries
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const projectsData = await fetchWithToken<Project[]>('http://localhost:8080/api/projects/userProjects');
        setProjects(projectsData);

        const entriesResponse = await fetchWithToken<{
          success: boolean;
          message: string;
          data: TimeEntry[];
          errors: Record<string, string> | null;
        }>('http://localhost:8080/api/timers?limit=5');
        if (!entriesResponse.success) {
          throw new Error(entriesResponse.message || 'Failed to fetch time entries');
        }
        setTimeEntries(entriesResponse.data || []);

        const tagsData = await fetchWithToken<Tag[]>('http://localhost:8080/api/tags');
        setTags(tagsData);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error('Fetch error:', error);
        toast({
          title: 'Data Loading Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    if (isAuthenticated) fetchData();
  }, [isAuthenticated]);

  // Check for active timer
  useEffect(() => {
    const checkActiveTimer = async () => {
      try {
        const token = localStorage.getItem('jwtToken');
        if (!token) return;

        const resp = await fetch('http://localhost:8080/api/timers/active', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (resp.status === 204) {
          setTimerState(prev => ({ ...prev, activeTimerId: null }));
          return;
        }

        if (resp.status === 401) {
          localStorage.removeItem('jwtToken');
          logout();
          toast({
            title: 'Session Expired',
            description: 'Please log in again.',
            variant: 'destructive',
          });
          return;
        }

        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

        const response = await resp.json();
        if (response.success && response.data) {
          const startTime = new Date(response.data.startTime).getTime();
          const currentTime = Date.now();
          const elapsed = Math.floor((currentTime - startTime) / 1000);

          setTimerState(prev => ({
            ...prev,
            activeTimerId: response.data.id,
            status: 'running',
            time: elapsed,
          }));
          setCurrentTask({
            description: response.data.description,
            projectId: response.data.projectId?.toString() || 'noproject',
            tags: response.data.tags || [],
            billable: response.data.billable,
            newTag: '',
          });
        } else {
          setTimerState(prev => ({ ...prev, activeTimerId: null }));
        }
      } catch (error) {
        console.error('Error checking active timer:', error);
        toast({
          title: 'Error',
          description: 'Failed to check active timer.',
          variant: 'destructive',
        });
      }
    };
    if (isAuthenticated) checkActiveTimer();
  }, [isAuthenticated]);

  // Timer logic
  useEffect(() => {
    if (timerState.status === 'running') {
      intervalRef.current = window.setInterval(() => {
        if (timerMode === 'stopwatch' || (timerMode === 'pomodoro' && !pomodoroState.isBreak)) {
          setTimerState(prev => ({
            ...prev,
            time: prev.time + 1,
          }));
          if (preferences.soundEnabled && timerState.time > 0 && timerState.time % 60 === 0) {
            tickSound.current?.play().catch(e => console.error('Error playing sound:', e));
          }
          if (timerMode === 'pomodoro') {
            const workSeconds = preferences.pomodoroSettings.workDuration * 60;
            if (timerState.time >= workSeconds) {
              handlePomodoroSessionComplete();
            }
          }
        } else if (timerMode === 'countdown' || (timerMode === 'pomodoro' && pomodoroState.isBreak)) {
          setTimerState(prev => {
            const newTime = prev.time - 1;
            if (newTime <= 0) {
              clearInterval(intervalRef.current);
              if (preferences.soundEnabled) {
                timerCompleteSound.current?.play().catch(e => console.error('Error playing sound:', e));
              }
              if (preferences.notificationsEnabled) {
                showNotification(
                  timerMode === 'pomodoro' && pomodoroState.isBreak
                    ? 'Break complete! Ready to work?'
                    : 'Timer complete!'
                );
              }
              if (timerMode === 'pomodoro') {
                setTimeout(() => handlePomodoroBreakComplete(), 1000);
                return { ...prev, time: 0, status: 'paused' };
              }
              return { ...prev, time: 0, status: 'stopped' };
            }
            if (preferences.soundEnabled) {
              if (newTime <= 5) {
                tickSound.current?.play().catch(e => console.error('Error playing sound:', e));
              } else if (newTime % 60 === 0) {
                tickSound.current?.play().catch(e => console.error('Error playing sound:', e));
              }
            }
            return { ...prev, time: newTime };
          });
        }
      }, 1000);
    }
    return () => window.clearInterval(intervalRef.current);
  }, [timerState.status, timerMode, pomodoroState.isBreak, preferences]);

  const showNotification = (message: string) => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return;
    }
    if (Notification.permission === 'granted') {
      new Notification('TimeTracker', { body: message });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('TimeTracker', { body: message });
        }
      });
    }
  };

  const handleTimerModeChange = (mode: TimerMode) => {
    resetTimer();
    setTimerMode(mode);
    setPreferences(prev => ({ ...prev, timerMode: mode }));
    if (mode === 'countdown') {
      setTimerState(prev => ({ ...prev, time: countdownTime }));
    } else if (mode === 'pomodoro') {
      setTimerState(prev => ({
        ...prev,
        time: preferences.pomodoroSettings.workDuration * 60,
      }));
      setPomodoroState({
        currentSession: 1,
        isBreak: false,
        totalSessions: 0,
      });
    }
    toast({
      title: `${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode`,
      description: `Switched to ${mode} timer mode`,
    });
  };

  const handlePomodoroSessionComplete = () => {
    const { shortBreakDuration, longBreakDuration, sessionsUntilLongBreak } = preferences.pomodoroSettings;
    const isLongBreak = pomodoroState.currentSession % sessionsUntilLongBreak === 0;
    const breakDuration = isLongBreak ? longBreakDuration : shortBreakDuration;
    if (preferences.soundEnabled) {
      breakStartSound.current?.play().catch(e => console.error('Error playing sound:', e));
    }
    if (preferences.notificationsEnabled) {
      showNotification(`Work session complete! Time for a ${isLongBreak ? 'long' : 'short'} break.`);
    }
    setPomodoroState(prev => ({
      ...prev,
      isBreak: true,
      totalSessions: prev.totalSessions + 1,
    }));
    setTimerState(prev => ({
      ...prev,
      time: breakDuration * 60,
    }));
    toast({
      title: 'Pomodoro Break',
      description: `Time for a ${isLongBreak ? 'long' : 'short'} break (${breakDuration} minutes)`,
    });
  };

  const handlePomodoroBreakComplete = () => {
    if (preferences.soundEnabled) {
      workStartSound.current?.play().catch(e => console.error('Error playing sound:', e));
    }
    if (preferences.notificationsEnabled) {
      showNotification('Break complete! Ready to start working again?');
    }
    setPomodoroState(prev => ({
      ...prev,
      currentSession: prev.currentSession + 1,
      isBreak: false,
    }));
    setTimerState(prev => ({
      ...prev,
      time: preferences.pomodoroSettings.workDuration * 60,
      status: 'paused',
    }));
    toast({
      title: 'Pomodoro Work',
      description: `Ready for work session ${pomodoroState.currentSession + 1}`,
    });
  };

  const skipPomodoroSession = () => {
    if (pomodoroState.isBreak) {
      handlePomodoroBreakComplete();
    } else {
      handlePomodoroSessionComplete();
    }
  };

  const startTimer = async () => {
    if ((timerMode === 'countdown') || (timerMode === 'pomodoro' && pomodoroState.isBreak)) {
      setTimerState(prev => ({ ...prev, status: 'running' }));
      return;
    }
    if (!currentTask.description.trim()) {
      toast({
        title: 'Missing Description',
        description: 'Please enter a task description before starting the timer',
        variant: 'destructive',
        action: (
          <Button 
            variant="secondary" 
            onClick={() => document.getElementById('task-description-input')?.focus()}
          >
            Add Description
          </Button>
        )
      });
      return;
    }
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        toast({
          title: 'Authentication Error',
          description: 'Please log in to start the timer.',
          variant: 'destructive',
        });
        logout();
        return;
      }
      const projectId = currentTask.projectId === 'noproject' ? null : parseInt(currentTask.projectId);
      const res = await fetch('http://localhost:8080/api/timers/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description: currentTask.description,
          startTime: new Date().toISOString(),
          projectId: projectId,
          tagIds: currentTask.tags.map(tag => tag.id),
          billable: currentTask.billable,
        }),
      });
      if (res.status === 401) {
        toast({
          title: 'Authentication Error',
          description: 'Your session has expired. Please log in again.',
          variant: 'destructive',
        });
        return;
      }
      const response = await res.json();
      if (!response.success) {
        toast({
          title: 'Server Error',
          description: response.message || 'Failed to start timer.',
          variant: 'destructive',
        });
        throw new Error('Start failed');
      }
      setTimerState(prev => ({
        ...prev,
        status: 'running',
        activeTimerId: response.data.id,
      }));
      toast({
        title: 'Success',
        description: 'Timer started successfully!',
      });
    } catch (error) {
      console.error('Start timer error:', error);
      toast({
        title: 'Network Error',
        description: 'Could not connect to the server.',
        variant: 'destructive',
      });
    }
  };

  const stopTimer = async () => {
    if ((timerMode === 'countdown') || (timerMode === 'pomodoro' && pomodoroState.isBreak)) {
      setTimerState(prev => ({ ...prev, status: 'stopped' }));
      resetTimer();
      return;
    }
    if (!timerState.activeTimerId) {
      toast({
        title: 'No Active Timer',
        description: 'There is no timer to stop',
        variant: 'destructive',
      });
      return;
    }

    if (timerState.time < 60) {
      toast({
        title: 'Minimum Time Required',
        description: 'Please track at least 1 minute to save your session',
        variant: 'destructive',
        action: (
          <Button variant="secondary" onClick={() => setTimerState(prev => ({ ...prev, status: 'running' }))}>
            Continue Tracking
          </Button>
        )
      });
      return;
    }
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        toast({
          title: 'Authentication Error',
          description: 'Please log in to stop the timer.',
          variant: 'destructive',
        });
        return;
      }
      const res = await fetch(`http://localhost:8080/api/timers/${timerState.activeTimerId}/stop`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401) {
        toast({
          title: 'Authentication Error',
          description: 'Your session has expired. Please log in again.',
          variant: 'destructive',
        });
        return;
      }
      const response = await res.json();
      if (!response.success) {
        toast({
          title: 'Server Error',
          description: response.message || 'Failed to stop timer.',
          variant: 'destructive',
        });
        throw new Error('Stop failed');
      }
      const entryRes = await fetch('http://localhost:8080/api/time-entries?limit=5', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (entryRes.ok) {
        const entryData = await entryRes.json();
        setTimeEntries(entryData.data || []);
      }
      resetTimer();
      toast({
        title: 'Success',
        description: 'Time entry saved successfully!',
      });
    } catch (error) {
      console.error('Stop timer error:', error);
      toast({
        title: 'Network Error',
        description: 'Could not connect to the server.',
        variant: 'destructive',
      });
    }
  };

  const resetTimer = () => {
    setTimerState({
      time: timerMode === 'countdown' ? countdownTime : 0,
      status: 'stopped',
      activeTimerId: null,
    });
    setCurrentTask({
      description: '',
      projectId: 'noproject',
      tags: [],
      billable: false,
      newTag: '',
    });
    if (timerMode === 'pomodoro') {
      setPomodoroState({
        currentSession: 1,
        isBreak: false,
        totalSessions: 0,
      });
      setTimerState(prev => ({
        ...prev,
        time: preferences.pomodoroSettings.workDuration * 60,
      }));
    }
  };

  const toggleTimer = () => {
    if (timerState.status === 'stopped') {
      startTimer();
    } else if (timerState.status === 'running') {
      setTimerState(prev => ({ ...prev, status: 'paused' }));
    } else {
      setTimerState(prev => ({ ...prev, status: 'running' }));
    }
  };

  const handleSelectCountdownPreset = (seconds: number) => {
    setCountdownTime(seconds);
    setTimerState(prev => ({ ...prev, time: seconds }));
  };

  const handleSetCustomCountdown = (minutes: number) => {
    const seconds = minutes * 60;
    setCountdownTime(seconds);
    setTimerState(prev => ({ ...prev, time: seconds }));
  };

  const handleAddTag = async () => {
    if (!currentTask.newTag.trim()) return;
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        toast({
          title: 'Authentication Error',
          description: 'Your session has expired. Please log in again.',
          variant: 'destructive',
        });
        logout();
        return;
      }
      const res = await fetch('http://localhost:8080/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: currentTask.newTag.trim(),
          color: getRandomColor(),
        }),
      });
      if (res.status === 401) {
        toast({
          title: 'Authentication Error',
          description: 'Your session has expired. Please log in again.',
          variant: 'destructive',
        });
        logout();
        return;
      }
      if (res.status === 409) {
        toast({
          title: 'Tag Exists',
          description: `Tag "${currentTask.newTag}" already exists.`,
          variant: 'destructive',
        });
        return;
      }
      if (!res.ok) throw new Error('Failed to create tag');
      const newTag = await res.json();
      setCurrentTask(prev => ({
        ...prev,
        tags: [...prev.tags, newTag],
        newTag: '',
      }));
      setTags(prevTags => {
        const updatedTags = [...prevTags, newTag];
        localStorage.setItem('cached_tags', JSON.stringify(updatedTags));
        return updatedTags;
      });
      toast({
        title: 'Tag Created',
        description: `Tag "${newTag.name}" created successfully!`,
      });
    } catch (error) {
      console.error('Error creating tag:', error);
      toast({
        title: 'Error',
        description: 'Failed to create tag.',
        variant: 'destructive',
      });
    }
  };

  const handleSelectTag = (tag: Tag) => {
    if (!currentTask.tags.find(t => t.id === tag.id)) {
      setCurrentTask(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
    }
  };

  const renderTimer = () => {
    const formattedTime = formatTime(timerState.time);
    const totalTime = pomodoroState.isBreak
      ? (pomodoroState.currentSession % preferences.pomodoroSettings.sessionsUntilLongBreak === 0
          ? preferences.pomodoroSettings.longBreakDuration
          : preferences.pomodoroSettings.shortBreakDuration) * 60
      : preferences.pomodoroSettings.workDuration * 60;
    const progress = (totalTime - timerState.time) / totalTime;

    return (
      <div>
        <motion.div
          className="text-4xl lg:text-5xl font-mono font-bold text-center my-4"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {formattedTime}
        </motion.div>
        {(timerMode === 'countdown' || timerMode === 'pomodoro') && (
          <TimerProgressIndicator progress={progress} />
        )}
        {(timerMode === 'countdown' || timerMode === 'pomodoro') && ( 
        <div className="w-16 h-16 mx-auto">
          <CircularProgressbar value={progress * 100} text={`${Math.round(progress * 100)}%`} />
        </div>)}
      </div>
    );
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timerState.status, toggleTimer, stopTimer, resetTimer, handleTimerModeChange]);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <TimerHeader
        preferences={preferences}
        setPreferences={setPreferences}
        user={user}
        setShowSettingsDialog={setShowSettingsDialog}
        setShowKeyboardShortcutsDialog={setShowKeyboardShortcutsDialog}
      />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {fetchError && (
          <motion.div
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-lg mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{fetchError}</span>
            </div>
          </motion.div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6 overflow-hidden">
        {/* <TabsContent value="stopwatch" className="p-4"> */}
        <QuoteComponent currentQuote={currentQuote} setCurrentQuote={setCurrentQuote} quotes={quotes} />
            {/* </TabsContent> */}
        <Tabs
          defaultValue="stopwatch"
          value={timerMode}
          onValueChange={(value: string) => handleTimerModeChange(value as TimerMode)}
          className={`w-full ${timerMode === 'pomodoro' ? 'bg-gradient-to-b from-red-50 to-white dark:from-red-900/20 dark:to-gray-900' : ''}`}
        >
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="stopwatch" className="py-3">
                <Timer className="h-4 w-4 mr-2" />
                Stopwatch
              </TabsTrigger>
              <TabsTrigger value="countdown" className="py-3">
                <AlarmClock className="h-4 w-4 mr-2" />
                Countdown
              </TabsTrigger>
              <TabsTrigger value="pomodoro" className="py-3">
                <Coffee className="h-4 w-4 mr-2" />
                Pomodoro
              </TabsTrigger>
            </TabsList>
            <TabsContent value="countdown" className="p-4">
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                {preferences.countdownPresets.map(seconds => (
                  <Button
                    key={seconds}
                    variant={countdownTime === seconds ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSelectCountdownPreset(seconds)}
                    className="min-w-[4rem]"
                  >
                    {Math.floor(seconds / 60)}m
                  </Button>
                ))}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Custom
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Set Custom Time</DialogTitle>
                      <DialogDescription>Enter the number of minutes for your timer.</DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center space-x-4 py-4">
                      <Input
                        type="number"
                        min="1"
                        max="180"
                        placeholder="Minutes"
                        value={customMinutes}
                        onChange={(e) => setCustomMinutes(Number(e.target.value))}
                        className="flex-1"
                        id="custom-minutes"
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={() => {
                          handleSetCustomCountdown(customMinutes);
                        }}
                      >
                        Set Timer
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </TabsContent>
            <TabsContent value="pomodoro" className="p-4">
              <PomodoroStatus
                pomodoroState={pomodoroState}
                preferences={preferences}
                timerState={timerState}
                skipPomodoroSession={skipPomodoroSession}
              />
            </TabsContent>
          </Tabs>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6 p-6">
          {renderTimer()}
        </div>
        <div className="mb-4 max-w-3xl mx-auto">
          <Input
            type="text"
            placeholder="What are you working on?"
            value={currentTask.description}
            onChange={e => setCurrentTask(prev => ({ ...prev, description: e.target.value }))}
            className="w-full p-6 !text-2xl md:!text-2xl text-center border-2 rounded-xl focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-700"
            disabled={timerState.status === 'running'}
            id="task-description-input"
          />
        </div>
        <ProjectTagSelectors
          projects={projects}
          tags={tags}
          currentTask={currentTask}
          setCurrentTask={setCurrentTask}
          handleAddTag={handleAddTag}
          handleSelectTag={handleSelectTag}
          timerState={timerState}
        />
        <TimerControls
          timerState={timerState}
          toggleTimer={toggleTimer}
          stopTimer={stopTimer}
          resetTimer={resetTimer}
        />
        <TimeEntriesList
          timeEntries={timeEntries}
          loading={loading}
          sortBy={sortBy}
          setSortBy={setSortBy}
          formatTime={formatTime}
        />
      </main>
      <SettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        preferences={preferences}
        setPreferences={setPreferences}
      />
      <KeyboardShortcutsDialog
        open={showKeyboardShortcutsDialog}
        onOpenChange={setShowKeyboardShortcutsDialog}
      />
    </div>
  );
}