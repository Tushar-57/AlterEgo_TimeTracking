import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Edit3,
  Flag,
  ListTodo,
  Plus,
  Repeat,
  Sparkles,
  Target,
  Trash2,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTaskStore } from '../store/taskStore';
import { useAuth } from '../context/AuthContext';
import type { Task, TaskPriority, TaskStatus, TaskType } from '../store/taskStore';
import { formatMinutesAsHoursMinutes } from '../utils/utils';

type DraftTask = {
  type: TaskType;
  title: string;
  description: string;
  projectId: string;
  priority: TaskPriority;
  status: TaskStatus;
  tagsInput: string;
  estimatedDuration: number;
  deadline: string;
  followUpDate: string;
  noteToAI: string;
  streakTarget: number;
};

type ProjectOption = {
  id: string;
  name: string;
};

type TagOption = {
  id: string;
  name: string;
};

type HabitContributionCell = {
  dateKey: string;
  label: string;
  count: number;
  level: 0 | 1 | 2 | 3;
  inRange: boolean;
};

type HabitSeriesPoint = {
  dateKey: string;
  label: string;
  completedHabits: number;
};

type HabitTrendSnapshot = {
  contributionWeeks: HabitContributionCell[][];
  contributionMonthLabels: string[];
  contributionRangeLabel: string;
  maxContributionCount: number;
  dailySeries: HabitSeriesPoint[];
  currentRun: number;
  longestRun: number;
  activeDays: number;
  totalCompletionEvents: number;
};

type HabitSyncPayload = {
  capturedAt: string;
  summary: {
    totalHabits: number;
    completedToday: number;
    highestStreak: number;
    totalCompletionEvents: number;
    activeDays: number;
    currentRun: number;
    longestRun: number;
  };
  dailyCompletionCounts: Record<string, number>;
  habits: Array<{
    id: string;
    title: string;
    tags: string[];
    currentStreak: number;
    streakTarget: number;
    completionCount: number;
    completedDates: string[];
    updatedAt: string;
  }>;
};

const priorityStyles: Record<TaskPriority, string> = {
  low: 'bg-blue-50 text-blue-700',
  medium: 'bg-amber-50 text-amber-700',
  high: 'bg-rose-50 text-rose-700',
};

const statusStyles: Record<TaskStatus, string> = {
  todo: 'bg-slate-100 text-slate-700',
  'in-progress': 'bg-indigo-50 text-indigo-700',
  completed: 'bg-emerald-50 text-emerald-700',
};

const modeThemes: Record<TaskType, { cardBorder: string; title: string; subtitle: string; glow: string }> = {
  todo: {
    cardBorder: 'border-cyan-200',
    title: 'Task Mode',
    subtitle: 'Capture outcomes, due dates, and clear execution blocks.',
    glow: 'from-cyan-600 via-sky-600 to-blue-600',
  },
  habit: {
    cardBorder: 'border-fuchsia-200',
    title: 'Habit Mode',
    subtitle: 'Build repeatable routines with visible streak momentum.',
    glow: 'from-fuchsia-600 via-purple-600 to-violet-600',
  },
};

const CONTRIBUTION_WINDOW_DAYS = 140;
const HABIT_LINE_WINDOW_DAYS = 30;

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateKey = (dateKey: string) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const shiftDays = (date: Date, days: number) => {
  const shifted = new Date(date);
  shifted.setDate(shifted.getDate() + days);
  return shifted;
};

const sortDateKeysAsc = (left: string, right: string) => left.localeCompare(right);

const buildHabitCompletionMap = (habitTasks: Task[]) => {
  const completionMap = new Map<string, number>();

  habitTasks.forEach((habit) => {
    const uniqueDates = Array.from(new Set(habit.completedDates));
    uniqueDates.forEach((dateKey) => {
      if (!dateKey || typeof dateKey !== 'string') {
        return;
      }
      completionMap.set(dateKey, (completionMap.get(dateKey) || 0) + 1);
    });
  });

  return completionMap;
};

const resolveContributionLevel = (count: number, maxCount: number): 0 | 1 | 2 | 3 => {
  if (count <= 0 || maxCount <= 0) {
    return 0;
  }

  const lowerThreshold = Math.max(1, Math.ceil(maxCount * 0.34));
  const midThreshold = Math.max(lowerThreshold + 1, Math.ceil(maxCount * 0.67));

  if (count <= lowerThreshold) {
    return 1;
  }

  if (count < midThreshold) {
    return 2;
  }

  return 3;
};

