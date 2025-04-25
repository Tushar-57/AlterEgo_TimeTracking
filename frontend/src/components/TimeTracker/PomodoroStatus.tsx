// import { Badge } from '../Calendar_updated/components/ui/badge';
// import { Button } from '../Calendar_updated/components/ui/button';
// import { CheckCircle, Clock, SkipForward } from 'lucide-react';
// import { PomodoroSettings, PomodoroState } from './types';
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../Calendar_updated/components/ui/tooltip';

// export const PomodoroStatus = ({
//   pomodoroState,
//   preferences,
//   timerState,
//   skipPomodoroSession,
// }: {
//   pomodoroState: PomodoroState;
//   preferences: { pomodoroSettings: PomodoroSettings };
//   timerState: { status: string };
//   skipPomodoroSession: () => void;
// }) => (
//   <div className="flex justify-center items-center gap-4 mb-4">
//     <div className="text-center">
//       <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center">
//         <Clock className="h-4 w-4 mr-1" /> Session
//       </div>
//       <div className="font-medium">
//         {pomodoroState.currentSession}/{preferences.pomodoroSettings.sessionsUntilLongBreak}
//       </div>
//     </div>
    
//     <Badge
//       variant={pomodoroState.isBreak ? 'secondary' : 'default'}
//       className={`px-3 py-1 ${pomodoroState.isBreak ? 'bg-blue-500' : 'bg-green-500'}`}
//     >
//       {pomodoroState.isBreak ? 'Break' : 'Work'}
//     </Badge>

//     <div className="text-center">
//       <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center">
//         <CheckCircle className="h-4 w-4 mr-1" /> Completed
//       </div>
//       <div className="font-medium">{pomodoroState.totalSessions}</div>
//     </div>

//     {timerState.status === 'running' && (
//       <TooltipProvider>
//       <Tooltip>
//         <TooltipTrigger asChild>
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={skipPomodoroSession}
//             className="flex items-center mx-auto"
//           >
//             <SkipForward className="h-4 w-4 mr-1" />
//             Skip {pomodoroState.isBreak ? 'Break' : 'Session'}
//           </Button>
//         </TooltipTrigger>
//         <TooltipContent>Skip current {pomodoroState.isBreak ? 'break' : 'work session'}</TooltipContent>
//       </Tooltip>
//     </TooltipProvider>
//     )}
//   </div>
// );
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
  <div className="flex justify-center items-center gap-6 mb-4 bg-gray-800/50 rounded-lg p-4 border border-cyan-500/30">
    <motion.div
      className="text-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-sm text-cyan-400 flex items-center justify-center font-orbitron">
        <Clock className="h-4 w-4 mr-1" /> Session
      </div>
      <div className="font-medium text-white">
        {pomodoroState.currentSession}/{preferences.pomodoroSettings.sessionsUntilLongBreak}
      </div>
    </motion.div>

    <Badge
      variant={pomodoroState.isBreak ? 'secondary' : 'default'}
      className={`px-3 py-1 ${
        pomodoroState.isBreak
          ? 'bg-blue-500/80 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]'
          : 'bg-green-500/80 text-white shadow-[0_0_10px_rgba(34,197,94,0.5)]'
      } font-orbitron`}
    >
      {pomodoroState.isBreak ? 'Break' : 'Work'}
    </Badge>

    <motion.div
      className="text-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <div className="text-sm text-cyan-400 flex items-center justify-center font-orbitron">
        <CheckCircle className="h-4 w-4 mr-1" /> Completed
      </div>
      <div className="font-medium text-white">{pomodoroState.totalSessions}</div>
    </motion.div>

    {timerState.status === 'running' && (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={skipPomodoroSession}
              className="flex items-center mx-auto border-cyan-500 text-cyan-400 hover:bg-cyan-500/20 hover:shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all"
            >
              <SkipForward className="h-4 w-4 mr-1" />
              Skip {pomodoroState.isBreak ? 'Break' : 'Session'}
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-gray-800 text-cyan-400 border-cyan-500/50">
            Skip current {pomodoroState.isBreak ? 'break' : 'work session'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )}
  </div>
);