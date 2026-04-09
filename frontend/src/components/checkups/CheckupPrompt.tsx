import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  BellRing,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Flame,
  ListChecks,
  NotebookText,
  SkipForward,
  Target,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTaskStore } from '../../store/taskStore';
import { formatMinutesAsHoursMinutes } from '../../utils/utils';

type CheckupType = 'morning' | 'evening';
type CheckupFrequency = 'daily' | 'weekly' | 'biweekly';

type OnboardingSnapshot = {
  role?: string;
  goals?: Array<{
    title?: string;
    priority?: string;
    endDate?: string;
    category?: string;
  }>;
  answers?: Array<{
    answer?: string;
    description?: string;
  }>;
  schedule?: {
    checkIn?: {
      preferredTime?: string;
      frequency?: string;
    };
    timezone?: string;
  };
  planner?: {
    notifications?: {
      remindersEnabled?: boolean;
    };
  };
  preferredTone?: string;
  mentor?: {
    archetype?: string;
    style?: string;
    name?: string;
  };
};

type CheckupApiPayload = {
  date?: string;
  checkup_type?: CheckupType;
  focus_target?: string;
  coach_message?: string;
  generated_with?: string;
  stats?: Record<string, unknown>;
  decision_metrics?: Record<string, unknown>;
  wins?: string[];
  blockers?: string[];
  tomorrow_focus?: string[];
  journaling?: Record<string, unknown>;
  reflection_journal?: Record<string, unknown>;
  performance?: {
    score?: number;
    objective_score?: number;
    subjective_score?: number;
  };
  context_snapshot?: Record<string, unknown>;
  perspective?: Record<string, unknown>;
};

type RagInsights = {
  mostUsedAgent?: string;
  topKnowledgeCategory?: string;
  learningVelocity?: number;
  avgDailyInteractions?: number;
  timeEntryRecords?: number;
  timeEntryBillableRecords?: number;
  avgTimeEntryMinutes?: number;
};

type CheckupRecord = {
  status: 'completed' | 'skipped';
  type: CheckupType;
  handledAt: string;
};

type PendingCheckup = {
  dateKey: string;
  dueMinutes: number;
  snoozedUntilMinutes: number | null;
  postponedMinutes: number;
  type: CheckupType;
};

type PersistedPromptState = {
  records: Record<string, CheckupRecord>;
  pending: PendingCheckup | null;
};

type CheckupConfig = {
  preferredTime: string;
  frequency: CheckupFrequency;
  timezone: string;
  remindersEnabled: boolean;
  preferredTone?: string;
  mentorArchetype?: string;
  mentorStyle?: string;
  mentorName?: string;
};

type FocusTaskSnapshot = {
  id: string;
  title: string;
  priority: string;
  status: string;
  deadline: string | null;
  estimatedDuration: number;
  timeSpent: number;
};

type DeadlineSnapshot = {
  id: string;
  title: string;
  dueInDays: number;
  deadline: string;
  priority: string;
  status: string;
};

type HabitSnapshot = {
  id: string;
  title: string;
  streakTarget: number;
  currentStreak: number;
  completedToday: boolean;
  completionRate7d: number;
};

type CheckupContext = {
  date: string;
  topGoals: string[];
  priorities: string[];
  priorityFocus: string;
  deadlineTasks: {
    overdue: number;
    dueToday: number;
  };
  completedTasksToday: number;
  plannedDeepWorkMinutes: number;
  ragInsights: RagInsights | null;
  focusTasks: FocusTaskSnapshot[];
  upcomingDeadlines: DeadlineSnapshot[];
  habitMetrics: {
    totalHabits: number;
    completedToday: number;
    avgStreak: number;
    completionRate7d: number;
  };
  habits: HabitSnapshot[];
  timeMetrics: {
    totalEstimatedMinutes: number;
    totalTimeSpentMinutes: number;
    deepWorkTargetMinutes: number;
    deepWorkCoverageRatio: number;
  };
};

const STORAGE_KEY = 'alterego-checkup-prompt-v1';
const POLL_INTERVAL_MS = 30000;
const POSTPONE_STEP_MINUTES = 15;
const POSTPONE_LIMIT_MINUTES = 60;

const readPersistedState = (): PersistedPromptState => {
  if (typeof window === 'undefined') {
    return { records: {}, pending: null };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { records: {}, pending: null };
    }

    const parsed = JSON.parse(raw) as Partial<PersistedPromptState>;
    return {
      records: typeof parsed.records === 'object' && parsed.records !== null ? parsed.records : {},
      pending: parsed.pending ?? null,
    };
  } catch {
    return { records: {}, pending: null };
  }
};

