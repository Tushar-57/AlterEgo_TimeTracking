import { useEffect, useMemo, useRef, useState } from 'react';
import { BellRing, CalendarClock, CheckCircle2, Clock3, ListChecks, SkipForward, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTaskStore } from '../../store/taskStore';

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
  coach_message?: string;
  generated_with?: string;
  stats?: Record<string, unknown>;
  decision_metrics?: Record<string, unknown>;
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

  const checkupContext = useMemo(() => {
    if (!activePrompt) {
      return null;
    }

    const selectedDateKey = activePrompt.dateKey;
    const selectedDateUtc = `${selectedDateKey}T00:00:00.000Z`;

    let overdue = 0;
    let dueToday = 0;
    let completedTasksToday = 0;

    tasks.forEach((task) => {
      const deadlineKey = normalizeDateKey(task.deadline);
      if (deadlineKey) {
        if (deadlineKey < selectedDateKey && task.status !== 'completed') {
          overdue += 1;
        } else if (deadlineKey === selectedDateKey && task.status !== 'completed') {
          dueToday += 1;
        }
      }

      if (task.status === 'completed') {
        completedTasksToday += 1;
        return;
      }

      if (task.completedDates?.includes(selectedDateKey)) {
        completedTasksToday += 1;
      }
    });

    const sortedGoals = Array.isArray(onboardingSnapshot?.goals)
      ? [...onboardingSnapshot.goals]
          .filter((goal) => Boolean(goal?.title))
          .sort((left, right) => {
            const leftPriority = String(left.priority || '').toLowerCase();
            const rightPriority = String(right.priority || '').toLowerCase();
            const score = (priority: string) => {
              if (priority === 'critical') return 4;
              if (priority === 'high') return 3;
              if (priority === 'medium') return 2;
              return 1;
            };
            return score(rightPriority) - score(leftPriority);
          })
      : [];

    const topGoals = sortedGoals.map((goal) => String(goal.title)).slice(0, 3);
    const priorities = Array.isArray(onboardingSnapshot?.answers)
      ? onboardingSnapshot.answers
          .map((answer) => String(answer.answer || '').trim())
          .filter((answer) => answer.length > 0)
      : [];

    return {
      date: selectedDateUtc,
      topGoals,
      priorities,
      priorityFocus: priorities[0] || topGoals[0] || '',
      deadlineTasks: {
        overdue,
        dueToday,
      },
      completedTasksToday,
      plannedDeepWorkMinutes,
      ragInsights,
    };
  }, [activePrompt, tasks, onboardingSnapshot, plannedDeepWorkMinutes, ragInsights]);

  const perspectivePayload = useMemo(() => {
    const payload: Record<string, unknown> = {
      confidence,
      plannedDeepWorkMinutes,
      note: perspectiveNotes.trim() || null,
    };

    if (activePrompt?.type === 'evening') {
      payload.selfRating = selfRating;
      payload.topPriorityCompleted = topPriorityCompleted;
    }

    return payload;
  }, [activePrompt?.type, confidence, plannedDeepWorkMinutes, perspectiveNotes, selfRating, topPriorityCompleted]);

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

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-3 md:bottom-4 md:justify-end md:px-4">
      <div className="pointer-events-auto w-full max-w-[420px] rounded-2xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur-sm">
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

        <div className="space-y-3 px-4 py-4">
          <p className="text-sm text-slate-700">
            Are you ready for your checkup now?
          </p>

          <div className="grid grid-cols-1 gap-2 text-xs text-slate-600 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-100 px-3 py-2">
              <div className="flex items-center gap-1 font-medium text-slate-700">
                <Clock3 className="h-3.5 w-3.5" />
                Scheduled
              </div>
              <p className="mt-1">{formatTime(config.preferredTime)}</p>
            </div>
            <div className="rounded-lg bg-slate-100 px-3 py-2">
              <div className="flex items-center gap-1 font-medium text-slate-700">
                <CalendarClock className="h-3.5 w-3.5" />
                Frequency
              </div>
              <p className="mt-1 capitalize">{config.frequency}</p>
            </div>
          </div>

          {config.preferredTone || config.mentorArchetype || config.mentorStyle ? (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
              Style: {config.preferredTone || 'Adaptive'}
              {config.mentorArchetype ? ` | ${config.mentorArchetype}` : ''}
              {config.mentorStyle ? ` | ${config.mentorStyle}` : ''}
            </p>
          ) : null}

          {checkupContext ? (
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
                <p className="font-medium text-slate-700">Priority Focus</p>
                <p className="mt-1 line-clamp-1 font-semibold text-slate-900">{checkupContext.priorityFocus || 'Not set'}</p>
              </div>
            </div>
          ) : null}

          {ragInsights ? (
            <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">
              <p className="font-medium">RAG Snapshot</p>
              <p className="mt-1">
                Agent: {ragInsights.mostUsedAgent || 'n/a'} | Category: {ragInsights.topKnowledgeCategory || 'n/a'}
              </p>
              <p>
                Velocity: {ragInsights.learningVelocity?.toFixed(2) ?? '0.00'}/day | Avg interactions: {ragInsights.avgDailyInteractions?.toFixed(2) ?? '0.00'}
              </p>
            </div>
          ) : null}

          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
            <p className="font-medium text-slate-800">Your Perspective</p>

            <label className="flex items-center justify-between gap-3">
              <span>Confidence (1-10)</span>
              <input
                type="number"
                min={1}
                max={10}
                value={confidence}
                onChange={(event) => setConfidence(clamp(Number(event.target.value) || 1, 1, 10))}
                className="w-16 rounded border border-slate-300 bg-white px-2 py-1 text-right text-xs"
              />
            </label>

            <label className="flex items-center justify-between gap-3">
              <span>Planned deep work (minutes)</span>
              <input
                type="number"
                min={0}
                value={plannedDeepWorkMinutes}
                onChange={(event) => setPlannedDeepWorkMinutes(Math.max(0, Number(event.target.value) || 0))}
                className="w-20 rounded border border-slate-300 bg-white px-2 py-1 text-right text-xs"
              />
            </label>

            {promptType === 'evening' ? (
              <>
                <label className="flex items-center justify-between gap-3">
                  <span>Self-rating (1-10)</span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={selfRating}
                    onChange={(event) => setSelfRating(clamp(Number(event.target.value) || 1, 1, 10))}
                    className="w-16 rounded border border-slate-300 bg-white px-2 py-1 text-right text-xs"
                  />
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={topPriorityCompleted}
                    onChange={(event) => setTopPriorityCompleted(event.target.checked)}
                  />
                  Top priority completed
                </label>
              </>
            ) : null}

            <label className="block">
              <span className="mb-1 block">Notes</span>
              <textarea
                value={perspectiveNotes}
                onChange={(event) => setPerspectiveNotes(event.target.value)}
                placeholder={promptType === 'morning' ? 'What matters most today?' : 'How did today actually go?'}
                className="h-16 w-full resize-none rounded border border-slate-300 bg-white px-2 py-1 text-xs"
              />
            </label>
          </div>

          {errorMessage ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {errorMessage}
            </p>
          ) : null}

          {successPayload?.coach_message ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              <p className="inline-flex items-center gap-1 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Checkup saved
              </p>
              <p className="mt-1 line-clamp-3 whitespace-pre-wrap">{successPayload.coach_message}</p>
              {successPayload.performance?.score ? (
                <p className="mt-1 rounded bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-900">
                  Evening performance score: {successPayload.performance.score}/10
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => navigate('/coach')}
                className="mt-2 rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-medium text-white transition hover:bg-emerald-500"
              >
                Open Coach
              </button>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
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
              Postpone {POSTPONE_STEP_MINUTES}m
            </button>

            <button
              type="button"
              onClick={handleReady}
              disabled={isSubmitting}
              className={`rounded-lg px-3 py-2 text-xs font-semibold text-white transition ${
                isSubmitting ? 'cursor-not-allowed bg-slate-500' : 'bg-slate-900 hover:bg-slate-700'
              }`}
            >
              {isSubmitting ? 'Starting...' : 'Ready for checkup'}
            </button>
          </div>

          <p className="text-[11px] text-slate-500">
            {nowForPrompt?.canPostpone
              ? `You can postpone up to ${nowForPrompt.remainingPostpone} more minute(s).`
              : 'Postpone limit reached (1 hour). You can skip for today if needed.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CheckupPrompt;
