import React, { useMemo, useState } from 'react';
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Filter,
  Flag,
  Plus,
  Repeat,
  Sparkles,
  Target,
  Trash2,
} from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import type { Task, TaskPriority, TaskStatus, TaskType } from '../store/taskStore';

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

const typeStyles: Record<TaskType, string> = {
  todo: 'bg-cyan-50 text-cyan-700',
  habit: 'bg-fuchsia-50 text-fuchsia-700',
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

const TaskManager = () => {
  const { tasks, addTask, deleteTask, updateTaskStatus, toggleTaskCompletion } = useTaskStore();

  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'all' | TaskType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');

  const [newTask, setNewTask] = useState({
    type: 'todo' as TaskType,
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    status: 'todo' as TaskStatus,
    tagsInput: '',
    estimatedDuration: 30,
    deadline: '',
    followUpDate: '',
    noteToAI: '',
    streakTarget: 7,
  });

  const taskStats = useMemo(() => {
    const todoCount = tasks.filter((task) => task.type === 'todo').length;
    const habitCount = tasks.filter((task) => task.type === 'habit').length;
    const completedCount = tasks.filter((task) => task.status === 'completed').length;
    return {
      total: tasks.length,
      todoCount,
      habitCount,
      completedCount,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return [...tasks]
      .filter((task) => (typeFilter === 'all' ? true : task.type === typeFilter))
      .filter((task) => (statusFilter === 'all' ? true : task.status === statusFilter))
      .filter((task) => (priorityFilter === 'all' ? true : task.priority === priorityFilter))
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
  }, [priorityFilter, statusFilter, tasks, typeFilter]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const tags = newTask.tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const nowIso = new Date().toISOString();

    addTask({
      id: crypto.randomUUID(),
      type: newTask.type,
      title: newTask.title.trim(),
      description: newTask.description.trim(),
      tags,
      priority: newTask.priority,
      status: newTask.type === 'habit' ? 'in-progress' : newTask.status,
      estimatedDuration: Math.max(0, Number(newTask.estimatedDuration) || 0),
      timeSpent: 0,
      deadline: newTask.deadline || undefined,
      followUpDate: newTask.followUpDate || undefined,
      noteToAI: newTask.noteToAI.trim() || undefined,
      streakTarget: newTask.type === 'habit' ? Math.max(1, Number(newTask.streakTarget) || 1) : undefined,
      currentStreak: 0,
      completedDates: [],
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    setNewTask({
      type: 'todo',
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      tagsInput: '',
      estimatedDuration: 30,
      deadline: '',
      followUpDate: '',
      noteToAI: '',
      streakTarget: 7,
    });
    setShowNewTaskForm(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EEF7FF] via-[#F9FBFF] to-[#FFF9F1] p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-[#D8E3F5] bg-white/95 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Task Workspace</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">Todos + Habits</h1>
            <p className="mt-1 text-sm text-slate-500">Track deadlines, follow-ups, and behavior loops in one board.</p>
          </div>
          <button
            onClick={() => setShowNewTaskForm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            <Plus className="h-4 w-4" />
            New Item
          </button>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[#D8E3F5] bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Items</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{taskStats.total}</p>
          </div>
          <div className="rounded-xl border border-[#D8E3F5] bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Todo Tracks</p>
            <p className="mt-1 text-2xl font-semibold text-cyan-700">{taskStats.todoCount}</p>
          </div>
          <div className="rounded-xl border border-[#D8E3F5] bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Habit Tracks</p>
            <p className="mt-1 text-2xl font-semibold text-fuchsia-700">{taskStats.habitCount}</p>
          </div>
          <div className="rounded-xl border border-[#D8E3F5] bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Completed</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-700">{taskStats.completedCount}</p>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-[#D8E3F5] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-center gap-2 text-slate-500">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filters</span>
          </div>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as 'all' | TaskType)}
            className="rounded-lg border border-[#DBE6F5] bg-[#F8FBFF] px-3 py-2 text-sm"
          >
            <option value="all">All Types</option>
            <option value="todo">Todo</option>
            <option value="habit">Habit</option>
          </select>
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
          <div className="rounded-2xl border border-dashed border-[#D8E3F5] bg-white/80 p-10 text-center">
            <p className="text-lg font-semibold text-slate-700">No items in this view</p>
            <p className="mt-1 text-sm text-slate-500">Change filters or create a new todo or habit track.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const completedToday = task.type === 'habit' && isCompletedToday(task);
              return (
                <div
                  key={task.id}
                  className="rounded-2xl border border-[#D8E3F5] bg-white p-4 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-900">{task.title}</h3>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${typeStyles[task.type]}`}>
                          {task.type}
                        </span>
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
                          <CalendarDays className="h-3.5 w-3.5" />
                          Deadline: {formatDate(task.deadline)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                          <Target className="h-3.5 w-3.5" />
                          Follow-up: {formatDate(task.followUpDate)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                          <Flag className="h-3.5 w-3.5" />
                          {formatDuration(task.timeSpent)} / {formatDuration(task.estimatedDuration)}
                        </span>
                        {task.type === 'habit' && (
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
                          <p className="font-medium text-slate-700">Note To AI</p>
                          <p className="mt-1 whitespace-pre-wrap">{task.noteToAI}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-row flex-wrap items-center gap-2 md:w-[220px] md:justify-end">
                      {task.type === 'habit' ? (
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
                          {completedToday ? 'Completed Today' : 'Check Off Today'}
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
                          {task.status === 'completed' ? 'Mark Todo' : 'Mark Completed'}
                        </button>
                      )}

                      <select
                        value={task.status}
                        onChange={(event) => updateTaskStatus(task.id, event.target.value as TaskStatus)}
                        className="rounded-lg border border-[#DBE6F5] bg-[#F8FBFF] px-3 py-2 text-sm"
                      >
                        <option value="todo">Todo</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>

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

        {showNewTaskForm && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4">
            <div className="w-full max-h-[90dvh] overflow-y-auto rounded-t-3xl border border-[#D8E3F5] bg-white p-5 shadow-2xl sm:max-w-2xl sm:rounded-2xl sm:p-6">
              <h2 className="text-xl font-semibold text-slate-900">Create Todo Or Habit</h2>
              <p className="mt-1 text-sm text-slate-500">Capture due dates, follow-up reminders, and coaching notes.</p>

              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="space-y-1 text-sm text-slate-700">
                    <span className="font-medium">Type</span>
                    <select
                      value={newTask.type}
                      onChange={(event) => setNewTask((prev) => ({ ...prev, type: event.target.value as TaskType }))}
                      className="w-full rounded-lg border border-[#DBE6F5] bg-[#F8FBFF] px-3 py-2"
                    >
                      <option value="todo">Todo</option>
                      <option value="habit">Habit</option>
                    </select>
                  </label>

                  <label className="space-y-1 text-sm text-slate-700">
                    <span className="font-medium">Priority</span>
                    <select
                      value={newTask.priority}
                      onChange={(event) => setNewTask((prev) => ({ ...prev, priority: event.target.value as TaskPriority }))}
                      className="w-full rounded-lg border border-[#DBE6F5] bg-[#F8FBFF] px-3 py-2"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </label>
                </div>

                <label className="block space-y-1 text-sm text-slate-700">
                  <span className="font-medium">Title</span>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(event) => setNewTask((prev) => ({ ...prev, title: event.target.value }))}
                    className="w-full rounded-lg border border-[#DBE6F5] bg-[#F8FBFF] px-3 py-2"
                    required
                  />
                </label>

                <label className="block space-y-1 text-sm text-slate-700">
                  <span className="font-medium">Description</span>
                  <textarea
                    value={newTask.description}
                    onChange={(event) => setNewTask((prev) => ({ ...prev, description: event.target.value }))}
                    className="w-full rounded-lg border border-[#DBE6F5] bg-[#F8FBFF] px-3 py-2"
                    rows={3}
                    placeholder="Add implementation details or expected outcome"
                  />
                </label>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="space-y-1 text-sm text-slate-700">
                    <span className="font-medium">Estimated Duration (minutes)</span>
                    <input
                      type="number"
                      min={0}
                      value={newTask.estimatedDuration}
                      onChange={(event) =>
                        setNewTask((prev) => ({ ...prev, estimatedDuration: Number(event.target.value) || 0 }))
                      }
                      className="w-full rounded-lg border border-[#DBE6F5] bg-[#F8FBFF] px-3 py-2"
                    />
                  </label>

                  <label className="space-y-1 text-sm text-slate-700">
                    <span className="font-medium">Status</span>
                    <select
                      value={newTask.status}
                      onChange={(event) => setNewTask((prev) => ({ ...prev, status: event.target.value as TaskStatus }))}
                      className="w-full rounded-lg border border-[#DBE6F5] bg-[#F8FBFF] px-3 py-2"
                      disabled={newTask.type === 'habit'}
                    >
                      <option value="todo">Todo</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="space-y-1 text-sm text-slate-700">
                    <span className="font-medium">Deadline</span>
                    <input
                      type="date"
                      value={newTask.deadline}
                      onChange={(event) => setNewTask((prev) => ({ ...prev, deadline: event.target.value }))}
                      className="w-full rounded-lg border border-[#DBE6F5] bg-[#F8FBFF] px-3 py-2"
                    />
                  </label>

                  <label className="space-y-1 text-sm text-slate-700">
                    <span className="font-medium">Follow-Up</span>
                    <input
                      type="date"
                      value={newTask.followUpDate}
                      onChange={(event) => setNewTask((prev) => ({ ...prev, followUpDate: event.target.value }))}
                      className="w-full rounded-lg border border-[#DBE6F5] bg-[#F8FBFF] px-3 py-2"
                    />
                  </label>
                </div>

                {newTask.type === 'habit' && (
                  <label className="block space-y-1 text-sm text-slate-700">
                    <span className="font-medium">Streak Target (days)</span>
                    <input
                      type="number"
                      min={1}
                      value={newTask.streakTarget}
                      onChange={(event) => setNewTask((prev) => ({ ...prev, streakTarget: Number(event.target.value) || 1 }))}
                      className="w-full rounded-lg border border-[#DBE6F5] bg-[#F8FBFF] px-3 py-2"
                    />
                  </label>
                )}

                <label className="block space-y-1 text-sm text-slate-700">
                  <span className="font-medium">Tags</span>
                  <input
                    type="text"
                    value={newTask.tagsInput}
                    onChange={(event) => setNewTask((prev) => ({ ...prev, tagsInput: event.target.value }))}
                    className="w-full rounded-lg border border-[#DBE6F5] bg-[#F8FBFF] px-3 py-2"
                    placeholder="client, deep-work, sprint-2"
                  />
                </label>

                <label className="block space-y-1 text-sm text-slate-700">
                  <span className="inline-flex items-center gap-1 font-medium">
                    <Sparkles className="h-4 w-4 text-violet-600" />
                    Note To AI
                  </span>
                  <textarea
                    value={newTask.noteToAI}
                    onChange={(event) => setNewTask((prev) => ({ ...prev, noteToAI: event.target.value }))}
                    className="w-full rounded-lg border border-[#E6DDFF] bg-[#F7F4FF] px-3 py-2"
                    rows={3}
                    placeholder="What context should AI keep in mind while helping on this item?"
                  />
                </label>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewTaskForm(false)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
                  >
                    Save Item
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