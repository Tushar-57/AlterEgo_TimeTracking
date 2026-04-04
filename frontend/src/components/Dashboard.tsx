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
  const colors: { [key: number]: string } = {
    1: "lightblue",
    2: "violet",
    3: "amber",
    4: "rose",
    5: "emerald",
  };
  return projectId ? colors[projectId] || "lightblue" : "lightblue";
};

export const Dashboard = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchTimeEntriesDirect = useCallback(async (start: Date, end: Date) => {
    try {
      const token = localStorage.getItem("jwtToken");
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
        localStorage.removeItem("jwtToken");
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

  const mobileEvents = [...calendarEvents].sort((a, b) => {
    const topA = Number.parseFloat(a.position.top);
    const topB = Number.parseFloat(b.position.top);
    return topA - topB;
  });

  const handleUpdateEventPosition = useCallback(
    async (eventId: number, newPosition: { top: string; left: string }) => {
      try {
        const token = localStorage.getItem("jwtToken");
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
        const token = localStorage.getItem("jwtToken");
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
        const duplicateStart = new Date(sourceStart.getTime() + 15 * 60 * 1000);
        const duplicateEnd = new Date(duplicateStart.getTime() + durationSeconds * 1000);
        const duplicatedTop = `${Math.max(0, Number.parseFloat(source.position.top || "0") + 18)}px`;

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
            positionLeft: source.position.left,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Failed to duplicate time entry");
        }

        toast({
          title: "Entry duplicated",
          description: "A copy was created. Drag it to a new slot in weekly view.",
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

  if (isMobile) {
    return (
      <div className="min-h-screen w-full bg-gray-50 p-4">
        <div className="mx-auto max-w-3xl space-y-3">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500">Your scheduled entries in a mobile-friendly view.</p>
          </div>

          {mobileEvents.length === 0 ? (
            <div className="rounded-xl bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
              No scheduled entries found for this period.
            </div>
          ) : (
            mobileEvents.map((event) => (
              <div key={event.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                  {event.time} {event.period}
                </div>
                <div className="text-base font-semibold text-gray-900">{event.title}</div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return ( 
    <div className="flex flex-row w-full min-h-screen">
      <div className="flex flex-col flex-1 min-h-[1728px]">
        <div className="relative flex-1 overflow-y-auto">
          <CalendarSection
            events={calendarEvents}
            refreshEvents={fetchData}
            onUpdateEventPosition={handleUpdateEventPosition}
            onDuplicateEvent={handleDuplicateEvent}
          />
        </div>
      </div>
    </div>
  );
};