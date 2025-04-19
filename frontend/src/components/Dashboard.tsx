import { VideoIcon } from "lucide-react";
import React from "react";
import { Card, CardContent } from "../components/ui/card";
import { useEffect, useState } from "react";
import { CalendarSection } from "./sections/CalendarSection";
import { NavigationMenuSection } from "./sections/NavigationMenuSection/NavigationMenuSection";
import { Button } from "./ui/button"; // Add button component
import { Mic } from 'lucide-react'; // Add mic icon
import { DraggableEvent } from "../components/ui/DraggableEvent";
import { useAuth } from "../context/AuthContext";
// import AIComponent from '../components/AIComponent/client/src/App'
import AIComponent from '../components/AIComponent/client/src/components/InterfaceOverlay';

type TimeEntry = {
  id: number;
  startTime: string;
  duration: number;
  projectId?: number;
  taskDescription: string;
};

const getColorForProject = (projectId?: number): string => {
  const colors = ['lightblue', 'violet', 'amber', 'rose', 'emerald'];
  return colors[projectId ? projectId % colors.length : 0];
};

export const Dashboard = (): JSX.Element => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [showAIOverlay, setShowAIOverlay] = useState(false);
  const { isAuthenticated } = useAuth();

//   const fetchTimeEntries = async (start: Date, end: Date) => {
//     try {
//       const res = await fetch(`http://localhost:8080/api/time-entries?start=${start.toISOString()}&end=${end.toISOString()}`, {
//         headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` }
//       });
      
//       const data: TimeEntry[] = await res.json();
//       const transformed = data.map((entry: TimeEntry) => ({
//         id: entry.id,
//         time: new Date(entry.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//         period: new Date(entry.startTime).getHours() >= 12 ? 'PM' : 'AM',
//         title: entry.taskDescription,
//         color: getColorForProject(entry.projectId),
//         position: calculatePosition(entry.startTime, entry.duration),
//         width: "143px",
//         height: `${Math.max(30, (entry.duration / 3600) * 60)}px`
//       }));
      
//       setCalendarEvents(transformed);
//   } catch (error) {
//     console.error('Error fetching entries:', error);
//   }
// };


const calculatePosition = (startTime: string, duration: number) => {
  const start = new Date(startTime);
  const top = ((start.getHours() - 7) * 60 + start.getMinutes()) * 0.8;
  const left = 209 + (start.getDay() * 144);
  return { top: `${top}px`, left: `${left}px` };
};

  // useEffect(() => {
  //   if (isAuthenticated) {
  //     const start = new Date(currentDate);
  //     start.setDate(1);
  //     const end = new Date(currentDate);
  //     end.setMonth(end.getMonth() + 1);
      
  //     fetchTimeEntries(start, end);
  //   }
  // }, [currentDate, isAuthenticated]);

  return (
    <div className="bg-white flex flex-row justify-center w-full relative">
      <div className="bg-white w-full relative flex">
        <div className="w-[300px] flex-shrink-0">
          <NavigationMenuSection 
            currentDate={currentDate}
            onDateChange={setCurrentDate}
          />
        </div>

        <div className="flex-grow relative">
          <CalendarSection 
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            events={calendarEvents}
          />
          {/* Draggable events */}
        </div>
      </div>
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
        <div className="ai-overlay bg-background text-foreground dark:bg-background/95">
          <AIComponent />
        </div>
      )}
    </div>
  );
};