import { useCallback, useEffect, useState } from "react";
import { useToast } from "./Calendar_updated/components/hooks/use-toast";
import { useAuth } from "../context/AuthContext";
import { CalendarSection } from "./Calendar_updated/screens/Fantastical/sections/CalendarSection/CalendarSection";
import { CalendarEvent } from "./Calendar_updated/types";
import { parseDateTimeAsLocal } from "../utils/utils";
import { TodayBand } from "./Dashboard/TodayBand";

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
  linkedGoal?: string | null;
  focusScore?: number | null;
  energyScore?: number | null;
  blockers?: string | null;
  contextNotes?: string | null;
  aiDetail?: string | null;
  detail?: {
    linkedGoal?: string | null;
    focusScore?: number | null;
    energyScore?: number | null;
    blockers?: string | null;
    contextNotes?: string | null;
    aiDetail?: string | null;
  } | null;
  timeEntryDetail?: {
    linkedGoal?: string | null;
    focusScore?: number | null;
    energyScore?: number | null;
    blockers?: string | null;
    contextNotes?: string | null;
    aiDetail?: string | null;
  } | null;
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
  const startDate = parseDateTimeAsLocal(startTime);
  const hours = startDate.getHours();
  const minutes = startDate.getMinutes();
  const dayIndex = startDate.getDay();

  const top = (hours * 72 + (minutes / 60) * 72).toFixed(2) + "px";
  const columnWidth = (window.innerWidth - 96) / 7;
  const left = (dayIndex * columnWidth).toFixed(2) + "px";

  return { top, left };
};

/**
 * Fallback only. A project's real colour (from /api/projects) is preferred so
 * the calendar and the Projects page agree; this palette is used when an entry
 * has no project or the project list hasn't loaded.
 */
export const getColorForProject = (projectId: number | null): string => {
  const palette = ["lightblue", "violet", "amber", "rose", "emerald"];
  if (projectId === null || projectId === undefined) {
    return "lightblue";
  }

  const index = Math.abs(projectId) % palette.length;
  return palette[index];
};

export const Dashboard = () => {
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [projectColors, setProjectColors] = useState<Record<number, string>>({});
  const { toast } = useToast();
  const { token, isAuthenticated } = useAuth();

  // Entries are coloured by their project's own colour so the calendar matches
  // the Projects page. Best-effort: on failure we fall back to the id palette.
  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    void fetch('/api/projects/userProjects', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : []))
      .then((payload: unknown) => {
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray((payload as { data?: unknown })?.data)
          ? ((payload as { data: unknown[] }).data)
          : [];
        const map: Record<number, string> = {};
        (list as Array<{ id?: number; color?: string }>).forEach((project) => {
          if (typeof project?.id === 'number' && typeof project?.color === 'string') {
            map[project.id] = project.color;
          }
        });
        if (!cancelled) setProjectColors(map);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [token]);

  const fetchTimeEntriesDirect = useCallback(async (start: Date, end: Date) => {
    try {
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in to view entries.",
          variant: "destructive",
        });
        return;
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
        const startDate = parseDateTimeAsLocal(entry.startTime);
        const hours = startDate.getHours();
        const minutes = startDate.getMinutes().toString().padStart(2, "0");
        const projectId = entry.projectId ?? entry.project?.id ?? null;
        const detail = entry.timeEntryDetail ?? entry.detail ?? null;
        // Use canonical start time for placement so stale saved pixel offsets
        // from prior viewport sizes do not shift entries to the wrong weekday column.
        const position = calculatePosition(entry.startTime);

        return {
          id: entry.id,
          time: `${hours % 12 || 12}:${minutes}`,
          period: hours >= 12 ? "PM" : "AM",
          title: entry.description || "Untitled",
          startTime: entry.startTime,
          color:
            (projectId !== null && projectId !== undefined ? projectColors[projectId] : undefined)
            ?? getColorForProject(projectId),
          position,
          width: "143px",
          height: `${Math.max(30, (entry.duration / 3600) * 60)}px`,
          hasVideo: false,
          durationSeconds: entry.duration,
          projectId,
          tagIds: entry.tagIds ?? [],
          billable: entry.billable ?? false,
          linkedGoal: entry.linkedGoal ?? detail?.linkedGoal ?? null,
          focusScore: entry.focusScore ?? detail?.focusScore ?? null,
          energyScore: entry.energyScore ?? detail?.energyScore ?? null,
          blockers: entry.blockers ?? detail?.blockers ?? null,
          contextNotes: entry.contextNotes ?? detail?.contextNotes ?? null,
          aiDetail: entry.aiDetail ?? detail?.aiDetail ?? null,
        };
      });
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
  }, [toast, token, projectColors]);

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
        if (!token) {
          toast({
            title: "Authentication Error",
            description: "Please log in to save position.",
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
    [toast, token]
  );

  const handleDuplicateEvent = useCallback(
    async (eventId: number) => {
      const source = calendarEvents.find((event) => event.id === eventId);
      if (!source) {
        return;
      }

      try {
        if (!token) {
          toast({
            title: "Authentication Error",
            description: "Please log in to save position.",
            variant: "destructive",
          });
          return;
        }

        const sourceStart = parseDateTimeAsLocal(source.startTime);
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
            // Carry over advanced detail fields so the duplicated entry
            // is a true copy — including these matters because the edit
            // modal pulls them straight from CalendarEvent and relying on
            // backend defaults caused them to render blank in earlier flows.
            linkedGoal: source.linkedGoal ?? null,
            focusScore: source.focusScore ?? null,
            energyScore: source.energyScore ?? null,
            blockers: source.blockers ?? null,
            contextNotes: source.contextNotes ?? null,
            aiDetail: source.aiDetail ?? null,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Failed to duplicate time entry");
        }

        // Read the response body so we can verify the server-side id of the
        // new entry. Earlier flow ignored this and relied entirely on a
        // refetch — when the refetch hit a stale cache or returned before
        // the new row was visible, the user would click the new card,
        // initialEntry was null, and the edit modal saved as a brand-new
        // POST instead of a PUT update. Logging the new id here also makes
        // the duplicate-edit-save sequence traceable in DevTools.
        const duplicateBody = await response.json().catch(() => null);
        const newEntryId =
          duplicateBody?.data?.id
          ?? duplicateBody?.id
          ?? null;
        if (newEntryId) {
          console.info("[duplicate] created entry", { sourceId: eventId, newEntryId });
        } else {
          console.warn("[duplicate] response missing entry id", duplicateBody);
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
    [calendarEvents, fetchData, toast, token]
  );

  const handleDeleteEvent = useCallback(
    async (eventId: number) => {
      try {
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
          title: 'Deleted',
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
    [toast, token]
  );

  const handleContinueEvent = useCallback(
    async (eventId: number) => {
      try {
        if (!token) {
          toast({
            title: 'Authentication Error',
            description: 'Please log in to continue entries.',
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
    // Height is pinned to the viewport rather than inherited. <main> is
    // flex-1 inside a parent with no bounded height, so it grows to fit its
    // content instead of scrolling — which means h-full here resolved to the
    // full height of the calendar, the calendar's own scroll container never
    // scrolled, and the whole document scrolled instead. Bounding this page
    // gives the grid its scroller back, so it can jump to the current hour
    // without carrying the summary off the top of the screen.
    <div className="flex h-[calc(100dvh-1rem)] min-h-0 w-full flex-col gap-4 overflow-hidden p-4 md:h-dvh">
      {/* The calendar is a record of what happened. This says what it means. */}
      <div className="shrink-0">
        <TodayBand />
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
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
  );
};