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
  <div className="flex justify-center items-center gap-6 mb-4 bg-[#FAF9F6] dark:bg-[#2D2D2D] rounded-lg p-4 border border-[#F8C8DC]/30">
    <motion.div
      className="text-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-sm text-[#A3BFFA] flex items-center justify-center font-inter">
        <Clock className="h-4 w-4 mr-1" /> Session
      </div>
      <div className="font-medium text-[#1A202C] dark:text-[#E2E8F0]">
        {pomodoroState.currentSession}/{preferences.pomodoroSettings.sessionsUntilLongBreak}
      </div>
    </motion.div>

    <Badge
      variant={pomodoroState.isBreak ? 'secondary' : 'default'}
      className={`px-3 py-1 font-inter ${
        pomodoroState.isBreak
          ? 'bg-[#D6BCFA]/80 text-[#1A202C] dark:text-[#E2E8F0] shadow-sm'
          : 'bg-[#A8D5BA]/80 text-[#1A202C] dark:text-[#E2E8F0] shadow-sm'
      }`}
    >
      {pomodoroState.isBreak ? 'Break' : 'Work'}
    </Badge>

    <motion.div
      className="text-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <div className="text-sm text-[#A3BFFA] flex items-center justify-center font-inter">
        <CheckCircle className="h-4 w-4 mr-1" /> Completed
      </div>
      <div className="font-medium text-[#1A202C] dark:text-[#E2E8F0]">{pomodoroState.totalSessions}</div>
    </motion.div>

    {timerState.status === 'running' && (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={skipPomodoroSession}
              className="flex items-center mx-auto border-[#F8C8DC]/50 text-[#A3BFFA] hover:bg-[#F8C8DC]/20 transition-all"
            >
              <SkipForward className="h-4 w-4 mr-1" />
              Skip {pomodoroState.isBreak ? 'Break' : 'Session'}
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-[#FAF9F6] text-[#1A202C] dark:bg-[#3A3A3A] dark:text-[#E2E8F0] border-[#F8C8DC]/50">
            Skip current {pomodoroState.isBreak ? 'break' : 'work session'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )}
  </div>
);