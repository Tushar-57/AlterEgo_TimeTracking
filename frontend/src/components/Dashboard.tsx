import { useCallback, useEffect, useState } from "react";
import { useToast } from "./Calendar_updated/components/hooks/use-toast";
import { CalendarSection } from "./Calendar_updated/screens/Fantastical/sections/CalendarSection/CalendarSection";
import { CalendarEvent } from "./Calendar_updated/components/DraggableEvent";

interface TimerEntryResponse {
  id: number;
  startTime: string;
  duration: number;
  description?: string;
  projectId?: number | null;
  project?: { id: number } | null;
  tagIds?: number[];
  billable?: boolean;
  positionTop?: string;
  positionLeft?: string;
}

interface TimerEntryApiResponse {
  success?: boolean;
  message?: string;
  data?: TimerEntryResponse[];
}

interface CalendarRange {
  start: Date;
  end: Date;
}

const formatLocalDateTime = (date: Date) => {
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

export const calculatePosition = (startTime: string) => {
  const startDate = new Date(startTime);
  const hours = startDate.getHours();
  const minutes = startDate.getMinutes();
  const dayIndex = startDate.getDay();

  const top = (hours * 72 + (minutes / 60) * 72).toFixed(2) + "px";
  const columnWidth = (window.innerWidth - 96) / 7;
  const left = (dayIndex * columnWidth).toFixed(2) + "px";

  return { top, left };
};

export const getColorForProject = (projectId: number | null): string => {
  const palette = ["lightblue", "violet", "amber", "rose", "emerald"];
  if (projectId === null || projectId === undefined) {
    return "lightblue";
  }

  const index = Math.abs(projectId) % palette.length;
  return palette[index];
};

export const Dashboard = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const { toast } = useToast();

  const fetchTimeEntriesDirect = useCallback(async (start: Date, end: Date) => {
    try {
      const token = sessionStorage.getItem("auth_session");
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in to view time entries.",
          variant: "destructive",
        });
        return [];
      }

      const res = await fetch(
        `/api/timers?start=${encodeURIComponent(formatLocalDateTime(start))}&end=${encodeURIComponent(
          formatLocalDateTime(end)
        )}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.status === 401) {
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });
        sessionStorage.removeItem("auth_session");
        window.location.href = "/login";
        return [];
      }

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const payload: TimerEntryResponse[] | TimerEntryApiResponse = await res.json();
      const entries = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.data)
        ? payload.data
        : [];

      if (!Array.isArray(payload) && payload.success === false) {
        throw new Error(payload.message || 'Failed to load timer entries');
      }

      const transformed: CalendarEvent[] = entries.map((entry) => {
        const startDate = new Date(entry.startTime);
        const hours = startDate.getHours();
        const minutes = startDate.getMinutes().toString().padStart(2, "0");
        const projectId = entry.projectId ?? entry.project?.id ?? null;
        const position = entry.positionTop && entry.positionLeft
          ? { top: entry.positionTop, left: entry.positionLeft }
          : calculatePosition(entry.startTime);
        return {
          id: entry.id,
          time: `${hours % 12 || 12}:${minutes}`,
          period: hours >= 12 ? "PM" : "AM",
          title: entry.description || "Untitled",
          startTime: entry.startTime,
          color: getColorForProject(projectId),
          position,
          width: "143px",
          height: `${Math.max(30, (entry.duration / 3600) * 60)}px`,
          hasVideo: false,
          durationSeconds: entry.duration,
          projectId,
          tagIds: entry.tagIds ?? [],
          billable: entry.billable ?? false,
        };
      });
      console.log("Transformed events:", transformed);
      setCalendarEvents(transformed);
      return transformed;
    } catch (error) {
      console.error("Error fetching time entries:", error);
      toast({
        title: "Error",
        description: "Failed to load time entries. Please try again later.",
        variant: "destructive",
      });
      return [];
    }
  }, [toast]);

  const fetchData = useCallback(async (range?: CalendarRange) => {
    if (!isAuthenticated) {
      return;
    }

    if (range) {
      await fetchTimeEntriesDirect(range.start, range.end);
      return;
    }

    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setMonth(start.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);

    await fetchTimeEntriesDirect(start, end);
  }, [fetchTimeEntriesDirect, isAuthenticated]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleUpdateEventPosition = useCallback(
    async (eventId: number, newPosition: { top: string; left: string }) => {
      try {
        const token = sessionStorage.getItem("auth_session");
        if (!token) {
          toast({
            title: "Authentication Error",
            description: "Please log in to update event position.",
            variant: "destructive",
          });
          return;
        }

        const res = await fetch(`/api/timers/${eventId}/position`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            positionTop: newPosition.top,
            positionLeft: newPosition.left,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to update event position");
        }

        setCalendarEvents((prev) =>
          prev.map((event) =>
            event.id === eventId ? { ...event, position: newPosition } : event
          )
        );
      } catch (error) {
        console.error("Error updating event position:", error);
        toast({
          title: "Error",
          description: "Failed to update event position.",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  const handleDuplicateEvent = useCallback(
    async (eventId: number) => {
      const source = calendarEvents.find((event) => event.id === eventId);
      if (!source) {
        return;
      }

      try {
        const token = sessionStorage.getItem("auth_session");
        if (!token) {
          toast({
            title: "Authentication Error",
            description: "Please log in to duplicate entries.",
            variant: "destructive",
          });
          return;
        }

        const sourceStart = new Date(source.startTime);
        const durationSeconds = source.durationSeconds ?? Math.max(900, Math.round((Number.parseFloat(source.height) / 60) * 3600));
        const duplicateStart = new Date(sourceStart);
        duplicateStart.setDate(duplicateStart.getDate() + 1);
        const duplicateEnd = new Date(duplicateStart.getTime() + durationSeconds * 1000);
        const { top: duplicatedTop, left: duplicatedLeft } = calculatePosition(formatLocalDateTime(duplicateStart));

        const response = await fetch("/api/timers/addTimer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            description: source.title,
            startTime: formatLocalDateTime(duplicateStart),
            endTime: formatLocalDateTime(duplicateEnd),
            category: null,
            tagIds: source.tagIds ?? [],
            projectId: source.projectId ?? null,
            billable: source.billable ?? false,
            positionTop: duplicatedTop,
            positionLeft: duplicatedLeft,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Failed to duplicate time entry");
        }

        toast({
          title: "Entry duplicated",
          description: "A copy was created one day ahead in your timeline.",
        });

        const rangeStart = new Date(duplicateStart);
        rangeStart.setDate(duplicateStart.getDate() - duplicateStart.getDay());
        rangeStart.setHours(0, 0, 0, 0);
        const rangeEnd = new Date(rangeStart);
        rangeEnd.setDate(rangeStart.getDate() + 6);
        rangeEnd.setHours(23, 59, 59, 999);

        await fetchData({ start: rangeStart, end: rangeEnd });
      } catch (error) {
        console.error("Error duplicating time entry:", error);
        toast({
          title: "Duplicate failed",
          description: "Unable to duplicate this entry right now.",
          variant: "destructive",
        });
      }
    },
    [calendarEvents, fetchData, toast]
  );

  const handleDeleteEvent = useCallback(
    async (eventId: number) => {
      try {
        const token = sessionStorage.getItem('auth_session');
        if (!token) {
          toast({
            title: 'Authentication Error',
            description: 'Please log in to delete entries.',
            variant: 'destructive',
          });
          return;
        }

        const response = await fetch(`/api/timers/${eventId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok || payload?.success === false) {
          throw new Error(payload?.message || 'Failed to delete time entry');
        }

        setCalendarEvents((previous) => previous.filter((entry) => entry.id !== eventId));
        toast({
          title: 'Entry Deleted',
          description: 'Time entry removed successfully.',
        });
      } catch (error) {
        console.error('Error deleting time entry:', error);
        toast({
          title: 'Delete failed',
          description: 'Unable to delete this entry right now.',
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  const handleContinueEvent = useCallback(
    async (eventId: number) => {
      try {
        const token = sessionStorage.getItem('auth_session');
        if (!token) {
          toast({
            title: 'Authentication Error',
            description: 'Please log in to continue an entry.',
            variant: 'destructive',
          });
          return;
        }

        const response = await fetch(`/api/timers/${eventId}/continue`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const payload = (await response.json().catch(() => null)) as
          | {
              success?: boolean;
              message?: string;
              errors?: {
                code?: string;
                message?: string;
              };
            }
          | null;

        const errorCode = payload?.errors?.code;
        const backendMessage = payload?.errors?.message || payload?.message;

        if (!response.ok || payload?.success === false) {
          if (response.status === 409 || errorCode === 'TIMER_CONFLICT') {
            toast({
              title: 'Active Timer Already Running',
              description: 'Stop the running timer from the Timer page, then continue this entry.',
              variant: 'destructive',
            });
            return;
          }

          if (response.status === 401) {
            toast({
              title: 'Session Expired',
              description: 'Please sign in again to continue this entry.',
              variant: 'destructive',
            });
            return;
          }

          throw new Error(backendMessage || 'Failed to continue time entry');
        }

        toast({
          title: 'Timer Continued',
          description: 'A new running timer has started with the same details.',
        });

        await fetchData();
      } catch (error) {
        console.error('Error continuing time entry:', error);
        toast({
          title: 'Continue failed',
          description: 'Unable to continue this entry right now.',
          variant: 'destructive',
        });
      }
    },
    [fetchData, toast]
  );

  return (
    <div className="flex h-full min-h-0 w-full flex-row p-2 sm:p-4">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-[24px] border border-teal-200/60 bg-white/75 shadow-[0_20px_55px_-45px_rgba(15,23,42,0.75)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/75">
          <CalendarSection
            events={calendarEvents}
            refreshEvents={fetchData}
            onUpdateEventPosition={handleUpdateEventPosition}
            onDuplicateEvent={handleDuplicateEvent}
            onDeleteEvent={handleDeleteEvent}
            onContinueEvent={handleContinueEvent}
          />
        </div>
      </div>
    </div>
  );
};