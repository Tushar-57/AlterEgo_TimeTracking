import { Button } from '../Calendar_updated/components/ui/button';
import { Play, Pause, Square, RefreshCw } from 'lucide-react';
import { TimerStatus, TimerMode } from './types';

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

  const canReset = currentTime > 0 || Boolean(timerState.activeTimerId) || status !== 'stopped';
  const isStartBlocked = status === 'stopped' && currentMode !== 'stopwatch' && currentTime <= 0;
  const isStopBlocked = status === 'stopped' && !timerState.activeTimerId && currentTime <= 0;

  const startLabel = status === 'running' ? 'Pause' : status === 'paused' ? 'Resume' : 'Start';

  return (
    <div className="flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
      <Button
        variant={status === 'running' ? 'secondary' : 'default'}
        size="lg"
        onClick={toggleTimer}
        className="h-12 w-full px-8 text-base font-semibold sm:w-auto"
        disabled={isStartBlocked}
        title={status === 'running' ? 'Pause timer' : status === 'paused' ? 'Resume timer' : 'Start timer'}
      >
        {status === 'running' ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        {startLabel}
      </Button>

      <div className="grid grid-cols-2 gap-3 sm:flex">
        <Button
          variant="outline"
          size="lg"
          onClick={stopTimer}
          className="h-12"
          disabled={isStopBlocked}
          title="Stop and save timer"
        >
          <Square className="h-4 w-4" />
          Stop
        </Button>

        <Button
          variant="ghost"
          size="lg"
          onClick={resetTimer}
          className="h-12"
          disabled={!canReset}
          title={canReset ? 'Reset timer' : 'Start the timer to enable reset'}
        >
          <RefreshCw className="h-4 w-4" />
          Reset
        </Button>
      </div>
    </div>
  );
}
