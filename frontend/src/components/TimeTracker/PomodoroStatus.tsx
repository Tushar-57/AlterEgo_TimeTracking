import { Badge } from '../Calendar_updated/components/ui/badge';
import { Button } from '../Calendar_updated/components/ui/button';
import { CheckCircle, Clock, SkipForward } from 'lucide-react';
import { PomodoroSettings, PomodoroState } from './types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../Calendar_updated/components/ui/tooltip';
import { motion } from 'framer-motion';

export const PomodoroStatus = ({
  pomodoroState,
  preferences,
  timerState,
  skipPomodoroSession,
}: {
  pomodoroState: PomodoroState;
  preferences: { pomodoroSettings: PomodoroSettings };
  timerState: { status: string };
  skipPomodoroSession: () => void;
}) => (
  <div className="w-full max-w-xl rounded-2xl border border-[#D8BFD8]/35 bg-[#F7F7F7] p-4 shadow-sm dark:bg-[#263449] sm:p-5">
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
      <motion.div
        className="rounded-xl bg-white/70 px-3 py-3 text-center dark:bg-[#1f2b3b]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <div className="mb-1 flex items-center justify-center text-xs font-medium text-[#6B7280] dark:text-[#B0C4DE]">
          <Clock className="mr-1 h-3.5 w-3.5" />
          Session
        </div>
        <div className="font-serif text-base font-semibold text-[#2D3748] dark:text-[#E6E6FA]">
          {pomodoroState.currentSession}/{preferences.pomodoroSettings.sessionsUntilLongBreak}
        </div>
      </motion.div>

      <motion.div
        className="rounded-xl bg-white/70 px-3 py-3 text-center dark:bg-[#1f2b3b]"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-[#6B7280] dark:text-[#B0C4DE]">
          Current
        </div>
        <Badge
          variant={pomodoroState.isBreak ? 'secondary' : 'default'}
          className={`px-3 py-1 text-xs font-semibold sm:text-sm ${
            pomodoroState.isBreak
              ? 'bg-[#B0C4DE]/80 text-[#2D3748] dark:text-[#E6E6FA]'
              : 'bg-[#D8BFD8]/80 text-[#2D3748] dark:text-[#E6E6FA]'
          }`}
        >
          {pomodoroState.isBreak ? 'Break' : 'Work'}
        </Badge>
      </motion.div>

      <motion.div
        className="col-span-2 rounded-xl bg-white/70 px-3 py-3 text-center dark:bg-[#1f2b3b] sm:col-span-1"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: 'easeOut' }}
      >
        <div className="mb-1 flex items-center justify-center text-xs font-medium text-[#6B7280] dark:text-[#B0C4DE]">
          <CheckCircle className="mr-1 h-3.5 w-3.5" />
          Completed
        </div>
        <div className="font-serif text-base font-semibold text-[#2D3748] dark:text-[#E6E6FA]">{pomodoroState.totalSessions}</div>
      </motion.div>
    </div>

    {timerState.status === 'running' && (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div className="mt-3" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={skipPomodoroSession}
                className="w-full rounded-xl border-[#D8BFD8]/50 bg-white/80 text-[#4B5563] hover:bg-[#D8BFD8]/20 dark:bg-[#1f2b3b] dark:text-[#B0C4DE]"
              >
                <SkipForward className="mr-2 h-4 w-4" />
                Skip {pomodoroState.isBreak ? 'Break' : 'Session'}
              </Button>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent className="bg-[#F7F7F7] text-[#2D3748] dark:bg-[#3C4A5E] dark:text-[#E6E6FA] border-[#D8BFD8]/50 shadow-sm">
            Skip current {pomodoroState.isBreak ? 'break' : 'work session'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )}
  </div>
);