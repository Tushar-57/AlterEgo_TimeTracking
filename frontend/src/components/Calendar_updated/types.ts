/**
 * Shared calendar types. Previously these lived in (and were re-exported through)
 * the now-deleted `Fantastical.tsx` / `DraggableEvent.tsx` mock components.
 */

export type ColorKey = 'lightblue' | 'violet' | 'amber' | 'rose' | 'emerald';

export interface CalendarEvent {
  id: number;
  time: string;
  period: string;
  title: string;
  color: string;
  position: { top: string; left: string };
  width: string;
  height: string;
  hasVideo?: boolean;
  startTime: string;
  durationSeconds?: number;
  projectId?: number | null;
  tagIds?: number[];
  billable?: boolean;
  linkedGoal?: string | null;
  focusScore?: number | null;
  energyScore?: number | null;
  blockers?: string | null;
  contextNotes?: string | null;
  aiDetail?: string | null;
}
