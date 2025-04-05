// import { X, Play, Pause, RotateCcw, Volume2, Hourglass, Timer as TimerIcon, MessageSquare, Edit2 } from 'lucide-react';
// import { useState } from 'react';
// // const [validationError, setValidationError] = useState<string | null>(null);

// interface TimerPopupProps {
//   time: number;
//   status: 'stopped' | 'running' | 'paused';
//   soundEnabled: boolean;
//   aiMode: boolean;
//   timerMode: 'stopwatch' | 'countdown';
//   presetTimes: Array<{ label: string; seconds: number }>;
//   formatTime: (seconds: number) => string;
//   toggleTimer: () => void;
//   resetTimer: () => void;
//   handlePresetClick: (preset: { label: string; seconds: number }) => void;
//   setSoundEnabled: (value: boolean) => void;
//   setAiMode: (value: boolean) => void;
//   onClose: () => void;
//   onSave: (entry: {
//     taskDescription: string;
//     category: string;
//     startTime: Date;
//     endTime: Date;
//     duration: number;
//   }) => void;

//   isSubmitting?: boolean;
//   submitError?: string | null;
// }

// export const TimerPopup = ({
//   isSubmitting,
//   submitError,
//   time,
//   status,
//   soundEnabled,
//   aiMode,
//   timerMode,
//   presetTimes,
//   formatTime,
//   toggleTimer,
//   resetTimer,
//   handlePresetClick,
//   setSoundEnabled,
//   setAiMode,
//   onClose,
//   onSave
// }: TimerPopupProps) => {
//   const [taskDescription, setTaskDescription] = useState('');
//   const [category, setCategory] = useState('work');
//   const [startTime] = useState(new Date());
//   const [endTime, setEndTime] = useState<Date | null>(null);
//   const [validationError, setValidationError] = useState<string | null>(null);

//   // Manual mode state
//   const [manualMode, setManualMode] = useState(false);
//   const [manualStart, setManualStart] = useState<string>('');
//   const [manualEnd, setManualEnd] = useState<string>('');

//   // Chat window state
//   const [chatOpen, setChatOpen] = useState(false);
//   const [messages, setMessages] = useState<string[]>([]);
//   const [draftMessage, setDraftMessage] = useState('');


//   const handleComplete = () => {
//     // Manual mode validation
//     let sTime = startTime;
//     let eTime = new Date();
//     if (manualMode) {
//       if (!manualStart || !manualEnd) {
//         setValidationError('Please fill both start and end times in manual mode');
//         return;
//       }
//       const s = new Date(manualStart);
//       const e = new Date(manualEnd);
//       if (e <= s) {
//         setValidationError('End time must be after start time');
//         return;
//       }
//       sTime = s;
//       eTime = e;
//     } else {
//       if (status === 'running') {
//         setValidationError('Please stop the timer before saving');
//         return;
//       }
//       eTime = new Date();
//     }

//     if (!taskDescription.trim()) {
//       setValidationError('Task description is required');
//       return;
//     }

//     setValidationError(null);
//     const duration = Math.floor((eTime.getTime() - sTime.getTime()) / 1000);
//     onSave({
//       taskDescription: taskDescription.trim(),
//       category,
//       startTime: sTime,
//       endTime: eTime,
//       duration
//     });
//   };

//   const sendMessage = () => {
//     if (!draftMessage.trim()) return;
//     setMessages(prev => [...prev, draftMessage.trim()]);
//     setDraftMessage('');
//   };

//   return (
//     <div className="fixed inset-0 bg-black/30 backdrop-blur-xl z-50 flex items-center justify-center p-8">
//       <div className="glass-morphism rounded-2xl w-full max-w-3xl max-h-full flex flex-col relative">
//         {/* Header with manual toggle and chat button */}
//         <div className="p-6 border-b border-white/10 flex justify-between items-center">
//           <h2 className="text-2xl font-semibold text-gray-800">Time Entry Details</h2>
//           <div className="flex items-center space-x-3">
//             <button
//               onClick={() => setManualMode(!manualMode)}
//               className="p-2 rounded-full hover:bg-gray-100 transition-colors"
//               title={manualMode ? 'Switch to Automatic' : 'Switch to Manual'}
//             >
//               <Edit2 className="w-6 h-6 text-gray-600" />
//             </button>
//             <button
//               onClick={() => setChatOpen(!chatOpen)}
//               className="p-2 rounded-full hover:bg-gray-100 transition-colors"
//               title="Open Chat"
//             >
//               <MessageSquare className="w-6 h-6 text-gray-600" />
//             </button>
//             <button
//               onClick={onClose}
//               className="p-2 rounded-full hover:bg-gray-100 transition-colors"
//             >
//               <X className="w-6 h-6 text-gray-600" />
//             </button>
//           </div>
//         </div>