const writePersistedState = (state: PersistedPromptState) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const parseTimeToMinutes = (value: string): number => {
  const [hourPart, minutePart] = value.split(':');
  const hour = Number(hourPart);
  const minute = Number(minutePart);

  if (!Number.isFinite(hour) || !Number.isFinite(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return 9 * 60;
  }

  return hour * 60 + minute;
};

const getDateKeyPartsInTimeZone = (timezone: string) => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const lookup = (type: string) => parts.find((part) => part.type === type)?.value ?? '';

  const year = lookup('year');
  const month = lookup('month');
  const day = lookup('day');
  const hour = Number(lookup('hour'));
  const minute = Number(lookup('minute'));

  const safeHour = Number.isFinite(hour) ? hour : 0;
  const safeMinute = Number.isFinite(minute) ? minute : 0;

  return {
    dateKey: `${year}-${month}-${day}`,
    minutesOfDay: safeHour * 60 + safeMinute,
  };
};

const dateKeyToUtcDate = (dateKey: string): Date => {
  const [yearRaw, monthRaw, dayRaw] = dateKey.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return new Date(Date.UTC(1970, 0, 1));
  }

  return new Date(Date.UTC(year, month - 1, day));
};

const diffDays = (fromDateKey: string, toDateKey: string): number => {
  const from = dateKeyToUtcDate(fromDateKey);
  const to = dateKeyToUtcDate(toDateKey);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((to.getTime() - from.getTime()) / msPerDay);
};

const isSupportedFrequency = (value: string | undefined): value is CheckupFrequency => {
  return value === 'daily' || value === 'weekly' || value === 'biweekly';
};

const resolveFrequency = (value?: string): CheckupFrequency => {
  return isSupportedFrequency(value) ? value : 'daily';
};

const resolveCheckupType = (dueMinutes: number): CheckupType => {
  return dueMinutes < 15 * 60 ? 'morning' : 'evening';
};

const requiredGapDays = (frequency: CheckupFrequency): number => {
  if (frequency === 'weekly') {
    return 7;
  }
  if (frequency === 'biweekly') {
    return 14;
  }
  return 1;
};

const pickLatestHandledDate = (records: Record<string, CheckupRecord>): string | null => {
  const dateKeys = Object.keys(records);
  if (dateKeys.length === 0) {
    return null;
  }

  return [...dateKeys].sort((left, right) => right.localeCompare(left))[0];
};

const isFrequencyDue = (
  frequency: CheckupFrequency,
  records: Record<string, CheckupRecord>,
  todayDateKey: string
): boolean => {
  if (records[todayDateKey]) {
    return false;
  }

  if (frequency === 'daily') {
    return true;
  }

  const latestHandledDate = pickLatestHandledDate(records);
  if (!latestHandledDate) {
    return true;
  }

  return diffDays(latestHandledDate, todayDateKey) >= requiredGapDays(frequency);
};

