import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TimerMode = 'focus' | 'balanced' | 'relax';
export type TimerStatus = 'stopped' | 'running' | 'paused';

interface TimerState {
  mode: TimerMode;
  status: TimerStatus;
  time: number;
  targetTime: number;
  sessions: Array<{
    id: string;
    startTime: string;
    endTime: string;
    duration: number;
    mode: TimerMode;
    taskId?: string;
  }>;
  setMode: (mode: TimerMode) => void;
  setStatus: (status: TimerStatus) => void;
  setTime: (time: number) => void;
  setTargetTime: (time: number) => void;
  addSession: (session: TimerState['sessions'][0]) => void;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set) => ({
      mode: 'balanced',
      status: 'stopped',
      time: 0,
      targetTime: 1500, // 25 minutes
      sessions: [],
      setMode: (mode) => set({ mode }),
      setStatus: (status) => set({ status }),
      setTime: (time) => set({ time }),
      setTargetTime: (time) => set({ targetTime }),
      addSession: (session) => set((state) => ({
        sessions: [...state.sessions, session]
      })),
    }),
    {
      name: 'timer-storage',
    }
  )
);