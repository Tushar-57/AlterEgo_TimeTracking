// import React, { useState } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { Mentor, MentorArchetype, CoachingStyle } from '../types/onboarding';
// import { AVATARS, RANDOM_NAMES } from '../types/onboarding';
// import { Brain, Lightbulb, Target, Compass, Map, Users, Heart, Sparkles, Zap, Shield } from 'lucide-react';
// import { BackButton } from '../UI/BackButton';

// interface StepMentorProps {
//   onSelect: (mentor: Mentor) => void;
//   onBack: () => void;
// }

// const StepMentor: React.FC<StepMentorProps> = ({ onSelect, onBack }) => {
//   const [currentSubStep, setCurrentSubStep] = useState<'archetype' | 'style' | 'name' | 'avatar'>('archetype');
//   const [archetype, setArchetype] = useState<MentorArchetype | null>(null);
//   const [style, setStyle] = useState<CoachingStyle | null>(null);
//   const [name, setName] = useState('');
//   const [avatar, setAvatar] = useState('');

//   const archetypes = [
//     { type: 'Innovator', icon: <Lightbulb className="w-8 h-8" />, description: 'Sparks creativity and innovative solutions', color: 'from-blue-100 to-indigo-200' },
//     { type: 'Sage', icon: <Brain className="w-8 h-8" />, description: 'Offers wisdom and deep insights', color: 'from-emerald-100 to-teal-200' },
//     { type: 'Challenger', icon: <Target className="w-8 h-8" />, description: 'Drives you to exceed your limits', color: 'from-orange-100 to-amber-200' },
//     { type: 'Master', icon: <Compass className="w-8 h-8" />, description: 'Guides with expertise and precision', color: 'from-violet-100 to-purple-200' },
//     { type: 'Guide', icon: <Map className="w-8 h-8" />, description: 'Navigates with patience and support', color: 'from-rose-100 to-pink-200' },
//   ];

//   const styles = [
//     { type: 'Direct', icon: <Zap className="w-8 h-8" />, description: 'Clear and straightforward guidance', color: 'from-yellow-100 to-orange-200' },
//     { type: 'Friendly', icon: <Users className="w-8 h-8" />, description: 'Warm and approachable support', color: 'from-green-100 to-emerald-200' },
//     { type: 'Encouraging', icon: <Heart className="w-8 h-8" />, description: 'Boosts your confidence and morale', color: 'from-pink-100 to-rose-200' },
//     { type: 'Nurturing', icon: <Sparkles className="w-8 h-8" />, description: 'Caring and empathetic coaching', color: 'from-purple-100 to-violet-200' },
//     { type: 'Patient', icon: <Shield className="w-8 h-8" />, description: 'Supportive and unhurried guidance', color: 'from-blue-100 to-cyan-200' },
//     { type: 'Challenging', icon: <Target className="w-8 h-8" />, description: 'Pushes you to achieve greatness', color: 'from-red-100 to-rose-200' },
//     { type: 'Inspirational', icon: <Lightbulb className="w-8 h-8" />, description: 'Ignites your passion and vision', color: 'from-indigo-100 to-blue-200' },
//   ];

//   const subStepTitles: Record<'archetype' | 'style' | 'name' | 'avatar', string> = {
//     archetype: 'Choose Your Coach’s Archetype',
//     style: 'Select Coaching Style',
//     name: 'Name Your Coach',
//     avatar: 'Pick an Avatar',
//   };

//   const randomizeName = () => {
//     const randomIndex = Math.floor(Math.random() * RANDOM_NAMES.length);
//     setName(RANDOM_NAMES[randomIndex]);
//     setCurrentSubStep('avatar');
//   };

//   const handleArchetypeSelect = (selectedArchetype: MentorArchetype) => {
//     setArchetype(selectedArchetype);
//     setCurrentSubStep('style');
//   };

//   const handleStyleSelect = (selectedStyle: CoachingStyle) => {
//     setStyle(selectedStyle);
//     setCurrentSubStep('name');
//   };

//   const handleNameSubmit = () => {
//     if (name) {
//       setCurrentSubStep('avatar');
//     }
//   };