//         {/* Content */}
//         <div className="flex-1 overflow-auto grid grid-cols-3 gap-8 p-8">
//           {/* Main Form Section */}
//           <div className="col-span-3 lg:col-span-2 flex flex-col space-y-8">
//             <div className="glass-morphism-inner p-6 rounded-xl space-y-6">
//               <div className="space-y-4">
//                 <label className="block text-sm font-medium text-gray-700">Task Description</label>
//                 <input
//                   type="text"
//                   value={taskDescription}
//                   onChange={(e) => setTaskDescription(e.target.value)}
//                   className="w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-black"
//                   placeholder="Enter task description"
//                 />
//               </div>

//               <div className="space-y-4">
//                 <label className="block text-sm font-medium text-gray-700">Category</label>
//                 <select
//                   value={category}
//                   onChange={(e) => setCategory(e.target.value)}
//                   className="w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-black"
//                 >
//                   <option value="work">Work</option>
//                   <option value="meeting">Meeting</option>
//                   <option value="personal">Personal</option>
//                   <option value="learning">Learning</option>
//                 </select>
//               </div>

//               {/* Manual Mode Inputs */}
//               {manualMode && (
//                 <div className="space-y-4">
//                   <label className="block text-sm font-medium text-gray-700">Start Time</label>
//                   <input
//                     type="datetime-local"
//                     value={manualStart}
//                     onChange={e => setManualStart(e.target.value)}
//                     className="w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-black"
//                   />

//                   <label className="block text-sm font-medium text-gray-700">End Time</label>
//                   <input
//                     type="datetime-local"
//                     value={manualEnd}
//                     onChange={e => setManualEnd(e.target.value)}
//                     className="w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-black"
//                   />
//                 </div>
//               )}
//             </div>

//             {/* Timer Display (hide in manual mode) */}
//             {!manualMode && (
//               <div className="glass-morphism-inner p-6 rounded-xl flex flex-col items-center space-y-8">
//                 <div className={`text-9xl font-mono ${
//                   status === 'running' ? 'text-gray-800' : 'text-gray-600'
//                 }`}>
//                   {formatTime(time)}
//                 </div>
//                 <div className="flex gap-6">
//                   <button
//                     onClick={toggleTimer}
//                     className={`p-8 rounded-full transition-all ${
//                       status === 'running'
//                         ? 'bg-gray-200 text-gray-700'
//                         : 'bg-black text-white hover:bg-gray-800'
//                     }`}
//                   >
//                     {status === 'running' ? <Pause className="w-12 h-12" /> : <Play className="w-12 h-12" />}
//                   </button>
//                   <button
//                     onClick={resetTimer}
//                     className="p-4 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors self-center"
//                   >
//                     <RotateCcw className="w-8 h-8" />
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Metadata Sidebar */}
//           <div className="space-y-8 col-span-3 lg:col-span-1">
//             <div className="glass-morphism-inner p-6 rounded-xl">
//               <h3 className="text-lg font-medium mb-4">Session Details</h3>
//               <div className="space-y-4">
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Start Time:</span>
//                   <span className="text-gray-800">
//                     {manualMode
//                       ? manualStart ? new Date(manualStart).toLocaleString() : '--'
//                       : startTime.toLocaleString()}
//                   </span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">End Time:</span>
//                   <span className="text-gray-800">
//                     {manualMode
//                       ? manualEnd ? new Date(manualEnd).toLocaleString() : '--'
//                       : endTime?.toLocaleTimeString() || '--:--:--'}
//                   </span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Duration:</span>
//                   <span className="text-gray-800">
//                     {manualMode
//                       ? manualStart && manualEnd
//                         ? formatTime((new Date(manualEnd).getTime() - new Date(manualStart).getTime()) / 1000)
//                         : '--'
//                       : formatTime(time)}
//                   </span>
//                 </div>
//               </div>
//               {validationError && (
//                 <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
//                   {validationError}
//                 </div>
//               )}
//               {submitError && (
//                 <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
//                   Error: {submitError}
//                 </div>
//               )}
//               {isSubmitting && (
//                 <div className="mt-4 p-3 bg-blue-100 text-blue-700 rounded-lg">
//                   Saving time entry...
//                 </div>
//               )}
//             </div>
//             <div className="glass-morphism-inner p-6 rounded-xl">
//               <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
//               <div className="space-y-4">
//                 <button
//                   onClick={handleComplete}
//                   className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
//                 >
//                   Complete Session
//                 </button>
//                 <button
//                   onClick={onClose}
//                   className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
//                 >
//                   Cancel Session
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Collapsible Chat Window */}
//         <div
//           className={`absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm shadow-lg transition-max-h duration-300 overflow-hidden ${
//             chatOpen ? 'max-h-64' : 'max-h-0'
//           }`}
//         >
//           <div className="p-4 flex flex-col h-full">
//             <div className="flex-1 overflow-auto space-y-2 mb-2">
//               {messages.map((msg, i) => (
//                 <div key={i} className="p-2 bg-gray-100 rounded-lg">
//                   {msg}
//                 </div>
//               ))}
//             </div>
//             <div className="flex">
//               <input
//                 type="text"
//                 value={draftMessage}
//                 onChange={e => setDraftMessage(e.target.value)}
//                 className="flex-1 px-4 py-2 rounded-l-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
//                 placeholder="Type a message..."
//               />
//               <button
//                 onClick={sendMessage}
//                 className="px-4 py-2 bg-black text-white rounded-r-lg hover:bg-gray-800 transition-colors"
//               >
//                 Send
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };
import { X, Play, Pause, RotateCcw, Volume2, Hourglass, Timer as TimerIcon, Edit2, MessageCircle, Mic, Plus } from 'lucide-react';
import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

