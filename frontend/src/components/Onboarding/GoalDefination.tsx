import React, { useState, ChangeEvent, KeyboardEvent, useEffect } from "react";
import { ChatBubbleProps } from "./types/onboarding";

interface StepGoalsProps {
  handleNext: () => void;
  userGoals: string[];
  handleBack:() => void;
  setUserGoals: React.Dispatch<React.SetStateAction<string[]>>;
  setChatHistory: React.Dispatch<React.SetStateAction<ChatBubbleProps[]>>;
}

const StepGoals: React.FC<StepGoalsProps> = ({ handleNext, handleBack, userGoals, setUserGoals, setChatHistory }) => {
  const [newGoal, setNewGoal] = useState<string>("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>(userGoals);

  const suggestedGoals = [
    "public speaking",
    "launching a startup",
    "getting promoted",
    "writing a book",
    "reading more books",
    "getting in shape"
  ];

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNewGoal(event.target.value);
  };

  const handleGoalSelection = (goal: string) => {
    setSelectedGoals((prevGoals) =>
      prevGoals.includes(goal) ? prevGoals.filter((g) => g !== goal) : [...prevGoals, goal]
    );
  };

  const handleAddGoal = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && newGoal.trim() !== "") {
      setSelectedGoals((prevGoals) => [...prevGoals, newGoal.trim()]);
      setNewGoal("");
    }
  };

  // const goToNextStep = () => {
  //   setUserGoals(selectedGoals);
  //   const chatMessage = {
  //     type: "bot",

  //     message: `Your selected goals are: ${selectedGoals.join(", ")}`,
  //   };
  //   setChatHistory((prevChat) => [...prevChat, chatMessage]);
  //   handleNext();
  // };

  const isGoalSelected = (goal: string) => {
    return selectedGoals.includes(goal);
  };


  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4 text-center">What are your goals?</h2>
        <div className="mb-4">
          <div className="flex flex-col gap-2">
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              type="text"
              placeholder="Enter your own goal (press Enter to add)"
              value={newGoal}
              onChange={handleInputChange}
              onKeyDown={handleAddGoal}
            />
          </div>
        </div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Suggested Goals</h3>
          <div className="flex flex-wrap gap-2">
            {suggestedGoals.map((goal, index) => (
              <button
                onClick={() => handleGoalSelection(goal)}
                key={index}
                className={`
                  ${
                    isGoalSelected(goal)
                      ? "bg-blue-500 hover:bg-blue-700 text-white"
                      : "bg-blue-100 hover:bg-blue-200 text-blue-700"
                  }
                  font-medium py-1 px-3 rounded-full transition-colors
                `}
              >
                {goal}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end mt-6">
        <button
          className="bg-gray-500 hover:bg-gray-700..."
          onClick={handleBack} // Use passed handleBack
        > 
          Back
        </button>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={handleNext}
          > 
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepGoals;