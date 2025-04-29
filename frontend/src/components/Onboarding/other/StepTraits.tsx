import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { Trait, Tone } from '../../../types/onboarding';
import { TRAITS } from '../../../constants/onboarding';
import { getToneStyles } from '../../../utils/onboardingUtils';

interface StepTraitsProps {
  selectedTraits: Trait[];
  onSelect: (traits: Trait[]) => void;
  onSubmit: () => void;
  tone: Tone | null;
}

const StepTraits: React.FC<StepTraitsProps> = ({
  selectedTraits,
  onSelect,
  onSubmit,
  tone
}) => {
  const toneStyles = getToneStyles(tone);
  const buttonColor = tone ? toneStyles.buttonColor : 'bg-purple-600 hover:bg-purple-700';
  const accentColor = tone ? toneStyles.accentColor : 'border-purple-600';
  const textColor = tone ? toneStyles.textColor : 'text-purple-600';
  
  const handleTraitToggle = (trait: Trait) => {
    const updatedTraits = selectedTraits.includes(trait)
      ? selectedTraits.filter(t => t !== trait)
      : [...selectedTraits, trait];
    
    onSelect(updatedTraits);
  };

  return (
    <div className="w-full animate-fadeIn">
      <p className="text-gray-600 mb-4">
        Select traits you'd like your AI coach to help you develop:
      </p>
      
      <div className="flex flex-wrap gap-3 mb-6">
        {TRAITS.map(trait => {
          const isSelected = selectedTraits.includes(trait);
          
          return (
            <button
              key={trait}
              onClick={() => handleTraitToggle(trait)}
              className={`
                px-4 py-2 rounded-full border-2 transition-all duration-300
                ${isSelected 
                  ? `${accentColor} ${textColor} bg-white` 
                  : 'border-gray-200 bg-gray-50 text-gray-600'}
                flex items-center gap-2 hover:shadow-sm
              `}
            >
              {isSelected && <Check className="h-4 w-4" />}
              {trait}
            </button>
          );
        })}
      </div>
      
      <button
        onClick={onSubmit}
        disabled={selectedTraits.length === 0}
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

export default StepTraits;