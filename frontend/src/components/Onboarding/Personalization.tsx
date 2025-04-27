import React, { useState, useEffect } from 'react';
import { Question, Role, Answer } from './types/onboarding';

interface PersonalizationProps {
  userRole: Role | null
  nextStep: () => void;
  previousStep: () => void
}

const Personalization: React.FC<PersonalizationProps> = ({ userRole, nextStep, previousStep }) => {
  const [currentAnswers, setCurrentAnswers] = useState<Answer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number | null>(0);
  const [questions, setQuestions] = useState<Question[]>([])
  const roleSpecificQuestions: { [key: string]: string[] } = {
    student: [
      "Study reminders",
      "Assignment tracking",
      "Test preparation",
      "Knowledge retention",
    ],
    professional: [
      "Time management",
      "Project organization",
      "Work-life balance",
      "Skill development",
    ],
    freelancer: [
      "Client management",
      "Project scheduling",
      "Income tracking",
      "Skill marketing",
    ],
    other: ["What are your specific needs?", "How do you want to be helped?"],
  };  
  useEffect(() => {
    const getQuestions = (): Question[] => {
      const questionsTexts = userRole 
        ? roleSpecificQuestions[userRole] || []
        : [];
        
      return questionsTexts.map((text) => ({
        text,
        answers: []
      }));
    };
  
    setQuestions(getQuestions());
  }, [userRole]);

  const handleAnswer = (answer: Answer) => {
    setCurrentAnswers((prevAnswers) => [...prevAnswers, answer]);
    setCurrentQuestionIndex((prevIndex) => {
      if (prevIndex === null) return 0;
      return prevIndex + 1;
    });
  };  

  const allQuestionsAnswered: boolean = currentQuestionIndex !== null && currentQuestionIndex >= questions.length && questions.length > 0

  const handleSubmit = () => {
    nextStep();
  }

  const handlePreviousStep = () => {
    previousStep()
  }
  
    useEffect(() => {
      if (allQuestionsAnswered) { handleSubmit(); }
    }, [allQuestionsAnswered])

  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <button onClick={handlePreviousStep} className='absolute top-4 left-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded'>Back</button>
      <h2 className="text-2xl font-bold mb-6">
        {userRole === "student" ? "How would you like this app to support your learning journey?" :
        userRole === "professional" ? "What aspects of work would you like to improve?" :
        userRole === "freelancer" ? "What are your key priorities?" :
        userRole === "other" ? "Please tell us what's your focus?" : "Please select a role."}
      </h2>
      <div className="flex flex-col items-center gap-4">
        {currentQuestionIndex !== null && questions.length > 0 && questions.slice(currentQuestionIndex, currentQuestionIndex + 1).map((question) => (
          <button
            key={question.text}
            onClick={() => handleAnswer({ id: question.text, text: question.text })}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            {question.text}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Personalization;