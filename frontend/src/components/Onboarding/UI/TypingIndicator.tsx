// import React from 'react';
// import { Tone } from '../types/onboarding';
// // import { getToneStyles } from '../utils/onboardingUtils';

// interface TypingIndicatorProps {
//   tone: Tone | null | string;
// }

// const TypingIndicator: React.FC<TypingIndicatorProps> = ({ tone }) => {
//   // const toneStyles = getToneStyles(tone);
//   const dotColor =  'text-purple-600';
  
//   return (
//     <div className="flex items-center space-x-1 ml-4 mb-4">
//       <div className={`w-2.5 h-2.5 rounded-full ${dotColor} animate-bounce`} style={{ animationDelay: '0ms' }} />
//       <div className={`w-2.5 h-2.5 rounded-full ${dotColor} animate-bounce`} style={{ animationDelay: '200ms' }} />
//       <div className={`w-2.5 h-2.5 rounded-full ${dotColor} animate-bounce`} style={{ animationDelay: '400ms' }} />
//     </div>
//   );
// };

// export default TypingIndicator; 
import React from 'react';
import { Tone } from '../types/onboarding';
// import { getToneStyles } from '../utils/onboardingUtils';

interface TypingIndicatorProps {
}

const TypingIndicator: React.FC<TypingIndicatorProps> = () => {
  
  return (
    <div className="mr-auto mb-4 bg-white p-4 rounded-2xl border shadow-sm max-w-[80%]">
      <div className="flex space-x-2">
        <div className={`w-2 h-2 rounded-full bg-gradient-to-r animate-pulse`} />
        <div className={`w-2 h-2 rounded-full bg-gradient-to-r animate-pulse`} 
             style={{ animationDelay: '300ms' }} />
        <div className={`w-2 h-2 rounded-full bg-gradient-to-r  animate-pulse`}
             style={{ animationDelay: '600ms' }} />
      </div>
    </div>
  );
};

export default TypingIndicator;