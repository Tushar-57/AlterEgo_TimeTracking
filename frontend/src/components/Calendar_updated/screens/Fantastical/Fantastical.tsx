import { useState } from "react";
import { CalendarSection } from "./sections/CalendarSection/CalendarSection";
import { DraggableEvent } from "../../components/DraggableEvent";

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
}

export const Fantastical = ({ events }: { events: CalendarEvent[] }): JSX.Element => {
  const [colorClasses] = useState({
    lightblue: {
      bg: "bg-blue-100",
      accent: "bg-blue-500",
      text: "text-blue-900",
      icon: "bg-blue-200 text-blue-900"
    },
    violet: {
      bg: "bg-violet-100",
      accent: "bg-violet-500",
      text: "text-violet-900",
      icon: "bg-violet-200 text-violet-900"
    },
    amber: {
      bg: "bg-amber-100",
      accent: "bg-amber-500",
      text: "text-amber-900",
      icon: "bg-amber-200 text-amber-900"
    },
    rose: {
      bg: "bg-rose-100",
      accent: "bg-rose-500",
      text: "text-rose-900",
      icon: "bg-rose-200 text-rose-900"
    },
    emerald: {
      bg: "bg-emerald-100",
      accent: "bg-emerald-500",
      text: "text-emerald-900",
      icon: "bg-emerald-200 text-emerald-900"
    }
  });

  const getColorClasses = (color: string) => {
    return colorClasses[color as keyof typeof colorClasses] || colorClasses.lightblue;
  };

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden">
      <CalendarSection events={events} />
      {events.map(event => (
        <DraggableEvent 
          key={event.id} 
          event={event} 
          getColorClasses={getColorClasses}
        />
      ))}
    </div>
  );
};