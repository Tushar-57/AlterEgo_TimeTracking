// import { motion } from 'framer-motion';
// import 'react-circular-progressbar/dist/styles.css';
// import { CircularProgressbar } from 'react-circular-progressbar';
// import { useEffect } from 'react';
// import { toast } from '../Calendar_updated/components/hooks/use-toast';

// export const TimerProgressIndicator = ({
//   progress,
//   isCircular,
// }: {
//   progress: number;
//   isCircular?: boolean;
// }) => {
//   const percentage = Math.round(progress * 100);
//   useEffect(() => {
//     if ([0.25, 0.5, 0.75].includes(Math.round(progress * 100) / 100)) {
//       toast({
//         title: `Progress Milestone`,
//         description: `You've reached ${Math.round(progress * 100)}% of your timer!`,
//       });
//     }
//   }, [progress]);

//   return isCircular ? (
//     <div className="w-24 h-24">
//       <CircularProgressbar value={percentage} text={`${percentage}%`} />
//     </div>
//   ) : (
//     <div className="relative h-8 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-4">
//       <motion.div
//         className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center"
//         initial={{ width: '0%' }}
//         animate={{
//           width: `${percentage}%`,
//           scale: 1,
//         }}
//         transition={{
//           width: { duration: 0.5 },
//           scale: { duration: 0 },
//         }}
//       >
//         <span className="text-white text-xs font-bold">{percentage}%</span>
//       </motion.div>
//     </div>
//   );
// };


import { motion } from 'framer-motion';
import 'react-circular-progressbar/dist/styles.css';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { useEffect } from 'react';
import { toast } from '../Calendar_updated/components/hooks/use-toast';

export const TimerProgressIndicator = ({
  progress,
  isCircular,
}: {
  progress: number;
  isCircular?: boolean;
}) => {
  const percentage = Math.round(progress * 100);
  useEffect(() => {
    if ([0.25, 0.5, 0.75].includes(Math.round(progress * 100) / 100)) {
      toast({
        title: `Progress Milestone`,
        description: `You've reached ${Math.round(progress * 100)}% of your timer!`,
        className: 'bg-gray-800 text-cyan-400 border-cyan-500/50',
      });
    }
  }, [progress]);

  return isCircular ? (
    <motion.div
      className="w-24 h-24 relative"
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 1, repeat: percentage % 25 === 0 ? 1 : 0 }}
    >
      <CircularProgressbar
        value={percentage}
        text={`${percentage}%`}
        styles={buildStyles({
          pathColor: '#22d3ee',
          textColor: '#22d3ee',
          trailColor: '#1e293b',
          textSize: '16px',
          pathTransitionDuration: 0.5,
        })}
      />
      <div className="absolute inset-0 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.7)]"></div>
    </motion.div>
  ) : (
    <div className="relative h-8 w-full bg-gray-800 rounded-full overflow-hidden mt-4 border border-cyan-500/30">
      <motion.div
        className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-indigo-600 flex items-center justify-center shadow-[0_0_10px_rgba(34,211,238,0.5)]"
        initial={{ width: '0%' }}
        animate={{
          width: `${percentage}%`,
          scale: 1,
        }}
        transition={{
          width: { duration: 0.5 },
          scale: { duration: 0 },
        }}
      >
        <span className="text-white text-xs font-bold font-orbitron">{percentage}%</span>
      </motion.div>
    </div>
  );
};