import { Button } from '../Calendar_updated/components/ui/button';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '../Calendar_updated/components/ui/tooltip';
import { Play, Pause, Save, RotateCcw } from 'lucide-react';
import { TimerStatus } from './types';
import { motion } from 'framer-motion';

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
  <div className="flex justify-center gap-6 bg-[#FAF9F6] dark:bg-[#2D2D2D] rounded-lg p-4 border border-[#F8C8DC]/30">
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={resetTimer}
            disabled={timerState.status === 'running'}
            className="rounded-full h-12 w-12 bg-[#F5F5F4] dark:bg-[#3A3A3A] border-[#F8C8DC]/50 text-[#A3BFFA] hover:bg-[#F8C8DC]/20 transition-all"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="bg-[#FAF9F6] text-[#1A202C] dark:bg-[#3A3A3A] dark:text-[#E2E8F0] border-[#F8C8DC]/50">Reset timer (R)</TooltipContent>
      </Tooltip>
    </TooltipProvider>

    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            animate={{
              scale: timerState.status === 'running' ? [1, 1.1, 1] : 1,
              boxShadow:
                timerState.status === 'running'
                  ? ['0 0 10px rgba(248, 200, 220, 0.5)', '0 0 20px rgba(248, 200, 220, 0.7)', '0 0 10px rgba(248, 200, 220, 0.5)']
                  : 'none',
            }}
            transition={{ duration: 1.5, repeat: timerState.status === 'running' ? Infinity : 0 }}
          >
            <Button
              onClick={toggleTimer}
              className={`rounded-full h-14 w-14 flex items-center justify-center shadow-md hover:shadow-lg transition-transform ${
                timerState.status === 'running'
                  ? 'bg-[#FF6B6B]/80 hover:bg-[#FF6B6B]'
                  : 'bg-[#A8D5BA]/80 hover:bg-[#A8D5BA]'
              } active:scale-95`}
            >
              {timerState.status === 'running' ? (
                <Pause className="h-8 w-8 text-white" />
              ) : (
                <Play className="h-8 w-8 ml-1 text-white" />
              )}
            </Button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent className="bg-[#FAF9F6] text-[#1A202C] dark:bg-[#3A3A3A] dark:text-[#E2E8F0] border-[#F8C8DC]/50">
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
            className="rounded-full h-12 w-12 bg-[#F5F5F4] dark:bg-[#3A3A3A] border-[#F8C8DC]/50 text-[#A3BFFA] hover:bg-[#F8C8DC]/20 transition-all"
          >
            <Save className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="bg-[#FAF9F6] text-[#1A202C] dark:bg-[#3A3A3A] dark:text-[#E2E8F0] border-[#F8C8DC]/50">Stop and save (S)</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
);