import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Clock3,
  Copy,
  Pencil,
  Play,
  Plus,
  SearchIcon,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "../../../../components/ui/toggle-group";
import { CalendarEvent } from "../../../../types";
import { TaskPopup } from "./TaskPopup";
import { ContextMenu, type ContextMenuItem } from "./ContextMenu";
import Draggable, { DraggableData, DraggableEvent } from "react-draggable";
import { formatSecondsAsHoursMinutes, parseDateTimeAsLocal } from "../../../../../../utils/utils";

const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const hour = i % 12 || 12;
  const period = i < 12 ? "AM" : "PM";
  return `${hour} ${period}`;
});

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const HOUR_ROW_HEIGHT = 72;

const WEEKDAY_INITIALS = [
  { name: 'Sunday', initial: 'S' },
  { name: 'Monday', initial: 'M' },
  { name: 'Tuesday', initial: 'T' },
  { name: 'Wednesday', initial: 'W' },
  { name: 'Thursday', initial: 'T' },
  { name: 'Friday', initial: 'F' },
  { name: 'Saturday', initial: 'S' },
] as const;

/** An entry's `color` is now the owning project's own hex (see Dashboard), so
 *  the calendar and the Projects page agree on what colour a project is.
 *  Legacy palette names still resolve for entries with no project. */
const eventColorClasses: Record<string, string> = {
  lightblue: "border-blue-300/60 bg-blue-100 text-blue-800 dark:border-blue-400/30 dark:bg-blue-500/15 dark:text-blue-200",
  violet: "border-violet-300/60 bg-violet-100 text-violet-800 dark:border-violet-400/30 dark:bg-violet-500/15 dark:text-violet-200",
  amber: "border-amber-300/60 bg-amber-100 text-amber-800 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-200",
  rose: "border-rose-300/60 bg-rose-100 text-rose-800 dark:border-rose-400/30 dark:bg-rose-500/15 dark:text-rose-200",
  emerald: "border-emerald-300/60 bg-emerald-100 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-200",
};

const getEventColorClasses = (color: string) =>
  eventColorClasses[color] ??
  "border-border bg-secondary text-secondary-foreground dark:bg-secondary";

const isSameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const formatEventTimeLabel = (event: CalendarEvent) => {
  const parsed = parseDateTimeAsLocal(event.startTime);
  if (Number.isNaN(parsed.getTime())) {
    return `${event.time} ${event.period}`;
  }

  return parsed.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

const getEventDurationSeconds = (event: CalendarEvent) => {
  if (Number.isFinite(event.durationSeconds)) {
    return Math.max(0, Math.round(Number(event.durationSeconds)));
  }

  const parsedHeight = Number.parseFloat(event.height);
  if (Number.isFinite(parsedHeight)) {
    return Math.max(900, Math.round((parsedHeight / HOUR_ROW_HEIGHT) * 3600));
  }

  return 0;
};

interface PositionedEvent {
  event: CalendarEvent;
  top: number;
  height: number;
  lane: number;
  laneCount: number;
  startMinutes: number;
  endMinutes: number;
}

interface CalendarSectionProps {
  events: CalendarEvent[];
  refreshEvents: (range?: { start: Date; end: Date }) => Promise<void>;
  onUpdateEventPosition?: (eventId: number, newPosition: { top: string; left: string }) => Promise<void> | void;
  onDuplicateEvent?: (eventId: number) => Promise<void> | void;
  onDeleteEvent?: (eventId: number) => Promise<void> | void;
  onContinueEvent?: (eventId: number) => Promise<void> | void;
}

interface CalendarContextMenuState {
  x: number;
  y: number;
  selectedTime: Date;
  event?: CalendarEvent;
}

export const CalendarSection = ({
  events,
  refreshEvents,
  onUpdateEventPosition,
  onDuplicateEvent,
  onDeleteEvent,
  onContinueEvent,
}: CalendarSectionProps): JSX.Element => {
  const [view, setView] = useState<"day" | "week" | "month" | "year">(
    () => (window.innerWidth < 1024 ? "month" : "day")
  );
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mobileViewMode, setMobileViewMode] = useState<"calendar" | "agenda">("calendar");
  const [mobileSelectedDate, setMobileSelectedDate] = useState(new Date());
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<Date | undefined>(undefined);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [contextMenu, setContextMenu] = useState<CalendarContextMenuState | null>(null);
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const [now, setNow] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileEntrySort, setMobileEntrySort] = useState<"newest" | "oldest" | "duration">("newest");
  const [mobileEntryFilter, setMobileEntryFilter] = useState<"all" | "billable" | "non-billable">("all");
  const [dragPreview, setDragPreview] = useState<Record<number, { top: number; left: number }>>({});
  const [weekGridWidth, setWeekGridWidth] = useState(0);
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const didAutoScrollDailyRef = useRef(false);
  const weekGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let wasMobile = window.innerWidth < 1024;

    const handleResize = () => {
      const nextIsMobile = window.innerWidth < 1024;
      setIsMobileLayout(nextIsMobile);

      // Only reset the view when the layout actually crosses the mobile
      // boundary — not on every resize while already narrow. Previously this
      // stomped the user's chosen view on any mobile-width resize tick.
      if (nextIsMobile && !wasMobile) {
        setView("month");
      }
      wasMobile = nextIsMobile;
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (
      mobileSelectedDate.getMonth() !== currentDate.getMonth() ||
      mobileSelectedDate.getFullYear() !== currentDate.getFullYear()
    ) {
      const nextSelectedDate = new Date(currentDate);
      const maxDayInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      nextSelectedDate.setDate(Math.min(mobileSelectedDate.getDate(), maxDayInMonth));
      setMobileSelectedDate(nextSelectedDate);
    }
  }, [currentDate, mobileSelectedDate]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(interval);
  }, []);

  const getVisibleRange = (date: Date, currentView: "day" | "week" | "month" | "year") => {
    if (currentView === "day") {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    if (currentView === "week") {
      const start = new Date(date);
      start.setDate(date.getDate() - date.getDay());
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    if (currentView === "month") {
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }

    const start = new Date(date.getFullYear(), 0, 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date.getFullYear(), 11, 31);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  useEffect(() => {
    void refreshEvents(getVisibleRange(currentDate, view));
  }, [currentDate, view, refreshEvents]);

  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return {
        day: day.toLocaleString("en-US", { weekday: "short" }).toUpperCase(),
        date: day.getDate().toString(),
        isWeekend: i === 0 || i === 6,
        isToday: day.toDateString() === new Date().toDateString(),
      };
    });
  };

  const getMonthData = (date: Date, scopedEvents: CalendarEvent[]) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const start = new Date(firstDay);
    start.setDate(firstDay.getDate() - firstDay.getDay());

    return Array.from({ length: 42 }, (_, index) => {
      const cellDate = new Date(start);
      cellDate.setDate(start.getDate() + index);

      return {
        date: cellDate.getDate().toString(),
        fullDate: cellDate,
        isCurrentMonth: cellDate.getMonth() === date.getMonth(),
        isToday: isSameDay(cellDate, new Date()),
        isWeekend: cellDate.getDay() === 0 || cellDate.getDay() === 6,
        events: scopedEvents.filter((event) => {
          const eventDate = parseDateTimeAsLocal(event.startTime);
          return !Number.isNaN(eventDate.getTime()) && isSameDay(eventDate, cellDate);
        }),
      };
    });
  };

  const getYearData = (date: Date) => {
    return monthNames.map((month, index) => {
      const firstDay = new Date(date.getFullYear(), index, 1);
      const daysInMonth = new Date(date.getFullYear(), index + 1, 0).getDate();
      return {
        month,
        firstWeekday: firstDay.getDay(),
        daysInMonth,
      };
    });
  };

  const handleNavigation = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (view === "day") {
      newDate.setDate(currentDate.getDate() + (direction === "prev" ? -1 : 1));
    } else if (view === "week") {
      newDate.setDate(currentDate.getDate() + (direction === "prev" ? -7 : 7));
    } else if (view === "month") {
      newDate.setMonth(currentDate.getMonth() + (direction === "prev" ? -1 : 1));
    } else if (view === "year") {
      newDate.setFullYear(currentDate.getFullYear() + (direction === "prev" ? -1 : 1));
    }
    setCurrentDate(newDate);
  };

  const getButtonText = () => {
    if (view === "day") {
      return currentDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } else if (view === "week") {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    } else if (view === "month") {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else {
      return currentDate.getFullYear().toString();
    }
  };

  const openCreatePopupAt = (targetDate: Date) => {
    setSelectedEvent(null);
    setSelectedTime(new Date(targetDate));
    setIsPopupOpen(true);
  };

  const openEditPopup = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setSelectedTime(parseDateTimeAsLocal(event.startTime));
    setIsPopupOpen(true);
    setContextMenu(null);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    setSelectedTime(undefined);
    setSelectedEvent(null);
  };

  const resolveSlotDate = (hour: number, dayIndex?: number) => {
    const selectedDate = new Date(currentDate);
    if (view === "week" && dayIndex !== undefined) {
      selectedDate.setDate(currentDate.getDate() - currentDate.getDay() + dayIndex);
    }
    selectedDate.setHours(hour, 0, 0, 0);
    return selectedDate;
  };

  const handleTimeSlotClick = (hour: number, dayIndex?: number, event?: React.MouseEvent) => {
    const selectedDate = resolveSlotDate(hour, dayIndex);

    if (event && event.type === "contextmenu") {
      event.preventDefault();
      setContextMenu({ x: event.clientX, y: event.clientY, selectedTime: selectedDate });
      return;
    }

    openCreatePopupAt(selectedDate);
  };

  const openEventContextMenu = (mouseEvent: React.MouseEvent, calendarEvent: CalendarEvent) => {
    mouseEvent.preventDefault();
    mouseEvent.stopPropagation();
    setContextMenu({
      x: mouseEvent.clientX,
      y: mouseEvent.clientY,
      selectedTime: parseDateTimeAsLocal(calendarEvent.startTime),
      event: calendarEvent,
    });
  };

  const contextMenuItems: ContextMenuItem[] = useMemo(() => {
    if (!contextMenu) return [];

    if (contextMenu.event) {
      const target = contextMenu.event;
      const items: ContextMenuItem[] = [
        { label: "Edit entry", icon: Pencil, onClick: () => openEditPopup(target) },
      ];
      if (onDuplicateEvent) {
        items.push({ label: "Duplicate", icon: Copy, onClick: () => void onDuplicateEvent(target.id) });
      }
      if (onContinueEvent) {
        items.push({ label: "Continue as timer", icon: Play, onClick: () => void onContinueEvent(target.id) });
      }
      if (onDeleteEvent) {
        items.push({
          label: "Delete",
          icon: Trash2,
          destructive: true,
          onClick: () => void onDeleteEvent(target.id),
        });
      }
      return items;
    }

    return [
      {
        label: "Add time entry",
        icon: Plus,
        onClick: () => openCreatePopupAt(contextMenu.selectedTime),
      },
    ];
  }, [contextMenu, onDuplicateEvent, onContinueEvent, onDeleteEvent]);

  const handleSave = async () => {
    await refreshEvents(getVisibleRange(currentDate, view));
    closePopup();
  };

  const handleViewChange = (value: string) => {
    if (value === "day" || value === "week" || value === "month" || value === "year") {
      setView(value);
    }
  };

  const searchableEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return events;
    }

    return events.filter((event) => {
      const text = `${event.title} ${event.time} ${event.period}`.toLowerCase();
      return text.includes(query);
    });
  }, [events, searchQuery]);

  const getEventsForDate = (targetDate: Date) =>
    searchableEvents
      .filter((event) => {
        const eventDate = parseDateTimeAsLocal(event.startTime);
        return !Number.isNaN(eventDate.getTime()) && isSameDay(eventDate, targetDate);
      })
      .sort((a, b) => parseDateTimeAsLocal(a.startTime).getTime() - parseDateTimeAsLocal(b.startTime).getTime());

  const applyMobileEntryFilter = (sourceEvents: CalendarEvent[]) => {
    if (mobileEntryFilter === "billable") {
      return sourceEvents.filter((event) => event.billable);
    }

    if (mobileEntryFilter === "non-billable") {
      return sourceEvents.filter((event) => !event.billable);
    }

    return sourceEvents;
  };

  const sortMobileEntries = (sourceEvents: CalendarEvent[]) => {
    const eventsCopy = [...sourceEvents];

    if (mobileEntrySort === "oldest") {
      return eventsCopy.sort(
        (a, b) => parseDateTimeAsLocal(a.startTime).getTime() - parseDateTimeAsLocal(b.startTime).getTime()
      );
    }

    if (mobileEntrySort === "duration") {
      return eventsCopy.sort((a, b) => getEventDurationSeconds(b) - getEventDurationSeconds(a));
    }

    return eventsCopy.sort(
      (a, b) => parseDateTimeAsLocal(b.startTime).getTime() - parseDateTimeAsLocal(a.startTime).getTime()
    );
  };

  const getPositionedEvents = (dayEvents: CalendarEvent[]): PositionedEvent[] => {
    const laneEndTimes: number[] = [];

    const items = dayEvents.map((event) => {
      const eventDate = parseDateTimeAsLocal(event.startTime);
      const startMinutes = eventDate.getHours() * 60 + eventDate.getMinutes();
      const top = (startMinutes / 60) * HOUR_ROW_HEIGHT;

      const parsedHeight = Number.parseFloat(event.height);
      const height = Number.isFinite(parsedHeight) ? Math.max(24, parsedHeight) : HOUR_ROW_HEIGHT;
      const durationMinutes = Math.max(15, (height / HOUR_ROW_HEIGHT) * 60);
      const endMinutes = Math.min(24 * 60, startMinutes + durationMinutes);

      let lane = laneEndTimes.findIndex((end) => end <= startMinutes);
      if (lane === -1) {
        lane = laneEndTimes.length;
      }
      laneEndTimes[lane] = endMinutes;

      return { event, top, height, lane, startMinutes, endMinutes };
    });

    return items.map((item) => {
      const overlapping = items.filter(
        (other) => other.startMinutes < item.endMinutes && other.endMinutes > item.startMinutes
      );
      const laneCount = Math.max(1, ...overlapping.map((other) => other.lane + 1));
      return { ...item, laneCount };
    });
  };

  useEffect(() => {
    setDragPreview({});
  }, [events]);

  useEffect(() => {
    if (view !== "week") {
      return;
    }

    const updateWeekGridWidth = () => {
      setWeekGridWidth(weekGridRef.current?.clientWidth ?? 0);
    };

    updateWeekGridWidth();
    window.addEventListener("resize", updateWeekGridWidth);

    return () => window.removeEventListener("resize", updateWeekGridWidth);
  }, [view, isMobileLayout]);

  const weekColumnWidth = weekGridWidth > 0 ? weekGridWidth / 7 : 140;

  const parsePixelValue = (value: string | undefined, fallback: number) => {
    const parsed = Number.parseFloat(value ?? "");
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const getEventHeightPx = (event: CalendarEvent) => {
    const parsed = Number.parseFloat(event.height);
    return Number.isFinite(parsed) ? Math.max(24, parsed) : 36;
  };

  const getWeeklyEventPosition = (event: CalendarEvent) => {
    if (dragPreview[event.id]) {
      return dragPreview[event.id];
    }

    const startDate = parseDateTimeAsLocal(event.startTime);
    const fallbackTop = startDate.getHours() * HOUR_ROW_HEIGHT + (startDate.getMinutes() / 60) * HOUR_ROW_HEIGHT;
    const fallbackLeft = startDate.getDay() * weekColumnWidth;
    const parsedTop = parsePixelValue(event.position?.top, fallbackTop);
    const parsedLeft = parsePixelValue(event.position?.left, fallbackLeft);
    const eventHeight = getEventHeightPx(event);
    const maxTop = Math.max(0, 24 * HOUR_ROW_HEIGHT - eventHeight);
    const maxLeft = Math.max(0, weekColumnWidth * 6);

    const outOfBoundsTop = parsedTop < -HOUR_ROW_HEIGHT || parsedTop > 24 * HOUR_ROW_HEIGHT + HOUR_ROW_HEIGHT;
    const outOfBoundsLeft =
      weekGridWidth > 0 && (parsedLeft < -weekColumnWidth || parsedLeft > weekGridWidth + weekColumnWidth);

    const parsedDayIndex = Math.round(parsedLeft / Math.max(1, weekColumnWidth));
    const canonicalDayIndex = startDate.getDay();
    const dayMismatch = Math.abs(parsedDayIndex - canonicalDayIndex) > 0;

    const parsedQuarterHourSlot = Math.round(parsedTop / (HOUR_ROW_HEIGHT / 4));
    const canonicalQuarterHourSlot = Math.round(fallbackTop / (HOUR_ROW_HEIGHT / 4));
    const timeMismatch = Math.abs(parsedQuarterHourSlot - canonicalQuarterHourSlot) > 2;

    const normalizedTop = outOfBoundsTop || timeMismatch ? fallbackTop : parsedTop;
    const normalizedLeft = outOfBoundsLeft || dayMismatch ? fallbackLeft : parsedLeft;

    const slotHeight = HOUR_ROW_HEIGHT / 4;

    return {
      top: Math.min(maxTop, Math.max(0, Math.round(normalizedTop / slotHeight) * slotHeight)),
      left: Math.min(maxLeft, Math.max(0, Math.round(normalizedLeft / weekColumnWidth) * weekColumnWidth)),
    };
  };

  const handleWeeklyDrag = (eventId: number, data: DraggableData) => {
    setDragPreview((previous) => ({
      ...previous,
      [eventId]: { top: data.y, left: data.x },
    }));
  };

  const handleWeeklyDragStop = (
    eventId: number,
    sourceEvent: CalendarEvent,
    _event: DraggableEvent,
    data: DraggableData
  ) => {
    const dayIndex = Math.min(6, Math.max(0, Math.round(data.x / weekColumnWidth)));
    const snappedLeft = Math.round(dayIndex * weekColumnWidth);
    const slotHeight = HOUR_ROW_HEIGHT / 4;
    const eventHeight = getEventHeightPx(sourceEvent);
    const maxTop = Math.max(0, 24 * HOUR_ROW_HEIGHT - eventHeight);
    const snappedTop = Math.min(maxTop, Math.max(0, Math.round(data.y / slotHeight) * slotHeight));

    setDragPreview((previous) => ({
      ...previous,
      [eventId]: { top: snappedTop, left: snappedLeft },
    }));

    if (onUpdateEventPosition) {
      void onUpdateEventPosition(eventId, {
        top: `${snappedTop}px`,
        left: `${snappedLeft}px`,
      });
    }
  };

  const weekRangeEvents = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(currentDate.getDate() - currentDate.getDay());
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    return searchableEvents.filter((event) => {
      const eventDate = parseDateTimeAsLocal(event.startTime);
      return !Number.isNaN(eventDate.getTime()) && eventDate >= start && eventDate < end;
    });
  }, [currentDate, searchableEvents]);

  useEffect(() => {
    if (isMobileLayout || view !== "day") {
      return;
    }

    const scrollContainer = timelineScrollRef.current;
    if (!scrollContainer) {
      return;
    }

    const nowDate = new Date();
    const focusPosition =
      nowDate.getHours() * HOUR_ROW_HEIGHT + (nowDate.getMinutes() / 60) * HOUR_ROW_HEIGHT;
    const targetTop = Math.max(0, focusPosition - scrollContainer.clientHeight * 0.35);

    scrollContainer.scrollTo({
      top: targetTop,
      behavior: didAutoScrollDailyRef.current ? "smooth" : "auto",
    });

    didAutoScrollDailyRef.current = true;
  }, [currentDate, isMobileLayout, view]);

  const currentTimePosition = now.getHours() * HOUR_ROW_HEIGHT + (now.getMinutes() / 60) * HOUR_ROW_HEIGHT;

  const weekDays = getWeekDays(currentDate);
  const monthData = getMonthData(currentDate, searchableEvents);
  const yearData = getYearData(currentDate);
  const todayWeekIndex = weekDays.findIndex((day) => day.isToday);

  const openTaskForDate = (baseDate: Date) => {
    const entryDate = new Date(baseDate);
    const roundedNow = new Date(now);
    roundedNow.setSeconds(0, 0);
    roundedNow.setMinutes(roundedNow.getMinutes() + 1);
    entryDate.setHours(roundedNow.getHours(), roundedNow.getMinutes(), 0, 0);
    openCreatePopupAt(entryDate);
  };

  const renderMobileCalendar = () => {
    const selectedDayEvents = sortMobileEntries(applyMobileEntryFilter(getEventsForDate(mobileSelectedDate)));
    const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
      <div className="space-y-4 p-1">
        <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Selected Day</p>
              <p className="text-sm font-semibold text-foreground">
                {mobileSelectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
            <Button size="sm" className="h-8 gap-1 px-3" onClick={() => openTaskForDate(mobileSelectedDate)}>
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>

          <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-muted-foreground">
            {weekdayLabels.map((dayLabel) => (
              <span key={dayLabel} className="py-1" aria-hidden="true">
                {dayLabel.charAt(0)}
              </span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {monthData.map((day, index) => {
              const isSelected = isSameDay(day.fullDate, mobileSelectedDate);

              return (
                <button
                  key={`${day.fullDate.toISOString()}-${index}`}
                  type="button"
                  aria-label={day.fullDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  aria-pressed={isSelected}
                  onClick={() => setMobileSelectedDate(new Date(day.fullDate))}
                  className={`relative flex h-10 items-center justify-center rounded-lg text-xs font-medium transition ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : day.isToday
                      ? "bg-today/15 text-today-foreground ring-1 ring-inset ring-today/40 dark:text-today"
                      : day.isCurrentMonth
                      ? "text-foreground hover:bg-accent hover:text-accent-foreground"
                      : "text-muted-foreground/60 hover:bg-accent"
                  }`}
                >
                  <span>{day.date}</span>
                  {day.events.length > 0 && (
                    <span
                      className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${
                        isSelected ? "bg-primary-foreground" : "bg-primary"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Entries for day</p>
            <span className="rounded-full bg-secondary px-2 py-1 text-[11px] font-medium text-secondary-foreground">
              {selectedDayEvents.length}
            </span>
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <select
              value={mobileEntrySort}
              onChange={(event) => setMobileEntrySort(event.target.value as "newest" | "oldest" | "duration")}
              aria-label="Sort entries"
              className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="duration">Longest</option>
            </select>

            <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
              {(["all", "billable", "non-billable"] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={`rounded-md px-2 py-1 text-[11px] font-medium capitalize transition ${
                    mobileEntryFilter === filter
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setMobileEntryFilter(filter)}
                >
                  {filter === "non-billable" ? "Non-billable" : filter}
                </button>
              ))}
            </div>
          </div>

          {selectedDayEvents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-surface p-4 text-center text-sm text-muted-foreground">
              No entries for this day yet.
            </div>
          ) : (
            <div className="space-y-2">
              {selectedDayEvents.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  className="w-full rounded-xl border border-border bg-surface p-3 text-left transition hover:bg-accent"
                  onClick={() => openEditPopup(event)}
                  onContextMenu={(mouseEvent) => openEventContextMenu(mouseEvent, event)}
                >
                  <div className="text-xs font-semibold text-primary">{formatEventTimeLabel(event)}</div>
                  <div className="mt-1 text-sm font-semibold text-foreground">{event.title}</div>
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{formatSecondsAsHoursMinutes(getEventDurationSeconds(event))}</span>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <span>{event.billable ? "Billable" : "Non-billable"}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMobileAgenda = () => {
    const range = getVisibleRange(currentDate, view);
    const visibleEvents = sortMobileEntries(
      applyMobileEntryFilter(
        searchableEvents
      .filter((event) => {
        const eventDate = parseDateTimeAsLocal(event.startTime);
        return eventDate >= range.start && eventDate <= range.end;
      })
      )
    );

    const groupedEvents = visibleEvents.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
      const eventDate = parseDateTimeAsLocal(event.startTime);
      const key = `${eventDate.getFullYear()}-${(eventDate.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${eventDate.getDate().toString().padStart(2, "0")}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(event);
      return acc;
    }, {});

    const groupedEntries = Object.entries(groupedEvents);

    return (
      <div className="space-y-4 p-1">
        <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="text-sm font-semibold text-foreground">Agenda</div>
            <Button size="sm" className="h-8 gap-1 px-3" onClick={() => openTaskForDate(new Date())}>
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <select
              value={mobileEntrySort}
              onChange={(event) => setMobileEntrySort(event.target.value as "newest" | "oldest" | "duration")}
              aria-label="Sort entries"
              className="rounded-lg border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="duration">Longest</option>
            </select>
            <select
              value={mobileEntryFilter}
              onChange={(event) => setMobileEntryFilter(event.target.value as "all" | "billable" | "non-billable")}
              aria-label="Filter entries"
              className="rounded-lg border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All</option>
              <option value="billable">Billable</option>
              <option value="non-billable">Non-billable</option>
            </select>
          </div>
          <p className="text-xs text-muted-foreground">A compact list of every entry in the current range.</p>
        </div>

        {groupedEntries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface p-6 text-center text-sm text-muted-foreground">
            No entries in this range yet.
          </div>
        ) : (
          groupedEntries.map(([dayKey, dayEvents]) => {
            const dayDate = new Date(`${dayKey}T00:00:00`);
            return (
              <div key={dayKey} className="rounded-xl border border-border bg-card p-3 shadow-sm">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5" />
                  {dayDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                <div className="space-y-2">
                  {dayEvents.map((event) => (
                    <button
                      type="button"
                      key={event.id}
                      className="w-full rounded-lg border border-border bg-surface p-3 text-left transition hover:bg-accent"
                      onClick={() => openEditPopup(event)}
                      onContextMenu={(mouseEvent) => openEventContextMenu(mouseEvent, event)}
                    >
                      <div className="text-xs font-medium text-primary">{formatEventTimeLabel(event)}</div>
                      <div className="mt-1 text-sm font-semibold text-foreground">{event.title}</div>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{formatSecondsAsHoursMinutes(getEventDurationSeconds(event))}</span>
                        <span className="h-1 w-1 rounded-full bg-border" />
                        <span>{event.billable ? "Billable" : "Non-billable"}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = getPositionedEvents(getEventsForDate(currentDate));
    const isToday = currentDate.toDateString() === now.toDateString();

    return (
      <div className="flex h-full w-full min-w-0 flex-col">
        <div className="grid grid-cols-[56px_minmax(0,1fr)] border-b border-border">
          <div className="border-r border-border bg-muted/40" />
          <div className={`px-3 py-2 ${isToday ? "bg-today/10" : "bg-card"}`}>
            <div className="text-[11px] font-semibold tracking-wide text-muted-foreground">
              {currentDate.toLocaleString("en-US", { weekday: "long" }).toUpperCase()}
            </div>
            <div className={`text-2xl font-semibold ${isToday ? "text-today-foreground dark:text-today" : "text-foreground"}`}>
              {currentDate.getDate()}
            </div>
          </div>
        </div>

        <div className="grid min-h-[1728px] grid-cols-[56px_minmax(0,1fr)]">
          <div className="border-r border-border bg-muted/40">
            {timeSlots.map((time, timeIndex) => (
              <div
                key={timeIndex}
                className="flex h-[72px] items-start px-2 pt-1 text-[11px] font-medium text-muted-foreground"
              >
                {time}
              </div>
            ))}
          </div>

          <div className="relative overflow-hidden bg-card">
            {timeSlots.map((_, timeIndex) => (
              <button
                key={timeIndex}
                type="button"
                aria-label={`Add entry at ${timeSlots[timeIndex]}`}
                className="absolute left-0 right-0 border-b border-border/60 transition hover:bg-accent/60"
                style={{
                  top: `${timeIndex * HOUR_ROW_HEIGHT}px`,
                  height: `${HOUR_ROW_HEIGHT}px`,
                }}
                onClick={(event) => handleTimeSlotClick(timeIndex, undefined, event)}
                onContextMenu={(event) => handleTimeSlotClick(timeIndex, undefined, event)}
              />
            ))}

            {dayEvents.map((item) => {
              const laneWidth = 100 / item.laneCount;
              const leftPercent = item.lane * laneWidth;

              return (
                <button
                  key={item.event.id}
                  type="button"
                  className={`absolute z-10 rounded-md border px-2 py-1 text-left text-xs shadow-sm transition hover:brightness-105 ${getEventColorClasses(item.event.color)}`}
                  style={{
                    ...getEventColorStyle(item.event.color),
                    top: `${item.top + 2}px`,
                    left: `calc(${leftPercent}% + 6px)`,
                    width: `calc(${laneWidth}% - 12px)`,
                    height: `${Math.max(20, item.height - 4)}px`,
                  }}
                  onClick={() => openEditPopup(item.event)}
                  onContextMenu={(mouseEvent) => openEventContextMenu(mouseEvent, item.event)}
                >
                  <div className="truncate font-semibold">{item.event.title}</div>
                  <div className="truncate text-[10px] opacity-80">{formatEventTimeLabel(item.event)}</div>
                </button>
              );
            })}

            {isToday && (
              <div className="pointer-events-none absolute inset-x-0 z-20" style={{ top: `${currentTimePosition}px` }}>
                <div className="relative flex items-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-today shadow-sm" />
                  <div className="h-[2px] flex-1 bg-today/90" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const renderedWeekEvents = [...weekRangeEvents].sort(
      (left, right) => parseDateTimeAsLocal(left.startTime).getTime() - parseDateTimeAsLocal(right.startTime).getTime()
    );

    return (
      <div className="flex h-full w-full min-w-0 flex-col">
        <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b border-border">
          <div className="border-r border-border bg-muted/40" />
          {weekDays.map((dayInfo, index) => (
            <div
              key={index}
              className={`border-r border-border px-2 py-2 text-center last:border-r-0 ${
                dayInfo.isToday ? "bg-today/10" : dayInfo.isWeekend ? "bg-muted/40" : "bg-card"
              }`}
            >
              <div className="text-[11px] font-semibold text-muted-foreground">{dayInfo.day}</div>
              <div
                className={`text-xl font-semibold ${
                  dayInfo.isToday ? "text-today-foreground dark:text-today" : "text-foreground"
                }`}
              >
                {dayInfo.date}
              </div>
            </div>
          ))}
        </div>

        <div className="grid min-h-[1728px] grid-cols-[56px_minmax(0,1fr)]">
          <div className="border-r border-border bg-muted/40">
            {timeSlots.map((time, timeIndex) => (
              <div
                key={timeIndex}
                className="flex h-[72px] items-start px-2 pt-1 text-[11px] font-medium text-muted-foreground"
              >
                {time}
              </div>
            ))}
          </div>

          <div ref={weekGridRef} className="relative overflow-hidden bg-card">
            <div className="absolute inset-0 grid grid-cols-7">
              {weekDays.map((dayInfo, dayIndex) => (
                <div
                  key={dayIndex}
                  className={`relative border-r border-border last:border-r-0 ${dayInfo.isWeekend ? "bg-muted/40" : "bg-card"}`}
                >
                  {timeSlots.map((_, timeIndex) => (
                    <button
                      key={timeIndex}
                      type="button"
                      aria-label={`Add entry on ${dayInfo.day} at ${timeSlots[timeIndex]}`}
                      className="absolute left-0 right-0 border-b border-border/60 transition hover:bg-accent/60"
                      style={{
                        top: `${timeIndex * HOUR_ROW_HEIGHT}px`,
                        height: `${HOUR_ROW_HEIGHT}px`,
                      }}
                      onClick={(event) => handleTimeSlotClick(timeIndex, dayIndex, event)}
                      onContextMenu={(event) => handleTimeSlotClick(timeIndex, dayIndex, event)}
                    />
                  ))}
                </div>
              ))}
            </div>

            {renderedWeekEvents.map((event) => {
              const eventPosition = getWeeklyEventPosition(event);
              const eventHeight = getEventHeightPx(event);

              return (
                <Draggable
                  key={event.id}
                  bounds="parent"
                  grid={[Math.max(1, weekColumnWidth), HOUR_ROW_HEIGHT / 4]}
                  position={{ x: eventPosition.left, y: eventPosition.top }}
                  onDrag={(_, data) => handleWeeklyDrag(event.id, data)}
                  onStop={(dragEvent, data) => handleWeeklyDragStop(event.id, event, dragEvent, data)}
                >
                  <div
                    className={`absolute z-20 cursor-grab rounded-md border px-2 py-1 text-xs shadow-sm transition hover:brightness-105 active:cursor-grabbing ${getEventColorClasses(event.color)}`}
                    style={{
                      ...getEventColorStyle(event.color),
                      width: `${Math.max(88, weekColumnWidth - 8)}px`,
                      height: `${eventHeight}px`,
                    }}
                    onClick={() => openEditPopup(event)}
                    onContextMenu={(mouseEvent) => openEventContextMenu(mouseEvent, event)}
                    title="Click to edit · drag to move · right-click for more"
                  >
                    <div className="truncate font-semibold">{event.title}</div>
                    <div className="truncate text-[10px] opacity-80">{formatEventTimeLabel(event)}</div>
                  </div>
                </Draggable>
              );
            })}

            {todayWeekIndex !== -1 && (
              <div
                className="pointer-events-none absolute z-20"
                style={{
                  top: `${currentTimePosition}px`,
                  left: `calc(${todayWeekIndex} * (100% / 7))`,
                  width: "calc(100% / 7)",
                }}
              >
                <div className="relative flex items-center">
                  <div className="absolute -left-1.5 h-3 w-3 rounded-full bg-today shadow-sm" />
                  <div className="h-[2px] w-full bg-today/90" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderMonthView = () => (
    <div className="flex h-full w-full flex-col">
      <div className="grid grid-cols-7 border-b border-border bg-muted/40">
        {weekDays.map((day) => (
          <div key={day.day} className="border-r border-border p-2 text-center last:border-r-0">
            <span className="text-xs font-bold text-muted-foreground">{day.day}</span>
          </div>
        ))}
      </div>
      <div className="grid auto-rows-[minmax(120px,1fr)] grid-cols-7">
        {monthData.map((day, index) => (
          <div
            key={index}
            className={`group relative border-b border-r border-border p-2 last:border-r-0 ${
              !day.isCurrentMonth
                ? "bg-muted/40"
                : day.isToday
                ? "bg-today/10"
                : day.isWeekend
                ? "bg-muted/30"
                : "bg-card"
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-sm font-medium ${
                  !day.isCurrentMonth
                    ? "text-muted-foreground/50"
                    : day.isToday
                    ? "flex h-6 w-6 items-center justify-center rounded-full bg-today font-semibold text-today-foreground"
                    : "text-foreground"
                }`}
              >
                {day.date}
              </span>
              <button
                type="button"
                aria-label={`Add entry on ${day.fullDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`}
                onClick={() => openTaskForDate(day.fullDate)}
                className="rounded p-0.5 text-muted-foreground opacity-0 transition hover:bg-accent hover:text-accent-foreground focus:opacity-100 group-hover:opacity-100"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-2 space-y-1 overflow-hidden">
              {day.events.slice(0, 3).map((event) => (
                <button
                  key={event.id}
                  type="button"
                  className={`w-full truncate rounded-md border px-1.5 py-1 text-left text-[11px] transition hover:brightness-105 ${getEventColorClasses(event.color)}`}
                  title={`${formatEventTimeLabel(event)} ${event.title}`}
                  onClick={() => openEditPopup(event)}
                  onContextMenu={(mouseEvent) => openEventContextMenu(mouseEvent, event)}
                >
                  <span className="font-medium">{formatEventTimeLabel(event)}</span> {event.title}
                </button>
              ))}
              {day.events.length > 3 && (
                <div className="px-1 text-[11px] font-medium text-muted-foreground">+{day.events.length - 3} more</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderYearView = () => {
    const eventCountByDay = new Map<string, number>();
    for (const event of searchableEvents) {
      const eventDate = parseDateTimeAsLocal(event.startTime);
      if (Number.isNaN(eventDate.getTime()) || eventDate.getFullYear() !== currentDate.getFullYear()) {
        continue;
      }
      const key = `${eventDate.getMonth()}-${eventDate.getDate()}`;
      eventCountByDay.set(key, (eventCountByDay.get(key) ?? 0) + 1);
    }

    const openMonth = (monthIndex: number) => {
      const next = new Date(currentDate.getFullYear(), monthIndex, 1);
      setCurrentDate(next);
      setView("month");
    };

    return (
      <div className="grid grid-cols-1 gap-4 p-2 sm:grid-cols-2 sm:p-4 xl:grid-cols-4">
        {yearData.map((month, monthIndex) => {
          const isCurrentMonth =
            monthIndex === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
          return (
            <button
              key={month.month}
              type="button"
              onClick={() => openMonth(monthIndex)}
              className={`overflow-hidden rounded-lg border text-left transition hover:border-primary/60 hover:shadow-sm ${
                isCurrentMonth ? "border-primary/60 ring-1 ring-inset ring-primary/30" : "border-border"
              }`}
            >
              <div className="border-b border-border bg-muted/40 p-2">
                <h3 className="text-sm font-semibold text-foreground">{month.month}</h3>
              </div>
              <div className="p-2">
                <div className="grid grid-cols-7 gap-1">
                  {["S", "M", "T", "W", "T", "F", "S"].map((label, dayIndex) => (
                    <div key={dayIndex} className="text-center text-[10px] text-muted-foreground">
                      {label}
                    </div>
                  ))}
                  {Array.from({
                    length: Math.ceil((month.firstWeekday + month.daysInMonth) / 7) * 7,
                  }).map((_, i) => {
                    const day = i - month.firstWeekday + 1;
                    const isInMonth = day > 0 && day <= month.daysInMonth;
                    const count = isInMonth ? eventCountByDay.get(`${monthIndex}-${day}`) ?? 0 : 0;

                    return (
                      <div
                        key={i}
                        className={`relative flex aspect-square items-center justify-center text-[10px] ${
                          isInMonth ? "text-foreground" : "text-transparent"
                        }`}
                      >
                        {isInMonth ? day : ""}
                        {count > 0 && (
                          <span className="absolute bottom-0 h-1 w-1 rounded-full bg-primary" aria-hidden="true" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <section className="flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden p-2 sm:gap-4 sm:p-4">
      <div className="sticky top-0 z-10 rounded-b-lg border-b border-border bg-card/95 px-3 pb-3 pt-3 shadow-sm backdrop-blur sm:px-6 sm:pt-4">
        <div className="relative flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-border">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 rounded-r-none border-r border-border"
                aria-label="Previous"
                onClick={() => handleNavigation("prev")}
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 rounded-l-none"
                aria-label="Next"
                onClick={() => handleNavigation("next")}
              >
                <ChevronRightIcon className="h-5 w-5" />
              </Button>
            </div>
            <Button
              variant="outline"
              className="h-9"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>
            <span className="text-sm font-semibold text-foreground sm:text-base">{getButtonText()}</span>
          </div>

          {isMobileLayout ? (
            <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
              {(["calendar", "agenda"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setMobileViewMode(mode)}
                  className={`h-8 rounded-md px-4 text-sm font-medium capitalize transition ${
                    mobileViewMode === mode
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          ) : (
            <ToggleGroup
              type="single"
              value={view}
              onValueChange={handleViewChange}
              className="flex gap-1 rounded-lg bg-muted p-1"
            >
              {(["day", "week", "month", "year"] as const).map((viewValue) => (
                <ToggleGroupItem
                  key={viewValue}
                  value={viewValue}
                  className="h-8 rounded-md px-3 text-sm font-medium capitalize text-muted-foreground data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-sm sm:px-4"
                >
                  {viewValue}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          )}

          <div className="flex w-full items-center lg:w-[220px]">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring">
              <SearchIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                className="h-auto flex-1 border-0 bg-transparent p-0 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="Search entries..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
      <div ref={timelineScrollRef} className="relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto rounded-lg border border-border bg-card">
        {isMobileLayout ? (
          mobileViewMode === "agenda" ? renderMobileAgenda() : renderMobileCalendar()
        ) : (
          <>
            {view === "day" && renderDayView()}
            {view === "week" && renderWeekView()}
            {view === "month" && renderMonthView()}
            {view === "year" && renderYearView()}
          </>
        )}
        <TaskPopup
          isOpen={isPopupOpen}
          onClose={closePopup}
          defaultStartTime={selectedTime}
          initialEntry={selectedEvent}
          onSave={handleSave}
          onDelete={onDeleteEvent}
          onContinue={onContinueEvent}
        />
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={() => setContextMenu(null)}
        />
      )}
    </section>
  );
};