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

  const canReset = status === 'paused' && currentTime > 0;

  const startButtonStyles =
    status === 'running'
      ? 'bg-gradient-to-br from-[#0EA5A4] to-[#14B8A6] text-white hover:from-[#0B8B89] hover:to-[#0EA5A4] shadow-[0_10px_24px_rgba(20,184,166,0.35)]'
      : status === 'paused'
      ? 'bg-gradient-to-br from-[#2563EB] to-[#4F46E5] text-white hover:from-[#1D4ED8] hover:to-[#4338CA] shadow-[0_10px_24px_rgba(79,70,229,0.35)]'
      : 'bg-gradient-to-br from-[#D97706] to-[#EF4444] text-white hover:from-[#B45309] hover:to-[#DC2626] shadow-[0_10px_24px_rgba(239,68,68,0.35)]';

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={status === 'stopped' ? { scale: [1, 1.03, 1], boxShadow: ['0 0 0 rgba(0,0,0,0)', '0 0 0 10px rgba(239,68,68,0.15)', '0 0 0 rgba(0,0,0,0)'] } : undefined}
        transition={status === 'stopped' ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } : undefined}
      >
        <Button
          variant="default"
          size="lg"
          onClick={toggleTimer}
          className={`rounded-full p-4 sm:p-6 ${startButtonStyles}`}
          disabled={currentTime === 0 && currentMode !== 'stopwatch'}
          title={status === 'running' ? 'Pause timer' : status === 'paused' ? 'Resume timer' : 'Start timer'}
        >
          {status === 'running' ? (
            <Pause className="h-5 w-5 sm:h-6 sm:w-6" />
          ) : (
            <Play className="h-5 w-5 sm:h-6 sm:w-6" />
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
          className="bg-[#F7F7F7] dark:bg-[#3C4A5E] border-[#D8BFD8]/50 text-[#6B7280] hover:bg-[#D8BFD8]/20 rounded-full p-4 sm:p-6"
          disabled={status === 'stopped' && !timerState.activeTimerId}
        >
          <Square className="h-5 w-5 sm:h-6 sm:w-6" />
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
          className="bg-[#F7F7F7] dark:bg-[#3C4A5E] border-[#D8BFD8]/50 text-[#6B7280] hover:bg-[#D8BFD8]/20 rounded-full p-4 sm:p-6 disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={!canReset}
          title={canReset ? 'Reset timer' : 'Reset is available only when paused and timer is not 00:00'}
        >
          <RefreshCw className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>
      </motion.div>
    </div>
  );
}