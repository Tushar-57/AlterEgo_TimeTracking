// import { useEffect, useState } from "react";
import { Button } from "../components/Calendar_updated/components/ui/button";
import { Mic } from 'lucide-react';
import { Skeleton } from './ui/Skeleton';
import { useAuth } from "../context/AuthContext";
import { Fantastical } from "./Calendar_updated/screens/Fantastical/Fantastical";
import EnhancedVoiceCommandPopup from "./Calendar_updated/components/EnhancedVoiceCommandPopup";
import { useNavigate } from "react-router-dom";
// import { useToast } from "./Calendar_updated/components/hooks/use-toast";
import { useTimeEntries } from "./Calendar_updated/components/hooks/useTimeEntries";
// import { CalendarEvent } from "./Calendar_updated/components/DraggableEvent";
// import { CalendarSection } from "./Calendar_updated/screens/Fantastical/sections/CalendarSection/CalendarSection";

// export const getColorForProject = (projectId?: number): string => {
//   const colors = ['lightblue', 'violet', 'amber', 'rose', 'emerald'];
//   return colors[projectId ? projectId % colors.length : 0];
// };

// export const calculatePosition = (startTime: string, duration: number) => {
//   const start = new Date(startTime);
//   const dayOfWeek = start.getDay();
//   const minutesFromTop = (start.getHours() * 60) + start.getMinutes();
//   return {
//     top: `${minutesFromTop * 0.3}px`, // 0.3px per minute to match 18px/hour
//     left: `${9+ dayOfWeek * 143}px`
//   };
// };

// export type CalendarEvent = {
//   id: number;
//   time: string;
//   period: string;
//   title: string;
//   color: string;
//   position: { top: string; left: string };
//   width: string;
//   height: string;
//   hasVideo: boolean;
// };

// export const Dashboard = (): JSX.Element => {
//   const [currentDate, setCurrentDate] = useState(new Date());
//   const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
//   const [showAIOverlay, setShowAIOverlay] = useState(false);
//   const { isAuthenticated } = useAuth();
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();
//   const { toast } = useToast();

//   useEffect(() => {
//     if (isAuthenticated) {
//       const fetchData = async () => {
//         setLoading(true);
//         try {
//           const start = new Date(currentDate);
//           start.setDate(1);
//           const end = new Date(currentDate);
//           end.setMonth(end.getMonth() + 1);
//           await fetchTimeEntries(start, end);
//         } finally {
//           setLoading(false);
//         }
//       };
//       fetchData();
//     }
//   }, [currentDate, isAuthenticated]);

//   const fetchTimeEntries = async (start: Date, end: Date) => {
//     try {
//       const token = localStorage.getItem('jwtToken');
//       if (!token) {
//         console.error('No token found in localStorage');
//         toast({
//           title: 'Authentication Error',
//           description: 'No authentication token found. Please log in again.',
//           variant: 'destructive',
//         });
//         return [];
//       }
  
//       const url = `http://localhost:8080/api/timers?start=${start.toISOString()}&end=${end.toISOString()}`;
//       const res = await fetch(url, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });
  
//       if (res.status === 401) {
//         console.error('401 Unauthorized - Check token validity or endpoint');
//         toast({
//           title: 'Session Expired',
//           description: 'Your session may have expired. Please log in again.',
//           variant: 'destructive',
//         });
//         return [];
//       }
  
//       if (!res.ok) {
//         throw new Error(`HTTP error! status: ${res.status}`);
//       }
  
//       const data = await res.json();
  
//       const transformed = data.data.map((entry: any) => ({
//         id: entry.id,
//         time: new Date(entry.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//         period: new Date(entry.startTime).getHours() >= 12 ? 'PM' : 'AM',
//         title: entry.description,
//         color: entry.project ? entry.project.color : '#defaultColor',
//         position: {
//           top: entry.positionTop || calculatePosition(entry.startTime, entry.duration).top,
//           left: entry.positionLeft || calculatePosition(entry.startTime, entry.duration).left,
//         },
//         width: '143px',
//         height: `${Math.max(30, (entry.duration / 3600) * 60)}px`,
//         hasVideo: false,
//       }));
  
//       setCalendarEvents(transformed);
//       return transformed;
//     } catch (error) {
//       console.error('Error fetching time entries:', error);
//       toast({
//         title: 'Error',
//         description: 'Failed to fetch time entries. Please try again later.',
//         variant: 'destructive',
//       });
//       return [];
//     }
//   };

//   const handleEventDrag = async (eventId: number, newPosition: { top: string; left: string }) => {
//     try {
//       const token = localStorage.getItem('jwtToken');
//       if (!token) {
//         toast({
//           title: 'Authentication Error',
//           description: 'No authentication token found. Please log in again.',
//           variant: 'destructive',
//         });
//         return;
//       }

//       const event = calendarEvents.find(e => e.id === eventId);
//       if (!event) return;

//       setCalendarEvents(prevEvents =>
//         prevEvents.map(e =>
//           e.id === eventId ? { ...e, position: newPosition } : e
//         )
//       );

//       const res = await fetch(`http://localhost:8080/api/timers/${eventId}/position`, {
//         method: 'PUT',
//         headers: {
//           Authorization: `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           positionTop: newPosition.top,
//           positionLeft: newPosition.left,
//         }),
//       });

//       if (!res.ok) {
//         throw new Error(`HTTP error! status: ${res.status}`);
//       }

//       toast({
//         title: 'Position Updated',
//         description: 'Event position updated successfully.',
//       });
//     } catch (error) {
//       console.error('Error updating event position:', error);
//       toast({
//         title: 'Error',
//         description: 'Failed to update event position. Please try again.',
//         variant: 'destructive',
//       });
//     }
//   };

//   return (
//     <div className="bg-white flex flex-row justify-center w-full relative">
//       {loading ? (
//         <div className="flex flex-col gap-4 p-8 w-full">
//           <Skeleton className="h-12 w-full" />
//           <Skeleton className="h-64 w-full" />
//           <Skeleton className="h-32 w-full" />
//         </div>
//       ) : (
//         <Fantastical events={calendarEvents} onEventDrag={handleEventDrag} />
//       )}
//       <div className="fixed bottom-8 right-8 z-50">
//         <Button
//           className={`p-6 rounded-full shadow-lg transform transition-all ${
//             showAIOverlay ? 'bg-primary scale-110' : 'bg-gray-900 hover:bg-gray-800'
//           }`}
//           onClick={() => setShowAIOverlay(!showAIOverlay)}
//         >
//           <Mic className="h-6 w-6" />
//           {showAIOverlay && <span className="ml-2">Close AI</span>}
//         </Button>
//       </div>
//       {showAIOverlay && (
//         <div className="ai-overlay bg-black text-white h-screen w-screen fixed inset-0 z-50 overflow-hidden">
//           <EnhancedVoiceCommandPopup />
//           <Button className="absolute top-4 right-4 z-50" onClick={() => setShowAIOverlay(false)}>
//             Close
//           </Button>
//         </div>
//       )}
//     </div>
//   );
// };
// import { useState, useEffect } from 'react';
// import { useToast } from './use-toast';
// import { Fantastical } from '../screens/Fantastical/Fantastical';
// import { useTimeEntries } from './useTimeEntries';
// import { CalendarEvent } from '../screens/Fantastical/Fantastical';

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