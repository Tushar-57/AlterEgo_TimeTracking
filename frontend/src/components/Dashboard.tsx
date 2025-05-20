import { useEffect, useState } from "react";
import { useToast } from "./Calendar_updated/components/hooks/use-toast";
import { CalendarSection } from "./Calendar_updated/screens/Fantastical/sections/CalendarSection/CalendarSection";
import { CalendarEvent, DraggableEvent } from "./Calendar_updated/components/DraggableEvent";
import { NavigationMenuSection } from "./Calendar_updated/screens/Fantastical/sections/NavigationMenuSection/NavigationMenuSection";

export const calculatePosition = (startTime: string, duration: number) => {
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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchTimeEntriesDirect = async (start: Date, end: Date) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("jwtToken");
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in to view time entries.",
          variant: "destructive",
        });
        return [];
      }

      const formatDate = (date: Date) => {
        return date.toISOString().replace(/\.\d{3}Z$/, "");
      };

      const res = await fetch(
        `http://localhost:8080/api/timers?start=${formatDate(start)}&end=${formatDate(end)}`,
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

      const data = await res.json();
      const transformed: CalendarEvent[] = data.map((entry: any) => {
        const startDate = new Date(entry.startTime);
        const hours = startDate.getHours();
        const minutes = startDate.getMinutes().toString().padStart(2, "0");
        const position = entry.positionTop && entry.positionLeft
          ? { top: entry.positionTop, left: entry.positionLeft }
          : calculatePosition(entry.startTime, entry.duration);
        return {
          id: entry.id,
          time: `${hours % 12 || 12}:${minutes}`,
          period: hours >= 12 ? "PM" : "AM",
          title: entry.description || "Untitled",
          color: getColorForProject(entry.projectId),
          position,
          width: "143px",
          height: `${Math.max(30, (entry.duration / 3600) * 60)}px`,
          hasVideo: false,
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
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    if (isAuthenticated) {
      const start = new Date(currentDate);
      start.setDate(1);
      const end = new Date(start);
      end.setMonth(start.getMonth() + 1);
      end.setDate(0);
      await fetchTimeEntriesDirect(start, end);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentDate, isAuthenticated]);

  const handleEventDrag = async (
    eventId: number,
    newPosition: { top: string; left: string }
  ) => {
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

      const res = await fetch(`http://localhost:8080/api/timers/${eventId}/position`, {
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
      toast({
        title: "Position Updated",
        description: "Event position updated successfully.",
      });
    } catch (error) {
      console.error("Error updating event position:", error);
      toast({
        title: "Error",
        description: "Failed to update event position.",
        variant: "destructive",
      });
    }
  };

  return ( 
    <div className="flex flex-row w-full h-screen">
      <div className="flex flex-col flex-1 min-h-[1728px]">
        <div className="relative flex-1 overflow-y-auto">
          <CalendarSection
            events={calendarEvents}
            refreshEvents={fetchData}
          />
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            {calendarEvents.map((event) => (
              <div
                key={event.id}
                className="pointer-events-auto"
                style={{
                  position: "absolute",
                  top: event.position.top,
                  left: `calc(${event.position.left} + 48px)`, // Adjust for sidebar
                  width: event.width,
                  height: event.height,
                }}
              >
                <DraggableEvent
                  event={event}
                  getColorClasses={(color: string) => ({
                    bg: `bg-${color}-100`,
                    accent: `bg-${color}-500`,
                    text: `text-${color}-900`,
                    icon: `bg-${color}-200 text-${color}-900`,
                  })}
                  onDragStop={handleEventDrag}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};