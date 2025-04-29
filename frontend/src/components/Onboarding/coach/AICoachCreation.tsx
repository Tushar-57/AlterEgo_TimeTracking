import React, { useState, useEffect } from 'react';

export interface AICoachCreationProps {
  nextStep: () => void;
}
 
const AICoachCreation: React.FC<AICoachCreationProps> = ({ nextStep }) => {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Analyzing your preferences');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        const newProgress = prevProgress + 10;
        if (newProgress >= 100) {
          
          return 100;
        }
        return newProgress;
      });
    }, 500);

    const messageTimeout = setTimeout(() => {
        setMessage('Gathering your information');
        setTimeout(() => {
          setMessage('Creating a unique personality');
          setTimeout(() => {
            setMessage('Defining key strategies');
            setTimeout(() => {
              setMessage('Final adjustments');
            }, 1000);
          }, 1000);
        }, 1000);
      }, 0)

    const nextStepTimeout = setTimeout(() => {
        nextStep()
    }, 6000)

    return () => {
      clearInterval(interval)
      clearTimeout(messageTimeout)
      return;
    };}, [progress]);

  return isLoading && (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Crafting your personal growth coach...</h1>
      <div className="w-64 h-64 rounded-full border-8 border-dashed border-blue-500 animate-spin mb-8"></div>
      <div className="w-full max-w-md bg-white rounded-full overflow-hidden">
        <div
          className="bg-blue-500 h-4"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  );
};

export default AICoachCreation;