//   const handleAvatarSelect = (selectedAvatar: string) => {
//     setAvatar(selectedAvatar);
//     if (archetype && style && name) {
//       onSelect({ archetype, style, name, avatar: selectedAvatar });
//     }
//   };

//   return (
//     <AnimatePresence mode="wait">
//       {currentSubStep === 'archetype' && (
//         <motion.div
//           key="archetype"
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           exit={{ opacity: 0, y: -20 }}
//           transition={{ duration: 0.3 }}
//           className="w-full max-w-2xl mx-auto p-4"
//         >
//           <div className="flex justify-between items-center mb-4">
//             <motion.div
//               initial={{ opacity: 0, y: -20 }}
//               animate={{ opacity: 1, y: 0 }}
//               className="text-center"
//             >
//               <h2 className="text-2xl font-bold text-gray-900 mb-3">{subStepTitles.archetype}</h2>
//               <p className="text-gray-600">Select the archetype that best suits your coaching needs.</p>
//             </motion.div>
//             <BackButton onClick={onBack} />
//           </div>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             {archetypes.map((arch, index) => (
//               <motion.button
//                 key={arch.type}
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ delay: index * 0.1 }}
//                 onClick={() => handleArchetypeSelect(arch.type as MentorArchetype)}
//                 className="group relative overflow-hidden rounded-lg bg-white p-6 shadow-md hover:shadow-lg transition-shadow duration-300"
//               >
//                 <div className="relative z-10">
//                   <div className={`inline-block p-3 rounded-lg bg-gradient-to-br ${arch.color} text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
//                     {arch.icon}
//                   </div>
//                   <h3 className="text-lg font-bold text-gray-900 mb-2">{arch.type}</h3>
//                   <p className="text-gray-600 text-sm">{arch.description}</p>
//                 </div>
//                 <div className={`absolute inset-0 bg-gradient-to-br ${arch.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
//               </motion.button>
//             ))}
//           </div>
//         </motion.div>
//       )}

//       {currentSubStep === 'style' && (
//         <motion.div
//           key="style"
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           exit={{ opacity: 0, y: -20 }}
//           transition={{ duration: 0.3 }}
//           className="w-full max-w-2xl mx-auto p-4"
//         >
//           <motion.div
//             initial={{ opacity: 0, y: -20 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="text-center mb-8"
//           >
//             <h2 className="text-2xl font-bold text-gray-900 mb-3">{subStepTitles.style}</h2>
//             <p className="text-gray-600">Choose the coaching style that resonates with you.</p>
//           </motion.div>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             {styles.map((sty, index) => (
//               <motion.button
//                 key={sty.type}
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ delay: index * 0.1 }}
//                 onClick={() => handleStyleSelect(sty.type as CoachingStyle)}
//                 className="group relative overflow-hidden rounded-lg bg-white p-6 shadow-md hover:shadow-lg transition-shadow duration-300"
//               >
//                 <div className="relative z-10">
//                   <div className={`inline-block p-3 rounded-lg bg-gradient-to-br ${sty.color} text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
//                     {sty.icon}
//                   </div>
//                   <h3 className="text-lg font-bold text-gray-900 mb-2">{sty.type}</h3>
//                   <p className="text-gray-600 text-sm">{sty.description}</p>
//                 </div>
//                 <div className={`absolute inset-0 bg-gradient-to-br ${sty.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
//               </motion.button>
//             ))}
//           </div>
//         </motion.div>
//       )}

//       {currentSubStep === 'name' && (
//         <motion.div
//           key="name"
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           exit={{ opacity: 0, y: -20 }}
//           transition={{ duration: 0.3 }}
//           className="w-full max-w-2xl mx-auto p-4"
//         >
//           <motion.div
//             initial={{ opacity: 0, y: -20 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="text-center mb-8"
//           >
//             <h2 className="text-2xl font-bold text-gray-900 mb-3">{subStepTitles.name}</h2>
//             <p className="text-gray-600">Give your coach a name that feels right.</p>
//           </motion.div>
//           <div className="bg-white rounded-lg p-6 shadow-md max-w-md mx-auto">
//             <div className="flex gap-3">
//               <input
//                 type="text"
//                 value={name}
//                 onChange={(e) => setName(e.target.value)}
//                 placeholder="Enter coach name"
//                 className="flex-1 border border-gray-300 rounded-lg p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#a8d8ea] transition-all"
//               />
//               <button
//                 onClick={randomizeName}
//                 className="bg-gradient-to-r from-[#a8d8ea] to-[#b4e7ce] text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
//               >
//                 Randomize
//               </button>
//             </div>
//             <button
//               onClick={handleNameSubmit}
//               disabled={!name}
//               className="mt-3 w-full bg-gradient-to-r from-[#a8d8ea] to-[#b4e7ce] text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 disabled:opacity-50"
//             >
//               Next
//             </button>
//           </div>
//         </motion.div>
//       )}