interface TimerPopupProps {
  time: number;
  status: 'stopped' | 'running' | 'paused';
  soundEnabled: boolean;
  aiMode: boolean;
  timerMode: 'stopwatch' | 'countdown';
  presetTimes: Array<{ label: string; seconds: number }>;
  formatTime: (seconds: number) => string;
  toggleTimer: () => void;
  resetTimer: () => void;
  handlePresetClick: (preset: { label: string; seconds: number }) => void;
  setSoundEnabled: (value: boolean) => void;
  setAiMode: (value: boolean) => void;
  onClose: () => void;
  onSave: (entry: {
    taskDescription: string;
    category: string;
    tags: string[];
    startTime: Date;
    endTime: Date;
    duration: number;
  }) => void;

  isSubmitting?: boolean;
  submitError?: string | null;
}

export const TimerPopup = ({
  isSubmitting,
  submitError,
  time,
  status,
  soundEnabled,
  aiMode,
  timerMode,
  presetTimes,
  formatTime,
  toggleTimer,
  resetTimer,
  handlePresetClick,
  setSoundEnabled,
  setAiMode,
  onClose,
  onSave
}: TimerPopupProps) => {
  const [taskDescription, setTaskDescription] = useState('');
  const [category, setCategory] = useState('work');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [startTime] = useState(new Date());
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Manual mode state
  const [manualMode, setManualMode] = useState(false);
  const [manualStart, setManualStart] = useState<string>('');
  const [manualEnd, setManualEnd] = useState<string>('');

  // Chat window state
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [draftMessage, setDraftMessage] = useState('');

  const handleComplete = () => {
    let sTime = startTime;
    let eTime = new Date();
    if (manualMode) {
      if (!manualStart || !manualEnd) {
        setValidationError('Please fill both start and end times in manual mode');
        return;
      }
      const s = new Date(manualStart);
      const e = new Date(manualEnd);
      if (e <= s) {
        setValidationError('End time must be after start time');
        return;
      }
      sTime = s;
      eTime = e;
    } else {
      if (status === 'running') {
        setValidationError('Please stop the timer before saving');
        return;
      }
      eTime = new Date();
    }

    if (!taskDescription.trim()) {
      setValidationError('Task description is required');
      return;
    }

    setValidationError(null);
    const duration = Math.floor((eTime.getTime() - sTime.getTime()) / 1000);
    onSave({
      taskDescription: taskDescription.trim(),
      category,
      tags,
      startTime: sTime,
      endTime: eTime,
      duration
    });
  };

  const sendMessage = () => {
    if (!draftMessage.trim()) return;
    setMessages(prev => [...prev, draftMessage.trim()]);
    setDraftMessage('');
  };

  const addTag = () => {
    const tag = newTag.trim();
    if (tag && !tags.includes(tag)) {
      setTags(prev => [...prev, tag]);
    }
    setNewTag('');
  };

  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(tags);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setTags(reordered);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4" onKeyDown={e => e.stopPropagation()} tabIndex={0}>
      <div className="bg-white rounded-2xl w-[600px] max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Time Entry</h2>
          <div className="flex space-x-2">
            <button onClick={() => setManualMode(!manualMode)} title={manualMode ? 'Auto Mode' : 'Manual Mode'} className="p-2 hover:bg-gray-100 rounded">
              <Edit2 className="w-5 h-5 text-gray-600" />
            </button>
            <button onClick={() => setChatOpen(!chatOpen)} title="AI Assistant" className="p-2 hover:bg-gray-100 rounded">
              <MessageCircle className="w-5 h-5 text-gray-600" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-auto grid grid-cols-1 gap-6">
          {/* Task & Meta */}
          <div className="space-y-4">
            <input
              type="text"
              value={taskDescription}
              onChange={e => setTaskDescription(e.target.value)}
              placeholder="What are you working on?"
              className="w-full text-lg font-medium px-4 py-2 border rounded focus:ring-2 focus:ring-indigo-500"
            />

            <div className="flex space-x-4">
              <select value={category} onChange={e => setCategory(e.target.value)} className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500">
                <option value="work">Work</option>
                <option value="meeting">Meeting</option>
                <option value="personal">Personal</option>
                <option value="learning">Learning</option>
              </select>

              {/* Tag Input */}
              <div className="flex-1 flex space-x-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTag()}
                  placeholder="Add tag and press Enter"
                  className="flex-1 px-3 py-2 border rounded-l focus:ring-2 focus:ring-indigo-500"
                />
                <button onClick={addTag} className="px-3 bg-indigo-600 text-white rounded-r hover:bg-indigo-700">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tags List */}
            {tags.length > 0 && (
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="tags" direction="horizontal">
                  {provided => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="flex space-x-2 overflow-auto">
                      {tags.map((tag, idx) => (
                        <Draggable key={tag} draggableId={tag} index={idx}>
                          {prov => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                              className="flex items-center bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full shadow-sm"
                            >
                              <span>{tag}</span>
                              <button onClick={() => removeTag(tag)} className="ml-2 focus:outline-none">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>

          {/* Timer Controls */}
          {!manualMode && (
            <div className="flex flex-col items-center space-y-4">
              <div className="text-4xl font-mono text-gray-800">{formatTime(time)}</div>
              <div className="flex space-x-4">
                <button onClick={toggleTimer} className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition">
                  {status === 'running' ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <button onClick={resetTimer} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition">
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Manual Mode Inputs */}
          {manualMode && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600">Start</label>
                <input
                  type="datetime-local"
                  value={manualStart}
                  onChange={e => setManualStart(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">End</label>
                <input
                  type="datetime-local"
                  value={manualEnd}
                  onChange={e => setManualEnd(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {validationError && <p className="text-sm text-red-600">{validationError}</p>}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t flex justify-end space-x-4 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 rounded hover:bg-gray-200 transition">Cancel</button>
          <button onClick={handleComplete} className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded shadow hover:from-indigo-600 hover:to-purple-600 transition">
            Save
          </button>
        </div>

        {/* Chat Window */}
        <div className={`absolute bottom-0 left-0 right-0 bg-white shadow-lg transition-max-h duration-300 overflow-hidden ${chatOpen ? 'max-h-60' : 'max-h-0'}`}>
          <div className="p-4 flex flex-col h-full">
            <div className="flex-1 overflow-auto space-y-2 mb-2 text-sm">
              {messages.map((msg, i) => (
                <div key={i} className="p-2 bg-gray-100 rounded">{msg}</div>
              ))}
            </div>
            <div className="flex">
              <button className="p-2 bg-gray-200 rounded-l hover:bg-gray-300 transition">
                <Mic className="w-5 h-5 text-gray-600" />
              </button>
              <input
                type="text"
                value={draftMessage}
                onChange={e => setDraftMessage(e.target.value)}
                className="flex-1 px-3 py-2 border-t border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ask AI or type..."
              />
              <button onClick={sendMessage} className="p-2 bg-indigo-600 text-white rounded-r hover:bg-indigo-700 transition">Send</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}