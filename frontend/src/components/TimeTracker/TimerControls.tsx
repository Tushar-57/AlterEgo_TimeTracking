import { Button } from '../Calendar_updated/components/ui/button';
import { Play, Pause, Square, RefreshCw } from 'lucide-react';
import { TimerStatus, TimerMode } from './types';
import { motion } from 'framer-motion';

interface TimerControlsProps {
  timerState: {
    stopwatchTime: number;
    countdownTime: number;
    pomodoroTime: number;
    status: TimerStatus;
    activeTimerId: number | null;
    startTime?: string;
    currentMode: TimerMode;
  };
  toggleTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
}

export function TimerControls({
  timerState,
  toggleTimer,
  stopTimer,
  resetTimer,
}: TimerControlsProps) {
  const { status, currentMode, stopwatchTime, countdownTime, pomodoroTime } = timerState;

  // Determine the current time based on the timer mode
  const currentTime =
    currentMode === 'stopwatch'
      ? stopwatchTime
      : currentMode === 'countdown'
      ? countdownTime
      : pomodoroTime;

  return (
    <div className="flex items-center gap-4">
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          variant="default"
          size="lg"
          onClick={toggleTimer}
          className="bg-[#D8BFD8] text-white hover:bg-[#D8BFD8]/80 rounded-full p-6"
          disabled={currentTime === 0 && currentMode !== 'stopwatch'}
        >
          {status === 'running' ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6" />
          )}
        </Button>
      </motion.div>

      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          variant="outline"
          size="lg"
          onClick={stopTimer}
          className="bg-[#F7F7F7] dark:bg-[#3C4A5E] border-[#D8BFD8]/50 text-[#6B7280] hover:bg-[#D8BFD8]/20 rounded-full p-6"
          disabled={status === 'stopped' && !timerState.activeTimerId}
        >
          <Square className="h-6 w-6" />
        </Button>
      </motion.div>

      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          variant="outline"
          size="lg"
          onClick={resetTimer}
          className="bg-[#F7F7F7] dark:bg-[#3C4A5E] border-[#D8BFD8]/50 text-[#6B7280] hover:bg-[#D8BFD8]/20 rounded-full p-6"
        >
          <RefreshCw className="h-6 w-6" />
        </Button>
      </motion.div>
    </div>
  );
}