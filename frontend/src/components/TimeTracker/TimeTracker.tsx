import { useState, useRef, useEffect, useMemo } from 'react';
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
import { TimerProgressIndicator } from './TimerProgress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../Calendar_updated/components/ui/tabs';
import { Button } from '../Calendar_updated/components/ui/button';
import { Input } from '../Calendar_updated/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '../Calendar_updated/components/ui/dialog';
import { Timer, AlarmClock, Coffee, Plus, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Project, Tag, TimeEntry, UserPreferences, TimerStatus, TimerMode, PomodoroState } from './types';
import { formatTime, getRandomColor } from './utility';
import 'react-circular-progressbar/dist/styles.css';

export default function TimeTracker() {
  const { isAuthenticated, user, logout } = useAuth();
  const { toast } = useToast();

  // Timer states per mode
  const [timerState, setTimerState] = useState<{
    stopwatchTime: number;
    countdownTime: number;
    pomodoroTime: number;
    status: TimerStatus;
    activeTimerId: number | null;
    startTime?: string;
    currentMode: TimerMode;
  }>(() => {
    const saved = localStorage.getItem('timerState');
    return saved ? JSON.parse(saved) : {
      stopwatchTime: 0,
      countdownTime: 1500,
      pomodoroTime: 1500,
      status: 'stopped',
      activeTimerId: null,
      currentMode: 'stopwatch',
    };
  });

  // Mode-related states
  const [timerMode, setTimerMode] = useState<TimerMode>(() => timerState.currentMode || 'stopwatch');
  const [pomodoroState, setPomodoroState] = useState<PomodoroState>(() => {
    const saved = localStorage.getItem('pomodoroState');
    return saved ? JSON.parse(saved) : { currentSession: 0, isBreak: false, totalSessions: 0 };
  });
  const [countdownPreset, setCountdownPreset] = useState(() => timerState.countdownTime || 1500);
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
    category?: string;
  }>(() => {
    const saved = localStorage.getItem('currentTask');
    return saved ? JSON.parse(saved) : {
      description: '',
      projectId: 'noproject',
      billable: false,
      newTag: '',
      tags: [],
      category: '',
    };
  });

  // UI states
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showKeyboardShortcutsDialog, setShowKeyboardShortcutsDialog] = useState(false);
  const [currentQuote, setCurrentQuote] = useState<{ text: string; author: string }>({
    text: 'Productivity is being able to do things that you were never able to do before.',
    author: 'Franz Kafka',
  });
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'duration'>('newest');
  const [descriptionError, setDescriptionError] = useState(false);

  // User preferences
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const saved = localStorage.getItem('timeTracker_preferences');
    return saved ? JSON.parse(saved) : {
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
      progressStyle: 'circular',
    };
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

  // Persist states
  useEffect(() => {
    localStorage.setItem('timerState', JSON.stringify(timerState));
    localStorage.setItem('pomodoroState', JSON.stringify(pomodoroState));
    localStorage.setItem('currentTask', JSON.stringify(currentTask));
  }, [timerState, pomodoroState, currentTask]);

  // Load and apply user preferences
  useEffect(() => {
    const savedPreferences = localStorage.getItem('timeTracker_preferences');
    if (savedPreferences) {
      try {
        const parsedPreferences = JSON.parse(savedPreferences);
        setPreferences(prev => ({ ...prev, ...parsedPreferences }));
        setTimerMode(parsedPreferences.timerMode || 'stopwatch');
        document.documentElement.classList.toggle('dark', parsedPreferences.darkMode);
        toast({
          title: 'Preferences Loaded',
          description: 'User preferences loaded successfully.',
          className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
        });
      } catch (error) {
        console.error('Error parsing saved preferences:', error);
        toast({
          title: 'Preferences Error',
          description: 'Failed to load saved preferences.',
          variant: 'destructive',
          className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
        });
      }
    } else {
      document.documentElement.classList.toggle('dark', preferences.darkMode);
    }
  }, [toast]);

  // Save preferences and sync dark mode
  useEffect(() => {
    try {
      localStorage.setItem('timeTracker_preferences', JSON.stringify(preferences));
      document.documentElement.classList.toggle('dark', preferences.darkMode);
      toast({
        title: 'Preferences Saved',
        description: `Dark mode ${preferences.darkMode ? 'enabled' : 'disabled'}.`,
        className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: 'Preferences Error',
        description: 'Failed to save preferences.',
        variant: 'destructive',
        className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
      });
    }
  }, [preferences, toast]);

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
        setTimeEntries(entriesResponse.data.filter((entry: TimeEntry) => entry.endTime !== null));
        console.log('Fetched time entries:', entriesResponse.data);

        const tagsData = await fetchWithToken<Tag[]>('http://localhost:8080/api/tags');
        setTags(tagsData);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error('Fetch error:', error);
        toast({
          title: 'Data Loading Error',
          description: errorMessage,
          variant: 'destructive',
          className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
        });
      } finally {
        setLoading(false);
      }
    };
    if (isAuthenticated) fetchData();
  }, [isAuthenticated, toast]);

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
          setTimerState(prev => ({ ...prev, activeTimerId: null, startTime: undefined }));
          return;
        }

        if (resp.status === 401) {
          localStorage.removeItem('jwtToken');
          logout();
          toast({
            title: 'Session Expired',
            description: 'Please log in again.',
            variant: 'destructive',
            className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
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
            stopwatchTime: elapsed,
            activeTimerId: response.data.id,
            status: 'running',
            startTime: response.data.startTime,
            currentMode: 'stopwatch',
          }));
          setCurrentTask({
            description: response.data.description,
            projectId: response.data.projectId?.toString() || 'noproject',
            tags: response.data.tags || [],
            billable: response.data.billable,
            newTag: '',
            category: response.data.category || '',
          });
          setTimerMode('stopwatch');
          console.log('Active timer tags:', response.data.tags);
        } else {
          setTimerState(prev => ({ ...prev, activeTimerId: null, startTime: undefined }));
        }
      } catch (error) {
        console.error('Error checking active timer:', error);
        toast({
          title: 'Error',
          description: 'Failed to check active timer.',
          variant: 'destructive',
          className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
        });
      }
    };
    if (isAuthenticated) checkActiveTimer();
  }, [isAuthenticated, logout, toast]);

  // Timer logic
  useEffect(() => {
    if (timerState.status === 'running') {
      intervalRef.current = window.setInterval(() => {
        if (timerMode === 'stopwatch' || (timerMode === 'pomodoro' && !pomodoroState.isBreak)) {
          setTimerState(prev => ({
            ...prev,
            stopwatchTime: timerMode === 'stopwatch' ? prev.stopwatchTime + 1 : prev.stopwatchTime,
            pomodoroTime: timerMode === 'pomodoro' ? prev.pomodoroTime - 1 : prev.pomodoroTime,
          }));
          if (preferences.soundEnabled && timerState.stopwatchTime > 0 && timerState.stopwatchTime % 60 === 0) {
            tickSound.current?.play().catch(e => console.error('Error playing sound:', e));
          }
          if (timerMode === 'pomodoro') {
            const workSeconds = preferences.pomodoroSettings.workDuration * 60;
            if (timerState.pomodoroTime <= 0) {
              handlePomodoroSessionComplete();
            }
          }
        } else if (timerMode === 'countdown' || (timerMode === 'pomodoro' && pomodoroState.isBreak)) {
          setTimerState(prev => {
            const newTime = prev[timerMode === 'countdown' ? 'countdownTime' : 'pomodoroTime'] - 1;
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
                return { ...prev, pomodoroTime: 0, status: 'paused' };
              }
              return { ...prev, countdownTime: 0, status: 'stopped' };
            }
            if (preferences.soundEnabled) {
              if (newTime <= 5) {
                tickSound.current?.play().catch(e => console.error('Error playing sound:', e));
              } else if (newTime % 60 === 0) {
                tickSound.current?.play().catch(e => console.error('Error playing sound:', e));
              }
            }
            return {
              ...prev,
              [timerMode === 'countdown' ? 'countdownTime' : 'pomodoroTime']: newTime,
            };
          });
        }
      }, 1000);
    }
    return () => window.clearInterval(intervalRef.current);
  }, [timerState.status, timerMode, pomodoroState.isBreak, preferences, toast]);

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
    if (timerState.status !== 'stopped') {
      toast({
        title: 'Cannot Change Mode',
        description: 'Please stop or reset the timer before switching modes.',
        variant: 'destructive',
        className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
      });
      return;
    }
    setTimerMode(mode);
    setTimerState(prev => ({
      ...prev,
      currentMode: mode,
      stopwatchTime: mode === 'stopwatch' && prev.activeTimerId ? prev.stopwatchTime : 0,
      countdownTime: mode === 'countdown' ? countdownPreset : prev.countdownTime,
      pomodoroTime: mode === 'pomodoro' ? preferences.pomodoroSettings.workDuration * 60 : prev.pomodoroTime,
    }));
    setPreferences(prev => ({ ...prev, timerMode: mode }));
    if (mode === 'pomodoro') {
      setPomodoroState(prev => ({
        ...prev,
        currentSession: prev.currentSession || 1,
        isBreak: prev.isBreak || false,
        totalSessions: prev.totalSessions || 0,
      }));
    }
    toast({
      title: `${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode`,
      description: `Switched to ${mode} timer mode`,
      className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
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
      pomodoroTime: breakDuration * 60,
    }));
    toast({
      title: 'Pomodoro Break',
      description: `Time for a ${isLongBreak ? 'long' : 'short'} break (${breakDuration} minutes)`,
      className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
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
      pomodoroTime: preferences.pomodoroSettings.workDuration * 60,
      status: 'paused',
    }));
    toast({
      title: 'Pomodoro Work',
      description: `Ready for work session ${pomodoroState.currentSession + 1}`,
      className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
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
    if ((timerMode === 'countdown' || (timerMode === 'pomodoro' && pomodoroState.isBreak)) && !currentTask.description.trim()) {
      setTimerState(prev => ({ ...prev, status: 'running' }));
      return;
    }
    if (!currentTask.description.trim()) {
      setDescriptionError(true);
      toast({
        title: 'Missing Description',
        description: 'Please enter a task description before starting the timer',
        variant: 'destructive',
        action: (
          <Button
            variant="secondary"
            onClick={() => document.getElementById('task-description-input')?.focus()}
            className="bg-[#D8BFD8] text-white hover:bg-[#D8BFD8]/80"
          >
            Add Description
          </Button>
        ),
        className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
      });
      return;
    }
    setDescriptionError(false);
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        toast({
          title: 'Authentication Error',
          description: 'Please log in to start the timer.',
          variant: 'destructive',
          className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
      });
        logout();
        return;
      }
      const projectId = currentTask.projectId === 'noproject' ? null : parseInt(currentTask.projectId);
      const tagIds = currentTask.tags.map(tag => tag.id);
      console.log('Starting timer with tagIds:', tagIds);
      const startTime = new Date().toISOString();
      const res = await fetch('http://localhost:8080/api/timers/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description: currentTask.description,
          startTime: startTime,
          projectId: projectId,
          tagIds: tagIds,
          billable: currentTask.billable,
          category: currentTask.category || null,
        }),
      });
      if (res.status === 401) {
        toast({
          title: 'Authentication Error',
          description: 'Your session has expired. Please log in again.',
          variant: 'destructive',
          className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
        });
        logout();
        return;
      }
      const response = await res.json();
      if (!response.success) {
        toast({
          title: 'Server Error',
          description: response.message || 'Failed to start timer.',
          variant: 'destructive',
          className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
        });
        throw new Error('Start failed');
      }
      setTimerState(prev => ({
        ...prev,
        status: 'running',
        activeTimerId: response.data.id,
        startTime: startTime,
        stopwatchTime: 0,
      }));
      toast({
        title: 'Timer Started',
        description: `Tracking "${currentTask.description}"`,
        className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
      });
    } catch (error) {
      console.error('Start timer error:', error);
      toast({
        title: 'Network Error',
        description: 'Could not connect to the server.',
        variant: 'destructive',
        className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
      });
    }
  };

  const stopTimer = async () => {
    if (timerMode === 'countdown' || (timerMode === 'pomodoro' && pomodoroState.isBreak)) {
      setTimerState(prev => ({ ...prev, status: 'stopped', startTime: undefined }));
      resetTimer();
      return;
    }
    if (!timerState.activeTimerId || !timerState.startTime) {
      toast({
        title: 'No Active Timer',
        description: 'There is no timer to stop',
        variant: 'destructive',
        className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
      });
      return;
    }

    if (timerState.stopwatchTime < 60) {
      toast({
        title: 'Minimum Time Required',
        description: 'Please track at least 1 minute to save your session',
        variant: 'destructive',
        action: (
          <Button
            variant="secondary"
            onClick={() => setTimerState(prev => ({ ...prev, status: 'running' }))}
            className="bg-[#D8BFD8] text-white hover:bg-[#D8BFD8]/80"
          >
            Continue Tracking
          </Button>
        ),
        className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
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
          className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
        });
        logout();
        return;
      }
      const projectId = currentTask.projectId === 'noproject' ? null : parseInt(currentTask.projectId);
      const tagIds = currentTask.tags.map(tag => tag.id);
      console.log('Stopping timer with tagIds:', tagIds);
      const endTime = new Date().toISOString();
      const res = await fetch(`http://localhost:8080/api/timers/${timerState.activeTimerId}/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description: currentTask.description,
          startTime: timerState.startTime,
          endTime: endTime,
          projectId: projectId,
          tagIds: tagIds,
          billable: currentTask.billable,
        }),
      });
      if (res.status === 401) {
        toast({
          title: 'Authentication Error',
          description: 'Your session has expired. Please log in again.',
          variant: 'destructive',
          className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
        });
        logout();
        return;
      }
      const response = await res.json();
      if (!response.success) {
        toast({
          title: 'Server Error',
          description: response.message || 'Failed to stop timer.',
          variant: 'destructive',
          className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
        });
        throw new Error('Stop failed');
      }
      const entryRes = await fetch('http://localhost:8080/api/timers?limit=5', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (entryRes.ok) {
        const entryData = await entryRes.json();
        setTimeEntries(entryData.data.filter((entry: TimeEntry) => entry.endTime !== null));
        console.log('Updated time entries:', entryData.data);
      }
      resetTimer();
      toast({
        title: 'Time Entry Saved',
        description: `Saved time entry for "${currentTask.description}"`,
        className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
      });
    } catch (error) {
      console.error('Stop timer error:', error);
      toast({
        title: 'Network Error',
        description: 'Could not connect to the server.',
        variant: 'destructive',
        className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
      });
    }
  };

  const resetTimer = () => {
    setTimerState(prev => ({
      ...prev,
      stopwatchTime: prev.activeTimerId ? prev.stopwatchTime : 0,
      countdownTime: countdownPreset,
      pomodoroTime: preferences.pomodoroSettings.workDuration * 60,
      status: 'stopped',
      activeTimerId: null,
      startTime: undefined,
    }));
    setCurrentTask({
      description: '',
      projectId: 'noproject',
      tags: [],
      billable: false,
      newTag: '',
      category: '',
    });
    if (timerMode === 'pomodoro') {
      setPomodoroState({
        currentSession: 1,
        isBreak: false,
        totalSessions: 0,
      });
    }
    setDescriptionError(false);
    toast({
      title: 'Timer Reset',
      description: 'Timer has been reset.',
      className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
    });
  };

  const toggleTimer = () => {
    if (timerState.status === 'stopped') {
      startTimer();
    } else if (timerState.status === 'running') {
      setTimerState(prev => ({ ...prev, status: 'paused' }));
      toast({
        title: 'Timer Paused',
        description: 'Your timer is paused.',
        className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
      });
    } else {
      setTimerState(prev => ({ ...prev, status: 'running' }));
      toast({
        title: 'Timer Resumed',
        description: 'Your timer is running.',
        className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
      });
    }
  };

  const handleSelectCountdownPreset = (seconds: number) => {
    setCountdownPreset(seconds);
    setCustomMinutes(seconds / 60);
    setTimerState(prev => ({ ...prev, countdownTime: seconds }));
  };

  const handleSetCustomCountdown = (minutes: number) => {
    const seconds = minutes * 60;
    setCountdownPreset(seconds);
    setCustomMinutes(minutes);
    setTimerState(prev => ({ ...prev, countdownTime: seconds }));
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
          className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
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
          className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
        });
        logout();
        return;
      }
      if (res.status === 409) {
        toast({
          title: 'Tag Exists',
          description: `Tag "${currentTask.newTag}" already exists.`,
          variant: 'destructive',
          className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
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
        className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
      });
    } catch (error) {
      console.error('Error creating tag:', error);
      toast({
        title: 'Error',
        description: 'Failed to create tag.',
        variant: 'destructive',
        className: 'bg-[#F7F7F7] text-[#2D3748] dark:bg-[#2D3748] dark:text-[#E6E6FA] border-[#D8BFD8]/50',
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

  const QuoteComponent = useMemo(() => {
    return () => (
      <motion.div
        className="relative flex items-center justify-between gap-4 mb-8 p-6 rounded-xl bg-[#F7F7F7] dark:bg-[#2D3748] border border-[#D8BFD8]/30 shadow-inner"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          background: preferences.darkMode
            ? 'linear-gradient(145deg, #2D3748, #3C4A5E)'
            : 'linear-gradient(145deg, #F7F7F7, #E6E6FA)',
        }}
      >
        <div className="flex-1">
          <motion.div
            className="text-center text-[#6B7280] dark:text-[#E6E6FA] font-serif text-lg italic"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            key={currentQuote.text}
          >
            "{currentQuote.text}"
          </motion.div>
          <div className="text-center text-[#9CA3AF] dark:text-[#B0C4DE] text-sm mt-2">
            — {currentQuote.author}
          </div>
        </div>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            size="icon"
            className="text-[#B0C4DE] hover:bg-[#D8BFD8]/20 hover:shadow-sm transition-all"
            onClick={() => setCurrentQuote(quotes[Math.floor(Math.random() * quotes.length)])}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              key={currentQuote.text}
            >
              <RefreshCw className="h-5 w-5" />
            </motion.div>
          </Button>
        </motion.div>
      </motion.div>
    );
  }, [currentQuote, preferences.darkMode]);

  const renderTimer = () => {
    const currentTime = timerState[timerMode === 'stopwatch' ? 'stopwatchTime' : timerMode === 'countdown' ? 'countdownTime' : 'pomodoroTime'];
    const formattedTime = formatTime(currentTime);
    const totalTime = timerMode === 'countdown' ? countdownPreset :
      timerMode === 'pomodoro' ? (
        pomodoroState.isBreak
          ? (pomodoroState.currentSession % preferences.pomodoroSettings.sessionsUntilLongBreak === 0
              ? preferences.pomodoroSettings.longBreakDuration
              : preferences.pomodoroSettings.shortBreakDuration) * 60
          : preferences.pomodoroSettings.workDuration * 60
      ) : 3600;
    const progress = timerMode === 'stopwatch' ? currentTime / totalTime : (totalTime - currentTime) / totalTime;

    return (
      <div className="flex flex-col items-center mt-6">
        <motion.div
          className="text-6xl font-mono font-serif text-[#2D3748] dark:text-[#E6E6FA]"
          animate={{ scale: timerState.status === 'running' ? [1, 1.03, 1] : 1 }}
          transition={{ duration: 2, repeat: timerState.status === 'running' ? Infinity : 0 }}
        >
          {formattedTime}
        </motion.div>
        {(timerMode === 'countdown' || timerMode === 'pomodoro') && (
          <TimerProgressIndicator
            progress={progress}
            progressStyle={preferences.progressStyle}
          />
        )}
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
      if (e.code === 'Digit1' && timerState.status === 'stopped') {
        e.preventDefault();
        handleTimerModeChange('stopwatch');
      }
      if (e.code === 'Digit2' && timerState.status === 'stopped') {
        e.preventDefault();
        handleTimerModeChange('countdown');
      }
      if (e.code === 'Digit3' && timerState.status === 'stopped') {
        e.preventDefault();
        handleTimerModeChange('pomodoro');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timerState.status, toggleTimer, stopTimer, resetTimer]);

  return (
    <div className="min-h-screen bg-[#F3F4F6] dark:bg-[#1F2937] font-sans">
      <TimerHeader
        preferences={preferences}
        setPreferences={setPreferences}
        user={user}
        setShowSettingsDialog={setShowSettingsDialog}
        setShowKeyboardShortcutsDialog={setShowKeyboardShortcutsDialog}
      />
      <main className="max-w-5xl mx-auto py-12 px-6">
        {fetchError && (
          <motion.div
            className="bg-[#FECACA]/20 border border-[#FECACA]/50 text-[#DC2626] p-4 rounded-xl mb-8 shadow-sm"
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

        <QuoteComponent />

        <div className="bg-[#FFFFFF] dark:bg-[#2D3748] rounded-2xl shadow-lg p-8 mb-8">
          <div className="relative">
            <Input
              type="text"
              placeholder="What are you working on?"
              value={currentTask.description}
              onChange={e => {
                setCurrentTask(prev => ({ ...prev, description: e.target.value }));
                setDescriptionError(false);
              }}
              className={`w-full text-xl p-6 bg-[#F7F7F7] dark:bg-[#3C4A5E] border-[#D8BFD8]/50 text-[#2D3748] dark:text-[#E6E6FA] font-serif rounded-xl focus:ring-2 focus:ring-[#D8BFD8] shadow-sm ${descriptionError ? 'border-[#DC2626] border-2' : ''}`}
              disabled={timerState.status === 'running'}
              id="task-description-input"
            />
            {descriptionError && (
              <motion.p
                className="text-[#DC2626] text-sm mt-2 font-serif"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                Please enter a task description
              </motion.p>
            )}
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

          <Tabs
            value={timerMode}
            onValueChange={(value: string) => handleTimerModeChange(value as TimerMode)}
            className="mt-6"
          >
            <TabsList className="grid grid-cols-3 bg-[#F7F7F7] dark:bg-[#3C4A5E] rounded-xl border border-[#D8BFD8]/30 shadow-sm">
              <TabsTrigger
                value="stopwatch"
                disabled={timerState.status !== 'stopped'}
                className="flex items-center gap-2 py-2 font-serif text-[#6B7280] data-[state=active]:bg-[#D8BFD8]/20 data-[state=active]:text-[#2D3748] dark:data-[state=active]:text-[#E6E6FA] data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed"
              >
                <Timer className="h-4 w-4" />
                Stopwatch
              </TabsTrigger>
              <TabsTrigger
                value="countdown"
                disabled={timerState.status !== 'stopped'}
                className="flex items-center gap-2 py-2 font-serif text-[#6B7280] data-[state=active]:bg-[#D8BFD8]/20 data-[state=active]:text-[#2D3748] dark:data-[state=active]:text-[#E6E6FA] data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed"
              >
                <AlarmClock className="h-4 w-4" />
                Countdown
              </TabsTrigger>
              <TabsTrigger
                value="pomodoro"
                disabled={timerState.status !== 'stopped'}
                className="flex items-center gap-2 py-2 font-serif text-[#6B7280] data-[state=active]:bg-[#D8BFD8]/20 data-[state=active]:text-[#2D3748] dark:data-[state=active]:text-[#E6E6FA] data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed"
              >
                <Coffee className="h-4 w-4" />
                Pomodoro
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stopwatch" className="p-4">
              <div className="flex flex-col items-center gap-6">
                {renderTimer()}
                <TimerControls
                  timerState={timerState}
                  toggleTimer={toggleTimer}
                  stopTimer={stopTimer}
                  resetTimer={resetTimer}
                />
              </div>
            </TabsContent>

            <TabsContent value="countdown" className="p-4">
              <div className="flex flex-col items-center gap-6">
                <div className="flex flex-wrap gap-2 justify-center mb-4">
                  {preferences.countdownPresets.map(seconds => (
                    <Button
                      key={seconds}
                      variant={countdownPreset === seconds ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleSelectCountdownPreset(seconds)}
                      className={`min-w-[4rem] font-serif ${
                        countdownPreset === seconds
                          ? 'bg-[#D8BFD8] text-white hover:bg-[#D8BFD8]/80'
                          : 'bg-[#F7F7F7] dark:bg-[#3C4A5E] border-[#D8BFD8]/50 text-[#6B7280] hover:bg-[#D8BFD8]/20'
                      }`}
                    >
                      {Math.floor(seconds / 60)}m
                    </Button>
                  ))}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-[#F7F7F7] dark:bg-[#3C4A5E] border-[#D8BFD8]/50 text-[#6B7280] hover:bg-[#D8BFD8]/20 font-serif"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Custom
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#FFFFFF] dark:bg-[#2D3748] border-[#D8BFD8]/30 rounded-xl">
                      <DialogHeader>
                        <DialogTitle className="text-[#2D3748] dark:text-[#E6E6FA] font-serif">Set Custom Time</DialogTitle>
                        <DialogDescription className="text-[#6B7280] dark:text-[#B0C4DE]">Enter the number of minutes for your timer.</DialogDescription>
                      </DialogHeader>
                      <div className="flex items-center space-x-4 py-4">
                        <Input
                          type="number"
                          min="1"
                          max="180"
                          placeholder="Minutes"
                          value={customMinutes}
                          onChange={(e) => setCustomMinutes(Number(e.target.value))}
                          className="flex-1 bg-[#F7F7F7] dark:bg-[#3C4A5E] border-[#D8BFD8]/50 text-[#2D3748] dark:text-[#E6E6FA]"
                          id="custom-minutes"
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={() => handleSetCustomCountdown(customMinutes)}
                          className="bg-[#D8BFD8] text-white hover:bg-[#D8BFD8]/80 font-serif"
                        >
                          Set Timer
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                {renderTimer()}
                <TimerControls
                  timerState={timerState}
                  toggleTimer={toggleTimer}
                  stopTimer={stopTimer}
                  resetTimer={resetTimer}
                />
              </div>
            </TabsContent>

            <TabsContent value="pomodoro" className="p-4">
              <div className="flex flex-col items-center gap-6">
                <PomodoroStatus
                  pomodoroState={pomodoroState}
                  preferences={preferences}
                  timerState={timerState}
                  skipPomodoroSession={skipPomodoroSession}
                />
                {renderTimer()}
                <TimerControls
                  timerState={timerState}
                  toggleTimer={toggleTimer}
                  stopTimer={stopTimer}
                  resetTimer={resetTimer}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

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