//       {currentSubStep === 'avatar' && (
//         <motion.div
//           key="avatar"
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           exit={{ opacity: 0, y: -20 }}
//           transition={{ duration: 0.3 }}
//           className="w-full max-w-2xl mx-auto p-4"
//         >
//           <motion.div
//             initial={{ opacity: 0, y: -20 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="text-center mb-8"
//           >
//             <h2 className="text-2xl font-bold text-gray-900 mb-3">{subStepTitles.avatar}</h2>
//             <p className="text-gray-600">Pick an avatar for your coach.</p>
//           </motion.div>
//           <div className="flex gap-4 justify-center">
//             {AVATARS.map((a) => (
//               <motion.img
//                 key={a.id}
//                 src={a.url}
//                 alt={a.alt}
//                 onClick={() => handleAvatarSelect(a.url)}
//                 whileHover={{ scale: 1.15, rotate: 5 }}
//                 className={`w-16 h-16 rounded-full cursor-pointer shadow-sm transition-all ${
//                   avatar === a.url ? 'ring-4 ring-[#a8d8ea] glow' : ''
//                 }`}
//               />
//             ))}
//           </div>
//         </motion.div>
//       )}
//     </AnimatePresence>
//   );
// };

// export default StepMentor;
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mentor, MentorArchetype, CoachingStyle } from '../types/onboarding';
import { AVATARS, RANDOM_NAMES } from '../types/onboarding';
import { Brain, Lightbulb, Target, Compass, Map, Users, Heart, Sparkles, Zap, Shield, CheckCircle } from 'lucide-react';
import { BackButton } from '../UI/BackButton';

interface StepMentorProps {
  onSelect: (mentor: Mentor) => void;
  onBack: () => void;
}

