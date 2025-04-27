import React, { useState } from 'react';
import { Speaker, Smile, MessageCircle } from 'lucide-react';
import { Button } from './OnboardingFlow'
import { ChatBubbleProps } from './types/onboarding'

interface StepToneProps {
  handleNext: () => void
  preferredTone: string
  setPreferredTone: React.Dispatch<React.SetStateAction<string>>
  setChatHistory: React.Dispatch<React.SetStateAction<ChatBubbleProps[]>>
}

const StepTone: React.FC<StepToneProps> = ({ handleNext, preferredTone, setPreferredTone, setChatHistory }) => {
  const [selectedTone, setSelectedTone] = useState<string>('');

  const handleToneSelection = (tone: string) => {
    setSelectedTone(tone);
  };

  const handleNextButton = () => {
    setPreferredTone(selectedTone);
    setChatHistory((prevChatHistory) => [
      ...prevChatHistory,
      {
        text: `My preferred coach tone is: ${selectedTone}`,
        sender: 'user',
      },
    ])
    handleNext();
  };

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
        What style do you prefer for your coach? Select one of the following:
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div onClick={() => handleToneSelection('Bold')}
          className={
            'bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer ' + (selectedTone === 'Bold' ? 'border-blue-500' : '')
          }>
          <div className='flex items-center justify-center mb-4'>
            <Speaker
              className={`w-10 h-10 ${selectedTone === 'Bold' ? 'text-blue-600' : 'text-gray-600'}`}
            />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 text-center">Bold</h3>
          <p className="text-gray-600 text-center mt-2">
            Direct and assertive.
          </p>
        </div>
        <div onClick={() => handleToneSelection('Calm')}
          className={
            'bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer ' + (selectedTone === 'Calm' ? 'border-blue-500' : '')
          }>          <div className='flex items-center justify-center mb-4'>
            <MessageCircle
              className={`w-10 h-10 ${selectedTone === 'Calm' ? 'text-blue-600' : 'text-gray-600'}`}
            />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 text-center">Calm</h3>
          <p className="text-gray-600 text-center mt-2">
            Relaxed and supportive.
          </p>
        </div>
        <div
          onClick={() => handleToneSelection('Playful')}
          className={`bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer ${
            selectedTone === 'Playful' ? 'border-blue-500' : ''
          }`}
        >
          <div className='flex items-center justify-center mb-4'>
            <Smile
              className={`w-10 h-10 ${selectedTone === 'Playful' ? 'text-blue-600' : 'text-gray-600'}`}
            />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 text-center">Playful</h3>
          <p className="text-gray-600 text-center mt-2">
            Fun and lighthearted.
          </p>
        </div>
      </div>
      {selectedTone && (
        <div className="flex justify-center">
          <Button label="Next" onPress={handleNextButton} />
        </div>
      )}
    </div>
  );
}
export default StepTone;