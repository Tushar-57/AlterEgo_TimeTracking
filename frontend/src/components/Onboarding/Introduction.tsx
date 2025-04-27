import React, { useState } from "react";
import { ChatBubbleProps } from "./types/onboarding"; 

interface StepIntroductionProps {
  handleNext: () => void;
  setChatHistory: React.Dispatch<React.SetStateAction<ChatBubbleProps[]>>;
}

const StepIntroduction: React.FC<StepIntroductionProps> = ({ handleNext, setChatHistory }) => {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const handleReasonSelection = (reason: string) => {
    setSelectedReason(reason);
    setChatHistory(prev => [
      ...prev,
      { type: "user", content: `Selected reason: ${reason}` }
    ]);
    
    // Proceed after short delay
    setTimeout(() => {
      handleNext();
    }, 500);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-60px)] p-6">
      <h1 className="text-3xl font-semibold text-gray-800 mb-8">
        Welcome!
      </h1>
      <p className="text-lg text-gray-600 mb-8 text-center">What brought you here today?</p>
      <div className="grid gap-6 w-full max-w-xl">
        <button
          onClick={() => handleReasonSelection("Boost productivity")}
          className="w-full px-8 py-6 bg-blue-100 text-blue-700 font-semibold rounded-xl shadow-md hover:bg-blue-200 transition-colors duration-200"
        >
          Boost productivity
        </button>
        <button
          onClick={() => handleReasonSelection("Build new skills")}
          className="w-full px-8 py-6 bg-green-100 text-green-700 font-semibold rounded-xl shadow-md hover:bg-green-200 transition-colors duration-200"
        >
          Build new skills
        </button>
        <button
          onClick={() => handleReasonSelection("Manage time better")}
          className="w-full px-8 py-6 bg-yellow-100 text-yellow-700 font-semibold rounded-xl shadow-md hover:bg-yellow-200 transition-colors duration-200"
        >
          Manage time better
        </button>
      </div>
    </div>
  );
};

export default StepIntroduction;