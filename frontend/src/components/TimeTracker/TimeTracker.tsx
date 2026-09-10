import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '../Calendar_updated/components/hooks/use-toast';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';
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
import { Switch } from '../Calendar_updated/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '../Calendar_updated/components/ui/dialog';
import { Timer, AlarmClock, Coffee, Plus, RefreshCw, Sunrise, Moon, AlertTriangle, History } from 'lucide-react';
import { motion } from 'framer-motion';
import { CurrentTask, Project, Tag, TimeEntry, UserPreferences, TimerStatus, TimerMode, PomodoroState } from './types';
import { formatTime, getRandomColor } from './utility';
import { formatMinutesAsHoursMinutes, formatSecondsAsHoursMinutes, parseDateTimeAsLocal } from '../../utils/utils';
import 'react-circular-progressbar/dist/styles.css';
import { useTheme } from '../../context/ThemeContext';

const toLocalDateTimeString = (date: Date) => {
 const pad = (value: number) => value.toString().padStart(2, '0');
 return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
 date.getHours()
 )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const formatDateTimeLocalInput = (date: Date) => {
 const pad = (value: number) => value.toString().padStart(2, '0');
 return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/** How far back a finished session can still be treated as"where I left off". */
const RESUME_ANCHOR_WINDOW_MS = 12 * 60 * 60 * 1000;

/** Names a past moment the way the user would say it out loud:"2:32 PM","yesterday 11:10 PM". */
const formatResumeAnchorLabel = (date: Date) => {
 const clock = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
 const today = new Date();

 if (date.toDateString() === today.toDateString()) {
 return clock;
 }

 const yesterday = new Date(today);
 yesterday.setDate(today.getDate() - 1);

 if (date.toDateString() === yesterday.toDateString()) {
 return `yesterday ${clock}`;
 }

 return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${clock}`;
};

const toProjectId = (value: CurrentTask['projectId']): number | null => {
 if (value === null || value === 'noproject') {
 return null;
 }

 const parsed = Number(value);
 return Number.isFinite(parsed) ? parsed : null;
};

type DailyMarkerType = 'wake_up' | 'sign_off';

type AgenticSyncStatus = {
 enabled: boolean;
 configured: boolean;
 pending: number;
 retry: number;
 processing: number;
 failed: number;
 success: number;
 cooldownRemainingSeconds: number;
 nextAttemptAt?: string | null;
 degraded: boolean;
 hasFailures?: boolean;
};

type ApiEnvelope<T> = {
 success: boolean;
 message?: string;
 data?: T;
 errors?: Record<string, string> | null;
};

const DAILY_MARKER_CONFIG: Record<
 DailyMarkerType,
 {
 buttonLabel: string;
 description: string;
 category: string;
 contextNotes: string;
 recordedTitle: string;
 updatedTitle: string;
 }
> = {
 wake_up: {
 buttonLabel: 'Log wake-up',
 description: 'Wake-up',
 category: 'daily_wake_up',
 contextNotes: 'One-tap wake-up checkpoint from TimeTracker quick actions.',
 recordedTitle: 'Wake-Up Recorded',
 updatedTitle: 'Wake-Up Updated',
 },
 sign_off: {
 buttonLabel: 'Log sign-off',
 description: 'Sign-off',
 category: 'daily_sign_off',
 contextNotes: 'One-tap sign-off checkpoint from TimeTracker quick actions.',
 recordedTitle: 'Sign-Off Recorded',
 updatedTitle: 'Sign-Off Updated',
 },
};

const QUOTES = [
 { text: 'Productivity is being able to do things that you were never able to do before.', author: 'Franz Kafka' },
 { text: 'The key is not to prioritize what\'s on your schedule, but to schedule your priorities.', author: 'Stephen Covey' },
 { text: 'Time management is life management.', author: 'Robin Sharma' },
 { text: 'Focus on being productive instead of busy.', author: 'Tim Ferriss' },
 { text: 'Your time is limited, so don\'t waste it living someone else\'s life.', author: 'Steve Jobs' },
];

export default function TimeTracker() {
 const { isAuthenticated, logout, token } = useAuth();
 const { toast } = useToast();
 const { isDark, setThemeMode } = useTheme();

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
 const fallbackState = {
 stopwatchTime: 0,
 countdownTime: 1500,
 pomodoroTime: 1500,
 status: 'stopped' as TimerStatus,
 activeTimerId: null,
 currentMode: 'stopwatch' as TimerMode,
 };

 const saved = localStorage.getItem('timerState');
 if (!saved) {
 return fallbackState;
 }

 try {
 const parsed = JSON.parse(saved);
 const parsedStatus = parsed?.status;
 const parsedMode = parsed?.currentMode;

 return {
 ...fallbackState,
 ...parsed,
 stopwatchTime: Math.max(0, Number(parsed?.stopwatchTime) || 0),
 countdownTime: Math.max(0, Number(parsed?.countdownTime) || fallbackState.countdownTime),
 pomodoroTime: Math.max(0, Number(parsed?.pomodoroTime) || fallbackState.pomodoroTime),
 status:
 parsedStatus === 'running' || parsedStatus === 'paused' || parsedStatus === 'stopped'
 ? parsedStatus
 : 'stopped',
 currentMode:
 parsedMode === 'stopwatch' || parsedMode === 'countdown' || parsedMode === 'pomodoro'
 ? parsedMode
 : 'stopwatch',
 activeTimerId: Number.isFinite(parsed?.activeTimerId) ? parsed.activeTimerId : null,
 };
 } catch {
 return fallbackState;
 }
 });

 // Mode-related states
 const [timerMode, setTimerMode] = useState<TimerMode>(() => timerState.currentMode || 'stopwatch');
 const [pomodoroState, setPomodoroState] = useState<PomodoroState>(() => {
 const saved = localStorage.getItem('pomodoroState');
 return saved ? JSON.parse(saved) : { currentSession: 0, isBreak: false, totalSessions: 0 };
 });
 const [countdownPreset, setCountdownPreset] = useState(() => timerState.countdownTime || 1500);
 const [customMinutes, setCustomMinutes] = useState<number>(25);
 const [customHours, setCustomHours] = useState<number>(0);
 const [showAdvancedCustomCountdown, setShowAdvancedCustomCountdown] = useState(false);
 const [isCustomCountdownDialogOpen, setIsCustomCountdownDialogOpen] = useState(false);
 // Backdating: start the stopwatch as if it had been running since an earlier
 // moment, for the sessions people forget to start.
 const [isBackdatingStart, setIsBackdatingStart] = useState(false);
 const [showCustomStartPicker, setShowCustomStartPicker] = useState(false);
 const [backdatePreviewTick, setBackdatePreviewTick] = useState(0);
 const [manualStartDateTime, setManualStartDateTime] = useState<string>(() => formatDateTimeLocalInput(new Date()));

 // Data states
 const [projects, setProjects] = useState<Project[]>([]);
 const [tags, setTags] = useState<Tag[]>([]);
 const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
 const [loading, setLoading] = useState(false);
 const [fetchError, setFetchError] = useState<string | null>(null);
 const [currentTask, setCurrentTask] = useState<CurrentTask>(() => {
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
 const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
 const [isResetInProgress, setIsResetInProgress] = useState(false);
 const [currentQuote, setCurrentQuote] = useState<{ text: string; author: string }>({
 text: 'Productivity is being able to do things that you were never able to do before.',
 author: 'Franz Kafka',
 });
 const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'duration'>('newest');
 const [descriptionError, setDescriptionError] = useState(false);
 const [deletingEntryId, setDeletingEntryId] = useState<number | null>(null);
 const [dailyMarkerLoading, setDailyMarkerLoading] = useState<DailyMarkerType | null>(null);
 const [agenticSyncStatus, setAgenticSyncStatus] = useState<AgenticSyncStatus | null>(null);
 const [agenticRetryInProgress, setAgenticRetryInProgress] = useState(false);

 // User preferences
 const [preferences, setPreferences] = useState<UserPreferences>(() => {
 const saved = localStorage.getItem('timeTracker_preferences');
 return saved ? JSON.parse(saved) : {
 timerMode: 'stopwatch',
 darkMode: isDark,
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
 const nextDarkMode =
 typeof parsedPreferences?.darkMode === 'boolean' ? parsedPreferences.darkMode : isDark;

 setPreferences(prev => ({ ...prev, ...parsedPreferences }));
 setTimerMode(parsedPreferences.timerMode || 'stopwatch');

 if (typeof parsedPreferences?.darkMode === 'boolean') {
 setThemeMode(nextDarkMode ? 'dark' : 'light');
 }

 toast({
 title: 'Settings loaded',
 description: 'User preferences loaded successfully.',
 className: 'bg-muted text-foreground border-border',
 });
 } catch (error) {
 console.error('Error parsing saved preferences:', error);
 toast({
 title: 'Couldn’t load settings',
 description: 'Failed to load saved preferences.',
 variant: 'destructive',
 className: 'bg-muted text-foreground border-border',
 });
 }
 }
 }, [isDark, setThemeMode, toast]);

 useEffect(() => {
 setPreferences(prev => {
 if (prev.darkMode === isDark) {
 return prev;
 }

 return {
 ...prev,
 darkMode: isDark,
 };
 });
 }, [isDark]);

 // Save preferences and sync dark mode
 useEffect(() => {
 try {
 localStorage.setItem('timeTracker_preferences', JSON.stringify(preferences));

 if (preferences.darkMode !== isDark) {
 setThemeMode(preferences.darkMode ? 'dark' : 'light');
 }
 } catch (error) {
 console.error('Error saving preferences:', error);
 toast({
 title: 'Couldn’t load settings',
 description: 'Failed to save preferences.',
 variant: 'destructive',
 className: 'bg-muted text-foreground border-border',
 });
 }
 }, [isDark, preferences, setThemeMode, toast]);

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
 const cachedProjectsRaw = localStorage.getItem('cached_projects');
 if (cachedProjectsRaw) {
 const cachedProjects = JSON.parse(cachedProjectsRaw) as Project[];
 if (Array.isArray(cachedProjects) && cachedProjects.length > 0) {
 setProjects(cachedProjects);
 }
 }
 } catch {
 // Ignore cache parse issues and continue with network fetch.
 }

 try {
 const cachedTagsRaw = localStorage.getItem('cached_tags');
 if (cachedTagsRaw) {
 const cachedTags = JSON.parse(cachedTagsRaw) as Tag[];
 if (Array.isArray(cachedTags) && cachedTags.length > 0) {
 setTags(cachedTags);
 }
 }
 } catch {
 // Ignore cache parse issues and continue with network fetch.
 }

 const errors: string[] = [];
 try {
 const projectsPromise = fetchWithToken<Project[]>('/api/projects/userProjects')
 .then((projectsData) => {
 setProjects(projectsData);
 localStorage.setItem('cached_projects', JSON.stringify(projectsData));
 })
 .catch((error) => {
 console.error('Failed to load projects', error);
            errors.push('projects');
 });

 const tagsPromise = fetchWithToken<Tag[]>('/api/tags')
 .then((tagsData) => {
 setTags(tagsData);
 localStorage.setItem('cached_tags', JSON.stringify(tagsData));
 })
 .catch((error) => {
 console.error('Failed to load tags', error);
            errors.push('tags');
 });

 const entriesPromise = fetchWithToken<ApiEnvelope<TimeEntry[]>>('/api/timers?limit=5')
 .then((entriesResponse) => {
 if (!entriesResponse.success || !Array.isArray(entriesResponse.data)) {
 throw new Error(entriesResponse.message || 'Failed to fetch time entries');
 }
 setTimeEntries(entriesResponse.data.filter((entry: TimeEntry) => entry.endTime !== null));
 })
 .catch((error) => {
 console.error('Failed to load time entries', error);
            errors.push('recent entries');
 });

 await Promise.allSettled([projectsPromise, tagsPromise, entriesPromise]);

 if (errors.length > 0) {
 // Name what's missing in plain language; the raw fetch error is only
          // useful in the console, not in the banner.
          const errorMessage = `Couldn't load ${errors.length === 1 ? errors[0] : `${errors.slice(0, -1).join(', ')} and ${errors[errors.length - 1]}`}.`;
 setFetchError(errorMessage);
 toast({
 title: 'Couldn’t load your data',
 description: errorMessage,
 variant: 'destructive',
 className: 'bg-muted text-foreground border-border',
 });
 }
 } catch (error) {
 const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
 setFetchError(errorMessage);
 toast({
 title: 'Couldn’t load your data',
 description: errorMessage,
 variant: 'destructive',
 className: 'bg-muted text-foreground border-border',
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
 if (!token) return;

 const resp = await fetch('/api/timers/active', {
 headers: { Authorization: `Bearer ${token}` },
 });

 if (resp.status === 204) {
 setTimerState(prev => ({
 ...prev,
 activeTimerId: null,
 startTime: undefined,
 status: 'stopped',
 stopwatchTime: 0,
 }));
 return;
 }

 if (resp.status === 401) {
 logout();
 toast({
 title: 'Signed out',
 description: 'Please log in again.',
 variant: 'destructive',
 className: 'bg-muted text-foreground border-border',
 });
 return;
 }

 if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

 const response = await resp.json();
 if (response.success && response.data) {
 const startTime = parseDateTimeAsLocal(response.data.startTime).getTime();
 const currentTime = Date.now();
 const elapsed = Math.max(0, Math.floor((currentTime - startTime) / 1000));

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
 setManualStartDateTime(formatDateTimeLocalInput(parseDateTimeAsLocal(response.data.startTime)));
 setIsBackdatingStart(false);
 setShowCustomStartPicker(false);
 setTimerMode('stopwatch');
 console.log('Active timer tags:', response.data.tags);
 } else {
 setTimerState(prev => ({
 ...prev,
 activeTimerId: null,
 startTime: undefined,
 status: 'stopped',
 stopwatchTime: 0,
 }));
 }
 } catch (error) {
 console.error('Error checking active timer:', error);
 toast({
 title: 'Error',
 description: 'Failed to check active timer.',
 variant: 'destructive',
 className: 'bg-muted text-foreground border-border',
 });
 }
 };
 if (isAuthenticated) checkActiveTimer();
 }, [isAuthenticated, logout, toast]);

 useEffect(() => {
 if (!isAuthenticated) {
 setAgenticSyncStatus(null);
 return;
 }

 let isActive = true;

 const fetchAgenticSyncStatus = async () => {
 try {
 const envelope = await fetchWithToken<ApiEnvelope<AgenticSyncStatus>>('/api/agentic/sync/status');
 if (!isActive || !envelope?.success || !envelope?.data) {
 return;
 }

 setAgenticSyncStatus(envelope.data);
 } catch {
 // Non-blocking status panel only.
 }
 };

 void fetchAgenticSyncStatus();
 const timer = window.setInterval(() => {
 void fetchAgenticSyncStatus();
 }, 45000);

 return () => {
 isActive = false;
 window.clearInterval(timer);
 };
 }, [isAuthenticated]);

 const retryFailedAgenticEvents = async () => {
 if (agenticRetryInProgress) {
 return;
 }

 setAgenticRetryInProgress(true);
 try {
 await fetchWithToken<ApiEnvelope<{ retried: number }>>('/api/agentic/sync/retry-failed?limit=100', {
 method: 'POST',
 });
 await fetchWithToken<ApiEnvelope<{ triggered: boolean }>>('/api/agentic/sync/process-now', {
 method: 'POST',
 });

 const status = await fetchWithToken<ApiEnvelope<AgenticSyncStatus>>('/api/agentic/sync/status');
 if (status.success && status.data) {
 setAgenticSyncStatus(status.data);
 }

 toast({
 title: 'Retrying sync',
 description: 'Failed Agentic sync events were queued for retry.',
 className: 'bg-muted text-foreground border-border',
 });
 } catch (error) {
 const message = error instanceof Error ? error.message : 'Failed to retry Agentic sync events.';
 toast({
 title: 'Retry didn’t work',
 description: message,
 variant: 'destructive',
 className: 'bg-muted text-foreground border-border',
 });
 } finally {
 setAgenticRetryInProgress(false);
 }
 };

 const clearTimerStateLocally = ({
 showResetToast = false,
 resetDescription = 'Timer has been reset.',
 }: {
 showResetToast?: boolean;
 resetDescription?: string;
 } = {}) => {
 setTimerState(prev => ({
 ...prev,
 stopwatchTime: 0,
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
 setIsBackdatingStart(false);
 setShowCustomStartPicker(false);
 setManualStartDateTime(formatDateTimeLocalInput(new Date()));

 if (showResetToast) {
 toast({
 title: 'Timer reset',
 description: resetDescription,
 className: 'bg-muted text-foreground border-border',
 });
 }
 };

 // Timer logic
 useEffect(() => {
 if (timerState.status === 'running') {
 intervalRef.current = window.setInterval(() => {
 if (timerMode === 'stopwatch') {
 setTimerState(prev => {
 const nextStopwatch = prev.stopwatchTime + 1;
 if (preferences.soundEnabled && nextStopwatch > 0 && nextStopwatch % 60 === 0) {
 tickSound.current?.play().catch(e => console.error('Error playing sound:', e));
 }
 return {
 ...prev,
 stopwatchTime: nextStopwatch,
 };
 });
 return;
 }

 if (timerMode === 'countdown') {
 setTimerState(prev => {
 const nextCountdown = Math.max(0, prev.countdownTime - 1);

 if (nextCountdown <= 0) {
 clearInterval(intervalRef.current);
 if (preferences.soundEnabled) {
 timerCompleteSound.current?.play().catch(e => console.error('Error playing sound:', e));
 }
 if (preferences.notificationsEnabled) {
 showNotification('Timer complete!');
 }
 return { ...prev, countdownTime: 0, status: 'stopped' };
 }

 if (preferences.soundEnabled && (nextCountdown <= 5 || nextCountdown % 60 === 0)) {
 tickSound.current?.play().catch(e => console.error('Error playing sound:', e));
 }

 return {
 ...prev,
 countdownTime: nextCountdown,
 };
 });
 return;
 }

 setTimerState(prev => {
 const nextPomodoro = Math.max(0, prev.pomodoroTime - 1);

 if (nextPomodoro <= 0) {
 clearInterval(intervalRef.current);
 if (preferences.soundEnabled) {
 timerCompleteSound.current?.play().catch(e => console.error('Error playing sound:', e));
 }
 if (preferences.notificationsEnabled) {
 showNotification(
 pomodoroState.isBreak ? 'Break complete! Ready to work?' : 'Work session complete!'
 );
 }

 if (pomodoroState.isBreak) {
 setTimeout(() => handlePomodoroBreakComplete(), 1000);
 } else {
 setTimeout(() => handlePomodoroSessionComplete(), 1000);
 }

 return { ...prev, pomodoroTime: 0, status: 'paused' };
 }

 if (preferences.soundEnabled && (nextPomodoro <= 5 || nextPomodoro % 60 === 0)) {
 tickSound.current?.play().catch(e => console.error('Error playing sound:', e));
 }

 return {
 ...prev,
 pomodoroTime: nextPomodoro,
 };
 });
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
 if (timerState.status !== 'stopped') {
 toast({
 title: 'Can’t switch while running',
 description: 'Please stop or reset the timer before switching modes.',
 variant: 'destructive',
 className: 'bg-muted text-foreground border-border',
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
 className: 'bg-muted text-foreground border-border',
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
 title: 'Break time',
 description: `Time for a ${isLongBreak ? 'long' : 'short'} break (${formatMinutesAsHoursMinutes(breakDuration)})`,
 className: 'bg-muted text-foreground border-border',
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
 title: 'Back to work',
 description: `Ready for work session ${pomodoroState.currentSession + 1}`,
 className: 'bg-muted text-foreground border-border',
 });
 };

 const skipPomodoroSession = () => {
 if (pomodoroState.isBreak) {
 handlePomodoroBreakComplete();
 } else {
 handlePomodoroSessionComplete();
 }
 };

 const refreshRecentTimeEntries = async (token: string) => {
 const entryRes = await fetch('/api/timers?limit=5', {
 headers: { Authorization: `Bearer ${token}` },
 });

 if (!entryRes.ok) {
 return;
 }

 const entryData = await entryRes.json().catch(() => null);
 if (entryData?.success && Array.isArray(entryData.data)) {
 setTimeEntries(entryData.data.filter((entry: TimeEntry) => entry.endTime !== null));
 }
 };

 const startTimer = async () => {
 const modeTime =
 timerMode === 'countdown'
 ? timerState.countdownTime
 : timerMode === 'pomodoro'
 ? timerState.pomodoroTime
 : timerState.stopwatchTime;

 if (timerMode !== 'stopwatch' && modeTime <= 0) {
 toast({
 title: 'Set a duration first',
 description: 'Please set a valid duration before starting.',
 variant: 'destructive',
 className: 'bg-muted text-foreground border-border',
 });
 return;
 }

 if ((timerMode === 'countdown' || (timerMode === 'pomodoro' && pomodoroState.isBreak)) && !currentTask.description.trim()) {
 setTimerState(prev => ({ ...prev, status: 'running' }));
 return;
 }
 if (!currentTask.description.trim()) {
 setDescriptionError(true);
 toast({
 title: 'Say what you are working on',
 description: 'Say what you are working on first before starting the timer',
 variant: 'destructive',
 action: (
 <Button
 variant="secondary"
 onClick={() => document.getElementById('task-description-input')?.focus()}
 className="bg-primary text-white hover:bg-primary/80"
 >
 What are you working on?
 </Button>
 ),
 className: 'bg-muted text-foreground border-border',
 });
 return;
 }
 setDescriptionError(false);

 // Countdown and Pomodoro sessions are local-only timers.
 // Keeping them local prevents stale backend active timers when users reset or auto-complete sessions.
 if (timerMode !== 'stopwatch') {
 setTimerState(prev => ({
 ...prev,
 status: 'running',
 activeTimerId: null,
 startTime: undefined,
 }));

 toast({
 title: 'Started',
 description: `Running ${timerMode} for"${currentTask.description}"`,
 className: 'bg-muted text-foreground border-border',
 });
 return;
 }

 try {
 if (!token) {
 toast({
 title: 'Signed out',
 description: 'Please log in to start the timer.',
 variant: 'destructive',
 className: 'bg-muted text-foreground border-border',
 });
 logout();
 return;
 }
 const projectId = toProjectId(currentTask.projectId);
 const tagIds = currentTask.tags.map(tag => tag.id);
 console.log('Starting timer with tagIds:', tagIds);
 const now = new Date();
 let requestedStartDate = now;

 if (timerMode === 'stopwatch' && isBackdatingStart) {
 const candidate = new Date(manualStartDateTime);

 if (Number.isNaN(candidate.getTime())) {
 toast({
 title: 'That start time doesn’t work',
 description: 'Please pick a valid start date and time.',
 variant: 'destructive',
 className: 'bg-muted text-foreground border-border',
 });
 return;
 }

 if (candidate.getTime() > now.getTime()) {
 toast({
 title: 'That is in the future',
 description: 'Start date/time must be current or earlier.',
 variant: 'destructive',
 className: 'bg-muted text-foreground border-border',
 });
 return;
 }

 requestedStartDate = candidate;
 }

 const startTime = toLocalDateTimeString(requestedStartDate);
 const res = await fetch('/api/timers/start', {
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
 title: 'Signed out',
 description: 'Your session has expired. Please log in again.',
 variant: 'destructive',
 className: 'bg-muted text-foreground border-border',
 });
 logout();
 return;
 }

 const response = await res.json().catch(() => null);
 const responseErrorMessage = response?.errors?.message || response?.message;

 if (res.status === 409) {
 toast({
 title: 'A timer is already running',
 description: responseErrorMessage || 'Please stop the current timer before starting a new one.',
 variant: 'destructive',
 className: 'bg-muted text-foreground border-border',
 });
 return;
 }

 if (!res.ok || !response?.success) {
 const serverMessage = responseErrorMessage || `Failed to start timer (HTTP ${res.status})`;
 toast({
 title: 'Server Error',
 description: serverMessage,
 variant: 'destructive',
 className: 'bg-muted text-foreground border-border',
 });
 throw new Error(serverMessage);
 }

 setTimerState(prev => ({
 ...prev,
 status: 'running',
 activeTimerId: response.data.id,
 startTime: startTime,
 stopwatchTime:
 timerMode === 'stopwatch'
 ? Math.max(0, Math.floor((Date.now() - requestedStartDate.getTime()) / 1000))
 : prev.stopwatchTime,
 }));
 toast({
 title: 'Started',
 description: `Tracking"${currentTask.description}"`,
 className: 'bg-muted text-foreground border-border',
 });
 } catch (error) {
 const errorMessage = error instanceof Error ? error.message : 'Could not connect to the server.';
 console.error('Start timer error:', error);
 toast({
 title: 'Timer Start Failed',
 description: errorMessage,
 variant: 'destructive',
 className: 'bg-muted text-foreground border-border',
 });
 }
 };

 const stopTimer = async (options?: { triggeredByReset?: boolean }): Promise<boolean> => {
 if (timerMode === 'countdown' || (timerMode === 'pomodoro' && pomodoroState.isBreak)) {
 // Best-effort cleanup for stale server timers from older sessions.
 if (timerState.activeTimerId && timerState.startTime) {
 try {
 if (token) {
 await fetch(`/api/timers/${timerState.activeTimerId}/stop`, {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 Authorization: `Bearer ${token}`,
 },
 body: JSON.stringify({
 description: currentTask.description?.trim() || `${timerMode} session`,
 startTime: timerState.startTime,
 endTime: toLocalDateTimeString(new Date()),
 projectId: toProjectId(currentTask.projectId),
 tagIds: currentTask.tags.map(tag => tag.id),
 billable: currentTask.billable,
 }),
 });
 }
 } catch (cleanupError) {
 console.warn('Could not cleanup stale backend timer during local stop:', cleanupError);
 }
 }

 clearTimerStateLocally({
 showResetToast: true,
 resetDescription: 'Timer has been reset.',
 });
 return true;
 }
 if (!timerState.activeTimerId) {
 toast({
 title: 'No Active Timer',
 description: 'There is no timer to stop',
 variant: 'destructive',
 className: 'bg-muted text-foreground border-border',
 });
 return false;
 }

 try {
 if (!token) {
 toast({
 title: 'Signed out',
 description: 'Please log in to stop the timer.',
 variant: 'destructive',
 className: 'bg-muted text-foreground border-border',
 });
 logout();
 return false;
 }
 const fallbackStartTime = toLocalDateTimeString(
 new Date(Date.now() - Math.max(0, timerState.stopwatchTime) * 1000)
 );
 const effectiveStartTime = timerState.startTime || fallbackStartTime;
 const projectId = toProjectId(currentTask.projectId);
 const tagIds = currentTask.tags.map(tag => tag.id);
 console.log('Stopping timer with tagIds:', tagIds);
 const endTime = toLocalDateTimeString(new Date());
 const res = await fetch(`/api/timers/${timerState.activeTimerId}/stop`, {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 Authorization: `Bearer ${token}`,
 },
 body: JSON.stringify({
 description: currentTask.description?.trim() || 'Untitled task',
 startTime: effectiveStartTime,
 endTime: endTime,
 projectId: projectId,
 tagIds: tagIds,
 billable: currentTask.billable,
 }),
 });
 if (res.status === 401) {
 toast({
 title: 'Signed out',
 description: 'Your session has expired. Please log in again.',
 variant: 'destructive',
 className: 'bg-muted text-foreground border-border',
 });
 logout();
 return false;
 }
 const response = await res.json();
 if (!response.success) {
 toast({
 title: 'Server Error',
 description: response.message || 'Failed to stop timer.',
 variant: 'destructive',
 className: 'bg-muted text-foreground border-border',
 });
 throw new Error('Stop failed');
 }
 await refreshRecentTimeEntries(token);
 clearTimerStateLocally();
 if (options?.triggeredByReset) {
 toast({
 title: 'Timer reset',
 description: `Stopped and saved"${currentTask.description}" before reset.`,
 className: 'bg-muted text-foreground border-border',
 });
 } else {
 toast({
 title: 'Time Entry Saved',
 description: `Saved time entry for"${currentTask.description}"`,
 className: 'bg-muted text-foreground border-border',
 });
 }
 return true;
 } catch (error) {
 console.error('Stop timer error:', error);
 toast({
 title: 'Network Error',
 description: options?.triggeredByReset
 ? 'Could not stop and save the active timer before reset.'
 : 'Could not connect to the server.',
 variant: 'destructive',
 className: 'bg-muted text-foreground border-border',
 });
 return false;
 }
 };

 const resetTimer = async () => {
 if (timerState.status === 'running') {
 setIsResetConfirmOpen(true);
 return;
 }

 if (timerState.activeTimerId) {
 const wasStopped = await stopTimer({ triggeredByReset: true });
 if (!wasStopped) {
 clearTimerStateLocally({
 showResetToast: true,
 resetDescription: 'Timer reset locally. The active session could not be saved.',
 });
 }
 return;
 }

 clearTimerStateLocally({ showResetToast: true });
 };

 const confirmRunningReset = async () => {
 setIsResetInProgress(true);
 setIsResetConfirmOpen(false);

 try {
 if (timerState.activeTimerId) {
 const wasStopped = await stopTimer({ triggeredByReset: true });
 if (!wasStopped) {
 clearTimerStateLocally({
 showResetToast: true,
 resetDescription: 'Timer reset locally. The active session could not be saved.',
 });
 }
 return;
 }

 clearTimerStateLocally({ showResetToast: true });
 } finally {
 setIsResetInProgress(false);
 }
 };

 const toggleTimer = () => {
 if (timerState.status === 'stopped') {
 startTimer();
 } else if (timerState.status === 'running') {
 setTimerState(prev => ({ ...prev, status: 'paused' }));
 toast({
 title: 'Timer Paused',
 description: 'Your timer is paused.',
 className: 'bg-muted text-foreground border-border',
 });
 } else {
 setTimerState(prev => ({ ...prev, status: 'running' }));
 toast({
 title: 'Timer Resumed',
 description: 'Your timer is running.',
 className: 'bg-muted text-foreground border-border',
 });
 }
 };

 const handleSelectCountdownPreset = (seconds: number) => {
 const safeSeconds = Math.max(60, Math.floor(Number.isFinite(seconds) ? seconds : 60));
 setCountdownPreset(safeSeconds);
 setCustomHours(Math.floor(safeSeconds / 3600));
 setCustomMinutes(Math.floor((safeSeconds % 3600) / 60));
 setTimerState(prev => ({ ...prev, countdownTime: safeSeconds }));
 };

 const handleSetCustomCountdown = (minutes: number) => {
 const safeMinutes = Math.min(720, Math.max(1, Math.floor(Number.isFinite(minutes) ? minutes : 1)));
 const seconds = safeMinutes * 60;
 setCountdownPreset(seconds);
 setCustomHours(Math.floor(safeMinutes / 60));
 setCustomMinutes(safeMinutes % 60);
 setTimerState(prev => ({ ...prev, countdownTime: seconds }));
 };

 // The dialog's inputs are a pending duration until"Apply" commits them, so
 // anything other than the duration already in force counts as an unsaved edit.
 const pendingCustomCountdownSeconds = Math.max(1, customHours * 60 + customMinutes) * 60;
 const hasUnappliedCustomCountdown = pendingCustomCountdownSeconds !== countdownPreset;

 const closeCustomCountdownDialog = useCallback(() => {
 // Put the inputs back to the duration that is actually in force, so a
 // dismissed edit doesn't linger as a stale number on the next open.
 setCustomHours(Math.floor(countdownPreset / 3600));
 setCustomMinutes(Math.floor((countdownPreset % 3600) / 60));
 setIsCustomCountdownDialogOpen(false);
 }, [countdownPreset]);

 const {
 isDiscardPromptOpen: isCustomCountdownDiscardOpen,
 requestClose: requestCustomCountdownClose,
 discardAndClose: discardCustomCountdown,
 keepEditing: keepEditingCustomCountdown,
 } = useUnsavedChangesGuard({
 isOpen: isCustomCountdownDialogOpen,
 isDirty: hasUnappliedCustomCountdown,
 onClose: closeCustomCountdownDialog,
 });

 // The one concrete "previous time" this page knows about: the moment the last
 // tracked session ended. Anything older than the window would turn a forgotten
 // start into an invented multi-hour entry, so it isn't offered.
 const resumeAnchor = useMemo(() => {
 const now = Date.now();
 let latestEnd = 0;

 timeEntries.forEach(entry => {
 if (!entry.endTime) {
 return;
 }

 const end = parseDateTimeAsLocal(entry.endTime).getTime();
 if (!Number.isFinite(end) || end > now || now - end > RESUME_ANCHOR_WINDOW_MS) {
 return;
 }

 latestEnd = Math.max(latestEnd, end);
 });

 return latestEnd > 0 ? new Date(latestEnd) : null;
 }, [timeEntries]);

 // Whatever start the timer would actually use, named so the control can say it.
 const backdatedStart = useMemo(() => {
 if (!isBackdatingStart) {
 return null;
 }

 const parsed = new Date(manualStartDateTime);
 return Number.isNaN(parsed.getTime()) ? null : parsed;
 }, [isBackdatingStart, manualStartDateTime]);

 const backdatePreview = useMemo(() => {
 if (!backdatedStart) {
 return null;
 }

 // backdatePreviewTick keeps this from going stale while the page sits idle.
 void backdatePreviewTick;
 const elapsedSeconds = Math.floor((Date.now() - backdatedStart.getTime()) / 1000);

 if (elapsedSeconds < 0) {
 return { isValid: false, label: 'That time is in the future — pick an earlier one.' };
 }

 return {
 isValid: true,
 label: `Start will show ${formatSecondsAsHoursMinutes(elapsedSeconds)} already tracked.`,
 };
 }, [backdatedStart, backdatePreviewTick]);

 const canOfferResume = timerMode === 'stopwatch' && timerState.status === 'stopped' && Boolean(resumeAnchor);

 // Refresh the elapsed preview, but only while it is actually on screen.
 useEffect(() => {
 if (!isBackdatingStart || !canOfferResume) {
 return;
 }

 const interval = window.setInterval(() => setBackdatePreviewTick(tick => tick + 1), 30000);
 return () => window.clearInterval(interval);
 }, [isBackdatingStart, canOfferResume]);

 // Never leave a backdate armed once its control is off screen — a timer that
 // silently starts hours in the past is worse than the vague switch it replaced.
 useEffect(() => {
 if (!resumeAnchor && (isBackdatingStart || showCustomStartPicker)) {
 setIsBackdatingStart(false);
 setShowCustomStartPicker(false);
 }
 }, [resumeAnchor, isBackdatingStart, showCustomStartPicker]);

 const toggleBackdatedStart = () => {
 if (isBackdatingStart) {
 setIsBackdatingStart(false);
 setShowCustomStartPicker(false);
 setManualStartDateTime(formatDateTimeLocalInput(new Date()));
 return;
 }

 if (!resumeAnchor) {
 return;
 }

 setManualStartDateTime(formatDateTimeLocalInput(resumeAnchor));
 setIsBackdatingStart(true);
 };

 const handleCustomStartChange = (value: string) => {
 setManualStartDateTime(value);
 setIsBackdatingStart(Boolean(value));
 };

 const handleAddTag = async () => {
 if (!currentTask.newTag.trim()) return;
 try {
 if (!token) {
 toast({
 title: 'Signed out',
 description: 'Your session has expired. Please log in again.',
 variant: 'destructive',
 className: 'bg-muted text-foreground border-border',
 });
 logout();
 return;
 }
 const res = await fetch('/api/tags', {
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
 title: 'Signed out',
 description: 'Your session has expired. Please log in again.',
 variant: 'destructive',
 className: 'bg-muted text-foreground border-border',
 });
 logout();
 return;
 }
 if (res.status === 409) {
 toast({
 title: 'Tag Exists',
 description: `Tag"${currentTask.newTag}" already exists.`,
 variant: 'destructive',
 className: 'bg-muted text-foreground border-border',
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
 description: `Tag"${newTag.name}" created successfully!`,
 className: 'bg-muted text-foreground border-border',
 });
 } catch (error) {
 console.error('Error creating tag:', error);
 toast({
 title: 'Error',
 description: 'Failed to create tag.',
 variant: 'destructive',
 className: 'bg-muted text-foreground border-border',
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

 const handleDeleteTimeEntry = async (entryId: number) => {
 if (deletingEntryId === entryId) {
 return;
 }

 try {
 setDeletingEntryId(entryId);
 if (!token) {
 toast({
 title: 'Signed out',
 description: 'Please log in to delete the entry.',
 variant: 'destructive',
 className: 'bg-muted text-foreground border-border',
 });
 logout();
 return;
 }

 const response = await fetch(`/api/timers/${entryId}`, {
 method: 'DELETE',
 headers: {
 Authorization: `Bearer ${token}`,
 },
 });

 if (response.status === 401) {
 toast({
 title: 'Signed out',
 description: 'Your session has expired. Please log in again.',
 variant: 'destructive',
 className: 'bg-muted text-foreground border-border',
 });
 logout();
 return;
 }

 const payload = await response.json().catch(() => null);
 if (!response.ok || payload?.success === false) {
 throw new Error(payload?.message || 'Failed to delete time entry');
 }

 setTimeEntries((previous) => previous.filter((entry) => entry.id !== entryId));
 toast({
 title: 'Entry Deleted',
 description: 'Time entry was removed successfully.',
 className: 'bg-muted text-foreground border-border',
 });
 } catch (error) {
 const errorMessage = error instanceof Error ? error.message : 'Failed to delete time entry.';
 toast({
 title: 'Delete Failed',
 description: errorMessage,
 variant: 'destructive',
 className: 'bg-muted text-foreground border-border',
 });
 } finally {
 setDeletingEntryId(null);
 }
 };

 const recordDailyMarker = async (markerType: DailyMarkerType) => {
 if (dailyMarkerLoading) {
 return;
 }

 const markerConfig = DAILY_MARKER_CONFIG[markerType];

 try {
 setDailyMarkerLoading(markerType);

 if (!token) {
 toast({
 title: 'Signed out',
 description: 'Your session has expired. Please log in again.',
 variant: 'destructive',
 className: 'bg-muted text-foreground border-border',
 });
 logout();
 return;
 }

 const now = new Date();
 const endDate = new Date(now.getTime() + 1000);
 const startOfDay = new Date(now);
 startOfDay.setHours(0, 0, 0, 0);
 const endOfDay = new Date(now);
 endOfDay.setHours(23, 59, 59, 0);

 const existingEntriesResponse = await fetch(
 `/api/timers?start=${encodeURIComponent(toLocalDateTimeString(startOfDay))}&end=${encodeURIComponent(
 toLocalDateTimeString(endOfDay)
 )}`,
 {
 headers: { Authorization: `Bearer ${token}` },
 }
 );

 if (existingEntriesResponse.status === 401) {
 toast({
 title: 'Signed out',
 description: 'Your session has expired. Please log in again.',
 variant: 'destructive',
 className: 'bg-muted text-foreground border-border',
 });
 logout();
 return;
 }

 const existingEntriesPayload = await existingEntriesResponse.json().catch(() => null);
 if (!existingEntriesResponse.ok || !existingEntriesPayload?.success) {
 throw new Error(existingEntriesPayload?.message || 'Unable to load today\'s entries.');
 }

 const existingMarker = (existingEntriesPayload.data as TimeEntry[]).find(
 (entry) => entry.description === markerConfig.description
 );

 const markerPayload = {
 description: markerConfig.description,
 startTime: toLocalDateTimeString(now),
 endTime: toLocalDateTimeString(endDate),
 category: markerConfig.category,
 tagIds: [],
 projectId: null,
 billable: false,
 positionTop: null,
 positionLeft: null,
 linkedGoal: null,
 focusScore: null,
 energyScore: null,
 blockers: null,
 contextNotes: markerConfig.contextNotes,
 aiDetail: null,
 };

 const markerResponse = await fetch(
 existingMarker ? `/api/timers/${existingMarker.id}` : '/api/timers/addTimer',
 {
 method: existingMarker ? 'PUT' : 'POST',
 headers: {
 'Content-Type': 'application/json',
 Authorization: `Bearer ${token}`,
 },
 body: JSON.stringify(markerPayload),
 }
 );

 if (markerResponse.status === 401) {
 toast({
 title: 'Signed out',
 description: 'Your session has expired. Please log in again.',
 variant: 'destructive',
 className: 'bg-muted text-foreground border-border',
 });
 logout();
 return;
 }

 const markerResult = await markerResponse.json().catch(() => null);
 if (!markerResponse.ok || !markerResult?.success) {
 throw new Error(markerResult?.message || 'Failed to save daily marker.');
 }

 await refreshRecentTimeEntries(token);

 toast({
 title: existingMarker ? markerConfig.updatedTitle : markerConfig.recordedTitle,
 description: `${markerConfig.description} saved at ${now.toLocaleTimeString([], {
 hour: '2-digit',
 minute: '2-digit',
 })}. This is now synced to your knowledge base.`,
 className: 'bg-muted text-foreground border-border',
 });
 } catch (error) {
 const errorMessage = error instanceof Error ? error.message : 'Failed to save daily marker.';
 toast({
 title: 'Daily Marker Failed',
 description: errorMessage,
 variant: 'destructive',
 className: 'bg-muted text-foreground border-border',
 });
 } finally {
 setDailyMarkerLoading(null);
 }
 };

 const QuoteComponent = useMemo(() => {
 return () => (
 <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3">
 <p className="min-w-0 text-sm text-surface-foreground">
 <span className="italic">&ldquo;{currentQuote.text}&rdquo;</span>
 <span className="ml-2 text-muted-foreground">— {currentQuote.author}</span>
 </p>
 <button
 type="button"
 aria-label="Show another quote"
 onClick={() => setCurrentQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)])}
 className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
 >
 <RefreshCw className="h-4 w-4" />
 </button>
 </div>
 );
 }, [currentQuote]);

 const renderTimer = () => {
 const currentTime = Math.max(
 0,
 timerState[timerMode === 'stopwatch' ? 'stopwatchTime' : timerMode === 'countdown' ? 'countdownTime' : 'pomodoroTime']
 );
 const formattedTime = formatTime(currentTime);
 const totalTime = timerMode === 'countdown' ? countdownPreset :
 timerMode === 'pomodoro' ? (
 pomodoroState.isBreak
 ? (pomodoroState.currentSession % preferences.pomodoroSettings.sessionsUntilLongBreak === 0
 ? preferences.pomodoroSettings.longBreakDuration
 : preferences.pomodoroSettings.shortBreakDuration) * 60
 : preferences.pomodoroSettings.workDuration * 60
 ) : 3600;
 const safeTotalTime = Math.max(1, totalTime);
 const rawProgress = timerMode === 'stopwatch'
 ? currentTime / safeTotalTime
 : (safeTotalTime - currentTime) / safeTotalTime;
 const progress = Math.min(1, Math.max(0, rawProgress));
 const modeLabel = timerMode.charAt(0).toUpperCase() + timerMode.slice(1);
 const statusLabel = timerState.status.charAt(0).toUpperCase() + timerState.status.slice(1);

 return (
 <div className="mt-6 w-full">
 <div className="mx-auto w-full max-w-xl rounded-3xl border border-border bg-card p-5 shadow-[0_18px_40px_rgba(45,55,72,0.12)] backdrop-blur sm:p-7">
 <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
 <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold tracking-wide text-muted-foreground">
 {modeLabel}
 </span>
 <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold tracking-wide text-muted-foreground">
 {statusLabel}
 </span>
 </div>
 <motion.div
 className="text-center font-mono text-5xl font-semibold tracking-wider text-foreground sm:text-7xl"
 animate={{ scale: timerState.status === 'running' ? [1, 1.025, 1] : 1 }}
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
 </div>
 );
 };

 useEffect(() => {
 const handleKeyDown = (e: KeyboardEvent) => {
 if (
 e.target instanceof HTMLInputElement
 || e.target instanceof HTMLTextAreaElement
 || e.target instanceof HTMLSelectElement
 || (e.target instanceof HTMLElement && e.target.isContentEditable)
 ) {
 return;
 }

 if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) {
 return;
 }

 if (e.code === 'Space') {
 e.preventDefault();
 toggleTimer();
 }
 if (e.code === 'KeyS') {
 if (timerState.status !== 'stopped') {
 e.preventDefault();
 stopTimer();
 }
 }
 if (e.code === 'KeyR') {
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
 }, [timerState.status, toggleTimer, stopTimer, resetTimer, handleTimerModeChange]);

 const agenticPendingCount = (agenticSyncStatus?.pending || 0) + (agenticSyncStatus?.retry || 0);
 const agenticHasBacklog = agenticPendingCount > 0 || (agenticSyncStatus?.processing || 0) > 0;
 const agenticIsDegraded = Boolean(
 agenticSyncStatus
 && ((agenticSyncStatus.cooldownRemainingSeconds || 0) > 0 || agenticHasBacklog)
 );
 const agenticHasFailedOnly = Boolean(
 agenticSyncStatus
 && !agenticIsDegraded
 && (agenticSyncStatus.failed > 0 || agenticSyncStatus.hasFailures)
 );

 return (
 <div className="min-h-screen bg-background font-sans">
 <main className="relative z-10 mx-auto w-full max-w-5xl px-3 pb-8 pt-4 sm:px-6 sm:pb-12 sm:pt-8">
 <TimerHeader
 setShowSettingsDialog={setShowSettingsDialog}
 setShowKeyboardShortcutsDialog={setShowKeyboardShortcutsDialog}
 />
 {fetchError && (
 <motion.div
 className="mb-6 flex flex-col gap-3 rounded-xl border border-border border-l-4 border-l-destructive bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
 initial={{ opacity: 0, y: -10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.3 }}
 role="status"
 >
 <div className="flex items-start gap-2">
 <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
 <div className="text-sm text-surface-foreground">
 <p className="font-medium">Some of your data didn&apos;t load</p>
 <p className="text-muted-foreground">{fetchError}</p>
 </div>
 </div>
 <div className="flex shrink-0 gap-2">
 <Button type="button" size="sm" onClick={() => window.location.reload()}>
 Retry
 </Button>
 <Button type="button" size="sm" variant="ghost" onClick={() => setFetchError(null)}>
 Dismiss
 </Button>
 </div>
 </motion.div>
 )}

 {agenticIsDegraded && (
 <motion.div
 className="mb-6 rounded-2xl border border-amber-300/60 bg-amber-50/85 p-4 text-amber-900 shadow-sm dark:border-amber-700/60 dark:bg-amber-950/35 dark:text-amber-100"
 initial={{ opacity: 0, y: -10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.25 }}
 >
 <div className="flex items-start gap-3">
 <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
 <div className="space-y-1 text-sm">
 <p className="font-semibold">Sync is having trouble</p>
 <p>
 Background sync is delayed. You can keep working locally, then use the refresh/sync action once Agentic is back.
 </p>
 <p className="text-xs opacity-90">
 Cooldown: {Math.max(0, agenticSyncStatus?.cooldownRemainingSeconds || 0)}s | Pending: {agenticPendingCount} | Failed: {agenticSyncStatus?.failed || 0}
 </p>
 </div>
 </div>
 </motion.div>
 )}

 {agenticHasFailedOnly && (
 <motion.div
 className="mb-6 rounded-2xl border border-yellow-300/60 bg-yellow-50/85 p-4 text-yellow-900 shadow-sm dark:border-yellow-700/60 dark:bg-yellow-950/35 dark:text-yellow-100"
 initial={{ opacity: 0, y: -10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.25 }}
 >
 <div className="flex items-start justify-between gap-3">
 <div className="space-y-1 text-sm">
 <p className="font-semibold">Sync needs attention</p>
 <p>
 Queue is idle, but {agenticSyncStatus?.failed || 0} earlier sync event(s) failed and need retry.
 </p>
 </div>
 <Button
 type="button"
 variant="outline"
 size="sm"
 onClick={() => {
 void retryFailedAgenticEvents();
 }}
 disabled={agenticRetryInProgress}
 className="shrink-0 rounded-xl border-yellow-500/40 bg-yellow-100/80 text-yellow-900 hover:bg-yellow-200 dark:border-yellow-600/40 dark:bg-yellow-900/40 dark:text-yellow-100"
 >
 {agenticRetryInProgress ? 'Retrying...' : 'Retry didn’t work Sync'}
 </Button>
 </div>
 </motion.div>
 )}

 <div className="relative mb-6 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
 <div className="pointer-events-none absolute -bottom-16 -left-12 h-36 w-36 rounded-full bg-muted blur-2xl" />
 <div className="relative">
 <Input
 type="text"
 placeholder="What are you working on?"
 value={currentTask.description}
 onChange={e => {
 setCurrentTask(prev => ({ ...prev, description: e.target.value }));
 setDescriptionError(false);
 }}
 className={`w-full rounded-2xl border-border bg-muted px-4 py-4 font-serif text-base text-foreground shadow-sm focus:ring-2 focus:ring-ring sm:px-5 sm:py-5 sm:text-xl ${descriptionError ? 'border-destructive border-2' : ''}`}
 disabled={timerState.status === 'running'}
 id="task-description-input"
 />
 {descriptionError && (
 <motion.p
 className="text-destructive text-sm mt-2 font-serif"
 initial={{ opacity: 0, y: -10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.3 }}
 >
 Say what you are working on first
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
 <TabsList className="grid h-auto grid-cols-3 rounded-2xl border border-border bg-muted p-1.5 shadow-sm">
 <TabsTrigger
 value="stopwatch"
 disabled={timerState.status !== 'stopped'}
 className="flex items-center gap-1 rounded-xl py-2.5 text-xs font-semibold tracking-wide text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 sm:gap-2 sm:text-sm"
 >
 <Timer className="h-4 w-4" />
 Stopwatch
 </TabsTrigger>
 <TabsTrigger
 value="countdown"
 disabled={timerState.status !== 'stopped'}
 className="flex items-center gap-1 rounded-xl py-2.5 text-xs font-semibold tracking-wide text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 sm:gap-2 sm:text-sm"
 >
 <AlarmClock className="h-4 w-4" />
 Countdown
 </TabsTrigger>
 <TabsTrigger
 value="pomodoro"
 disabled={timerState.status !== 'stopped'}
 className="flex items-center gap-1 rounded-xl py-2.5 text-xs font-semibold tracking-wide text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 sm:gap-2 sm:text-sm"
 >
 <Coffee className="h-4 w-4" />
 Pomodoro
 </TabsTrigger>
 </TabsList>

 <TabsContent value="stopwatch" className="mt-4 p-0">
 <div className="flex flex-col items-center gap-6">
 {renderTimer()}
 <TimerControls
 timerState={timerState}
 toggleTimer={toggleTimer}
 stopTimer={stopTimer}
 resetTimer={resetTimer}
 />

 {/* Backdating is a rare rescue, not the main action, so it sits below
 Start as one line — and only once there is a real time to resume from. */}
 {canOfferResume && resumeAnchor && (
 <div className="w-full max-w-xl">
 <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-2">
 <Button
 type="button"
 variant={isBackdatingStart ? 'default' : 'ghost'}
 size="sm"
 onClick={toggleBackdatedStart}
 aria-pressed={isBackdatingStart}
 className="h-8 rounded-lg px-2.5 text-xs font-semibold"
 >
 <History className="h-3.5 w-3.5" />
 {backdatedStart
 ? `Starting from ${formatResumeAnchorLabel(backdatedStart)}`
 : `Resume from ${formatResumeAnchorLabel(resumeAnchor)}`}
 </Button>

 <Button
 type="button"
 variant="ghost"
 size="sm"
 onClick={() => setShowCustomStartPicker(previous => !previous)}
 aria-expanded={showCustomStartPicker}
 aria-controls="manual-start-datetime"
 className="h-8 rounded-lg px-2.5 text-xs text-muted-foreground"
 >
 {showCustomStartPicker ? 'Done' : 'Another time'}
 </Button>
 </div>

 {showCustomStartPicker && (
 <div className="mt-2 rounded-xl border border-border bg-surface px-3 py-2">
 <label htmlFor="manual-start-datetime" className="text-xs font-semibold text-muted-foreground">
 Start the stopwatch at
 </label>
 <Input
 id="manual-start-datetime"
 type="datetime-local"
 value={manualStartDateTime}
 max={formatDateTimeLocalInput(new Date())}
 onChange={(event) => handleCustomStartChange(event.target.value)}
 className="mt-1 h-9 rounded-lg border-border bg-card text-sm text-foreground shadow-sm"
 />
 </div>
 )}

 {backdatePreview && (
 <p
 className={`mt-2 px-1 text-xs ${backdatePreview.isValid ? 'text-muted-foreground' : 'text-destructive'}`}
 role="status"
 >
 {backdatePreview.label}
 </p>
 )}
 </div>
 )}
 </div>
 </TabsContent>

 <TabsContent value="countdown" className="mt-4 p-0">
 <div className="flex flex-col items-center gap-6">
 <div className="mb-1 flex w-full max-w-xl gap-2 overflow-x-auto pb-2">
 {preferences.countdownPresets.map(seconds => (
 <Button
 key={seconds}
 variant={countdownPreset === seconds ? 'default' : 'outline'}
 size="sm"
 onClick={() => handleSelectCountdownPreset(seconds)}
 className={`min-w-[4.5rem] rounded-xl px-4 font-serif ${
 countdownPreset === seconds
 ? 'bg-primary text-white hover:bg-primary/85'
 : 'bg-muted border-border text-muted-foreground hover:bg-primary/20'
 }`}
 >
 {formatSecondsAsHoursMinutes(seconds)}
 </Button>
 ))}
 <Dialog
 open={isCustomCountdownDialogOpen}
 onOpenChange={(open) => {
 if (open) {
 setIsCustomCountdownDialogOpen(true);
 return;
 }

 // Outside click, Escape and the corner X all land here, so the
 // guard covers every way out of a half-typed duration.
 requestCustomCountdownClose();
 }}
 >
 <DialogTrigger asChild>
 <Button
 variant="outline"
 size="sm"
 className="rounded-xl bg-muted border-border text-muted-foreground hover:bg-primary/20 font-serif"
 >
 <Plus className="h-4 w-4 mr-1" />
 Custom
 </Button>
 </DialogTrigger>
 <DialogContent
 className="max-w-[94vw] sm:max-w-md bg-card border-border rounded-xl"
 onEscapeKeyDown={(event) => {
 if (isCustomCountdownDiscardOpen) {
 event.preventDefault();
 keepEditingCustomCountdown();
 }
 }}
 >
 <DialogHeader>
 <DialogTitle className="text-foreground font-serif">Set a duration</DialogTitle>
 <DialogDescription className="text-muted-foreground">
 Advanced mode adds separate hour and minute controls.
 </DialogDescription>
 </DialogHeader>

 <div className="space-y-4 py-2">
 <div className="flex items-center justify-between rounded-xl border border-border bg-muted px-3 py-2">
 <div>
 <p className="text-sm font-semibold text-foreground">Advanced</p>
 <p className="text-xs text-muted-foreground">Extra controls, only when you need them</p>
 </div>
 <Switch
 checked={showAdvancedCustomCountdown}
 onCheckedChange={setShowAdvancedCustomCountdown}
 aria-label="Toggle advanced custom timer inputs"
 />
 </div>

 {!showAdvancedCustomCountdown && (
 <div className="flex items-center gap-3">
 <div className="min-w-[4.5rem] rounded-lg bg-surface px-2 py-1 text-center text-xs font-semibold text-primary">
 Quick
 </div>
 <Input
 type="number"
 min="1"
 max="720"
 placeholder="Total duration"
 value={customHours > 0 ? customHours * 60 + customMinutes : customMinutes}
 onChange={(e) => {
 const parsed = Number(e.target.value);
 const safeMinutes = Number.isFinite(parsed) ? Math.max(1, Math.min(720, Math.floor(parsed))) : 1;
 setCustomHours(Math.floor(safeMinutes / 60));
 setCustomMinutes(safeMinutes % 60);
 }}
 className="flex-1 bg-muted border-border text-foreground"
 id="custom-minutes"
 />
 </div>
 )}

 {showAdvancedCustomCountdown && (
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label htmlFor="custom-hours" className="mb-1 block text-xs font-semibold text-muted-foreground">
 Hours
 </label>
 <Input
 id="custom-hours"
 type="number"
 min="0"
 max="12"
 value={customHours}
 onChange={(e) => {
 const parsed = Number(e.target.value);
 setCustomHours(Number.isFinite(parsed) ? Math.max(0, Math.min(12, Math.floor(parsed))) : 0);
 }}
 className="bg-muted border-border text-foreground"
 />
 </div>
 <div>
 <label htmlFor="custom-minutes-advanced" className="mb-1 block text-xs font-semibold text-muted-foreground">
 Minutes
 </label>
 <Input
 id="custom-minutes-advanced"
 type="number"
 min="0"
 max="59"
 value={customMinutes}
 onChange={(e) => {
 const parsed = Number(e.target.value);
 setCustomMinutes(Number.isFinite(parsed) ? Math.max(0, Math.min(59, Math.floor(parsed))) : 0);
 }}
 className="bg-muted border-border text-foreground"
 />
 </div>
 </div>
 )}

 <div className="rounded-lg border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
 Total Duration: <span className="font-semibold text-foreground">{customHours}h {customMinutes}m</span>
 </div>
 </div>

 <DialogFooter>
 <Button
 onClick={() => {
 const totalMinutes = Math.max(1, customHours * 60 + customMinutes);
 handleSetCustomCountdown(totalMinutes);
 setIsCustomCountdownDialogOpen(false);
 }}
 className="bg-primary text-white hover:bg-primary/80 font-serif"
 >
 Apply Duration
 </Button>
 </DialogFooter>

 {isCustomCountdownDiscardOpen && (
 <div
 role="alertdialog"
 aria-modal="true"
 aria-labelledby="custom-countdown-discard-title"
 className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-card/95 p-5 backdrop-blur-sm"
 >
 <div className="w-full max-w-xs text-center">
 <p id="custom-countdown-discard-title" className="text-sm font-semibold text-foreground">
 Discard this duration?
 </p>
 <p className="mt-1 text-xs text-muted-foreground">
 {customHours}h {customMinutes}m hasn&apos;t been applied yet.
 </p>
 <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
 <Button
 autoFocus
 variant="outline"
 size="sm"
 onClick={keepEditingCustomCountdown}
 className="rounded-xl border-border"
 >
 Keep Editing
 </Button>
 <Button
 variant="outline"
 size="sm"
 onClick={discardCustomCountdown}
 className="rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10"
 >
 Discard
 </Button>
 </div>
 </div>
 </div>
 )}
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

 <TabsContent value="pomodoro" className="mt-4 p-0">
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
 onDeleteEntry={handleDeleteTimeEntry}
 deletingEntryId={deletingEntryId}
 projects={projects}
 />

 {/* Secondary actions live below the primary"start tracking" flow. */}
 <section className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
 <p className="text-sm font-semibold text-foreground">Daily checkpoints</p>
 <p className="mt-0.5 text-xs text-muted-foreground">
 One tap records today&apos;s wake-up or sign-off and syncs it to your Coach.
 </p>
 <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
 <Button
 type="button"
 variant="outline"
 onClick={() => {
 void recordDailyMarker('wake_up');
 }}
 disabled={dailyMarkerLoading !== null}
 isLoading={dailyMarkerLoading === 'wake_up'}
 className="h-11 justify-start gap-2"
 >
 <Sunrise className="h-4 w-4" />
 {DAILY_MARKER_CONFIG.wake_up.buttonLabel}
 </Button>

 <Button
 type="button"
 variant="outline"
 onClick={() => {
 void recordDailyMarker('sign_off');
 }}
 disabled={dailyMarkerLoading !== null}
 isLoading={dailyMarkerLoading === 'sign_off'}
 className="h-11 justify-start gap-2"
 >
 <Moon className="h-4 w-4" />
 {DAILY_MARKER_CONFIG.sign_off.buttonLabel}
 </Button>
 </div>
 </section>

 <QuoteComponent />
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

 <Dialog open={isResetConfirmOpen} onOpenChange={setIsResetConfirmOpen}>
 <DialogContent className="max-w-[92vw] sm:max-w-md bg-card border-border rounded-xl">
 <DialogHeader>
 <DialogTitle className="text-foreground font-serif">
 Reset Running Timer?
 </DialogTitle>
 <DialogDescription className="text-muted-foreground">
 Are you sure you want to reset the timer?
 </DialogDescription>
 </DialogHeader>

 <p className="text-sm text-muted-foreground">
 {timerState.activeTimerId
 ? 'Your current run will be stopped, saved, and then reset.'
 : 'Your current running session will be cleared and set back to its initial state.'}
 </p>

 <DialogFooter>
 <Button
 variant="outline"
 onClick={() => setIsResetConfirmOpen(false)}
 className="rounded-xl border-border bg-muted text-muted-foreground hover:bg-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
 >
 Cancel
 </Button>
 <Button
 onClick={() => {
 void confirmRunningReset();
 }}
 disabled={isResetInProgress}
 className="rounded-xl bg-brand text-white hover:opacity-90"
 >
 {isResetInProgress ? 'Resetting...' : 'Yes, Reset Timer'}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </div>
 );
}