// import React from 'react';
// import Draggable from 'react-draggable';
// import { Card, CardContent } from './ui/card';
// import { VideoIcon } from 'lucide-react';

// export type ColorKey = 'lightblue' | 'violet' | 'amber' | 'rose' | 'emerald';

// interface CalendarEvent {
//   id: number;
//   time: string;
//   period: string;
//   title: string;
//   color: string;
//   position: { top: string; left: string };
//   width: string;
//   height: string;
//   hasVideo?: boolean;
// }

// export type ColorClasses = {
//   bg: string;
//   accent: string;
//   text: string;
//   icon: string;
// };

// interface DraggableEventProps {
//   event: CalendarEvent;
//   getColorClasses: (color: ColorKey | string) => ColorClasses;
// }
// export function DraggableEvent({ event, getColorClasses }: DraggableEventProps) {
//   return (
//     <Draggable
//       bounds="parent"
//       defaultPosition={{
//         x: parseInt(event.position.left),
//         y: parseInt(event.position.top)
//       }}
//       grid={[10, 10]}
//     >
//       <Card
//         className={`flex items-start ${getColorClasses(event.color).bg} rounded overflow-hidden absolute cursor-move hover:shadow-lg transition-shadow`}
//         style={{
//           width: event.width,
//           height: event.height,
//         }}
//       >
//         <div className={`${getColorClasses(event.color).accent} relative self-stretch w-[3px]`} />
//         <CardContent className="flex flex-col h-full items-start p-1.5 relative flex-1 grow rounded">
//           <div className="flex items-center gap-1 relative self-stretch w-full flex-[0_0_auto]">
//             <div className={`w-fit mt-[-1.00px] font-medium ${getColorClasses(event.color).text} text-xs whitespace-nowrap relative font-text-xs-medium tracking-[var(--text-xs-medium-letter-spacing)] leading-[var(--text-xs-medium-line-height)]`}>
//               {event.time}
//             </div>
//             <div className={`font-medium ${getColorClasses(event.color).text} text-xs relative w-fit mt-[-1.00px] font-text-xs-medium tracking-[var(--text-xs-medium-letter-spacing)] leading-[var(--text-xs-medium-line-height)] whitespace-nowrap`}>
//               {event.period}
//             </div>
//             {event.hasVideo && (
//               <div className={`${getColorClasses(event.color).icon} inline-flex items-start gap-2.5 p-0.5 relative flex-[0_0_auto] rounded-[100px]`}>
//                 <VideoIcon className="w-2 h-2" />
//               </div>
//             )}
//           </div>
//           <div className={`self-stretch font-semibold ${getColorClasses(event.color).text} text-xs relative [font-family:'Inter',Helvetica] tracking-[0] leading-4`}>
//             {event.title}
//           </div>
//         </CardContent>
//       </Card>
//     </Draggable>
//   );
// }
import React, { useState } from 'react';
import Draggable, { DraggableEvent as DraggableEventType } from 'react-draggable';
import { Card, CardContent } from './ui/card';
import { VideoIcon } from 'lucide-react';

export type ColorKey = 'lightblue' | 'violet' | 'amber' | 'rose' | 'emerald';

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
  startTime:string;
}

export type ColorClasses = {
  bg: string;
  accent: string;
  text: string;
  icon: string;
};

interface DraggableEventProps {
  event: CalendarEvent;
  getColorClasses: (color: ColorKey | string) => ColorClasses;
  onDragStop: (eventId: number, newPosition: { top: string; left: string }) => void;
}

export function DraggableEvent({ event, getColorClasses, onDragStop }: DraggableEventProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleStart = () => setIsDragging(true);

  const handleStop = (e: DraggableEventType, data: { x: number; y: number }) => {
    setIsDragging(false);
    const newPosition = {
      top: `${data.y}px`,
      left: `${data.x}px`,
    };
    onDragStop(event.id, newPosition);
  };

  return (
    <Draggable
      bounds="parent"
      defaultPosition={{
        x: parseInt(event.position.left),
        y: parseInt(event.position.top)
      }}
      grid={[143, 3.6]}
      onStart={handleStart}
      onStop={handleStop}
    >
      <Card
        className={`flex items-start ${getColorClasses(event.color).bg} rounded overflow-hidden absolute cursor-move hover:shadow-lg transition-shadow ${isDragging ? 'opacity-70 shadow-xl' : ''}`}
        style={{
          width: event.width,
          height: event.height,
        }}
      >
        <div className={`${getColorClasses(event.color).accent} relative self-stretch w-[3px]`} />
        <CardContent className="flex flex-col h-full items-start p-1.5 relative flex-1 grow rounded">
          <div className="flex items-center gap-1 relative self-stretch w-full flex-[0_0_auto]">
            <div className={`w-fit mt-[-1.00px] font-medium ${getColorClasses(event.color).text} text-[0.875rem] whitespace-nowrap relative font-text-xs-medium tracking-[var(--text-xs-medium-letter-spacing)] leading-[var(--text-xs-medium-line-height)]`}>
              {event.time}
            </div>
            <div className={`font-medium ${getColorClasses(event.color).text} text-[0.875rem] relative w-fit mt-[-1.00px] font-text-xs-medium tracking-[var(--text-xs-medium-letter-spacing)] leading-[var(--text-xs-medium-line-height)] whitespace-nowrap`}>
              {event.period}
            </div>
            {event.hasVideo && (
              <div className={`${getColorClasses(event.color).icon} inline-flex items-start gap-2.5 p-0.5 relative flex-[0_0_auto] rounded-[100px]`}>
                <VideoIcon className="w-2 h-2" />
              </div>
            )}
          </div>
          <div className={`self-stretch font-semibold ${getColorClasses(event.color).text} text-[0.875rem] relative [font-family:'Inter',Helvetica] tracking-[0] leading-4`}>
            {event.title}
          </div>
        </CardContent>
      </Card>
    </Draggable>
  );
}