const StepMentor: React.FC<StepMentorProps> = ({ onSelect, onBack }) => {
  const [currentSubStep, setCurrentSubStep] = useState<'archetype' | 'style' | 'name' | 'avatar'>('archetype');
  const [archetype, setArchetype] = useState<MentorArchetype | null>(null);
  const [style, setStyle] = useState<CoachingStyle | null>(null);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');

  const archetypes = [
    { type: 'Innovator', icon: <Lightbulb className="w-8 h-8" />, description: 'Sparks creativity and innovative solutions', tagline: 'Creativity' },
    { type: 'Sage', icon: <Brain className="w-8 h-8" />, description: 'Offers wisdom and deep insights', tagline: 'Wisdom' },
    { type: 'Challenger', icon: <Target className="w-8 h-8" />, description: 'Drives you to exceed your limits', tagline: 'Ambition' },
    { type: 'Master', icon: <Compass className="w-8 h-8" />, description: 'Guides with expertise and precision', tagline: 'Precision' },
    { type: 'Guide', icon: <Map className="w-8 h-8" />, description: 'Navigates with patience and support', tagline: 'Support' },
  ];

  const styles = [
    { type: 'Direct', icon: <Zap className="w-8 h-8" />, description: 'Clear and straightforward guidance', tagline: 'Clarity' },
    { type: 'Friendly', icon: <Users className="w-8 h-8" />, description: 'Warm and approachable support', tagline: 'Warmth' },
    { type: 'Encouraging', icon: <Heart className="w-8 h-8" />, description: 'Boosts your confidence and morale', tagline: 'Confidence' },
    { type: 'Nurturing', icon: <Sparkles className="w-8 h-8" />, description: 'Caring and empathetic coaching', tagline: 'Empathy' },
    { type: 'Patient', icon: <Shield className="w-8 h-8" />, description: 'Supportive and unhurried guidance', tagline: 'Patience' },
    { type: 'Challenging', icon: <Target className="w-8 h-8" />, description: 'Pushes you to achieve greatness', tagline: 'Greatness' },
    { type: 'Inspirational', icon: <Lightbulb className="w-8 h-8" />, description: 'Ignites your passion and vision', tagline: 'Vision' },
  ];

  const subStepTitles: Record<'archetype' | 'style' | 'name' | 'avatar', string> = {
    archetype: 'Choose Your Coach’s Archetype',
    style: 'Select Coaching Style',
    name: 'Name Your Coach',
    avatar: 'Pick an Avatar',
  };

  const subStepProgress: Record<'archetype' | 'style' | 'name' | 'avatar', number> = {
    archetype: 1,
    style: 2,
    name: 3,
    avatar: 4,
  };

  const randomizeName = () => {
    const randomIndex = Math.floor(Math.random() * RANDOM_NAMES.length);
    setName(RANDOM_NAMES[randomIndex]);
  };

  const handleArchetypeSelect = (selectedArchetype: MentorArchetype) => {
    console.log('Selected archetype:', selectedArchetype); // Temporary debug
    setArchetype(selectedArchetype);
    setCurrentSubStep('style');
  };

  const handleStyleSelect = (selectedStyle: CoachingStyle) => {
    console.log('Selected style:', selectedStyle); // Temporary debug
    setStyle(selectedStyle);
    setCurrentSubStep('name');
  };

  const handleNameSubmit = () => {
    if (name.trim()) {
      setCurrentSubStep('avatar');
    }
  };

  const handleAvatarSelect = (selectedAvatar: string) => {
    setAvatar(selectedAvatar);
    if (archetype && style && name) {
      onSelect({ archetype, style, name: name.trim(), avatar: selectedAvatar });
    }
  };

  const handleBack = () => {
    if (currentSubStep === 'style') {
      setCurrentSubStep('archetype');
      setArchetype(null);
    } else if (currentSubStep === 'name') {
      setCurrentSubStep('style');
      setStyle(null);
    } else if (currentSubStep === 'avatar') {
      setCurrentSubStep('name');
      setAvatar('');
    } else {
      onBack();
    }
  };

  return (
    <AnimatePresence mode="wait">
      {currentSubStep === 'archetype' && (
        <motion.div
          key="archetype"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-4xl mx-auto p-6 relative"
        >
          <div className="flex justify-between items-center mb-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-3xl font-bold text-gray-900">{subStepTitles.archetype}</h2>
            </motion.div>
            <BackButton onClick={handleBack} />
          </div>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="text-gray-600 max-w-2xl mx-auto mb-8 text-center"
          >
            Select the archetype that best suits your coaching needs.
          </motion.p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {archetypes.map((arch, index) => (
              <motion.button
                key={arch.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, scale: archetype === arch.type ? 1.02 : 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ y: -4, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)' }}
                onClick={() => handleArchetypeSelect(arch.type as MentorArchetype)}
                className={`group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:ring-2 group-hover:ring-blue-400 ${
                  archetype === arch.type ? 'bg-blue-50 ring-2 ring-blue-400' : 'ring-2 ring-blue-300 glow'
                }`}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-blue-100 to-cyan-100 opacity-10 group-hover:opacity-5 transition-opacity duration-300"
                  onClick={(e) => e.stopPropagation()}
                />
                {archetype === arch.type && (
                  <div className="absolute top-4 right-4 pointer-events-none">
                    <CheckCircle className="h-5 w-5 text-cyan-500" />
                  </div>
                )}
                <div className="relative z-10">
                  <motion.div
                    className="inline-block p-3 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 shadow-sm text-white mb-6 group-hover:scale-110 transition-transform duration-300"
                    animate={{ scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 2 } }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {arch.icon}
                  </motion.div>
                  <p className="text-blue-500 text-xs font-semibold uppercase tracking-wide mb-1">{arch.tagline}</p>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{arch.type}</h3>
                  <p className="text-gray-600">{arch.description}</p>
                </div>
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-300 rounded-full opacity-0 group-hover:opacity-10 blur-3xl transition-opacity duration-500" />
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {currentSubStep === 'style' && (
        <motion.div
          key="style"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-4xl mx-auto p-6 relative"
        >
          <div className="flex justify-between items-center mb-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-3xl font-bold text-gray-900">{subStepTitles.style}</h2>
            </motion.div>
            <BackButton onClick={handleBack} />
          </div>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="text-gray-600 max-w-2xl mx-auto mb-8 text-center"
          >
            Choose the coaching style that resonates with you.
          </motion.p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {styles.map((sty, index) => (
              <motion.button
                key={sty.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, scale: style === sty.type ? 1.02 : 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ y: -4, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)' }}
                onClick={() => handleStyleSelect(sty.type as CoachingStyle)}
                className={`group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:ring-2 group-hover:ring-blue-400 ${
                  style === sty.type ? 'bg-blue-50 ring-2 ring-blue-400' : 'ring-2 ring-blue-300 glow'
                }`}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-blue-100 to-cyan-100 opacity-10 group-hover:opacity-5 transition-opacity duration-300"
                  onClick={(e) => e.stopPropagation()}
                />
                {style === sty.type && (
                  <div className="absolute top-4 right-4 pointer-events-none">
                    <CheckCircle className="h-5 w-5 text-cyan-500" />
                  </div>
                )}
                <div className="relative z-10">
                  <motion.div
                    className="inline-block p-3 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 shadow-sm text-white mb-6 group-hover:scale-110 transition-transform duration-300"
                    animate={{ scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 2 } }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {sty.icon}
                  </motion.div>
                  <p className="text-blue-500 text-xs font-semibold uppercase tracking-wide mb-1">{sty.tagline}</p>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{sty.type}</h3>
                  <p className="text-gray-600">{sty.description}</p>
                </div>
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-300 rounded-full opacity-0 group-hover:opacity-10 blur-3xl transition-opacity duration-500" />
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {currentSubStep === 'name' && (
        <motion.div
          key="name"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-4xl mx-auto p-6 relative"
        >
          <div className="flex justify-between items-center mb-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-3xl font-bold text-gray-900">{subStepTitles.name}</h2>
            </motion.div>
            <BackButton onClick={handleBack} />
          </div>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="text-gray-600 max-w-2xl mx-auto mb-6 text-center"
          >
            Give your coach a name that feels right.
          </motion.p>
          <div className="text-center mb-4">
            <span className="text-sm text-gray-500">Step {subStepProgress.name} of 4</span>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 max-w-md mx-auto">
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter coach name"
                className="flex-1 p-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-blue-50 text-gray-900 transition-all duration-200"
              />
              <button
                onClick={randomizeName}
                className="bg-gradient-to-r from-blue-400 to-cyan-500 text-white px-4 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.98]"
              >
                Randomize
              </button>
            </div>
            <button
              onClick={handleNameSubmit}
              disabled={!name.trim()}
              className="w-full bg-gradient-to-r from-blue-400 to-cyan-500 text-white px-4 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              Next
            </button>
          </div>
        </motion.div>
      )}

      {currentSubStep === 'avatar' && (
        <motion.div
          key="avatar"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-4xl mx-auto p-6 relative"
        >
          <div className="flex justify-between items-center mb-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-3xl font-bold text-gray-900">{subStepTitles.avatar}</h2>
            </motion.div>
            <BackButton onClick={handleBack} />
          </div>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="text-gray-600 max-w-2xl mx-auto mb-6 text-center"
          >
            Pick an avatar for your coach.
          </motion.p>
          <div className="text-center mb-4">
            <span className="text-sm text-gray-500">Step {subStepProgress.avatar} of 4</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 justify-center">
            {AVATARS.map((a, index) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ scale: 1.1, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)' }}
                className={`relative rounded-2xl bg-white p-4 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:ring-2 group-hover:ring-blue-400 ${
                  avatar === a.url ? 'ring-4 ring-blue-400 glow' : 'ring-2 ring-blue-300'
                }`}
                onClick={() => handleAvatarSelect(a.url)}
              >
                <img
                  src={a.url}
                  alt={a.alt}
                  className="w-20 h-20 rounded-full mx-auto"
                />
                {avatar === a.url && (
                  <div className="absolute top-2 right-2 pointer-events-none">
                    <CheckCircle className="h-5 w-5 text-cyan-500" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StepMentor;