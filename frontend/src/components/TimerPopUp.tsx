// timerPopUp.tsx
import { X, Play, Pause, RotateCcw, Volume2, Hourglass, Timer as TimerIcon, Edit2, MessageCircle, Mic, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import type { Project } from '../store/projectStore'; 

export interface TimeEntry {
  taskDescription: string;
  category: string;
  tags: string[];
  startTime: Date;
  endTime: Date;
  projectId?: number;
  billable: boolean;
}
interface TimerPopupProps {

  taskDescription: string;
  setTaskDescription: (val: string) => void;
  category: string;
  setCategory: (val: string) => void;
  tags: string[];
  setTags: (val: string[]) => void;
  isBillable: boolean;
  setIsBillable: (val: boolean) => void;
  selectedProjectId?: number | undefined;
  setSelectedProjectId: (val: number | undefined) => void;
  status: 'stopped' | 'running' | 'paused';
  onTaskChange: (task: {
    description: string;
    project: string;
    tags: string[];
    billable: boolean;
  }) => void;
  // ... rest of existing props
  time: number;
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
  onSave: (entry: TimeEntry) => void;
  taskName: string;
  setTaskName: (name: string) => void;
  currentTimer?: {
    id?: number;
    isActive: boolean;
  };

  timerState: {
    time: number;
    status: 'stopped' | 'running' | 'paused';
    mode: 'stopwatch' | 'countdown';
    targetTime: number;
  };
  setTimerState: React.Dispatch<React.SetStateAction<{
    time: number;
    status: 'stopped' | 'running' | 'paused';
    mode: 'stopwatch' | 'countdown';
    targetTime: number;
  }>>;
  isSubmitting?: boolean;
  submitError?: string | null;
}


export const TimerPopup = ({
  isSubmitting,
  submitError,
  time,
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
  onSave,
  taskName,
  setTaskName
}: TimerPopupProps) => {
  const [taskDescription, setTaskDescription] = useState(taskName);
  const [category, setCategory] = useState('work');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [startTime] = useState(new Date());
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  // const [submitError, setSubmitError] = useState<string | null>(null);

  // Manual mode state
  const [manualMode, setManualMode] = useState(false);
  const [manualStart, setManualStart] = useState<string>('');
  const [manualEnd, setManualEnd] = useState<string>('');
  const [isBillable, setIsBillable] = useState(false);
  
  // Chat window state
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [draftMessage, setDraftMessage] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  const fetchProjects = async () => {
      setIsLoadingProjects(true);
      try {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
          window.location.href = '/login';
          return;
        }
    
        const res = await fetch('http://localhost:8080/api/projects', {
          headers: { Authorization: `Bearer ${token}` }
        });
    
        if (res.status === 401) {
          localStorage.removeItem('jwtToken');
          window.location.href = '/login';
          return;
        }
    
        if (!res.ok) throw new Error('Failed to fetch projects');
        
        const data = await res.json();
        setProjects(data);
      } catch (error) {
        console.error('Error fetching projects:', error);
        if (error instanceof Error && error.message.includes('401')) {
          localStorage.removeItem('jwtToken');
          window.location.href = '/login';
        }
      } finally {
        setIsLoadingProjects(false);
      }
    };

  const handleComplete = () => {
    console.log('Token:', localStorage.getItem('jwtToken'));
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
    console.log("Saving entry:", {
      taskDescription: taskDescription.trim(),
      category,
      tags,
      startTime: sTime,
      endTime: eTime,
      projectId: selectedProjectId ?? undefined,
      billable: isBillable
    });
    onSave({
      taskDescription: taskDescription.trim(),
      category,
      tags,
      startTime: manualMode ? new Date(manualStart) : startTime,
      endTime: manualMode ? new Date(manualEnd) : new Date(),
      projectId: selectedProjectId ?? undefined,
      billable: isBillable
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
            <DragDropContext onDragEnd={onDragEnd}>
              {tags.length > 0 ? (
                <Droppable droppableId="tags" direction="horizontal">
                  {(provided) => (
                    <div 
                      ref={provided.innerRef} 
                      {...provided.droppableProps}
                      className="flex space-x-2 overflow-auto"
                    >
                      {tags.map((tag, idx) => (
                        <Draggable key={tag} draggableId={tag} index={idx}>
                          {(prov) => (
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
              ) : (
                <div className="h-8" /> /* Empty spacer */
              )}
            </DragDropContext>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm text-gray-600">Project</label>
              <select
                value={selectedProjectId ?? ''}
                onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">No project</option>
                {isLoadingProjects ? (
                  <option disabled>Loading projects...</option>
                ) : (
                  projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm text-gray-600">Billable</label>
              <button
                onClick={() => setIsBillable(!isBillable)}
                className={`p-2 w-full rounded ${
                  isBillable 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {isBillable ? '✓ Billable' : 'Mark as Billable'}
              </button>
            </div>
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
          {submitError && (
            <div className="mt-2 text-sm text-red-600">
              {submitError.includes("Conflict") 
                ? "Stop current timer first!" 
                : submitError}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t flex justify-end space-x-4 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 rounded hover:bg-gray-200 transition">Cancel</button>
          <button 
            onClick={handleComplete} 
            disabled={isSubmitting}
            className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded shadow hover:from-indigo-600 hover:to-purple-600 transition"
          >
            {isSubmitting ? "Saving..." : "Save"}
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
            {validationError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-md flex items-center">
                <X className="w-5 h-5 mr-2" />
                {validationError}
              </div>
            )}

            {submitError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-md flex items-center">
                <X className="w-5 h-5 mr-2" />
                {submitError.includes("Conflict") 
                  ? "You have an active timer - stop it first!"
                  : submitError}
              </div>
            )}
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
// PlannerForm.tsx
