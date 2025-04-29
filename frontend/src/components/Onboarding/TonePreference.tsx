import React from 'react';
import { Zap, Leaf, Sparkles } from 'lucide-react';
import { Tone } from './types/onboarding';
import { TONES } from './types/onboarding';
import { getToneStyles } from './utils/onboardingUtils';

interface StepToneProps {
  selectedTone: Tone | null;
  onSelect: (tone: Tone) => void;
  onSubmit: () => void;
}

const StepTone: React.FC<StepToneProps> = ({
  selectedTone,
  onSelect,
  onSubmit
}) => {
  const toneStyles = getToneStyles(selectedTone);
  const buttonColor = selectedTone ? toneStyles.buttonColor : 'bg-purple-600 hover:bg-purple-700';
  
  // Define tone details with icons and descriptions
  const toneDetails = {
    Bold: {
      icon: <Zap className="h-8 w-8 mb-3 text-indigo-600" />,
      description: 'Direct, motivating, results-focused',
      color: 'border-indigo-600 bg-indigo-50'
    },
    Calm: {
      icon: <Leaf className="h-8 w-8 mb-3 text-teal-600" />,
      description: 'Patient, mindful, supportive',
      color: 'border-teal-600 bg-teal-50'
    },
    Playful: {
      icon: <Sparkles className="h-8 w-8 mb-3 text-amber-600" />,
      description: 'Fun, creative, encouraging',
      color: 'border-amber-600 bg-amber-50'
    }
  };

  return (
    <div className="w-full animate-fadeIn">
      <p className="text-gray-600 mb-4">
        What coaching style do you prefer?
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {TONES.map(tone => {
          const isSelected = selectedTone === tone;
          const details = toneDetails[tone];
          
          return (
            <button
              key={tone}
              onClick={() => onSelect(tone)}
              className={`
                p-6 rounded-xl border-2 transition-all duration-300
                ${isSelected 
                  ? details.color
                  : 'border-gray-200 bg-white'} 
                flex flex-col items-center text-center
                hover:shadow-md focus:outline-none
                ${isSelected ? 'transform scale-105' : ''}
              `}
            >
              {details.icon}
              <h3 className="text-lg font-medium mb-2">{tone}</h3>
              <p className="text-sm text-gray-600">{details.description}</p>
            </button>
          );
        })}
      </div>
      
      <button
        onClick={onSubmit}
        disabled={!selectedTone}
        className={`
          ${buttonColor} text-white px-6 py-2 rounded-lg
          transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
          hover:shadow-md
        `}
      >
        Continue
      </button>
    </div>
  );
};

export default StepTone;