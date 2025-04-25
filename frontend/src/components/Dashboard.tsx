import { useEffect, useState } from "react";
import { Button } from "../components/Calendar_updated/components/ui/button"; // Add button component
import { Mic } from 'lucide-react'; // Add mic icon
import {Skeleton} from './ui/Skeleton'
import { useAuth,  } from "../context/AuthContext";
import { Fantastical } from "./Calendar_updated/screens/Fantastical/Fantastical";
import EnhancedVoiceCommandPopup from "./Calendar_updated/components/EnhancedVoiceCommandPopup";
import { useTimeEntries } from './Calendar_updated/components/hooks/useTimeEntries';
import { useNavigate } from "react-router-dom";
import { useToast } from "./Calendar_updated/components/hooks/use-toast";

export const getColorForProject = (projectId?: number): string => {
  const colors = ['lightblue', 'violet', 'amber', 'rose', 'emerald']; // Use actual color values
  return colors[projectId ? projectId % colors.length : 0];
};
export const calculatePosition = (startTime: string, duration: number) => {
  const start = new Date(startTime);
  const dayOfWeek = start.getDay(); // 0 = Sunday
  const minutesFromTop = (start.getHours() * 60) + start.getMinutes();
  
  return {
    top: `${minutesFromTop}px`,
    left: `${209 + (dayOfWeek * 143)}px` // 143px per day column
  };
};
export type CalendarEvent = {
    id: number;
    time: string;
    period: string;
    title: string;
    color: string;
    position: { top: string; left: string };
    width: string;
    height: string;
  };

export const Dashboard = (): JSX.Element => {
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [showAIOverlay, setShowAIOverlay] = useState(false);
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const start = new Date(currentDate);
          start.setDate(1);
          const end = new Date(currentDate);
          end.setMonth(end.getMonth() + 1);
          await fetchTimeEntries(start, end);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [currentDate, isAuthenticated]);

  const fetchTimeEntries = async (start: Date, end: Date) => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        console.error('No token found in localStorage');
        toast({
          title: 'Authentication Error',
          description: 'No authentication token found. Please log in again.',
          variant: 'destructive',
        });
        return [];
      }
  
      console.log('Token being used:', token);
      // Updated endpoint to /api/timers
      const url = `http://localhost:8080/api/timers?start=${start.toISOString()}&end=${end.toISOString()}`;
      console.log('Fetching URL:', url);
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (res.status === 401) {
        console.error('401 Unauthorized - Check token validity or endpoint');
        toast({
          title: 'Session Expired',
          description: 'Your session may have expired. Please log in again.',
          variant: 'destructive',
        });
        return [];
      }
  
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
  
      const data = await res.json();
      console.log('API Response:', data);
  
      // Assuming ApiResponse structure: { success: boolean, data: TimeEntry[], message: string }
      const transformed = data.data.map((entry: any) => ({
        id: entry.id,
        time: new Date(entry.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        period: new Date(entry.startTime).getHours() >= 12 ? 'PM' : 'AM',
        title: entry.description,
        color: entry.project ? entry.project.color : '#defaultColor',
        position: calculatePosition(entry.startTime, entry.duration),
        width: '143px',
        height: `${Math.max(30, (entry.duration / 3600) * 60)}px`,
        hasVideo: false,
      }));
  
      setCalendarEvents(transformed);
      return transformed;
    } catch (error) {
      console.error('Error fetching time entries:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch time entries. Please try again later.',
        variant: 'destructive',
      });
      return [];
    }
  };

return (
  <div className="bg-white flex flex-row justify-center w-full relative">
    {loading ? (
      <div className="flex flex-col gap-4 p-8 w-full">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    ) : (
      <Fantastical events={calendarEvents} />
    )}
    <div className="fixed bottom-8 right-8 z-50">
      <Button
        className={`p-6 rounded-full shadow-lg transform transition-all ${
          showAIOverlay ? 'bg-primary scale-110' : 'bg-gray-900 hover:bg-gray-800'
        }`}
        onClick={() => setShowAIOverlay(!showAIOverlay)}
      >
        <Mic className="h-6 w-6" />
        {showAIOverlay && <span className="ml-2">Close AI</span>}
      </Button>
    </div>
    {showAIOverlay && (
      <div className="ai-overlay bg-black text-white h-screen w-screen fixed inset-0 z-50 overflow-hidden">
        <EnhancedVoiceCommandPopup />
        <Button className="absolute top-4 right-4 z-50" onClick={() => setShowAIOverlay(false)}>
          Close
        </Button>
      </div>
    )}
  </div>
);
};