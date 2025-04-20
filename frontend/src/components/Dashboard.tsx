import { useEffect, useState } from "react";
import { Button } from "../components/Calendar_updated/components/ui/button"; // Add button component
import { Mic } from 'lucide-react'; // Add mic icon
import { useAuth } from "../context/AuthContext";
import { Fantastical } from "./Calendar_updated/screens/Fantastical/Fantastical";
import EnhancedVoiceCommandPopup from "./Calendar_updated/components/EnhancedVoiceCommandPopup";

const getColorForProject = (projectId?: number): string => {
  const colors = ['lightblue', 'violet', 'amber', 'rose', 'emerald']; // Use actual color values
  return colors[projectId ? projectId % colors.length : 0];
};

export const Dashboard = (): JSX.Element => {
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [showAIOverlay, setShowAIOverlay] = useState(false);
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);

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

  type CalendarEvent = {
    id: number;
    time: string;
    period: string;
    title: string;
    color: string;
    position: { top: string; left: string };
    width: string;
    height: string;
  };

// const fetchTimeEntries = async (start: Date, end: Date) => {
//   try {
//     const res = await fetch(`http://localhost:8080/api/time-entries?start=${start.toISOString()}&end=${end.toISOString()}`, {
//       headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` }
//     });
    
//     const data = await res.json();
//     const transformed = data.map((entry: any) => ({
//       id: entry.id,
//       startTime: entry.startTime,
//       duration: entry.duration,
//       taskDescription: entry.taskDescription,
//       projectId: entry.projectId,
//       position: calculatePosition(entry.startTime, entry.duration),
//       height: `${Math.max(30, (entry.duration / 3600) * 60)}px`
//     }));
    
//     setCalendarEvents(transformed);
//   } catch (error) {
//     console.error('Error fetching entries:', error);
//   }
// };

const fetchTimeEntries = async (start: Date, end: Date) => {
  try {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      console.error('No JWT token found');
      return;
    }

    const res = await fetch(`http://localhost:8080/api/time-entries?start=${start.toISOString()}&end=${end.toISOString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 401) {
      console.log(res.status)
      // localStorage.removeItem('jwtToken');
      // window.location.href = '/login';
      return;
    }

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
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
  }
};

const calculatePosition = (startTime: string, duration: number) => {
  const start = new Date(startTime);
  const dayOfWeek = start.getDay(); // 0 = Sunday
  const minutesFromTop = (start.getHours() * 60) + start.getMinutes();
  
  return {
    top: `${minutesFromTop}px`,
    left: `${209 + (dayOfWeek * 143)}px` // 143px per day column
  };
};

useEffect(() => {
  if (isAuthenticated) {
    const start = new Date();
    start.setDate(1);
    const end = new Date(start);
    end.setMonth(start.getMonth() + 1);
    end.setDate(0); // Last day of current month
    
    fetchTimeEntries(start, end);
  }
}, [currentDate, isAuthenticated]);

  return (
    <div className="bg-white flex flex-row justify-center w-full relative">
      {loading ? (
        <div className="flex justify-center p-8">Loading entries...</div>
      ) : (
        <Fantastical />
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
          <Button 
            className="absolute top-4 right-4 z-50"
            onClick={() => setShowAIOverlay(false)}
          >
            Close
          </Button>
        </div>
      )}
    </div>
  );
};