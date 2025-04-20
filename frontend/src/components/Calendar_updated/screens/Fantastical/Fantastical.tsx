import { VideoIcon } from "lucide-react";
import { CalendarSection } from "./sections/CalendarSection";
// import AIButton  from "../../components/AIButton";
import { DraggableEvent } from "../../components/DraggableEvent";
import { ColorKey, ColorClasses } from "../../components/DraggableEvent";


// type ColorKey = 'lightblue' | 'violet' | 'amber' | 'rose' | 'emerald';

export const Fantastical = (): JSX.Element => {

  const calendarEvents = [
    // {
    //   id: 1,
    //   time: "8:00",
    //   period: "AM",
    //   title: "Monday Wake-Up Hour",
    //   color: "lightblue",
    //   hasVideo: true,
    //   position: { top: "196px", left: "209px" },
    //   width: "143px",
    //   height: "68px",
    // },
    // {
    //   id: 2,
    //   time: "9:00",
    //   period: "AM",
    //   title: "All-Team Kickoff",
    //   color: "lightblue",
    //   hasVideo: false,
    //   position: { top: "268px", left: "209px" },
    //   width: "143px",
    //   height: "68px",
    // },
    // {
    //   id: 3,
    //   time: "10:00",
    //   period: "AM",
    //   title: "Financial Update",
    //   color: "lightblue",
    //   hasVideo: true,
    //   position: { top: "340px", left: "209px" },
    //   width: "143px",
    //   height: "68px",
    // },
    // {
    //   id: 4,
    //   time: "11:00",
    //   period: "AM",
    //   title: "🍔 New Employee Welcome Lunch!",
    //   color: "violet",
    //   hasVideo: false,
    //   position: { top: "412px", left: "209px" },
    //   width: "143px",
    //   height: "140px",
    // },
    // {
    //   id: 5,
    //   time: "1:00",
    //   period: "PM",
    //   title: "Design Review",
    //   color: "lightblue",
    //   hasVideo: true,
    //   position: { top: "556px", left: "209px" },
    //   width: "143px",
    //   height: "68px",
    // },
    // {
    //   id: 6,
    //   time: "2:00",
    //   period: "PM",
    //   title: "1:1 with Jon",
    //   color: "amber",
    //   hasVideo: true,
    //   position: { top: "628px", left: "209px" },
    //   width: "143px",
    //   height: "68px",
    // },
    // {
    //   id: 7,
    //   time: "4:00",
    //   period: "PM",
    //   title: "🍻 Design Team Happy Hour",
    //   color: "rose",
    //   hasVideo: true,
    //   position: { top: "772px", left: "353px" },
    //   width: "143px",
    //   height: "68px",
    // },
    // {
    //   id: 8,
    //   time: "12:00",
    //   period: "PM",
    //   title: "🍔 Design System Kickoff Lunch",
    //   color: "lightblue",
    //   hasVideo: true,
    //   position: { top: "484px", left: "353px" },
    //   width: "143px",
    //   height: "68px",
    // },
    // {
    //   id: 9,
    //   time: "9:00",
    //   period: "AM",
    //   title: "Design Review: Acme Marketi...",
    //   color: "lightblue",
    //   hasVideo: false,
    //   position: { top: "268px", left: "353px" },
    //   width: "71px",
    //   height: "142px",
    // },
    // {
    //   id: 10,
    //   time: "9:00",
    //   period: "AM",
    //   title: "Webinar: Figma ...",
    //   color: "emerald",
    //   hasVideo: false,
    //   position: { top: "268px", left: "425px" },
    //   width: "71px",
    //   height: "68px",
    // },
    // {
    //   id: 11,
    //   time: "9:00",
    //   period: "AM",
    //   title: "☕ Coffee Chat",
    //   color: "lightblue",
    //   hasVideo: true,
    //   position: { top: "268px", left: "498px" },
    //   width: "143px",
    //   height: "68px",
    // },
    // {
    //   id: 12,
    //   time: "9:00",
    //   period: "AM",
    //   title: "☕ Coffee Chat",
    //   color: "lightblue",
    //   hasVideo: true,
    //   position: { top: "268px", left: "787px" },
    //   width: "143px",
    //   height: "68px",
    // },
    // {
    //   id: 13,
    //   time: "11:00",
    //   period: "AM",
    //   title: "Onboarding Presentation",
    //   color: "violet",
    //   hasVideo: true,
    //   position: { top: "412px", left: "498px" },
    //   width: "143px",
    //   height: "68px",
    // },
    // {
    //   id: 14,
    //   time: "10:00",
    //   period: "AM",
    //   title: "Health Benefits Walkthrough",
    //   color: "violet",
    //   hasVideo: true,
    //   position: { top: "340px", left: "643px" },
    //   width: "143px",
    //   height: "68px",
    // },
    // {
    //   id: 15,
    //   time: "2:00",
    //   period: "PM",
    //   title: "Concept Design Review II",
    //   color: "lightblue",
    //   hasVideo: true,
    //   position: { top: "628px", left: "353px" },
    //   width: "143px",
    //   height: "142px",
    // },
    // {
    //   id: 16,
    //   time: "1:00",
    //   period: "PM",
    //   title: "MVP Prioritization Workshop",
    //   color: "lightblue",
    //   hasVideo: true,
    //   position: { top: "556px", left: "498px" },
    //   width: "143px",
    //   height: "142px",
    // },
    // {
    //   id: 17,
    //   time: "1:00",
    //   period: "PM",
    //   title: "Design Review",
    //   color: "lightblue",
    //   hasVideo: true,
    //   position: { top: "484px", left: "643px" },
    //   width: "143px",
    //   height: "68px",
    // },
    // {
    //   id: 18,
    //   time: "12:00",
    //   period: "PM",
    //   title: "🥗 Marketing Meet-and-Greet",
    //   color: "lightblue",
    //   hasVideo: true,
    //   position: { top: "484px", left: "787px" },
    //   width: "143px",
    //   height: "68px",
    // },
    {
      id: 19,
      time: "2:00",
      period: "PM",
      title: "1:1 with Heather",
      color: "amber",
      hasVideo: true,
      position: { top: "628px", left: "787px" },
      width: "143px",
      height: "68px",
    },
    {
      id: 20,
      time: "4:00",
      period: "PM",
      title: "🍷 Happy Hour",
      color: "rose",
      hasVideo: true,
      position: { top: "772px", left: "787px" },
      width: "143px",
      height: "68px",
    },
  ];

  const getColorClasses = (color: ColorKey | string): ColorClasses => {
    const colorMap: Record<ColorKey, ColorClasses> = {
      lightblue: {
        bg: "bg-[#0ea5e91a]",
        accent: "bg-lightblue-500",
        text: "text-lightblue-700",
        icon: "bg-lightblue-700",
      },
      violet: {
        bg: "bg-[#8b5cf61a]",
        accent: "bg-violet-500",
        text: "text-violet-700",
        icon: "bg-violet-700",
      },
      amber: {
        bg: "bg-[#f59e0b1a]",
        accent: "bg-amber-500",
        text: "text-amber-700",
        icon: "bg-amber-700",
      },
      rose: {
        bg: "bg-rose-100",
        accent: "bg-rose-500",
        text: "text-rose-700",
        icon: "bg-rose-700",
      },
      emerald: {
        bg: "bg-[#10b9811a]",
        accent: "bg-emerald-500",
        text: "text-emerald-700",
        icon: "bg-emerald-700",
      },
    };
  
    return colorMap[color as ColorKey] || colorMap.lightblue;
  };

  return (
    <div className="bg-white flex flex-row justify-center w-full">
      <div className="bg-white w-full relative flex">
        
        {/* //Keep this navigational menu - To Be developed Later */}
        {/* <div className="w-[300px] flex-shrink-0">
          <NavigationMenuSection />
        </div> */}

        <div className="flex-grow relative">
          <CalendarSection />
          {calendarEvents.map((event) => (
            <DraggableEvent
              key={event.id}
              event={event}
              getColorClasses={getColorClasses}
            />
          ))}
        </div>
      </div>
    </div>
  );
};