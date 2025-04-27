import React, { useState } from 'react';
import { ChatBubbleProps } from './types/onboarding';
import { Avatar } from './types/onboarding';
import { AVATARS } from './types/coaching';
import { NameAndAvatarProps } from './types/onboarding';



const StepNameAndAvatar: React.FC<NameAndAvatarProps> = ({
  handleNext,
  coachName,
  setCoachName,
  coachAvatar,
  setCoachAvatar,
  setChatHistory,
}) => {
  const [tempName, setTempName] = useState<string>(coachName);
  const [tempAvatar, setTempAvatar] = useState<string>(coachAvatar);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempName(e.target.value);
  };

  const handleRandomize = () => {
    const randomName = `Coach ${Math.floor(Math.random() * 1000) + 1}`;
    setTempName(randomName);
  };

  const handleAvatarSelection = (avatarSrc: string) => {
    setTempAvatar(avatarSrc);
  };

  const handleNextStep = () => {
    setCoachName(tempName);
    setCoachAvatar(tempAvatar);
    setChatHistory((prev) => [
      ...prev,
      { role: 'user', content: `I chose the name ${tempName} and avatar ${tempAvatar}` },
    ]);
    handleNext();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center">
        <h2 className="text-2xl font-semibold">
          Choose a name and avatar for your coach.
        </h2>
      </div>
      <div className="flex items-center gap-4">
          <input type="text" value={tempName} onChange={handleNameChange} placeholder="Enter coach's name" className="border rounded-lg px-4 py-2" />
          <button onClick={handleRandomize} className="bg-blue-500 text-white py-2 px-4 rounded-lg">Randomize</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {AVATARS.map((avatar) => (
          <div
            key={avatar.id}
            onClick={() => handleAvatarSelection(avatar.src)}
            className={`cursor-pointer border-2 rounded-full p-2 ${tempAvatar === avatar.src ? 'border-blue-500' : 'border-transparent'}`}
          >
            <img
              src={avatar.src}
              alt={avatar.alt}
              className="w-16 h-16 rounded-full object-cover"
            />
          </div>
        ))}
      </div>
      <div className="mt-4">
        <button onClick={handleNextStep} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Next</button>
      </div>
    </div>
  );
};

export default StepNameAndAvatar;