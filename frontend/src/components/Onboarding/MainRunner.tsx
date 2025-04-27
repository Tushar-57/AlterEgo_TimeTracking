import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import OnboardingFlow from './OnboardingFlow';
import MentorSelection from './Mentor/MentorSelection';
import { MentorArchetype } from './types/coaching';

const MainRunner: React.FC = () => {
  const handleMentorSelection = (archetype: MentorArchetype) => {
    console.log('Selected mentor archetype:', archetype);
    // Add your mentor selection logic here
    // Example: API call, state management, navigation, etc.
  };

  return (
    <Router>
      <Routes>
        {/* Default redirect to onboarding flow */}
        <Route path="/" element={<Navigate to="/onboarding" replace />} />

        {/* Integrated Onboarding Flow */}
        <Route path="/onboarding/*" element={<OnboardingFlow />} />

        {/* Mentor Selection Flow */}
        <Route
          path="/mentor"
          element={<MentorSelection onSelect={handleMentorSelection} />}
        />

        {/* Catch-all redirect to onboarding */}
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    </Router>
  );
};

export default MainRunner;