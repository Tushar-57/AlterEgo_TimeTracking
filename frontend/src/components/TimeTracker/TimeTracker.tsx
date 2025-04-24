import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play, Pause, Save, RotateCcw, Tag, Briefcase, DollarSign, Clock, X, Plus,
  Calendar, ChevronDown, AlarmClock, Timer, Bell, Volume2, Settings, SkipForward, ArrowRight, CheckCircle, HelpCircle, Coffee
} from 'lucide-react';
import { useToast } from '../Calendar_updated/components/hooks/use-toast';
import { Button } from '../Calendar_updated/components/ui/button';
import { Input } from '../Calendar_updated/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '../Calendar_updated/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../Calendar_updated/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../Calendar_updated/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { Slider } from '../Calendar_updated/components/ui/slider';
import { Switch } from '../Calendar_updated/components/ui/switch';
import { Badge } from '../Calendar_updated/components/ui/badge';
import { useAuth } from '../../context/AuthContext';
import { fetchWithToken } from '../../utils/auth';

// Types
type TimerStatus = 'stopped' | 'running' | 'paused';
type TimerMode = 'stopwatch' | 'countdown' | 'pomodoro';
interface Project {
  id: number;
  name: string;
  color: string;
  client?: string;  // Add to match backend
}

interface Tag {
  id: number;
  name: string;
  color: string;
}
interface TimeEntry {
  id: number;
  description: string;
  startTime: string;
  endTime?: string;
  duration: number;
  project?: Project;
  tags?: Tag[];
  billable: boolean; // Add this line
}

type PomodoroSettings = {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
};

type UserPreferences = {
  timerMode: TimerMode;
  darkMode: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  pomodoroSettings: PomodoroSettings;
  countdownPresets: number[];
};

// Progress Indicator Component
const TimerProgressIndicator = ({ progress }: { progress: number }) => {
  return (
    <div className="relative h-8 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-4">
      <motion.div
        className="absolute top-0 left-0 h-full w-8 bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center"
        initial={{ x: '-100%' }}
        animate={{ x: `${progress * 100 - 100}%` }}
        transition={{ duration: 0.5 }}
      >
        <ArrowRight className="h-4 w-4 text-white" />
      </motion.div>
    </div>
  );
};

