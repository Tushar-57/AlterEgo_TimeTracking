import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in-progress' | 'completed';
export type TaskType = 'todo' | 'habit';

export interface Task {
  id: string;
  type: TaskType;
  title: string;
  description: string;
  projectId?: string;
  tags: string[];
  assigneeId?: string;
  startDate?: string;
  endDate?: string;
  priority: TaskPriority;
  status: TaskStatus;
  estimatedDuration: number;
  timeSpent: number;
  deadline?: string;
  followUpDate?: string;
  noteToAI?: string;
  streakTarget?: number;
  currentStreak: number;
  completedDates: string[];
  createdAt: string;
  updatedAt: string;
}

interface TaskState {
  tasks: Task[];
  replaceTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  toggleTaskCompletion: (id: string, completedAt?: Date) => void;
  seedSampleHabits: () => void;
}

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeTaskType = (rawType: unknown): TaskType => {
  const normalized = String(rawType || '').trim().toLowerCase();
  return normalized === 'habit' ? 'habit' : 'todo';
};

const normalizeTaskStatus = (rawStatus: unknown, type: TaskType): TaskStatus => {
  const normalized = String(rawStatus || '').trim().toLowerCase();

  if (normalized === 'completed') {
    return 'completed';
  }

  if (normalized === 'in-progress') {
    return 'in-progress';
  }

  if (normalized === 'todo') {
    return type === 'habit' ? 'in-progress' : 'todo';
  }

  return type === 'habit' ? 'in-progress' : 'todo';
};

const calculateCurrentStreak = (completedDates: string[]) => {
  if (completedDates.length === 0) {
    return 0;
  }

  const sorted = Array.from(new Set(completedDates)).sort((left, right) => right.localeCompare(left));
  const today = new Date();
  let streak = 0;

  for (let index = 0; index < sorted.length; index += 1) {
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - index);

    if (sorted[index] !== toDateKey(expectedDate)) {
      break;
    }

    streak += 1;
  }

  return streak;
};

const buildSampleHabit = (overrides: Partial<Task>): Task => {
  const nowIso = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: 'Daily focus ritual',
    description: 'Start with a 10-minute planning pass and define one meaningful win for the day.',
    tags: ['sample', 'focus'],
    priority: 'medium',
    status: 'in-progress',
    estimatedDuration: 15,
    timeSpent: 0,
    followUpDate: undefined,
    deadline: undefined,
    noteToAI: 'Nudge me gently if I miss this two days in a row.',
    streakTarget: 7,
    currentStreak: 0,
    completedDates: [],
    createdAt: nowIso,
    updatedAt: nowIso,
    ...overrides,
    type: 'habit',
  };
};

export const useTaskStore = create<TaskState>()(
  persist(
    (set) => ({
      tasks: [],
      replaceTasks: (tasks) =>
        set(() => {
          const nowIso = new Date().toISOString();
          const normalizedTasks = (Array.isArray(tasks) ? tasks : []).map((task) => {
            const normalizedType = normalizeTaskType(task.type);
            const completedDates = Array.isArray(task.completedDates)
              ? task.completedDates.filter((date): date is string => typeof date === 'string')
              : [];

            return {
              ...task,
              type: normalizedType,
              status: normalizeTaskStatus(task.status, normalizedType),
              tags: Array.isArray(task.tags)
                ? task.tags.filter((tag): tag is string => typeof tag === 'string')
                : [],
              completedDates,
              currentStreak: normalizedType === 'habit'
                ? calculateCurrentStreak(completedDates)
                : 0,
              createdAt: task.createdAt || nowIso,
              updatedAt: task.updatedAt || nowIso,
            };
          });

          return {
            tasks: normalizedTasks,
          };
        }),
      addTask: (task) =>
        set((state) => {
          const nowIso = new Date().toISOString();
          const normalizedType = normalizeTaskType(task.type);
          const nextTask: Task = {
            ...task,
            type: normalizedType,
            status: normalizeTaskStatus(task.status, normalizedType),
            currentStreak: task.currentStreak ?? 0,
            completedDates: task.completedDates ?? [],
            createdAt: task.createdAt || nowIso,
            updatedAt: nowIso,
          };

          return {
            tasks: [...state.tasks, nextTask],
          };
        }),
      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id
            ? (() => {
                const nextType = normalizeTaskType(updates.type ?? task.type);
                return {
                  ...task,
                  ...updates,
                  type: nextType,
                  status: normalizeTaskStatus(updates.status ?? task.status, nextType),
                  updatedAt: new Date().toISOString(),
                };
              })()
            : {
                ...task,
                type: normalizeTaskType(task.type),
                status: normalizeTaskStatus(task.status, normalizeTaskType(task.type)),
              }
        ),
      })),
      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
      })),
      updateTaskStatus: (id, status) => set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id
            ? {
                ...task,
                status,
                updatedAt: new Date().toISOString(),
              }
            : task
        ),
      })),
      toggleTaskCompletion: (id, completedAt = new Date()) =>
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id !== id) {
              return task;
            }

            const nowIso = new Date().toISOString();
            const dayKey = toDateKey(completedAt);
            const normalizedType = normalizeTaskType(task.type);

            if (normalizedType === 'habit') {
              const alreadyCompletedToday = task.completedDates.includes(dayKey);
              const nextCompletedDates = alreadyCompletedToday
                ? task.completedDates.filter((date) => date !== dayKey)
                : [...task.completedDates, dayKey];

              const includesToday = nextCompletedDates.includes(toDateKey(new Date()));

              return {
                ...task,
                completedDates: nextCompletedDates,
                currentStreak: calculateCurrentStreak(nextCompletedDates),
                status: includesToday ? 'completed' : 'in-progress',
                updatedAt: nowIso,
              };
            }

            const isCompleted = task.status === 'completed';
            return {
              ...task,
              status: isCompleted ? 'todo' : 'completed',
              completedDates: isCompleted ? [] : [dayKey],
              updatedAt: nowIso,
            };
          }),
        })),
      seedSampleHabits: () =>
        set((state) => {
          const existingHabitCount = state.tasks.filter((task) => task.type === 'habit').length;
          const normalizedHabitCount = state.tasks.filter((task) => normalizeTaskType(task.type) === 'habit').length;
          if (existingHabitCount > 0 || normalizedHabitCount > 0) {
            return state;
          }

          const seededHabits = [
            buildSampleHabit({
              title: 'Daily focus ritual',
              description: 'Start with a 10-minute planning pass and define one meaningful win for the day.',
              tags: ['sample', 'focus'],
              estimatedDuration: 15,
              streakTarget: 7,
            }),
            buildSampleHabit({
              title: 'Evening check-in reflection',
              description: 'Capture one progress note and one blocker before ending your day.',
              tags: ['sample', 'reflection'],
              estimatedDuration: 10,
              streakTarget: 5,
            }),
          ];

          return {
            tasks: [...state.tasks, ...seededHabits],
          };
        }),
    }),
    {
      name: 'task-storage',
    }
  )
);