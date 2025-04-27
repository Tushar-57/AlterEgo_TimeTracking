import React from "react";
import { Goal } from "./types/onboarding";

interface CoachWelcomeProps {
  goal: Goal;
  nextStep: () => void;
}

const CoachWelcome: React.FC<CoachWelcomeProps> = ({ goal, nextStep }) => {
  const userName = "User"; // Hardcoded name
  const userRole = "Your Role"; // Hardcoded role

  const personalizedMessage = `Hello ${userName}, I'm your AI growth coach, and I'm excited to help you on your journey as ${userRole}! I understand your goal is to ${goal.title}. We will work together to define your strategy, track your progress, and celebrate your achievements.`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-6 w-full max-w-2xl">
        Welcome, {userName}!
      </h1>
      <p className="text-center text-gray-600 mb-6 w-full max-w-2xl">
        {personalizedMessage}
      </p>
      <div className="bg-white shadow-md rounded-lg p-4 mb-6 w-full max-w-md">
        <p className="text-gray-700 font-semibold mb-2">Your goal:</p>
        <p className="text-blue-600">{goal.title}</p>
        {/* <p className="text-blue-600">{goal.description}</p> */}
      </div>
      {/*<div className="bg-white shadow-md rounded-lg p-4 mb-6 w-full max-w-md">
        <p className="text-gray-700 font-semibold mb-2">
          Your first suggested action:
        </p>
        <p className="text-blue-600">{}</p>
      </div>*/}
      <button
        onClick={nextStep}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full transition duration-300 ease-in-out"
      > 
        Enter the Chat
      </button>
    </div>
  );
};

export default CoachWelcome;