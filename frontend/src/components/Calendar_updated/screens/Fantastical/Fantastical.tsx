import { useState } from "react";
import { CalendarSection } from "./sections/CalendarSection/CalendarSection";
import { DraggableEvent } from "../../components/DraggableEvent";
import { CalendarEvent } from "../../components/DraggableEvent";

interface FantasticalProps {
  events: CalendarEvent[];
  onEventDrag: (eventId: number, newPosition: { top: string; left: string }) => void;
}

export const Fantastical = ({ events, onEventDrag }: FantasticalProps): JSX.Element => {
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

  console.log('Fantastical events:', events); // Debug log

  return (
    <div className="flex flex-col w-full h-screen">
      <div className="relative flex-1 overflow-y-auto">
        <CalendarSection
          events={events}
          refreshEvents={async () => {
            // Trigger event refresh in Dashboard.tsx
          }}
        />
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {events.map(event => (
            <div
              key={event.id}
              className="pointer-events-auto border-2 border-red-500" // Temporary debug border
              style={{
                position: 'absolute',
                top: event.position.top,
                left: `calc(${event.position.left} + 48px)`,
                width: event.width,
                height: event.height,
              }}
            >
              <DraggableEvent
                event={event}
                getColorClasses={getColorClasses}
                onDragStop={onEventDrag}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export type { CalendarEvent };