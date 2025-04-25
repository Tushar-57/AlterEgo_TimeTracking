export type TimerStatus = 'stopped' | 'running' | 'paused';
export type TimerMode = 'stopwatch' | 'countdown' | 'pomodoro';

export interface Project {
  id: number;
  name: string;
  color: string;
  client?: string;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
}

export interface TimeEntry {
  id: number;
  description: string;
  startTime: string;
  endTime?: string;
  duration: number;
  project?: Project;
  tags?: Tag[];
  billable: boolean;
}

export type PomodoroSettings = {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsUntilLongBreak: number;
};

export type UserPreferences = {
  timerMode: TimerMode;
  darkMode: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  pomodoroSettings: PomodoroSettings;
  countdownPresets: number[];
};
export interface PomodoroState {
  currentSession: number;
  isBreak: boolean;
  totalSessions: number;
}

export interface CurrentTask {
  description: string;
  projectId: string|any;
  tags: Tag[];
  billable: boolean;
  newTag: string;
}