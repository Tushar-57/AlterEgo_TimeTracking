import { useState, useEffect } from 'react';
import { useToast } from './use-toast';
import { calculatePosition, getColorForProject } from '../../../Dashboard';
import { CalendarEvent } from '../../screens/Fantastical/Fantastical';


export const useTimeEntries = (currentDate: Date, isAuthenticated: boolean) => {
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchTimeEntries = async (start: Date, end: Date) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in to view time entries.",
          variant: "destructive",
        });
        return;
      }

      const res = await fetch(`http://localhost:8080/api/time-entries?start=${start.toISOString()}&end=${end.toISOString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 401) {
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });
        localStorage.removeItem('jwtToken');
        window.location.href = '/login';
        return;
      }

      if (!res.ok) {
        throw new Error(`Failed to fetch time entries: ${res.statusText}`);
      }

      const data = await res.json();
      const transformed = data.map((entry: any) => {
        const startDate = new Date(entry.startTime);
        const hours = startDate.getHours();
        return {
          id: entry.id,
          time: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          period: hours >= 12 ? 'PM' : 'AM',
          title: entry.taskDescription,
          color: getColorForProject(entry.projectId),
          position: calculatePosition(entry.startTime, entry.duration),
          width: "143px",
          height: `${Math.max(30, (entry.duration / 3600) * 60)}px`,
          hasVideo: false
        };
      });

      setCalendarEvents(transformed);
    } catch (error) {
      console.error('Error fetching entries:', error);
      toast({
        title: "Error",
        description: "Failed to load time entries. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      const start = new Date(currentDate);
      start.setDate(1);
      const end = new Date(start);
      end.setMonth(start.getMonth() + 1);
      end.setDate(0);
      fetchTimeEntries(start, end);
    }
  }, [currentDate, isAuthenticated]);

  return { calendarEvents, loading, fetchTimeEntries };
};