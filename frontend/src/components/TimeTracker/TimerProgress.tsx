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


import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

interface TimerProgressIndicatorProps {
  progress: number;
  progressStyle: 'circular' | 'linear';
}

export const TimerProgressIndicator = ({ progress, progressStyle }: TimerProgressIndicatorProps) => {
  const normalizedProgress = Math.min(Math.max(progress * 100, 0), 100);

  if (progressStyle === 'circular') {
    return (
      <div className="w-24 h-24 mt-4">
        <CircularProgressbar
          value={normalizedProgress}
          styles={buildStyles({
            pathColor: '#A8D5BA',
            trailColor: '#F8C8DC',
            textColor: '#A3BFFA',
          })}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-xs h-2 bg-[#F8C8DC]/50 rounded-full mt-4">
      <div
        className="h-full bg-[#A8D5BA] rounded-full transition-all duration-300"
        style={{ width: `${normalizedProgress}%` }}
      />
    </div>
  );
};