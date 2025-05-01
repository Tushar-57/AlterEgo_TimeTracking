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
  <div className="flex justify-center items-center gap-8 bg-[#F7F7F7] dark:bg-[#2D3748] rounded-2xl p-6 border border-[#D8BFD8]/30 shadow-sm">
    <motion.div
      className="text-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="text-sm text-[#6B7280] dark:text-[#B0C4DE] flex items-center justify-center font-serif">
        <Clock className="h-4 w-4 mr-1" /> Session
      </div>
      <div className="font-medium text-[#2D3748] dark:text-[#E6E6FA] font-serif">
        {pomodoroState.currentSession}/{preferences.pomodoroSettings.sessionsUntilLongBreak}
      </div>
    </motion.div>

    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Badge
        variant={pomodoroState.isBreak ? 'secondary' : 'default'}
        className={`px-4 py-1 font-serif text-sm ${
          pomodoroState.isBreak
            ? 'bg-[#B0C4DE]/80 text-[#2D3748] dark:text-[#E6E6FA] shadow-sm'
            : 'bg-[#D8BFD8]/80 text-[#2D3748] dark:text-[#E6E6FA] shadow-sm'
        }`}
      >
        {pomodoroState.isBreak ? 'Break' : 'Work'}
      </Badge>
    </motion.div>

    <motion.div
      className="text-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
    >
      <div className="text-sm text-[#6B7280] dark:text-[#B0C4DE] flex items-center justify-center font-serif">
        <CheckCircle className="h-4 w-4 mr-1" /> Completed
      </div>
      <div className="font-medium text-[#2D3748] dark:text-[#E6E6FA] font-serif">{pomodoroState.totalSessions}</div>
    </motion.div>

    {timerState.status === 'running' && (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={skipPomodoroSession}
                className="flex items-center mx-auto bg-[#F7F7F7] dark:bg-[#3C4A5E] border-[#D8BFD8]/50 text-[#B0C4DE] hover:bg-[#D8BFD8]/20 rounded-xl shadow-sm"
              >
                <SkipForward className="h-4 w-4 mr-2" />
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