const buildHabitContributionWeeks = (completionMap: Map<string, number>) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const windowStart = shiftDays(today, -(CONTRIBUTION_WINDOW_DAYS - 1));
  const calendarStart = shiftDays(windowStart, -windowStart.getDay());
  const calendarEnd = shiftDays(today, 6 - today.getDay());

  const cells: HabitContributionCell[] = [];
  for (let cursor = new Date(calendarStart); cursor <= calendarEnd; cursor = shiftDays(cursor, 1)) {
    const dateKey = toDateKey(cursor);
    const inRange = cursor >= windowStart && cursor <= today;
    const count = inRange ? completionMap.get(dateKey) || 0 : 0;

    cells.push({
      dateKey,
      label: cursor.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      count,
      level: 0,
      inRange,
    });
  }

  const maxCount = cells.reduce((max, cell) => (cell.inRange ? Math.max(max, cell.count) : max), 0);

  const normalizedCells = cells.map((cell) => ({
    ...cell,
    level: cell.inRange ? resolveContributionLevel(cell.count, maxCount) : 0,
  }));

  const contributionWeeks: HabitContributionCell[][] = [];
  for (let index = 0; index < normalizedCells.length; index += 7) {
    contributionWeeks.push(normalizedCells.slice(index, index + 7));
  }

  const contributionMonthLabels = contributionWeeks.map((week) => {
    const monthMarker = week.find((cell) => {
      if (!cell.inRange) {
        return false;
      }
      const date = parseDateKey(cell.dateKey);
      return date.getDate() === 1;
    });

    if (!monthMarker) {
      return '';
    }

    return parseDateKey(monthMarker.dateKey).toLocaleDateString('en-US', { month: 'short' });
  });

  const contributionRangeLabel = `${windowStart.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} - ${today.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })}`;

  return {
    contributionWeeks,
    contributionMonthLabels,
    contributionRangeLabel,
    maxContributionCount: maxCount,
  };
};

const buildDailyHabitSeries = (completionMap: Map<string, number>) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = shiftDays(today, -(HABIT_LINE_WINDOW_DAYS - 1));

  const dailySeries: HabitSeriesPoint[] = [];
  for (let offset = 0; offset < HABIT_LINE_WINDOW_DAYS; offset += 1) {
    const date = shiftDays(start, offset);
    const dateKey = toDateKey(date);
    dailySeries.push({
      dateKey,
      label: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      completedHabits: completionMap.get(dateKey) || 0,
    });
  }

  return dailySeries;
};

const computeHabitRuns = (completionMap: Map<string, number>) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentRun = 0;
  for (let offset = 0; ; offset += 1) {
    const dateKey = toDateKey(shiftDays(today, -offset));
    if ((completionMap.get(dateKey) || 0) <= 0) {
      break;
    }
    currentRun += 1;
  }

  const sortedKeys = Array.from(completionMap.keys()).sort(sortDateKeysAsc);
  let longestRun = 0;
  let running = 0;
  let previousDate: Date | null = null;
  let activeDays = 0;

  sortedKeys.forEach((key) => {
    if ((completionMap.get(key) || 0) <= 0) {
      return;
    }

    activeDays += 1;
    const date = parseDateKey(key);

    if (!previousDate) {
      running = 1;
      longestRun = Math.max(longestRun, running);
      previousDate = date;
      return;
    }

    const expectedNext = shiftDays(previousDate, 1);
    if (toDateKey(expectedNext) === key) {
      running += 1;
    } else {
      running = 1;
    }

    longestRun = Math.max(longestRun, running);
    previousDate = date;
  });

  return {
    currentRun,
    longestRun,
    activeDays,
  };
};

const buildHabitTrendSnapshot = (habitTasks: Task[]): HabitTrendSnapshot => {
  const completionMap = buildHabitCompletionMap(habitTasks);
  const contribution = buildHabitContributionWeeks(completionMap);
  const dailySeries = buildDailyHabitSeries(completionMap);
  const runs = computeHabitRuns(completionMap);
  const totalCompletionEvents = Array.from(completionMap.values()).reduce((sum, value) => sum + value, 0);

  return {
    contributionWeeks: contribution.contributionWeeks,
    contributionMonthLabels: contribution.contributionMonthLabels,
    contributionRangeLabel: contribution.contributionRangeLabel,
    maxContributionCount: contribution.maxContributionCount,
    dailySeries,
    currentRun: runs.currentRun,
    longestRun: runs.longestRun,
    activeDays: runs.activeDays,
    totalCompletionEvents,
  };
};

