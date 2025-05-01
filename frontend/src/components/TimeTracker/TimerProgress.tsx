// import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
// import 'react-circular-progressbar/dist/styles.css';
// import { motion } from 'framer-motion';

// interface TimerProgressIndicatorProps {
//   progress: number;
//   progressStyle: 'circular' | 'linear';
// }

// export const TimerProgressIndicator = ({ progress, progressStyle }: TimerProgressIndicatorProps) => {
//   const normalizedProgress = Math.min(Math.max(progress * 100, 0), 100);

//   if (progressStyle === 'circular') {
//     return (
//       <motion.div
//         className="w-32 h-32 mt-6"
//         animate={{ scale: [1, 1.05, 1] }}
//         transition={{ duration: 2, repeat: Infinity }}
//       >
//         <CircularProgressbar
//           value={normalizedProgress}
//           text={`${Math.round(normalizedProgress)}%`}
//           styles={buildStyles({
//             pathColor: '#A8D5BA',
//             trailColor: '#F8C8DC',
//             textColor: '#A3BFFA',
//             textSize: '16px',
//             pathTransitionDuration: 0.5,
//           })}
//         />
//       </motion.div>
//     );
//   }

//   return (
//     <motion.div
//       className="w-full max-w-md h-3 bg-[#F8C8DC]/50 rounded-full mt-6 overflow-hidden"
//       animate={{ scaleY: [1, 1.02, 1] }}
//       transition={{ duration: 2, repeat: Infinity }}
//     >
//       <motion.div
//         className="h-full bg-gradient-to-r from-[#A8D5BA] to-[#F8C8DC] rounded-full"
//         initial={{ width: '0%' }}
//         animate={{ width: `${normalizedProgress}%` }}
//         transition={{ duration: 0.3 }}
//       />
//     </motion.div>
//   );
// };
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { motion } from 'framer-motion';

interface TimerProgressIndicatorProps {
  progress: number;
  progressStyle: 'circular' | 'linear';
}

export const TimerProgressIndicator = ({ progress, progressStyle }: TimerProgressIndicatorProps) => {
  const normalizedProgress = Math.min(Math.max(progress * 100, 0), 100);

  if (progressStyle === 'circular') {
    return (
      <motion.div
        className="w-36 h-36 mt-8 relative"
        animate={{ scale: [1, 1.03, 1], boxShadow: '0 0 10px rgba(216, 191, 216, 0.3)' }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <CircularProgressbar
          value={normalizedProgress}
          text={`${Math.round(normalizedProgress)}%`}
          styles={buildStyles({
            pathColor: '#D8BFD8',
            trailColor: '#F7F7F7',
            textColor: '#2D3748',
            textSize: '18px',
            pathTransitionDuration: 0.5,
            backgroundColor: '#E6E6FA',
          })}
          className="dark:text-[#E6E6FA] dark:trail-[#2D3748] dark:path-[#B0C4DE]"
        />
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(216, 191, 216, 0.2), transparent)' }}
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      className="w-full max-w-lg h-4 bg-[#F7F7F7] dark:bg-[#3C4A5E] rounded-full mt-8 overflow-hidden shadow-inner"
      animate={{ scaleY: [1, 1.02, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <motion.div
        className="h-full bg-gradient-to-r from-[#D8BFD8] to-[#B0C4DE] rounded-full"
        initial={{ width: '0%' }}
        animate={{ width: `${normalizedProgress}%` }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
    </motion.div>
  );
};