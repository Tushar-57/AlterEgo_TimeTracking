import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in-progress' | 'completed';

interface Task {
  id: string;
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
}

interface TaskState {
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set) => ({
      tasks: [],
      addTask: (task) => set((state) => ({ 
        tasks: [...state.tasks, task] 
      })),
      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id ? { ...task, ...updates } : task
        ),
      })),
      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
      })),
      updateTaskStatus: (id, status) => set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id ? { ...task, status } : task
        ),
      })),
    }),
    {
      name: 'task-storage',
    }
  )
);