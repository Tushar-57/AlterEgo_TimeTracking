import { Button } from '../Calendar_updated/components/ui/button';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '../Calendar_updated/components/ui/tooltip';
import { Play, Pause, Save, RotateCcw } from 'lucide-react';
import { TimerStatus, TimerMode } from './types';
import { formatTime } from './utility';

export const TimerControls = ({
  timerState,
  toggleTimer,
  stopTimer,
  resetTimer,
}: {
  timerState: { status: TimerStatus; time: number };
  toggleTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
}) => (
  <div className="flex justify-center gap-4">
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={resetTimer}
            disabled={timerState.status === 'running'}
            className="rounded-full h-12 w-12 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            <RotateCcw className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Reset timer (R)</TooltipContent>
      </Tooltip>
    </TooltipProvider>

    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
        <Button
          onClick={toggleTimer}
          className={`rounded-full h-14 w-14 flex items-center justify-center shadow-lg hover:shadow-xl transition-transform ${
            timerState.status === 'running' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
          } active:scale-95`}
        >
          {timerState.status === 'running' ? (
            <Pause className="h-8 w-8 text-white" />
          ) : (
            <Play className="h-8 w-8 ml-1 text-white" />
          )}
        </Button>
        </TooltipTrigger>
        <TooltipContent>
          {timerState.status === 'running' ? 'Pause timer (Space)' : 'Start timer (Space)'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>

    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          onClick={stopTimer}
          disabled={timerState.status === 'stopped' || timerState.time < 60}
          className="rounded-full h-12 w-12 bg-green-100 hover:bg-green-200 dark:bg-green-800 dark:hover:bg-green-700"
        >
          <Save className="h-5 w-5 text-green-700 dark:text-green-300" />
        </Button>
        </TooltipTrigger>
        <TooltipContent>Stop and save (S)</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
);