const formatTime = (value: string): string => {
  const [rawHour, rawMinute] = value.split(':');
  const hour = Number(rawHour);
  const minute = Number(rawMinute);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return value;
  }

  const period = hour >= 12 ? 'PM' : 'AM';
  const twelveHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelveHour}:${String(minute).padStart(2, '0')} ${period}`;
};

const formatMinutesLabel = (minutes: number): string =>
  formatMinutesAsHoursMinutes(Math.max(0, Math.floor(Number.isFinite(minutes) ? minutes : 0)));

const toDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeDateKey = (value?: string): string | null => {
  if (!value) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return toDateKey(parsed);
};

const readNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const buildAuthHeaders = (): HeadersInit => {
  const token = sessionStorage.getItem('auth_session');
  if (!token) {
    return {
      'Content-Type': 'application/json',
    };
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

const CheckupPrompt = () => {
  const navigate = useNavigate();
  const { tasks } = useTaskStore();
  const [config, setConfig] = useState<CheckupConfig | null>(null);
  const [onboardingSnapshot, setOnboardingSnapshot] = useState<OnboardingSnapshot | null>(null);
  const [persistedState, setPersistedState] = useState<PersistedPromptState>(() => readPersistedState());
  const [activePrompt, setActivePrompt] = useState<PendingCheckup | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successPayload, setSuccessPayload] = useState<CheckupApiPayload | null>(null);
  const [ragInsights, setRagInsights] = useState<RagInsights | null>(null);
  const [plannedDeepWorkMinutes, setPlannedDeepWorkMinutes] = useState(120);
  const [confidence, setConfidence] = useState(7);
  const [selfRating, setSelfRating] = useState(7);
  const [topPriorityCompleted, setTopPriorityCompleted] = useState(false);
  const [perspectiveNotes, setPerspectiveNotes] = useState('');

  const configRef = useRef<CheckupConfig | null>(null);
  const stateRef = useRef<PersistedPromptState>(persistedState);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    stateRef.current = persistedState;
    writePersistedState(persistedState);
  }, [persistedState]);

  useEffect(() => {
    let isMounted = true;

    const loadConfig = async () => {
      try {
        const response = await fetch('/api/onboarding/getOnboardingData', {
          method: 'GET',
          headers: buildAuthHeaders(),
          credentials: 'include',
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as OnboardingSnapshot;
        setOnboardingSnapshot(payload);
        const preferredTime = payload.schedule?.checkIn?.preferredTime || '09:00';
        const timezone = payload.schedule?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        const frequency = resolveFrequency(payload.schedule?.checkIn?.frequency);
        const remindersEnabled = payload.planner?.notifications?.remindersEnabled ?? true;

        const defaultConfidence = clamp(readNumber(payload.answers?.length ? 7 : 6, 7), 1, 10);
        setConfidence(defaultConfidence);
        setSelfRating(defaultConfidence);

        if (!isMounted) {
          return;
        }

        setConfig({
          preferredTime,
          timezone,
          frequency,
          remindersEnabled,
          preferredTone: payload.preferredTone,
          mentorArchetype: payload.mentor?.archetype,
          mentorStyle: payload.mentor?.style,
          mentorName: payload.mentor?.name,
        });
      } catch {
        // Silent fallback: no popup if config cannot be loaded.
      }
    };

    void loadConfig();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadRagInsights = async () => {
      try {
        const response = await fetch('/agentic-api/api/knowledge/analytics?time_range=30d', {
          method: 'GET',
          headers: buildAuthHeaders(),
          credentials: 'include',
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          insights?: {
            most_used_agent?: string;
            top_knowledge_category?: string;
            learning_velocity?: number;
            avg_daily_interactions?: number;
            time_entry_records?: number;
            time_entry_billable_records?: number;
            avg_time_entry_minutes?: number;
          };
        };

        if (cancelled) {
          return;
        }

        setRagInsights({
          mostUsedAgent: payload?.insights?.most_used_agent,
          topKnowledgeCategory: payload?.insights?.top_knowledge_category,
          learningVelocity: payload?.insights?.learning_velocity,
          avgDailyInteractions: payload?.insights?.avg_daily_interactions,
          timeEntryRecords: payload?.insights?.time_entry_records,
          timeEntryBillableRecords: payload?.insights?.time_entry_billable_records,
          avgTimeEntryMinutes: payload?.insights?.avg_time_entry_minutes,
        });
      } catch {
        // Best-effort insights only.
      }
    };

    void loadRagInsights();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const evaluatePrompt = () => {
      const currentConfig = configRef.current;
      if (!currentConfig || !currentConfig.remindersEnabled) {
        setActivePrompt(null);
        return;
      }

      const now = getDateKeyPartsInTimeZone(currentConfig.timezone);
      const dueMinutes = parseTimeToMinutes(currentConfig.preferredTime);
      const minutesSinceDue = now.minutesOfDay - dueMinutes;

      if (minutesSinceDue < 0) {
        setActivePrompt(null);
        return;
      }

      const currentState = stateRef.current;
      if (!isFrequencyDue(currentConfig.frequency, currentState.records, now.dateKey)) {
        setActivePrompt(null);
        return;
      }

      let pending = currentState.pending;
      const expectedType = resolveCheckupType(dueMinutes);
      if (!pending || pending.dateKey !== now.dateKey) {
        pending = {
          dateKey: now.dateKey,
          dueMinutes,
          snoozedUntilMinutes: null,
          postponedMinutes: 0,
          type: expectedType,
        };
      } else {
        pending = {
          ...pending,
          dueMinutes,
          type: expectedType,
        };
      }

      const shouldDisplay =
        pending.snoozedUntilMinutes === null || now.minutesOfDay >= pending.snoozedUntilMinutes;

      const pendingChanged =
        currentState.pending?.dateKey !== pending.dateKey ||
        currentState.pending?.dueMinutes !== pending.dueMinutes ||
        currentState.pending?.type !== pending.type ||
        currentState.pending?.snoozedUntilMinutes !== pending.snoozedUntilMinutes ||
        currentState.pending?.postponedMinutes !== pending.postponedMinutes;

      if (pendingChanged) {
        setPersistedState((previous) => ({
          ...previous,
          pending,
        }));
      }

      setActivePrompt(shouldDisplay ? pending : null);
    };

    evaluatePrompt();
    const timer = window.setInterval(evaluatePrompt, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const nowForPrompt = useMemo(() => {
    if (!config || !activePrompt) {
      return null;
    }

    const now = getDateKeyPartsInTimeZone(config.timezone);
    const elapsed = Math.max(0, now.minutesOfDay - activePrompt.dueMinutes);
    const remainingPostpone = Math.max(0, POSTPONE_LIMIT_MINUTES - Math.max(elapsed, activePrompt.postponedMinutes));
    const canPostpone = remainingPostpone > 0;

    return {
      elapsed,
      remainingPostpone,
      canPostpone,
      canSkip: !canPostpone,
    };
  }, [activePrompt, config]);

  const checkupContext = useMemo<CheckupContext | null>(() => {
    if (!activePrompt) {
      return null;
    }

    const selectedDateKey = activePrompt.dateKey;
    const selectedDateUtc = `${selectedDateKey}T00:00:00.000Z`;
    const selectedDateUtcBase = new Date(`${selectedDateKey}T00:00:00.000Z`);

    const rollingDateKeys = Array.from({ length: 7 }, (_, index) => {
      const candidate = new Date(selectedDateUtcBase);
      candidate.setUTCDate(selectedDateUtcBase.getUTCDate() - index);
      return candidate.toISOString().slice(0, 10);
    });

    const priorityScore = (priority: string) => {
      const normalized = priority.trim().toLowerCase();
      if (normalized === 'critical') return 4;
      if (normalized === 'high') return 3;
      if (normalized === 'medium') return 2;
      return 1;
    };

    let overdue = 0;
    let dueToday = 0;
    let completedTasksToday = 0;
    let totalEstimatedMinutes = 0;
    let totalTimeSpentMinutes = 0;
    let habitCompletedToday = 0;
    let habitStreakSum = 0;
    let habitCompletionPoints = 0;
    let habitCompletionSlots = 0;

    const focusTaskCandidates: FocusTaskSnapshot[] = [];
    const deadlineCandidates: DeadlineSnapshot[] = [];
    const habits: HabitSnapshot[] = [];

    tasks.forEach((task) => {
      const normalizedType = task.type === 'habit' ? 'habit' : 'todo';
      const normalizedStatus = String(task.status || 'todo');
      const normalizedPriority = String(task.priority || 'medium');
      const deadlineKey = normalizeDateKey(task.deadline || task.endDate);

      totalEstimatedMinutes += Math.max(0, readNumber(task.estimatedDuration, 0));
      totalTimeSpentMinutes += Math.max(0, readNumber(task.timeSpent, 0));

      const completedDates = Array.isArray(task.completedDates)
        ? task.completedDates.filter((value): value is string => typeof value === 'string')
        : [];
      const completedOnSelectedDate = completedDates.includes(selectedDateKey);

      if (normalizedType === 'habit') {
        const completionCount7d = rollingDateKeys.filter((dateKey) => completedDates.includes(dateKey)).length;
        const completionRate7d = rollingDateKeys.length > 0
          ? Math.round((completionCount7d / rollingDateKeys.length) * 100)
          : 0;
        const completedToday = completedOnSelectedDate || normalizedStatus === 'completed';
        if (completedToday) {
          habitCompletedToday += 1;
        }

        const currentStreak = Math.max(0, readNumber(task.currentStreak, 0));
        habitStreakSum += currentStreak;
        habitCompletionPoints += completionCount7d;
        habitCompletionSlots += rollingDateKeys.length;

        habits.push({
          id: task.id,
          title: task.title,
          streakTarget: Math.max(0, readNumber(task.streakTarget, 0)),
          currentStreak,
          completedToday,
          completionRate7d,
        });
      }

      if (normalizedType !== 'habit' && (normalizedStatus === 'completed' || completedOnSelectedDate)) {
        completedTasksToday += 1;
      }

      if (deadlineKey) {
        if (deadlineKey < selectedDateKey && normalizedStatus !== 'completed' && normalizedType !== 'habit') {
          overdue += 1;
        } else if (deadlineKey === selectedDateKey && normalizedStatus !== 'completed' && normalizedType !== 'habit') {
          dueToday += 1;
        }

        if (normalizedStatus !== 'completed') {
          const dueInDays = diffDays(selectedDateKey, deadlineKey);
          if (dueInDays >= 0 && dueInDays <= 7) {
            deadlineCandidates.push({
              id: task.id,
              title: task.title,
              dueInDays,
              deadline: deadlineKey,
              priority: normalizedPriority,
              status: normalizedStatus,
            });
          }
        }
      }

      if (normalizedType !== 'habit' && normalizedStatus !== 'completed') {
        focusTaskCandidates.push({
          id: task.id,
          title: task.title,
          priority: normalizedPriority,
          status: normalizedStatus,
          deadline: deadlineKey,
          estimatedDuration: Math.max(0, readNumber(task.estimatedDuration, 0)),
          timeSpent: Math.max(0, readNumber(task.timeSpent, 0)),
        });
      }
    });

    focusTaskCandidates.sort((left, right) => {
      const leftDeadlinePenalty = left.deadline ? diffDays(selectedDateKey, left.deadline) : 99;
      const rightDeadlinePenalty = right.deadline ? diffDays(selectedDateKey, right.deadline) : 99;

      if (leftDeadlinePenalty !== rightDeadlinePenalty) {
        return leftDeadlinePenalty - rightDeadlinePenalty;
      }

      const priorityDiff = priorityScore(right.priority) - priorityScore(left.priority);
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      return left.title.localeCompare(right.title);
    });

    deadlineCandidates.sort((left, right) => {
      if (left.dueInDays !== right.dueInDays) {
        return left.dueInDays - right.dueInDays;
      }
      return priorityScore(right.priority) - priorityScore(left.priority);
    });

    const sortedGoals = Array.isArray(onboardingSnapshot?.goals)
      ? [...onboardingSnapshot.goals]
          .filter((goal) => Boolean(goal?.title))
          .sort((left, right) => {
            const leftPriority = String(left.priority || 'medium');
            const rightPriority = String(right.priority || 'medium');
            return priorityScore(rightPriority) - priorityScore(leftPriority);
          })
      : [];

    const topGoals = sortedGoals.map((goal) => String(goal.title)).slice(0, 4);
    const priorities = Array.isArray(onboardingSnapshot?.answers)
      ? onboardingSnapshot.answers
          .map((answer) => String(answer.answer || '').trim())
          .filter((answer) => answer.length > 0)
      : [];

    const totalHabits = habits.length;
    const avgStreak = totalHabits > 0 ? Number((habitStreakSum / totalHabits).toFixed(1)) : 0;
    const habitCompletionRate7d = habitCompletionSlots > 0
      ? Math.round((habitCompletionPoints / habitCompletionSlots) * 100)
      : 0;

    const deepWorkCoverageRatio = plannedDeepWorkMinutes > 0
      ? Number((totalTimeSpentMinutes / plannedDeepWorkMinutes).toFixed(2))
      : 0;

    const priorityFocus = priorities[0] || focusTaskCandidates[0]?.title || topGoals[0] || '';

    return {
      date: selectedDateUtc,
      topGoals,
      priorities,
      priorityFocus,
      deadlineTasks: {
        overdue,
        dueToday,
      },
      completedTasksToday,
      plannedDeepWorkMinutes,
      ragInsights,
      focusTasks: focusTaskCandidates.slice(0, 5),
      upcomingDeadlines: deadlineCandidates.slice(0, 5),
      habitMetrics: {
        totalHabits,
        completedToday: habitCompletedToday,
        avgStreak,
        completionRate7d: habitCompletionRate7d,
      },
      habits: habits
        .sort((left, right) => {
          if (left.completedToday !== right.completedToday) {
            return left.completedToday ? -1 : 1;
          }
          return right.currentStreak - left.currentStreak;
        })
        .slice(0, 5),
      timeMetrics: {
        totalEstimatedMinutes: Number(totalEstimatedMinutes.toFixed(1)),
        totalTimeSpentMinutes: Number(totalTimeSpentMinutes.toFixed(1)),
        deepWorkTargetMinutes: plannedDeepWorkMinutes,
        deepWorkCoverageRatio,
      },
    };
  }, [activePrompt, tasks, onboardingSnapshot, plannedDeepWorkMinutes, ragInsights]);

  const checkupNote = useMemo(() => {
    const typedNote = perspectiveNotes.trim();
    if (typedNote.length > 0) {
      return typedNote;
    }

    if (!checkupContext) {
      return '';
    }

    if (activePrompt?.type === 'morning') {
      return [
        checkupContext.priorityFocus ? `Focus: ${checkupContext.priorityFocus}` : null,
        checkupContext.focusTasks[0]?.title ? `First task: ${checkupContext.focusTasks[0].title}` : null,
      ]
        .filter((item): item is string => Boolean(item))
        .join(' | ');
    }

    const completed = checkupContext.completedTasksToday;
    const totalHabits = checkupContext.habitMetrics.totalHabits;
    const habitsDone = checkupContext.habitMetrics.completedToday;

    return `Completed tasks today: ${completed}; Habits done: ${habitsDone}/${totalHabits}`;
  }, [activePrompt?.type, checkupContext, perspectiveNotes]);

  const perspectivePayload = useMemo(() => {
    const payload: Record<string, unknown> = {
      checkupType: activePrompt?.type,
      confidence,
      plannedDeepWorkMinutes,
      note: checkupNote || null,
      focusTasks: checkupContext?.focusTasks ?? [],
      habitMetrics: checkupContext?.habitMetrics ?? null,
      timeMetrics: checkupContext?.timeMetrics ?? null,
    };

    if (activePrompt?.type === 'evening') {
      payload.selfRating = selfRating;
      payload.topPriorityCompleted = topPriorityCompleted;
    }

    return payload;
  }, [
    activePrompt?.type,
    checkupContext?.focusTasks,
    checkupContext?.habitMetrics,
    checkupContext?.timeMetrics,
    confidence,
    checkupNote,
    plannedDeepWorkMinutes,
    selfRating,
    topPriorityCompleted,
  ]);

  const handlePostpone = () => {
    setErrorMessage(null);
    if (!config || !activePrompt) {
      return;
    }

    const now = getDateKeyPartsInTimeZone(config.timezone);
    const elapsed = Math.max(0, now.minutesOfDay - activePrompt.dueMinutes);
    const alreadyCounted = Math.max(elapsed, activePrompt.postponedMinutes);
    const remaining = POSTPONE_LIMIT_MINUTES - alreadyCounted;

    if (remaining <= 0) {
      setErrorMessage('Check-in window reached 1 hour. You can skip today if needed.');
      return;
    }

    const postponeBy = Math.min(POSTPONE_STEP_MINUTES, remaining);
    const candidateSnooze = Math.min(now.minutesOfDay + postponeBy, activePrompt.dueMinutes + POSTPONE_LIMIT_MINUTES);
    const nextPending: PendingCheckup = {
      ...activePrompt,
      snoozedUntilMinutes: candidateSnooze,
      postponedMinutes: Math.max(activePrompt.postponedMinutes, candidateSnooze - activePrompt.dueMinutes),
    };

    setPersistedState((previous) => ({
      ...previous,
      pending: nextPending,
    }));
    setActivePrompt(null);
  };

  const closeForToday = (status: 'completed' | 'skipped', payloadType?: CheckupType) => {
    if (!activePrompt) {
      return;
    }

    const recordType = payloadType || activePrompt.type;
    setPersistedState((previous) => ({
      records: {
        ...previous.records,
        [activePrompt.dateKey]: {
          status,
          type: recordType,
          handledAt: new Date().toISOString(),
        },
      },
      pending: null,
    }));
    setActivePrompt(null);
  };

  const handleSkip = () => {
    setErrorMessage(null);
    if (!nowForPrompt?.canSkip) {
      setErrorMessage('Skip unlocks after the 1-hour postpone window. You can postpone for now.');
      return;
    }
    closeForToday('skipped');
  };

  const handleReady = async () => {
    if (!activePrompt) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/onboarding/checkups/${activePrompt.type}`, {
        method: 'POST',
        headers: buildAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          date: activePrompt.dateKey,
          note: checkupNote || null,
          perspective: perspectivePayload,
          contextSnapshot: checkupContext,
        }),
      });

      const envelope = await response.json();
      if (!response.ok || envelope?.success === false) {
        const backendMessage = envelope?.errors?.message || envelope?.message || 'Unable to run checkup right now.';
        throw new Error(String(backendMessage));
      }

      const payload = (envelope?.data || {}) as CheckupApiPayload;
      setSuccessPayload(payload);
      closeForToday('completed', payload.checkup_type || activePrompt.type);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to run checkup right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!config || !activePrompt) {
    return null;
  }

  const promptType = activePrompt.type;
  const headline = promptType === 'morning' ? 'Morning Checkup' : 'Evening Checkup';
  const badgeTone = promptType === 'morning' ? 'from-amber-500 to-orange-500' : 'from-indigo-600 to-violet-600';
  const focusTasks = checkupContext?.focusTasks ?? [];
  const upcomingDeadlines = checkupContext?.upcomingDeadlines ?? [];
  const habits = checkupContext?.habits ?? [];
  const completedHabits = checkupContext?.habitMetrics.completedToday ?? 0;
  const totalHabits = checkupContext?.habitMetrics.totalHabits ?? 0;
  const deepWorkCoverageRatio = checkupContext?.timeMetrics.deepWorkCoverageRatio ?? 0;
  const deepWorkCoveragePercent = Math.round(deepWorkCoverageRatio * 100);
  const journalingPrompt =
    promptType === 'morning'
      ? 'What one behavior will make today a win, even if everything else changes?'
      : 'What did you learn about your working style today, and what will you adjust tomorrow?';

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-start justify-center px-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-[calc(4.25rem+env(safe-area-inset-top))] md:justify-end md:px-4 md:pb-4 md:pt-4">
      <div className="pointer-events-auto flex max-h-[min(82vh,760px)] w-full max-w-[420px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur-sm">
        <div className={`rounded-t-2xl bg-gradient-to-r ${badgeTone} px-4 py-3 text-white`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BellRing className="h-4 w-4" />
              <p className="text-sm font-semibold">{headline}</p>
            </div>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide">
              check-in
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 px-3 py-3">
            <p className="text-sm font-semibold text-slate-900">
              {promptType === 'morning' ? 'Plan with intention' : 'Reflect with clarity'}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {promptType === 'morning'
                ? 'Shape your day around top goals, real deadlines, and focused effort.'
                : 'Review what moved, where friction showed up, and what tomorrow needs first.'}
            </p>

            <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-600 sm:grid-cols-2">
              <div className="rounded-lg bg-white px-3 py-2 shadow-sm">
                <div className="flex items-center gap-1 font-medium text-slate-700">
                  <Clock3 className="h-3.5 w-3.5" />
                  Scheduled
                </div>
                <p className="mt-1">{formatTime(config.preferredTime)}</p>
              </div>
              <div className="rounded-lg bg-white px-3 py-2 shadow-sm">
                <div className="flex items-center gap-1 font-medium text-slate-700">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Frequency
                </div>
                <p className="mt-1 capitalize">{config.frequency}</p>
              </div>
            </div>

            {config.preferredTone || config.mentorArchetype || config.mentorStyle ? (
              <p className="mt-2 rounded-lg bg-white px-3 py-2 text-xs text-slate-600 shadow-sm">
                Style: {config.preferredTone || 'Adaptive'}
                {config.mentorArchetype ? ` | ${config.mentorArchetype}` : ''}
                {config.mentorStyle ? ` | ${config.mentorStyle}` : ''}
              </p>
            ) : null}
          </div>

          {checkupContext ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="inline-flex items-center gap-1 font-medium text-slate-700">
                    <ListChecks className="h-3.5 w-3.5" />
                    Due Today
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{checkupContext.deadlineTasks.dueToday}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="inline-flex items-center gap-1 font-medium text-slate-700">
                    <Target className="h-3.5 w-3.5" />
                    Overdue
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{checkupContext.deadlineTasks.overdue}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="font-medium text-slate-700">Completed Today</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{checkupContext.completedTasksToday}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="inline-flex items-center gap-1 font-medium text-slate-700">
                    <BarChart3 className="h-3.5 w-3.5" />
                    Deep Work Coverage
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{deepWorkCoveragePercent}%</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs text-slate-700">
                <div className="flex items-start justify-between gap-2">
                  <p className="inline-flex items-center gap-1.5 font-semibold text-slate-900">
                    <Target className="h-3.5 w-3.5" />
                    Focus Arc
                  </p>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                    {checkupContext.priorityFocus || 'Set one focus'}
                  </span>
                </div>

                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                    <p className="font-medium text-slate-800">Top Goals</p>
                    {checkupContext.topGoals.length > 0 ? (
                      <ul className="mt-1 space-y-1 text-slate-600">
                        {checkupContext.topGoals.slice(0, 3).map((goal) => (
                          <li key={goal} className="truncate">- {goal}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-slate-500">No goals captured yet.</p>
                    )}
                  </div>

                  <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                    <p className="font-medium text-slate-800">Focus Tasks</p>
                    {focusTasks.length > 0 ? (
                      <ul className="mt-1 space-y-1 text-slate-600">
                        {focusTasks.slice(0, 3).map((task) => (
                          <li key={task.id} className="truncate">
                            - {task.title}
                            {task.deadline ? ` (${task.deadline})` : ''}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-slate-500">No active tasks. Set one meaningful task now.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-sky-200 bg-sky-50/70 px-3 py-3 text-xs text-sky-900">
                <p className="inline-flex items-center gap-1.5 font-semibold">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Deadlines Next 7 Days
                </p>
                {upcomingDeadlines.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-sky-900/90">
                    {upcomingDeadlines.slice(0, 4).map((item) => (
                      <li key={item.id} className="truncate">
                        - {item.title} | {item.deadline} | {item.priority}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sky-900/80">No near-term deadlines detected.</p>
                )}
              </div>

              <div className="rounded-xl border border-orange-200 bg-orange-50/70 px-3 py-3 text-xs text-orange-900">
                <div className="flex items-start justify-between gap-2">
                  <p className="inline-flex items-center gap-1.5 font-semibold">
                    <Flame className="h-3.5 w-3.5" />
                    Habit Consistency
                  </p>
                  <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-medium">
                    {completedHabits}/{totalHabits} today
                  </span>
                </div>
                <p className="mt-1">
                  Avg streak: {checkupContext.habitMetrics.avgStreak} days | 7-day completion: {checkupContext.habitMetrics.completionRate7d}%
                </p>
                {habits.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-orange-900/90">
                    {habits.slice(0, 3).map((habit) => (
                      <li key={habit.id} className="truncate">
                        - {habit.title} | streak {habit.currentStreak}/{habit.streakTarget || 0}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-orange-900/80">No habits tracked yet.</p>
                )}
              </div>
            </div>
          ) : null}

          {ragInsights ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
              <p className="font-medium">Knowledge Pulse</p>
              <p className="mt-1">
                Agent: {ragInsights.mostUsedAgent || 'n/a'} | Category: {ragInsights.topKnowledgeCategory || 'n/a'}
              </p>
              <p>
                Velocity: {ragInsights.learningVelocity?.toFixed(2) ?? '0.00'}/day | Avg interactions: {ragInsights.avgDailyInteractions?.toFixed(2) ?? '0.00'}
              </p>
              <p>
                Time entries: {ragInsights.timeEntryRecords ?? 0} | Billable entries: {ragInsights.timeEntryBillableRecords ?? 0} | Avg session: {ragInsights.avgTimeEntryMinutes?.toFixed(1) ?? '0.0'}m
              </p>
            </div>
          ) : null}

          <div className="space-y-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-xs text-slate-700">
            <p className="inline-flex items-center gap-1.5 font-semibold text-slate-900">
              <NotebookText className="h-3.5 w-3.5" />
              Journal Your Perspective
            </p>
            <p className="text-[11px] text-slate-600">{journalingPrompt}</p>

            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center justify-between gap-2 rounded-lg bg-white px-2 py-1.5">
                <span>Confidence</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={confidence}
                  onChange={(event) => setConfidence(clamp(Number(event.target.value) || 1, 1, 10))}
                  className="w-14 rounded border border-slate-300 bg-white px-2 py-1 text-right text-xs"
                />
              </label>

              <label className="flex items-center justify-between gap-2 rounded-lg bg-white px-2 py-1.5">
                <span>Deep work (m)</span>
                <input
                  type="number"
                  min={0}
                  value={plannedDeepWorkMinutes}
                  onChange={(event) => setPlannedDeepWorkMinutes(Math.max(0, Number(event.target.value) || 0))}
                  className="w-16 rounded border border-slate-300 bg-white px-2 py-1 text-right text-xs"
                />
              </label>
            </div>

            {promptType === 'evening' ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <label className="flex items-center justify-between gap-2 rounded-lg bg-white px-2 py-1.5">
                  <span>Self-rating</span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={selfRating}
                    onChange={(event) => setSelfRating(clamp(Number(event.target.value) || 1, 1, 10))}
                    className="w-14 rounded border border-slate-300 bg-white px-2 py-1 text-right text-xs"
                  />
                </label>

                <label className="flex items-center gap-2 rounded-lg bg-white px-2 py-1.5">
                  <input
                    type="checkbox"
                    checked={topPriorityCompleted}
                    onChange={(event) => setTopPriorityCompleted(event.target.checked)}
                  />
                  Top priority completed
                </label>
              </div>
            ) : null}

            <label className="block">
              <span className="mb-1 block font-medium text-slate-800">Journal note</span>
              <textarea
                value={perspectiveNotes}
                onChange={(event) => setPerspectiveNotes(event.target.value)}
                placeholder={journalingPrompt}
                className="h-20 w-full resize-none rounded border border-slate-300 bg-white px-2 py-1 text-xs"
              />
            </label>
          </div>

          {errorMessage ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {errorMessage}
            </p>
          ) : null}

          {successPayload?.coach_message ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
              <p className="inline-flex items-center gap-1 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Checkup saved
              </p>
              <p className="mt-1 whitespace-pre-wrap">{successPayload.coach_message}</p>

              {Array.isArray(successPayload.wins) && successPayload.wins.length > 0 ? (
                <div className="mt-2 rounded-lg bg-emerald-100/70 px-2 py-1.5 text-[11px]">
                  <p className="font-semibold">Wins</p>
                  <ul className="mt-1 space-y-0.5">
                    {successPayload.wins.slice(0, 2).map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {successPayload.performance?.score !== undefined && successPayload.performance?.score !== null ? (
                <p className="mt-2 rounded bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-900">
                  Performance score: {successPayload.performance.score}/10
                </p>
              ) : null}

              <button
                type="button"
                onClick={() => navigate('/coach/knowledge')}
                className="mt-2 rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-medium text-white transition hover:bg-emerald-500"
              >
                Open Coach
              </button>
            </div>
          ) : null}

          <div className="sticky bottom-0 z-10 -mx-4 mt-2 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleSkip}
              disabled={!nowForPrompt?.canSkip || isSubmitting}
              className={`inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                nowForPrompt?.canSkip && !isSubmitting
                  ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  : 'cursor-not-allowed border-slate-200 text-slate-400'
              }`}
            >
              <SkipForward className="h-3.5 w-3.5" />
              Skip today
            </button>

            <button
              type="button"
              onClick={handlePostpone}
              disabled={!nowForPrompt?.canPostpone || isSubmitting}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                nowForPrompt?.canPostpone && !isSubmitting
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'cursor-not-allowed bg-slate-100 text-slate-400'
              }`}
            >
              Postpone {formatMinutesLabel(POSTPONE_STEP_MINUTES)}
            </button>

            <button
              type="button"
              onClick={handleReady}
              disabled={isSubmitting}
              className={`rounded-lg px-3 py-2 text-xs font-semibold text-white transition ${
                isSubmitting ? 'cursor-not-allowed bg-slate-500' : 'bg-slate-900 hover:bg-slate-700'
              }`}
            >
              {isSubmitting ? 'Starting...' : 'Run checkup'}
            </button>
            </div>

            <p className="mt-2 text-[11px] text-slate-500">
              {nowForPrompt?.canPostpone
                ? `You can postpone up to ${formatMinutesLabel(nowForPrompt.remainingPostpone)} more.`
                : 'Postpone limit reached (1 hour). You can skip for today if needed.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckupPrompt;