export default function TimeTracker() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Timer states
  const [timerState, setTimerState] = useState({
    time: 0,
    status: 'stopped' as TimerStatus,
    activeTimerId: null as number | null,
  });

  // Mode-related states
  const [timerMode, setTimerMode] = useState<TimerMode>('stopwatch');
  const [pomodoroState, setPomodoroState] = useState({currentSession: 0,isBreak: false, totalSessions: 0,});
  const [countdownTime, setCountdownTime] = useState(1500);
  const [currentTask, setCurrentTask] = useState({
    description: '',
    projectId: 'noproject',
    tags: [] as Tag[],
    billable: false,
    newTag: '',
  });
  // Data states
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTag, setNewTag] = useState('');
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [customMinutes, setCustomMinutes] = useState<number>(25);
  
  // UI states
  const [showTagInput, setShowTagInput] = useState(false);
  const [showProjectSelect, setShowProjectSelect] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showKeyboardShortcutsDialog, setShowKeyboardShortcutsDialog] = useState(false);
  const [errors, setErrors] = useState<{ description?: string; tag?: string; general?: string }>({});

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
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Load user preferences
  useEffect(() => {
    const savedPreferences = localStorage.getItem('timeTracker_preferences');
    if (savedPreferences) {
      try {
        const parsedPreferences = JSON.parse(savedPreferences);
        setPreferences(prev => ({ ...prev, ...parsedPreferences }));
        setTimerMode(parsedPreferences.timerMode || 'stopwatch');
        if (parsedPreferences.darkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (error) {
        console.error('Error parsing saved preferences:', error);
      }
    }
  }, []);

  // Save preferences
  useEffect(() => {
    localStorage.setItem('timeTracker_preferences', JSON.stringify(preferences));
    if (preferences.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [preferences]);

  // Set up audio elements
  useEffect(() => {
    timerCompleteSound.current = new Audio('/sounds/complete.mp3');
    tickSound.current = new Audio('/sounds/tick.mp3');
    breakStartSound.current = new Audio('/sounds/break.mp3');
    workStartSound.current = new Audio('/sounds/work.mp3');
    timerCompleteSound.current.src = 'https://soundbible.com/mp3/service-bell_daniel_simion.mp3';
    tickSound.current.src = 'https://soundbible.com/mp3/clock-ticking-2.mp3';
    breakStartSound.current.src = 'https://soundbible.com/mp3/digital-quick-tone.mp3';
    workStartSound.current.src = 'https://soundbible.com/mp3/analog-watch-alarm.mp3';
    return () => {
      if (timerCompleteSound.current) timerCompleteSound.current.pause();
      if (tickSound.current) tickSound.current.pause();
      if (breakStartSound.current) breakStartSound.current.pause();
      if (workStartSound.current) workStartSound.current.pause();
    };
  }, []);

  // const tagsResponse = await fetchWithToken('http://localhost:8080/api/tags')
  //           .catch(error => {
  //             console.error('Error fetching tags:', error);
  //             toast({
  //               title: 'Error',
  //               description: 'Failed to load tags',
  //               variant: 'destructive',
  //             });
  //             return { data: [] };
  //           });

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
        setFetchError(errorMessage);
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
  }, [isAuthenticated, toast, fetchWithToken]);

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
  }, [isAuthenticated, toast, logout]);

  // Keyboard shortcuts
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
  }, [timerState.status]);

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
        title: 'Validation Error',
        description: 'Task description is required.',
        variant: 'destructive',
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
        // localStorage.removeItem('jwtToken');
        // logout();
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
        title: 'Minimum Duration',
        description: 'Timer must run for at least 60 seconds to save',
        variant: 'destructive',
      });
      resetTimer();
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
        // logout();
        return;
      }
      const res = await fetch(`http://localhost:8080/api/timers/${timerState.activeTimerId}/stop`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401) {
        // localStorage.removeItem('jwtToken');
        // logout();
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
        setTimeEntries(entryData);
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
      if (!token) return;
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
        localStorage.removeItem('jwtToken');
        logout();
        toast({
          title: 'Authentication Error',
          description: 'Your session has expired. Please log in again.',
          variant: 'destructive',
        });
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
      setShowTagInput(false);
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

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getRandomColor = () => {
    const colors = [
      '#4f46e5', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#6366f1',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const getProjectNameById = (id: number | undefined) => {
    if (!id) return 'No Project';
    const project = projects.find(p => p.id === id);
    return project ? project.name : 'No Project';
  };

  const renderTimer = () => {
    const formattedTime = formatTime(timerState.time);
    const totalTime = timerMode === 'countdown'
      ? countdownTime
      : timerMode === 'pomodoro'
        ? pomodoroState.isBreak
          ? (pomodoroState.currentSession % preferences.pomodoroSettings.sessionsUntilLongBreak === 0
              ? preferences.pomodoroSettings.longBreakDuration
              : preferences.pomodoroSettings.shortBreakDuration) * 60
          : preferences.pomodoroSettings.workDuration * 60
        : 0;
    const progress = totalTime > 0 ? (totalTime - timerState.time) / totalTime : 0;

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
      </div>
    );
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <header className="bg-white dark:bg-gray-800 shadow-sm py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Clock className="text-indigo-600 dark:text-indigo-400" size={28} />
            <h1 className="text-2xl font-bold">AE - Timer</h1>
          </div>
          <div className="flex items-center gap-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => setPreferences(prev => ({ ...prev, darkMode: !prev.darkMode }))}
                  >
                    {preferences.darkMode ? (
                      <motion.div initial={{ rotate: -30 }} animate={{ rotate: 0 }} transition={{ duration: 0.2 }}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </motion.div>
                    ) : (
                      <motion.div initial={{ rotate: 30 }} animate={{ rotate: 0 }} transition={{ duration: 0.2 }}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                      </motion.div>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle dark mode</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => setShowSettingsDialog(true)}
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Settings</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => setShowKeyboardShortcutsDialog(true)}
                  >
                    <HelpCircle className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Keyboard shortcuts</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {user && (
              <div className="flex items-center">
                <div className="bg-indigo-600 rounded-full h-8 w-8 flex items-center justify-center text-white font-medium">
                  {user.name ? user.name[0] : user.email[0]}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
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
          <Tabs
            defaultValue="stopwatch"
            value={timerMode}
            onValueChange={(value: string) => handleTimerModeChange(value as TimerMode)}
            className="w-full"
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
            <TabsContent value="stopwatch" className="p-4">
              <div className="text-center text-gray-500 dark:text-gray-400">
                Track your work time without limits
              </div>
            </TabsContent>
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
                      {/* <Input type="number" min="1" max="180" placeholder="Minutes" defaultValue="25" className="flex-1" id="custom-minutes" /> */}
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
                          // const input = document.getElementById('custom-minutes') as HTMLInputElement;
                          // const minutes = parseInt(input.value || '25');
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
              <div className="flex justify-center items-center gap-4 mb-4">
                <div className="text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Session</div>
                  <div className="font-medium">{pomodoroState.currentSession}/{preferences.pomodoroSettings.sessionsUntilLongBreak}</div>
                </div>
                <Badge variant={pomodoroState.isBreak ? 'secondary' : 'default'} className="px-3 py-1">
                  {pomodoroState.isBreak ? 'Break' : 'Work'}
                </Badge>
                <div className="text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Completed</div>
                  <div className="font-medium">{pomodoroState.totalSessions}</div>
                </div>
              </div>
              {timerState.status === 'running' && (
                <Button variant="outline" size="sm" onClick={skipPomodoroSession} className="flex items-center mx-auto">
                  <SkipForward className="h-4 w-4 mr-1" />
                  Skip {pomodoroState.isBreak ? 'Break' : 'Session'}
                </Button>
              )}
            </TabsContent>
          </Tabs>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6 p-6">
          {renderTimer()}
        </div>
          <div className="mb-4">
            <Input
              type="text"
              placeholder="What are you working on?"
              value={currentTask.description}
              onChange={e => setCurrentTask(prev => ({ ...prev, description: e.target.value }))}
              className={`w-full p-3 text-lg border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-4 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={timerState.status === 'running'}
            />
             {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProjectSelect(!showProjectSelect)}
                disabled={timerState.status === 'running'}
                // className="flex items-center gap-2 px-4 py-2"
                className="flex items-center gap-2 px-4 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Briefcase className="h-4 w-4" />
                {currentTask.projectId === 'noproject' ? 'No Project' : getProjectNameById(parseInt(currentTask.projectId))}
                <ChevronDown className="h-4 w-4" />
              </Button>
              {showProjectSelect && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute z-50 mt-1 w-56 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                >
                  <div className="py-1 max-h-60 overflow-auto">
                    <button
                      onClick={() => {
                        setCurrentTask(prev => ({ ...prev, projectId: 'noproject' }));
                        setShowProjectSelect(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        currentTask.projectId === 'noproject'
                          ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-300'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      No Project
                    </button>
                    {projects.map(project => (
                      <button
                        key={project.id}
                        onClick={() => {
                          setCurrentTask(prev => ({ ...prev, projectId: project.id.toString() }));
                          setShowProjectSelect(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm ${
                          currentTask.projectId === project.id.toString()
                            ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-300'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {project.name}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTagInput(!showTagInput)}
                disabled={timerState.status === 'running'}
                // className="flex items-center gap-2"
                className="flex items-center gap-2 px-4 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Tag className="h-4 w-4" />
                Tags
                <ChevronDown className="h-4 w-4" />
              </Button>
              {showTagInput && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute z-50 mt-1 w-64 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                >
                  <div className="p-3">
                    <div className="flex gap-2 mb-3">
                      <Input
                        ref={tagInputRef}
                        placeholder="Add new tag"
                        value={currentTask.newTag}
                        onChange={e => setCurrentTask(prev => ({ ...prev, newTag: e.target.value }))}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        className="flex-1"
                        
                      />
                      <Button size="sm" onClick={handleAddTag} className="px-4">
                        Add
                      </Button>
                    </div>
                    <div className="max-h-40 overflow-y-auto py-1">
                      {tags.map(tag => (
                        <div
                          key={tag.id}
                          onClick={() => handleSelectTag(tag)}
                          className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                        >
                          <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: tag.color || '#ccc' }} />
                            <span className="text-sm">{tag.name}</span>
                          </div>
                          {currentTask.tags.some(t => t.id === tag.id) && <CheckCircle className="h-4 w-4 text-green-500" />}
                        </div>
                      ))}
                      {tags.length === 0 && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">No tags yet. Create one above.</div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {currentTask.tags.map(tag => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="flex items-center gap-1 pl-1 pr-2 py-1"
                  style={{ backgroundColor: `${tag.color}20` }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                  <span>{tag.name}</span>
                  <button
                    onClick={() => setCurrentTask(prev => ({ ...prev, tags: prev.tags.filter(t => t.id !== tag.id) }))}
                    disabled={timerState.status === 'running'}
                    className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X size={12} />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <DollarSign className={`h-4 w-4 ${currentTask.billable ? 'text-green-500' : 'text-gray-400'}`} />
              <span className="text-sm">Billable</span>
              <Switch
                checked={currentTask.billable || false}
                onCheckedChange={checked => setCurrentTask(prev => ({ ...prev, billable: checked }))}
                disabled={timerState.status === 'running'}
              />
            </div>
          </div>
          <div className="flex justify-center gap-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={resetTimer}
                    disabled={timerState.status === 'running'}
                    className="rounded-full h-12 w-12 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                  >
                    <RotateCcw className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset timer (R)</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={toggleTimer}
                    className="rounded-full h-14 w-14 flex items-center justify-center 
                      transition-colors duration-200"
                    style={{
                      '--main-color': timerState.status === 'running' ? '#ef4444' : '#3b82f6',
                      '--hover-color': timerState.status === 'running' ? '#dc2626' : '#2563eb',
                    } as React.CSSProperties}
                    variant={timerState.status === 'running' ? 'secondary' : 'default'}
                  >
                    <div className="[&>*]:text-white h-full w-full flex items-center justify-center 
                      hover:bg-[var(--hover-color)] bg-[var(--main-color)]">
                      {timerState.status === 'running' ? (
                        <Pause className="h-6 w-6" />
                      ) : (
                        <Play className="h-6 w-6 ml-1" />
                      )}
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {timerState.status === 'running' ? 'Pause timer (Space)' : 'Start timer (Space)'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={stopTimer}
                    disabled={timerState.status === 'stopped' || timerState.time < 60}
                    className="rounded-full h-12 w-12 bg-green-100 hover:bg-green-200 dark:bg-green-800 dark:hover:bg-green-700"
                  >
                    <Save className="h-5 w-5 text-green-700 dark:text-green-300" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Stop and save (S)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center items-center py-4"
            >
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
            </motion.div>
          )}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Recent Time Entries
          </h2>
          {loading ? (
            <div className="py-10 text-center text-gray-500 dark:text-gray-400">Loading time entries...</div>
          ) : timeEntries.length === 0 ? (
            <div className="py-10 text-center text-gray-500 dark:text-gray-400">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No time entries yet. Start tracking your time!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {timeEntries.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{entry.description || 'Untitled Task'}</h3>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {entry.project && (
                            <span className="flex items-center mr-3">
                              <Briefcase className="h-3 w-3 mr-1" />
                              {getProjectNameById(entry.project.id)}
                            </span>
                          )}
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(entry.startTime).toLocaleDateString()}
                          </span>
                        </div>
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {entry.tags.map(tag => (
                              <div
                                key={tag.id}
                                className="px-2 py-0.5 text-xs rounded-full"
                                style={{ 
                                  backgroundColor: `${tag.color}20`, 
                                  color: tag.color 
                                }}
                              >
                                {tag.name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center">
                        {entry.billable && <DollarSign className="h-4 w-4 text-green-500 mr-2" />}
                        <span className="font-mono">{formatTime(entry.duration)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
          <div className="mt-6 text-center">
            <Button variant="link" asChild>
              <a href="/reports" className="flex items-center justify-center">
                View all time entries
                <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </main>
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>Customize your timer preferences</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="general">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="pomodoro">Pomodoro</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Dark Mode</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Switch between light and dark themes</p>
                </div>
                <Switch
                  checked={preferences.darkMode}
                  onCheckedChange={checked => setPreferences(prev => ({ ...prev, darkMode: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Default Timer Mode</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Select the default timer type</p>
                </div>
                <Select
                  value={preferences.timerMode}
                  onValueChange={(value: TimerMode) => setPreferences(prev => ({ ...prev, timerMode: value }))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Timer Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stopwatch">Stopwatch</SelectItem>
                    <SelectItem value="countdown">Countdown</SelectItem>
                    <SelectItem value="pomodoro">Pomodoro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <h3 className="font-medium mb-2">Countdown Presets (minutes)</h3>
                <div className="flex flex-wrap gap-2">
                  {preferences.countdownPresets.map((seconds, index) => (
                    <div key={index} className="flex items-center">
                      <Input
                        type="number"
                        min="1"
                        max="180"
                        value={seconds / 60}
                        onChange={e => {
                          const newValue = parseInt(e.target.value) * 60;
                          const newPresets = [...preferences.countdownPresets];
                          newPresets[index] = newValue;
                          setPreferences(prev => ({ ...prev, countdownPresets: newPresets }));
                        }}
                        className="w-16 text-center"
                      />
                      {index > 2 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 ml-1"
                          onClick={() => {
                            const newPresets = preferences.countdownPresets.filter((_, i) => i !== index);
                            setPreferences(prev => ({ ...prev, countdownPresets: newPresets }));
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {preferences.countdownPresets.length < 8 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 min-w-[120px]"
                      onClick={() => {
                        setPreferences(prev => ({
                          ...prev,
                          countdownPresets: [...prev.countdownPresets, 1800],
                        }));
                      }}
                      
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="pomodoro" className="space-y-4 pt-4">
              <div>
                <h3 className="font-medium mb-2">Work Session</h3>
                <div className="flex items-center">
                  <span className="w-24 text-sm text-gray-500 dark:text-gray-400">Duration</span>
                  <div className="flex-1">
                    <Slider
                      min={5}
                      max={60}
                      step={5}
                      value={[preferences.pomodoroSettings.workDuration]}
                      onValueChange={value =>
                        setPreferences(prev => ({
                          ...prev,
                          pomodoroSettings: { ...prev.pomodoroSettings, workDuration: value[0] },
                        }))
                      }
                    />
                  </div>
                  <span className="w-16 text-right">{preferences.pomodoroSettings.workDuration} min</span>
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">Short Break</h3>
                <div className="flex items-center">
                  <span className="w-24 text-sm text-gray-500 dark:text-gray-400">Duration</span>
                  <div className="flex-1">
                    <Slider
                      min={1}
                      max={15}
                      step={1}
                      value={[preferences.pomodoroSettings.shortBreakDuration]}
                      onValueChange={value =>
                        setPreferences(prev => ({
                          ...prev,
                          pomodoroSettings: { ...prev.pomodoroSettings, shortBreakDuration: value[0] },
                        }))
                      }
                    />
                  </div>
                  <span className="w-16 text-right">{preferences.pomodoroSettings.shortBreakDuration} min</span>
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">Long Break</h3>
                <div className="flex items-center">
                  <span className="w-24 text-sm text-gray-500 dark:text-gray-400">Duration</span>
                  <div className="flex-1">
                    <Slider
                      min={5}
                      max={30}
                      step={5}
                      value={[preferences.pomodoroSettings.longBreakDuration]}
                      onValueChange={value =>
                        setPreferences(prev => ({
                          ...prev,
                          pomodoroSettings: { ...prev.pomodoroSettings, longBreakDuration: value[0] },
                        }))
                      }
                    />
                  </div>
                  <span className="w-16 text-right">{preferences.pomodoroSettings.longBreakDuration} min</span>
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">Sessions Until Long Break</h3>
                <div className="flex items-center">
                  <span className="w-24 text-sm text-gray-500 dark:text-gray-400">Sessions</span>
                  <div className="flex-1">
                    <Slider
                      min={2}
                      max={8}
                      step={1}
                      value={[preferences.pomodoroSettings.sessionsUntilLongBreak]}
                      onValueChange={value =>
                        setPreferences(prev => ({
                          ...prev,
                          pomodoroSettings: { ...prev.pomodoroSettings, sessionsUntilLongBreak: value[0] },
                        }))
                      }
                    />
                  </div>
                  <span className="w-16 text-right">{preferences.pomodoroSettings.sessionsUntilLongBreak}</span>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="notifications" className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Sound Effects</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Play sounds for timer events</p>
                </div>
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mr-2"
                    onClick={() => {
                      if (preferences.soundEnabled && timerCompleteSound.current) {
                        timerCompleteSound.current.play().catch(e => console.error('Error playing sound:', e));
                      }
                    }}
                  >
                    <Volume2 className="h-4 w-4" />
                  </Button>
                  <Switch
                    checked={preferences.soundEnabled}
                    onCheckedChange={checked => setPreferences(prev => ({ ...prev, soundEnabled: checked }))}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Browser Notifications</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Show notifications when timer completes</p>
                </div>
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="mr-2"
                    onClick={() => {
                      if (preferences.notificationsEnabled && 'Notification' in window) {
                        Notification.requestPermission().then(permission => {
                          if (permission === 'granted') {
                            new Notification('TimeTracker', { body: 'Notifications are now enabled!' });
                          }
                        });
                      }
                    }}
                  >
                    <Bell className="h-4 w-4" />
                  </Button>
                  <Switch
                    checked={preferences.notificationsEnabled}
                    onCheckedChange={checked => {
                      if (checked && 'Notification' in window && Notification.permission !== 'granted') {
                        Notification.requestPermission();
                      }
                      setPreferences(prev => ({ ...prev, notificationsEnabled: checked }));
                    }}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button onClick={() => setShowSettingsDialog(false)}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showKeyboardShortcutsDialog} onOpenChange={setShowKeyboardShortcutsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription>Use these shortcuts to navigate and control the TimeTracker efficiently.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Start/Pause Timer</span>
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">Space</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Stop and Save Timer</span>
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">S</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Reset Timer</span>
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">R</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Switch to Stopwatch</span>
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">1</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Switch to Countdown</span>
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">2</kbd>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Switch to Pomodoro</span>
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">3</kbd>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowKeyboardShortcutsDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}