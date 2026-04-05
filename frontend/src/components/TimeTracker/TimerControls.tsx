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

  const canReset = status !== 'running' && (currentTime > 0 || Boolean(timerState.activeTimerId));
  const isStartBlocked = status === 'stopped' && currentMode !== 'stopwatch' && currentTime <= 0;
  const isStopBlocked = status === 'stopped' && !timerState.activeTimerId && currentTime <= 0;

  const startLabel =
    status === 'running' ? 'Pause' : status === 'paused' ? 'Resume' : 'Start';

  const startButtonStyles =
    status === 'running'
      ? 'bg-gradient-to-br from-[#0EA5A4] to-[#14B8A6] text-white hover:from-[#0B8B89] hover:to-[#0EA5A4] shadow-[0_10px_24px_rgba(20,184,166,0.35)]'
      : status === 'paused'
      ? 'bg-gradient-to-br from-[#2563EB] to-[#4F46E5] text-white hover:from-[#1D4ED8] hover:to-[#4338CA] shadow-[0_10px_24px_rgba(79,70,229,0.35)]'
      : 'bg-gradient-to-br from-[#D97706] to-[#EF4444] text-white hover:from-[#B45309] hover:to-[#DC2626] shadow-[0_10px_24px_rgba(239,68,68,0.35)]';

  return (
    <div className="w-full max-w-xl space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-4">
      <motion.div
        className="w-full sm:w-auto"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.95 }}
        animate={status === 'stopped' ? { scale: [1, 1.03, 1], boxShadow: ['0 0 0 rgba(0,0,0,0)', '0 0 0 10px rgba(239,68,68,0.15)', '0 0 0 rgba(0,0,0,0)'] } : undefined}
        transition={status === 'stopped' ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } : undefined}
      >
        <Button
          variant="default"
          size="lg"
          onClick={toggleTimer}
          className={`h-14 w-full rounded-2xl px-6 text-base font-semibold sm:h-auto sm:w-auto sm:rounded-full sm:p-6 ${startButtonStyles}`}
          disabled={isStartBlocked}
          title={status === 'running' ? 'Pause timer' : status === 'paused' ? 'Resume timer' : 'Start timer'}
        >
          <span className="mr-2 inline-flex items-center">
            {status === 'running' ? (
              <Pause className="h-5 w-5 sm:h-6 sm:w-6" />
            ) : (
              <Play className="h-5 w-5 sm:h-6 sm:w-6" />
            )}
          </span>
          {startLabel}
        </Button>
      </motion.div>

      <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:flex sm:gap-4">
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            size="lg"
            onClick={stopTimer}
            className="h-12 w-full rounded-2xl border-[#D8BFD8]/50 bg-[#F7F7F7] px-4 text-sm font-semibold text-[#6B7280] hover:bg-[#D8BFD8]/20 sm:h-auto sm:w-auto sm:rounded-full sm:p-6 sm:text-base dark:bg-[#3C4A5E]"
            disabled={isStopBlocked}
            title="Stop and save timer"
          >
            <Square className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
            Stop
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            size="lg"
            onClick={resetTimer}
            className="h-12 w-full rounded-2xl border-[#D8BFD8]/50 bg-[#F7F7F7] px-4 text-sm font-semibold text-[#6B7280] hover:bg-[#D8BFD8]/20 disabled:cursor-not-allowed disabled:opacity-40 sm:h-auto sm:w-auto sm:rounded-full sm:p-6 sm:text-base dark:bg-[#3C4A5E]"
            disabled={!canReset}
            title={canReset ? 'Reset timer' : 'Reset is available after pausing or after a completed run'}
          >
            <RefreshCw className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
            Reset
          </Button>
        </motion.div>
      </div>
    </div>
  );
}