const buildHabitSyncPayload = (habitTasks: Task[], trendSnapshot: HabitTrendSnapshot): HabitSyncPayload => {
  const completionMap = buildHabitCompletionMap(habitTasks);
  const todayKey = toDateKey(new Date());

  const sortedDailyKeys = Array.from(completionMap.keys()).sort(sortDateKeysAsc);
  const dailyCompletionCounts = Object.fromEntries(
    sortedDailyKeys.map((key) => [key, completionMap.get(key) || 0])
  );

  const analyzeCompletionPattern = (dates: string[]): string => {
    if (dates.length === 0) return 'not_started';
    if (dates.length === 1) return 'started';
    
    // Check for recent completions (last 7 days)
    const today = new Date();
    const recentCompletions = dates.filter(d => {
      const date = new Date(d);
      const daysDiff = (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    }).length;
    
    if (recentCompletions >= 5) return 'very_consistent';
    if (recentCompletions >= 3) return 'consistent';
    if (recentCompletions >= 1) return 'struggling';
    return 'stalled';
  };

  const sortedHabits = [...habitTasks]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((habit) => {
      const completedDates = Array.from(new Set(habit.completedDates)).sort(sortDateKeysAsc);
      const last7Days = completedDates.slice(-7);
      const last30Days = completedDates.slice(-30);
      
      return {
        id: habit.id,
        title: habit.title,
        description: habit.description || '',
        tags: [...habit.tags].sort(),
        priority: habit.priority,
        currentStreak: habit.currentStreak,
        streakTarget: habit.streakTarget || 1,
        completionCount: completedDates.length,
        completionRate7d: Math.round((last7Days.length / 7) * 100),
        completionRate30d: Math.round((last30Days.length / 30) * 100),
        completedDates: last30Days, // Only send last 30 days to keep payload reasonable
        lastCompletedDate: completedDates[completedDates.length - 1] || null,
        pattern: analyzeCompletionPattern(completedDates),
        estimatedDuration: habit.estimatedDuration,
        totalTimeSpent: habit.timeSpent,
        noteToAI: habit.noteToAI || '',
        updatedAt: habit.updatedAt,
      };
    });

  const capturedAt =
    sortedHabits.reduce((latest, habit) => {
      if (!latest) {
        return habit.updatedAt;
      }
      return habit.updatedAt > latest ? habit.updatedAt : latest;
    }, '') || 'no-habit-updates';

  const highestStreak = habitTasks.reduce((max, habit) => Math.max(max, habit.currentStreak), 0);

  return {
    capturedAt,
    summary: {
      totalHabits: habitTasks.length,
      completedToday: completionMap.get(todayKey) || 0,
      highestStreak,
      totalCompletionEvents: trendSnapshot.totalCompletionEvents,
      activeDays: trendSnapshot.activeDays,
      currentRun: trendSnapshot.currentRun,
      longestRun: trendSnapshot.longestRun,
    },
    dailyCompletionCounts,
    habits: sortedHabits,
  };
};

const formatSeriesTick = (dateKey: string) => parseDateKey(dateKey).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const normalizeTaskType = (rawType: unknown): TaskType => {
  const normalized = String(rawType || '').trim().toLowerCase();
  return normalized === 'habit' ? 'habit' : 'todo';
};

const formatDuration = (minutes: number) => {
  const safeMinutes = Math.max(0, Math.floor(Number.isFinite(minutes) ? minutes : 0));
  return formatMinutesAsHoursMinutes(safeMinutes);
};

const formatDate = (value?: string) => {
  if (!value) {
    return 'Not set';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Not set';
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const isCompletedToday = (task: Task) => {
  const today = new Date();
  const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;
  return task.completedDates.includes(key);
};

const defaultDraft = (mode: TaskType): DraftTask => ({
  type: mode,
  title: '',
  description: '',
  projectId: '',
  priority: 'medium',
  status: mode === 'habit' ? 'in-progress' : 'todo',
  tagsInput: '',
  estimatedDuration: mode === 'habit' ? 15 : 30,
  deadline: '',
  followUpDate: '',
  noteToAI: '',
  streakTarget: 7,
});

const draftFromTask = (task: Task): DraftTask => ({
  type: normalizeTaskType(task.type),
  title: task.title,
  description: task.description,
  projectId: task.projectId ? String(task.projectId) : '',
  priority: task.priority,
  status: task.status,
  tagsInput: task.tags.join(', '),
  estimatedDuration: task.estimatedDuration,
  deadline: task.deadline || '',
  followUpDate: task.followUpDate || '',
  noteToAI: task.noteToAI || '',
  streakTarget: task.streakTarget || 7,
});

const TaskManager = () => {
  const { tasks, replaceTasks, addTask, updateTask, deleteTask, updateTaskStatus, toggleTaskCompletion, seedSampleHabits } = useTaskStore();
  const lastHabitSyncSignatureRef = useRef<string>('');
  const hasHydratedFromServerRef = useRef(false);
  const skipNextServerPushRef = useRef(false);

  const [activeMode, setActiveMode] = useState<TaskType>('todo');
  const [hasUserSelectedMode, setHasUserSelectedMode] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [draft, setDraft] = useState<DraftTask>(defaultDraft('todo'));
  const [availableProjects, setAvailableProjects] = useState<ProjectOption[]>([]);
  const [availableTags, setAvailableTags] = useState<TagOption[]>([]);
  const [loadingTaskMeta, setLoadingTaskMeta] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    seedSampleHabits();
  }, [seedSampleHabits]);

  useEffect(() => {
    let cancelled = false;

    const hydrateFromServer = async () => {
      if (!token) {
        hasHydratedFromServerRef.current = true;
        return;
      }

      try {
        const response = await fetch('/api/task-board/state', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        });

        if (!response.ok) {
          hasHydratedFromServerRef.current = true;
          return;
        }

        const payload = (await response.json()) as { tasks?: Task[] };
        if (!cancelled && Array.isArray(payload.tasks)) {
          skipNextServerPushRef.current = true;
          replaceTasks(payload.tasks);
        }
      } catch {
        // Local persistence remains available if server sync is unavailable.
      } finally {
        hasHydratedFromServerRef.current = true;
      }
    };

    void hydrateFromServer();

    return () => {
      cancelled = true;
    };
  }, [replaceTasks]);

  useEffect(() => {
    let cancelled = false;

    const loadTaskMeta = async () => {
      if (!token) {
        setAvailableProjects([]);
        setAvailableTags([]);
        return;
      }

      setLoadingTaskMeta(true);

      try {
        const [projectsResponse, tagsResponse] = await Promise.all([
          fetch('/api/projects/userProjects', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            credentials: 'include',
          }),
          fetch('/api/tags', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            credentials: 'include',
          }),
        ]);

        const projectsPayload = projectsResponse.ok
          ? ((await projectsResponse.json().catch(() => [])) as Array<{ id?: number | string; name?: string }>)
          : [];
        const tagsPayload = tagsResponse.ok
          ? ((await tagsResponse.json().catch(() => [])) as Array<{ id?: number | string; name?: string }>)
          : [];

        if (cancelled) {
          return;
        }

        const normalizedProjects = (Array.isArray(projectsPayload) ? projectsPayload : [])
          .map((project) => {
            const id = String(project.id ?? '').trim();
            const name = String(project.name ?? '').trim();
            if (!id || !name) {
              return null;
            }
            return { id, name };
          })
          .filter((project): project is ProjectOption => project !== null);

        const normalizedTags = (Array.isArray(tagsPayload) ? tagsPayload : [])
          .map((tag) => {
            const id = String(tag.id ?? '').trim();
            const name = String(tag.name ?? '').trim();
            if (!id || !name) {
              return null;
            }
            return { id, name };
          })
          .filter((tag): tag is TagOption => tag !== null);

        setAvailableProjects(normalizedProjects);
        setAvailableTags(normalizedTags);
      } catch {
        if (!cancelled) {
          setAvailableProjects([]);
          setAvailableTags([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingTaskMeta(false);
        }
      }
    };

    void loadTaskMeta();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasHydratedFromServerRef.current) {
      return;
    }

    if (skipNextServerPushRef.current) {
      skipNextServerPushRef.current = false;
      return;
    }

    const timeout = window.setTimeout(() => {
      if (!token) {
        return;
      }

      void fetch('/api/task-board/state', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ tasks }),
      }).catch(() => {
        // Keep local storage as fallback even if server sync fails.
      });
    }, 700);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [tasks]);

  useEffect(() => {
    const todoCount = tasks.filter((task) => normalizeTaskType(task.type) === 'todo').length;
    const habitCount = tasks.filter((task) => normalizeTaskType(task.type) === 'habit').length;
    if (!hasUserSelectedMode && activeMode === 'todo' && todoCount === 0 && habitCount > 0) {
      setActiveMode('habit');
    }
  }, [activeMode, hasUserSelectedMode, tasks]);

  const modeTasks = useMemo(() => {
    return tasks
      .filter((task) => normalizeTaskType(task.type) === activeMode)
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
  }, [activeMode, tasks]);

  const allHabitTasks = useMemo(
    () => tasks.filter((task) => normalizeTaskType(task.type) === 'habit'),
    [tasks]
  );

  const habitTrendSnapshot = useMemo(
    () => buildHabitTrendSnapshot(allHabitTasks),
    [allHabitTasks]
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    const payload = buildHabitSyncPayload(allHabitTasks, habitTrendSnapshot);
    const signature = JSON.stringify(payload);

    if (signature === lastHabitSyncSignatureRef.current) {
      return;
    }

    lastHabitSyncSignatureRef.current = signature;

    const syncHabitsToAgentic = async () => {
      try {
        await fetch('/api/agentic/habits/snapshot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } catch (error) {
        console.warn('Habit snapshot sync failed:', error);
      }
    };

    void syncHabitsToAgentic();
  }, [allHabitTasks, habitTrendSnapshot]);

  const filteredTasks = useMemo(() => {
    return modeTasks
      .filter((task) => (statusFilter === 'all' ? true : task.status === statusFilter))
      .filter((task) => (priorityFilter === 'all' ? true : task.priority === priorityFilter));
  }, [modeTasks, priorityFilter, statusFilter]);

  const projectNameById = useMemo(() => {
    return new Map(availableProjects.map((project) => [project.id, project.name]));
  }, [availableProjects]);

  const modeStats = useMemo(() => {
    const total = modeTasks.length;
    const completed = modeTasks.filter((task) => task.status === 'completed').length;
    const dueSoon = modeTasks.filter((task) => {
      if (!task.deadline || normalizeTaskType(task.type) !== 'todo') {
        return false;
      }

      const deadline = new Date(task.deadline);
      const now = new Date();
      const diffMs = deadline.getTime() - now.getTime();
      return diffMs >= 0 && diffMs <= 3 * 24 * 60 * 60 * 1000;
    }).length;

    const completedTodayCount = modeTasks.filter((task) => normalizeTaskType(task.type) === 'habit' && isCompletedToday(task)).length;
    const highestStreak = modeTasks.reduce((max, task) => Math.max(max, task.currentStreak), 0);
    const averageEstimatedDurationMinutes =
      total > 0 ? Math.round(modeTasks.reduce((sum, task) => sum + task.estimatedDuration, 0) / total) : 0;

    return {
      total,
      completed,
      dueSoon,
      completedTodayCount,
      highestStreak,
      averageEstimatedDurationMinutes,
    };
  }, [modeTasks]);

  const openCreate = (mode: TaskType) => {
    setEditingTaskId(null);
    setDraft(defaultDraft(mode));
    setShowAdvanced(false);
    setShowEditor(true);
  };

  const openEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setHasUserSelectedMode(true);
    setActiveMode(normalizeTaskType(task.type));
    setDraft(draftFromTask(task));
    setShowAdvanced(Boolean(task.description || task.tags.length || task.followUpDate || task.noteToAI || task.projectId));
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    setEditingTaskId(null);
    setShowAdvanced(false);
    setDraft(defaultDraft(activeMode));
  };

  const appendTagToDraft = (tagName: string) => {
    const normalized = tagName.trim();
    if (!normalized) {
      return;
    }

    setDraft((prev) => {
      const existingTags = prev.tagsInput
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const existsAlready = existingTags.some((tag) => tag.toLowerCase() === normalized.toLowerCase());
      if (existsAlready) {
        return prev;
      }

      return {
        ...prev,
        tagsInput: [...existingTags, normalized].join(', '),
      };
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedTitle = draft.title.trim();
    if (!trimmedTitle) {
      return;
    }

    const tags = draft.tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const nowIso = new Date().toISOString();
    const normalizedDraftType = normalizeTaskType(draft.type);

    if (editingTaskId) {
      updateTask(editingTaskId, {
        type: normalizedDraftType,
        title: trimmedTitle,
        description: draft.description.trim(),
        projectId: draft.projectId || undefined,
        priority: draft.priority,
        status: normalizedDraftType === 'habit' ? 'in-progress' : draft.status,
        tags,
        estimatedDuration: Math.max(0, Number(draft.estimatedDuration) || 0),
        deadline: draft.deadline || undefined,
        followUpDate: draft.followUpDate || undefined,
        noteToAI: draft.noteToAI.trim() || undefined,
        streakTarget: normalizedDraftType === 'habit' ? Math.max(1, Number(draft.streakTarget) || 1) : undefined,
        updatedAt: nowIso,
      });
      closeEditor();
      return;
    }

    addTask({
      id: crypto.randomUUID(),
      type: normalizedDraftType,
      title: trimmedTitle,
      description: draft.description.trim(),
      projectId: draft.projectId || undefined,
      tags,
      priority: draft.priority,
      status: normalizedDraftType === 'habit' ? 'in-progress' : draft.status,
      estimatedDuration: Math.max(0, Number(draft.estimatedDuration) || 0),
      timeSpent: 0,
      deadline: draft.deadline || undefined,
      followUpDate: draft.followUpDate || undefined,
      noteToAI: draft.noteToAI.trim() || undefined,
      streakTarget: normalizedDraftType === 'habit' ? Math.max(1, Number(draft.streakTarget) || 1) : undefined,
      currentStreak: 0,
      completedDates: [],
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    closeEditor();
  };

  const theme = modeThemes[activeMode];
  const isTaskMode = activeMode === 'todo';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EEF7FF] via-[#F9FBFF] to-[#FFF9F1] p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 overflow-hidden rounded-2xl border border-[#D8E3F5] bg-white/95 shadow-sm">
          <div className={`bg-gradient-to-r ${theme.glow} px-4 py-3 text-white sm:px-5`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80">Task + Habit Workspace</p>
            <h1 className="mt-1 text-xl font-semibold sm:text-2xl">{theme.title}</h1>
            <p className="mt-1 text-sm text-white/85">{theme.subtitle}</p>
          </div>

          <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="inline-flex w-full max-w-[360px] rounded-2xl border border-slate-200 bg-slate-100 p-1 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setHasUserSelectedMode(true);
                  setActiveMode('todo');
                }}
                className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  isTaskMode
                    ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow'
                    : 'text-slate-600 hover:bg-white/70'
                }`}
              >
                Tasks
              </button>
              <button
                type="button"
                onClick={() => {
                  setHasUserSelectedMode(true);
                  setActiveMode('habit');
                }}
                className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  !isTaskMode
                    ? 'bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white shadow'
                    : 'text-slate-600 hover:bg-white/70'
                }`}
              >
                Habits
              </button>
            </div>

            <button
              type="button"
              onClick={() => openCreate(activeMode)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              <Plus className="h-4 w-4" />
              {isTaskMode ? 'New Task' : 'New Habit'}
            </button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className={`rounded-xl border ${theme.cardBorder} bg-white p-4 shadow-sm`}>
            <p className="text-xs uppercase tracking-wide text-slate-500">Visible {isTaskMode ? 'Tasks' : 'Habits'}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{modeStats.total}</p>
          </div>
          <div className={`rounded-xl border ${theme.cardBorder} bg-white p-4 shadow-sm`}>
            <p className="text-xs uppercase tracking-wide text-slate-500">Completed</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-700">{modeStats.completed}</p>
          </div>
          {isTaskMode ? (
            <div className={`rounded-xl border ${theme.cardBorder} bg-white p-4 shadow-sm`}>
              <p className="text-xs uppercase tracking-wide text-slate-500">Due In 3 Days</p>
              <p className="mt-1 text-2xl font-semibold text-amber-700">{modeStats.dueSoon}</p>
            </div>
          ) : (
            <div className={`rounded-xl border ${theme.cardBorder} bg-white p-4 shadow-sm`}>
              <p className="text-xs uppercase tracking-wide text-slate-500">Completed Today</p>
              <p className="mt-1 text-2xl font-semibold text-fuchsia-700">{modeStats.completedTodayCount}</p>
            </div>
          )}
          {isTaskMode ? (
            <div className={`rounded-xl border ${theme.cardBorder} bg-white p-4 shadow-sm`}>
              <p className="text-xs uppercase tracking-wide text-slate-500">Avg Effort</p>
              <p className="mt-1 text-2xl font-semibold text-cyan-700">{formatDuration(modeStats.averageEstimatedDurationMinutes)}</p>
            </div>
          ) : (
            <div className={`rounded-xl border ${theme.cardBorder} bg-white p-4 shadow-sm`}>
              <p className="text-xs uppercase tracking-wide text-slate-500">Top Streak</p>
              <p className="mt-1 text-2xl font-semibold text-violet-700">{modeStats.highestStreak}</p>
            </div>
          )}
        </div>

        {!isTaskMode && (
          <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1fr]">
            <div className={`rounded-2xl border ${theme.cardBorder} bg-white p-4 shadow-sm`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Habit Contribution Grid</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-900">Streak Momentum</h2>
                  <p className="mt-1 text-sm text-slate-500">{habitTrendSnapshot.contributionRangeLabel}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-right">
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1.5">
                    <p className="text-[10px] uppercase tracking-wide text-emerald-700">Current Run</p>
                    <p className="text-sm font-semibold text-emerald-800">{habitTrendSnapshot.currentRun}d</p>
                  </div>
                  <div className="rounded-lg border border-violet-100 bg-violet-50 px-2.5 py-1.5">
                    <p className="text-[10px] uppercase tracking-wide text-violet-700">Longest Run</p>
                    <p className="text-sm font-semibold text-violet-800">{habitTrendSnapshot.longestRun}d</p>
                  </div>
                  <div className="rounded-lg border border-sky-100 bg-sky-50 px-2.5 py-1.5">
                    <p className="text-[10px] uppercase tracking-wide text-sky-700">Active Days</p>
                    <p className="text-sm font-semibold text-sky-800">{habitTrendSnapshot.activeDays}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto pb-2">
                <div className="min-w-[700px]">
                  <div className="mb-2 flex pl-8">
                    {habitTrendSnapshot.contributionMonthLabels.map((label, index) => (
                      <div key={`month-${index}`} className="w-[16px] text-[10px] text-slate-500">
                        {label}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <div className="flex flex-col justify-between py-[1px] text-[10px] text-slate-400">
                      <span>Sun</span>
                      <span>Tue</span>
                      <span>Thu</span>
                      <span>Sat</span>
                    </div>

                    <div className="flex gap-1">
                      {habitTrendSnapshot.contributionWeeks.map((week, weekIndex) => (
                        <div key={`week-${weekIndex}`} className="flex flex-col gap-1">
                          {week.map((cell, dayIndex) => {
                            const levelClass = !cell.inRange
                              ? 'border-transparent bg-transparent'
                              : cell.level === 0
                                ? 'border-emerald-100 bg-emerald-50'
                                : cell.level === 1
                                  ? 'border-emerald-200 bg-emerald-200'
                                  : cell.level === 2
                                    ? 'border-emerald-400 bg-emerald-400'
                                    : 'border-emerald-700 bg-emerald-700';

                            const title = cell.inRange
                              ? `${cell.label}: ${cell.count} habit${cell.count === 1 ? '' : 's'} completed`
                              : '';

                            return (
                              <div
                                key={`${cell.dateKey}-${weekIndex}-${dayIndex}`}
                                title={title}
                                className={`h-3.5 w-3.5 rounded-sm border ${levelClass}`}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-1 text-[11px] text-slate-500">
                <span>Less</span>
                <span className="h-3 w-3 rounded-sm border border-emerald-100 bg-emerald-50" />
                <span className="h-3 w-3 rounded-sm border border-emerald-200 bg-emerald-200" />
                <span className="h-3 w-3 rounded-sm border border-emerald-400 bg-emerald-400" />
                <span className="h-3 w-3 rounded-sm border border-emerald-700 bg-emerald-700" />
                <span>More</span>
                <span className="ml-2 text-slate-400">
                  Peak day: {habitTrendSnapshot.maxContributionCount} habit{habitTrendSnapshot.maxContributionCount === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            <div className={`rounded-2xl border ${theme.cardBorder} bg-white p-4 shadow-sm`}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Completion Trend</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">Daily Follow-Through</h2>
              <p className="mt-1 text-sm text-slate-500">Last {HABIT_LINE_WINDOW_DAYS} days of completed habits</p>

              <div className="mt-3 h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={habitTrendSnapshot.dailySeries} margin={{ top: 12, right: 10, left: -14, bottom: 8 }}>
                    <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="dateKey"
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      tickFormatter={(value: string, index: number) => (index % 5 === 0 ? formatSeriesTick(value) : '')}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                    <RechartsTooltip
                      labelFormatter={(value: string) => formatSeriesTick(value)}
                      formatter={(value: number | string) => [`${value}`, 'Completed Habits']}
                      contentStyle={{
                        borderRadius: '10px',
                        border: '1px solid #D1FAE5',
                        backgroundColor: 'rgba(255,255,255,0.98)',
                        fontSize: '12px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="completedHabits"
                      stroke="#047857"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 4, fill: '#047857' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <p className="mt-3 text-xs text-slate-500">
                Repetition compounds. If yesterday is active, today gets easier to start.
              </p>
            </div>
          </div>
        )}

        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-[#D8E3F5] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-center gap-2 text-slate-500">
            <ListTodo className="h-4 w-4" />
            <span className="text-sm font-medium">Filtered View</span>
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'all' | TaskStatus)}
            className="rounded-lg border border-[#DBE6F5] bg-[#F8FBFF] px-3 py-2 text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="todo">Todo</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value as 'all' | TaskPriority)}
            className="rounded-lg border border-[#DBE6F5] bg-[#F8FBFF] px-3 py-2 text-sm"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {filteredTasks.length === 0 ? (
          <div className={`rounded-2xl border border-dashed ${theme.cardBorder} bg-white/80 p-10 text-center`}>
            <p className="text-lg font-semibold text-slate-700">No {isTaskMode ? 'tasks' : 'habits'} in this view</p>
            <p className="mt-1 text-sm text-slate-500">
              {isTaskMode
                ? 'Create a focused task with a due date and priority.'
                : 'Start with a repeatable habit and edit it as your routine evolves.'}
            </p>
            <button
              type="button"
              onClick={() => openCreate(activeMode)}
              className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Create {isTaskMode ? 'Task' : 'Habit'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const taskType = normalizeTaskType(task.type);
              const completedToday = taskType === 'habit' && isCompletedToday(task);
              const isSampleHabit = taskType === 'habit' && task.tags.some((tag) => tag.toLowerCase() === 'sample');
              return (
                <div key={task.id} className={`rounded-2xl border ${theme.cardBorder} bg-white p-4 shadow-sm transition hover:shadow-md`}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-900">{task.title}</h3>
                        {isSampleHabit && (
                          <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700">Sample habit</span>
                        )}
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${priorityStyles[task.priority]}`}>
                          {task.priority}
                        </span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[task.status]}`}>
                          {task.status}
                        </span>
                      </div>

                      {task.description && <p className="mt-2 text-sm text-slate-600">{task.description}</p>}

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                          <Flag className="h-3.5 w-3.5" />
                          {formatDuration(task.timeSpent)} / {formatDuration(task.estimatedDuration)}
                        </span>

                        {task.projectId && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2.5 py-1 text-cyan-700">
                            <Target className="h-3.5 w-3.5" />
                            Project: {projectNameById.get(task.projectId) || task.projectId}
                          </span>
                        )}

                        {taskType === 'todo' ? (
                          <>
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                              <CalendarDays className="h-3.5 w-3.5" />
                              Deadline: {formatDate(task.deadline)}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                              <Target className="h-3.5 w-3.5" />
                              Follow-up: {formatDate(task.followUpDate)}
                            </span>
                          </>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-fuchsia-100 px-2.5 py-1 text-fuchsia-700">
                            <Repeat className="h-3.5 w-3.5" />
                            Streak {task.currentStreak}/{task.streakTarget || 1}
                          </span>
                        )}
                      </div>

                      {task.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {task.tags.map((tagValue) => (
                            <span key={`${task.id}-${tagValue}`} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                              {tagValue}
                            </span>
                          ))}
                        </div>
                      )}

                      {task.noteToAI && (
                        <div className="mt-3 rounded-xl border border-[#E9E3FF] bg-[#F7F4FF] p-3 text-xs text-slate-600">
                          <p className="inline-flex items-center gap-1 font-medium text-slate-700">
                            <Sparkles className="h-3.5 w-3.5 text-violet-600" />
                            Note To AI
                          </p>
                          <p className="mt-1 whitespace-pre-wrap">{task.noteToAI}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-row flex-wrap items-center gap-2 md:w-[230px] md:justify-end">
                      {taskType === 'habit' ? (
                        <button
                          type="button"
                          onClick={() => toggleTaskCompletion(task.id)}
                          className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                            completedToday
                              ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                              : 'bg-fuchsia-600 text-white hover:bg-fuchsia-500'
                          }`}
                        >
                          <Check className="h-4 w-4" />
                          {completedToday ? 'Completed Today' : 'Check Today'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleTaskCompletion(task.id)}
                          className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                            task.status === 'completed'
                              ? 'bg-slate-600 text-white hover:bg-slate-500'
                              : 'bg-emerald-600 text-white hover:bg-emerald-500'
                          }`}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {task.status === 'completed' ? 'Reopen' : 'Complete'}
                        </button>
                      )}

                      {taskType === 'todo' && (
                        <select
                          value={task.status}
                          onChange={(event) => updateTaskStatus(task.id, event.target.value as TaskStatus)}
                          className="rounded-lg border border-[#DBE6F5] bg-[#F8FBFF] px-3 py-2 text-sm"
                        >
                          <option value="todo">Todo</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      )}

                      <button
                        type="button"
                        onClick={() => openEdit(task)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        <Edit3 className="h-4 w-4" />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteTask(task.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showEditor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-0 sm:p-4">
            <div className="flex h-[100dvh] w-full flex-col overflow-hidden rounded-none border border-[#D8E3F5] bg-white shadow-2xl sm:h-auto sm:max-h-[92dvh] sm:max-w-2xl sm:rounded-2xl">
              <div className="border-b border-[#E5ECF8] px-5 py-4 sm:px-6">
                <h2 className="text-xl font-semibold text-slate-900">{editingTaskId ? 'Edit' : 'Create'} {draft.type === 'todo' ? 'Task' : 'Habit'}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Keep it minimal now, then expand advanced details only if needed.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
                  <label className="block space-y-1 text-sm text-slate-700">
                    <span className="font-medium">Title</span>
                    <input
                      type="text"
                      value={draft.title}
                      onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                      className="w-full rounded-lg border border-[#DBE6F5] bg-[#F8FBFF] px-3 py-2"
                      placeholder={draft.type === 'todo' ? 'Ship onboarding popup UX' : 'Evening reflection check-in'}
                      required
                    />
                  </label>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {draft.type === 'todo' ? (
                      <label className="space-y-1 text-sm text-slate-700">
                        <span className="font-medium">Priority</span>
                        <select
                          value={draft.priority}
                          onChange={(event) => setDraft((prev) => ({ ...prev, priority: event.target.value as TaskPriority }))}
                          className="w-full rounded-lg border border-[#DBE6F5] bg-[#F8FBFF] px-3 py-2"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </label>
                    ) : (
                      <label className="space-y-1 text-sm text-slate-700">
                        <span className="font-medium">Streak Target (days)</span>
                        <input
                          type="number"
                          min={1}
                          value={draft.streakTarget}
                          onChange={(event) => setDraft((prev) => ({ ...prev, streakTarget: Number(event.target.value) || 1 }))}
                          className="w-full rounded-lg border border-[#DBE6F5] bg-[#F8FBFF] px-3 py-2"
                        />
                      </label>
                    )}

                    <label className="space-y-1 text-sm text-slate-700">
                      <span className="font-medium">Estimated Duration (h + m)</span>
                      <input
                        type="number"
                        min={0}
                        value={draft.estimatedDuration}
                        onChange={(event) => setDraft((prev) => ({ ...prev, estimatedDuration: Number(event.target.value) || 0 }))}
                        className="w-full rounded-lg border border-[#DBE6F5] bg-[#F8FBFF] px-3 py-2"
                      />
                      <p className="text-xs text-slate-500">Preview: {formatDuration(draft.estimatedDuration)}</p>
                    </label>

                    <label className="space-y-1 text-sm text-slate-700 sm:col-span-2">
                      <span className="font-medium">Project</span>
                      <select
                        value={draft.projectId}
                        onChange={(event) => setDraft((prev) => ({ ...prev, projectId: event.target.value }))}
                        className="w-full rounded-lg border border-[#DBE6F5] bg-[#F8FBFF] px-3 py-2"
                      >
                        <option value="">No project</option>
                        {availableProjects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                      {loadingTaskMeta && (
                        <p className="text-xs text-slate-500">Loading projects and tags...</p>
                      )}
                    </label>
                  </div>

                  {draft.type === 'todo' && (
                    <label className="block space-y-1 text-sm text-slate-700">
                      <span className="font-medium">Deadline</span>
                      <input
                        type="date"
                        value={draft.deadline}
                        onChange={(event) => setDraft((prev) => ({ ...prev, deadline: event.target.value }))}
                        className="w-full rounded-lg border border-[#DBE6F5] bg-[#F8FBFF] px-3 py-2"
                      />
                    </label>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowAdvanced((prev) => !prev)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    {showAdvanced ? 'Hide Advanced Fields' : 'Show Advanced Fields'}
                  </button>

                  {showAdvanced && (
                    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <label className="block space-y-1 text-sm text-slate-700">
                        <span className="font-medium">Description</span>
                        <textarea
                          value={draft.description}
                          onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
                          className="w-full rounded-lg border border-[#DBE6F5] bg-white px-3 py-2"
                          rows={3}
                          placeholder="Optional implementation detail"
                        />
                      </label>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <label className="space-y-1 text-sm text-slate-700">
                          <span className="font-medium">Tags</span>
                          <input
                            type="text"
                            value={draft.tagsInput}
                            onChange={(event) => setDraft((prev) => ({ ...prev, tagsInput: event.target.value }))}
                            className="w-full rounded-lg border border-[#DBE6F5] bg-white px-3 py-2"
                            placeholder="focus, sprint"
                            list="task-tag-suggestions"
                          />
                          <datalist id="task-tag-suggestions">
                            {availableTags.map((tag) => (
                              <option key={tag.id} value={tag.name} />
                            ))}
                          </datalist>
                          {availableTags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {availableTags.slice(0, 10).map((tag) => (
                                <button
                                  key={tag.id}
                                  type="button"
                                  onClick={() => appendTagToDraft(tag.name)}
                                  className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600 hover:bg-slate-100"
                                >
                                  {tag.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </label>

                        <label className="space-y-1 text-sm text-slate-700">
                          <span className="font-medium">Follow-up Date</span>
                          <input
                            type="date"
                            value={draft.followUpDate}
                            onChange={(event) => setDraft((prev) => ({ ...prev, followUpDate: event.target.value }))}
                            className="w-full rounded-lg border border-[#DBE6F5] bg-white px-3 py-2"
                          />
                        </label>
                      </div>

                      {draft.type === 'todo' && (
                        <label className="block space-y-1 text-sm text-slate-700">
                          <span className="font-medium">Status</span>
                          <select
                            value={draft.status}
                            onChange={(event) => setDraft((prev) => ({ ...prev, status: event.target.value as TaskStatus }))}
                            className="w-full rounded-lg border border-[#DBE6F5] bg-white px-3 py-2"
                          >
                            <option value="todo">Todo</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                        </label>
                      )}

                      <label className="block space-y-1 text-sm text-slate-700">
                        <span className="inline-flex items-center gap-1 font-medium">
                          <Sparkles className="h-4 w-4 text-violet-600" />
                          Note To AI
                        </span>
                        <textarea
                          value={draft.noteToAI}
                          onChange={(event) => setDraft((prev) => ({ ...prev, noteToAI: event.target.value }))}
                          className="w-full rounded-lg border border-[#E6DDFF] bg-[#F7F4FF] px-3 py-2"
                          rows={3}
                          placeholder="Optional context to steer AI assistance"
                        />
                      </label>
                    </div>
                  )}
                </div>

                <div className="flex flex-col-reverse gap-2 border-t border-[#E5ECF8] bg-white px-5 py-3 sm:flex-row sm:justify-end sm:px-6">
                  <button
                    type="button"
                    onClick={closeEditor}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
                  >
                    {editingTaskId ? 'Save Changes' : 'Save Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskManager;