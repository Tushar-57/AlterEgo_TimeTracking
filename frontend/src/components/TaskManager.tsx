import React, { useEffect, useMemo, useState } from 'react';
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
import { useTaskStore } from '../store/taskStore';
import type { Task, TaskPriority, TaskStatus, TaskType } from '../store/taskStore';

type DraftTask = {
  type: TaskType;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  tagsInput: string;
  estimatedDuration: number;
  deadline: string;
  followUpDate: string;
  noteToAI: string;
  streakTarget: number;
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

const normalizeTaskType = (rawType: unknown): TaskType => {
  const normalized = String(rawType || '').trim().toLowerCase();
  return normalized === 'habit' ? 'habit' : 'todo';
};

const formatDuration = (minutes: number) => {
  const safeMinutes = Math.max(0, Math.floor(Number.isFinite(minutes) ? minutes : 0));
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
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
  const { tasks, addTask, updateTask, deleteTask, updateTaskStatus, toggleTaskCompletion, seedSampleHabits } = useTaskStore();

  const [activeMode, setActiveMode] = useState<TaskType>('todo');
  const [hasUserSelectedMode, setHasUserSelectedMode] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [draft, setDraft] = useState<DraftTask>(defaultDraft('todo'));

  useEffect(() => {
    seedSampleHabits();
  }, [seedSampleHabits]);

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

  const filteredTasks = useMemo(() => {
    return modeTasks
      .filter((task) => (statusFilter === 'all' ? true : task.status === statusFilter))
      .filter((task) => (priorityFilter === 'all' ? true : task.priority === priorityFilter));
  }, [modeTasks, priorityFilter, statusFilter]);

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

    return {
      total,
      completed,
      dueSoon,
      completedTodayCount,
      highestStreak,
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
    setShowAdvanced(Boolean(task.description || task.tags.length || task.followUpDate || task.noteToAI));
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    setEditingTaskId(null);
    setShowAdvanced(false);
    setDraft(defaultDraft(activeMode));
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
              <p className="text-xs uppercase tracking-wide text-slate-500">Avg Effort (min)</p>
              <p className="mt-1 text-2xl font-semibold text-cyan-700">
                {modeTasks.length > 0
                  ? Math.round(modeTasks.reduce((sum, task) => sum + task.estimatedDuration, 0) / modeTasks.length)
                  : 0}
              </p>
            </div>
          ) : (
            <div className={`rounded-xl border ${theme.cardBorder} bg-white p-4 shadow-sm`}>
              <p className="text-xs uppercase tracking-wide text-slate-500">Top Streak</p>
              <p className="mt-1 text-2xl font-semibold text-violet-700">{modeStats.highestStreak}</p>
            </div>
          )}
        </div>

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
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4">
            <div className="w-full max-h-[90dvh] overflow-y-auto rounded-t-3xl border border-[#D8E3F5] bg-white p-5 shadow-2xl sm:max-w-2xl sm:rounded-2xl sm:p-6">
              <h2 className="text-xl font-semibold text-slate-900">{editingTaskId ? 'Edit' : 'Create'} {draft.type === 'todo' ? 'Task' : 'Habit'}</h2>
              <p className="mt-1 text-sm text-slate-500">
                Keep it minimal now, then expand advanced details only if needed.
              </p>

              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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
                    <span className="font-medium">Estimated Minutes</span>
                    <input
                      type="number"
                      min={0}
                      value={draft.estimatedDuration}
                      onChange={(event) => setDraft((prev) => ({ ...prev, estimatedDuration: Number(event.target.value) || 0 }))}
                      className="w-full rounded-lg border border-[#DBE6F5] bg-[#F8FBFF] px-3 py-2"
                    />
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
                        />
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

                <div className="flex justify-end gap-2 pt-2">
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