import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type EventRecurrence = 'none' | 'daily' | 'weekly' | 'monthly';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  projectId?: string;
  tags: string[];
  assigneeId?: string;
  recurrence: EventRecurrence;
  color: string;
}

interface CalendarState {
  events: CalendarEvent[];
  view: 'day' | 'week' | 'month';
  selectedDate: string;
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  setView: (view: CalendarState['view']) => void;
  setSelectedDate: (date: string) => void;
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set) => ({
      events: [],
      view: 'week',
      selectedDate: new Date().toISOString(),
      addEvent: (event) => set((state) => ({
        events: [...state.events, event]
      })),
      updateEvent: (id, updates) => set((state) => ({
        events: state.events.map((event) =>
          event.id === id ? { ...event, ...updates } : event
        ),
      })),
      deleteEvent: (id) => set((state) => ({
        events: state.events.filter((event) => event.id !== id),
      })),
      setView: (view) => set({ view }),
      setSelectedDate: (date) => set({ selectedDate: date }),
    }),
    {
      name: 'calendar-storage',
    }
  )
);